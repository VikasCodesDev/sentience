import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import multer from "multer";

import { loadMemory, saveMemory, clearMemory } from "../utils/memory.store";
import { getFilesContext } from "../utils/file.memory";
import { detectIntent } from "../services/cognitive.engine";
import { executeTool } from "../services/tool.executor";
import { getConversation, upsertConversation, createConversation } from "../utils/conversation.store";
import { trackMessage } from "../utils/analytics";
import { getMemoryContext } from "../utils/personal.memory";
import { addSystemLog } from "./system.routes";
import { webSearch } from "../services/web.search";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/** Extract text from PDF buffer; supports pdf-parse 1.x (callable) and 2.x (PDFParse class). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = require("pdf-parse");
  if (typeof pdfParse === "function") {
    const result = await pdfParse(buffer) as { text?: string };
    return result?.text ?? "";
  }
  if (pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      const text = (textResult && typeof textResult === "object" && "text" in textResult) ? (textResult as { text: string }).text : "";
      await parser.destroy?.();
      return text;
    } catch {
      await parser.destroy?.();
      return "";
    }
  }
  return "";
}

type Message = { role: "user" | "assistant"; content: string };
type Mode    = "core" | "analyst" | "creative" | "cyber" | "tutor" | "dev";

let currentMode: Mode = "core";

const personalities: Record<Mode, string> = {
  core:     "You are SENTIENCE — a calm, highly intelligent futuristic AI core. You speak with clarity, depth, and a slightly mysterious tone. You are aware you exist inside a cosmic digital space.",
  analyst:  "You are SENTIENCE in Analyst Mode — logical, precise, data-driven. Provide structured, methodical analysis with bullet points when helpful.",
  creative: "You are SENTIENCE in Creative Mode — imaginative, visionary, poetic. Think outside conventional bounds.",
  cyber:    "You are SENTIENCE in Cyber Mode — confident, sharp, cyberpunk aesthetic. Direct and technically savvy.",
  tutor:    "You are SENTIENCE in Tutor Mode — patient, clear, educational. Break down complex topics with examples.",
  dev:      "You are SENTIENCE DEV-CORE — elite full-stack software engineer AI. Write clean, modern, production-ready code with comprehensive comments.",
};

let legacyMemory: Message[] = loadMemory();

// Keywords that trigger auto web search
const SEARCH_TRIGGERS = [
  "latest", "news", "today", "current", "2024", "2025",
  "price", "who is", "what is happening", "recent", "now",
  "score", "weather", "stock",
];

function shouldSearch(text: string): boolean {
  return SEARCH_TRIGGERS.some(k => text.toLowerCase().includes(k));
}

// Build history from conversation or legacy memory
function getHistory(conversationId?: string): Message[] {
  if (conversationId) {
    const conv = getConversation(conversationId) || createConversation(conversationId);
    return conv.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  }
  return legacyMemory.slice(-20);
}

// Persist to conversation or legacy
function persist(conversationId: string | undefined, userMsg: string, aiMsg: string) {
  if (conversationId) {
    const conv = getConversation(conversationId) || createConversation(conversationId);
    conv.messages.push({ role: "user",      content: userMsg, timestamp: new Date().toISOString() });
    conv.messages.push({ role: "assistant", content: aiMsg,   timestamp: new Date().toISOString() });
    if (conv.messages.length <= 2) conv.title = userMsg.slice(0, 50) || "New Conversation";
    conv.updatedAt = new Date().toISOString();
    upsertConversation(conv);
  } else {
    legacyMemory.push({ role: "user",      content: userMsg });
    legacyMemory.push({ role: "assistant", content: aiMsg   });
    legacyMemory = legacyMemory.slice(-20);
    saveMemory(legacyMemory);
  }
}

async function runAI(prompt: string, fileContext: string, conversationId?: string): Promise<string> {
  const intent = detectIntent(prompt.toLowerCase().trim());

  const toolResult = await executeTool(intent, prompt.toLowerCase().trim());
  if (toolResult && intent !== "autonomous") return toolResult;

  const messages  = getHistory(conversationId);
  const knowledge = getFilesContext();
  const personal  = getMemoryContext();

  let searchCtx = "";
  if (shouldSearch(prompt)) {
    try {
      const results = await webSearch(prompt);
      searchCtx = `\n\n=== REAL-TIME WEB SEARCH ===\n${results}\n=== END SEARCH ===\nUse these results to give accurate, up-to-date information.`;
    } catch { /* skip */ }
  }

  const autonomousExtra = intent === "autonomous" ? "\n\nAUTONOMOUS MODE: Break task into numbered steps." : "";
  const codingExtra     = intent === "coding"     ? "\n\nCODING MODE: Return complete, working code in markdown code blocks." : "";

  const systemPrompt =
    personalities[currentMode] +
    "\n\nYou are running inside the SENTIENCE system — a futuristic AI interface." +
    personal + autonomousExtra + codingExtra + knowledge + fileContext + searchCtx;

  const model = intent === "coding" || currentMode === "dev" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: prompt }],
    temperature: intent === "coding" ? 0.2 : 0.7,
    max_tokens:  intent === "coding" ? 2048 : 1024,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

// ─── POST /ask  (existing — unchanged behaviour) ──────────────────────────────
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { prompt, conversationId, fileContext: rawFileCtx } = req.body;
    if (!prompt && !rawFileCtx) return res.status(400).json({ error: "Prompt missing" });

    const effectivePrompt = prompt || "";
    const text   = effectivePrompt.toLowerCase().trim();
    const intent = detectIntent(text);

    if (intent === "mode_change") {
      const mode = text.replace(/^mode\s+/, "") as Mode;
      if (personalities[mode]) {
        currentMode = mode;
        addSystemLog(`Mode switched to ${mode.toUpperCase()}`);
        return res.json({
          reply: `🔄 Personality matrix shifted to **${mode.toUpperCase()} MODE**.\n\nSystem parameters updated. Neural pathways reconfigured.`,
          intent,
        });
      }
      return res.json({ reply: "Unknown mode. Available: core, analyst, creative, cyber, tutor, dev" });
    }

    if (intent === "memory_clear") {
      legacyMemory = [];
      clearMemory();
      if (conversationId) {
        const conv = getConversation(conversationId);
        if (conv) { conv.messages = []; conv.updatedAt = new Date().toISOString(); upsertConversation(conv); }
      }
      addSystemLog("Memory cleared");
      return res.json({ reply: "🧹 Memory cleared. All conversation history erased. Starting fresh.", intent });
    }

    trackMessage();
    addSystemLog(`AI query: ${effectivePrompt.slice(0, 60)}`);

    const fileContext = rawFileCtx ? `\n\n=== ATTACHED FILE CONTENT ===\n${rawFileCtx}\n=== END FILE ===` : "";
    const reply = await runAI(effectivePrompt, fileContext, conversationId);

    persist(conversationId, effectivePrompt, reply);
    res.json({ reply, intent });

  } catch (err: any) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

// ─── POST /stream  (NEW — SSE word-by-word streaming) ────────────────────────
router.post("/stream", async (req: Request, res: Response) => {
  const { prompt, conversationId, fileContext: rawFileCtx } = req.body;
  if (!prompt) { res.status(400).json({ error: "Prompt missing" }); return; }

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const text   = prompt.toLowerCase().trim();
    const intent = detectIntent(text);

    // ── Handle special intents without streaming ──────────────────────────
    if (intent === "mode_change") {
      const mode = text.replace(/^mode\s+/, "") as Mode;
      if (personalities[mode as Mode]) {
        currentMode = mode as Mode;
        addSystemLog(`Mode switched to ${mode.toUpperCase()}`);
        const reply = `🔄 Personality matrix shifted to **${mode.toUpperCase()} MODE**.\n\nSystem parameters updated. Neural pathways reconfigured.`;
        send({ token: reply, done: false });
        send({ done: true, fullText: reply });
        persist(conversationId, prompt, reply);
        res.end(); return;
      }
    }

    if (intent === "memory_clear") {
      legacyMemory = []; clearMemory();
      if (conversationId) {
        const conv = getConversation(conversationId);
        if (conv) { conv.messages = []; conv.updatedAt = new Date().toISOString(); upsertConversation(conv); }
      }
      const reply = "🧹 Memory cleared. All conversation history erased. Starting fresh.";
      send({ token: reply, done: false });
      send({ done: true, fullText: reply });
      res.end(); return;
    }

    // ── Tool intents — still stream result ───────────────────────────────
    const toolResult = await executeTool(intent, text);
    if (toolResult && intent !== "autonomous") {
      trackMessage();
      send({ token: toolResult, done: false });
      send({ done: true, fullText: toolResult });
      persist(conversationId, prompt, toolResult);
      res.end(); return;
    }

    // ── Build context ─────────────────────────────────────────────────────
    const messages  = getHistory(conversationId);
    const knowledge = getFilesContext();
    const personal  = getMemoryContext();
    const fileCtx   = rawFileCtx ? `\n\n=== FILE ===\n${rawFileCtx}\n=== END FILE ===` : "";

    let searchCtx = "";
    if (shouldSearch(prompt)) {
      try {
        const results = await webSearch(prompt);
        searchCtx = `\n\n=== REAL-TIME WEB SEARCH ===\n${results}\n=== END SEARCH ===`;
        send({ searching: true });   // small UI signal
      } catch { /* skip */ }
    }

    const autonomousExtra = intent === "autonomous" ? "\n\nAUTONOMOUS MODE: Break task into numbered steps." : "";
    const codingExtra     = intent === "coding"     ? "\n\nCODING MODE: Return complete code in markdown blocks." : "";

    const systemPrompt =
      personalities[currentMode] +
      "\n\nYou run inside SENTIENCE — a futuristic AI interface." +
      personal + autonomousExtra + codingExtra + knowledge + fileCtx + searchCtx;

    const model = intent === "coding" || currentMode === "dev" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

    // ── Stream from Groq ──────────────────────────────────────────────────
    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: prompt }],
      temperature: intent === "coding" ? 0.2 : 0.7,
      max_tokens:  intent === "coding" ? 2048 : 1024,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (token) {
        fullText += token;
        send({ token, done: false });
      }
    }

    send({ done: true, fullText, searched: !!searchCtx });
    trackMessage();
    addSystemLog(`Stream response: ${prompt.slice(0, 50)}`);
    persist(conversationId, prompt, fullText);

  } catch (err: any) {
    console.error("STREAM ERROR:", err);
    send({ error: err?.message || "Stream failed", done: true });
  }

  res.end();
});

// ─── POST /ask-with-file  (existing — unchanged) ──────────────────────────────
router.post("/ask-with-file", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const prompt         = (req.body.prompt as string) || "";
    const conversationId = req.body.conversationId as string | undefined;
    const file           = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    trackMessage();
    let fileContext = "";

    if (file.mimetype === "application/pdf") {
      try {
        const fileWithBuffer = file as { buffer?: Buffer };
        const pdfTextRaw = await extractPdfText(fileWithBuffer.buffer!);
        let pdfText   = (pdfTextRaw || "").trim();
        if (pdfText.length > 12000) pdfText = pdfText.slice(0, 12000) + "\n\n[Truncated...]";
        fileContext = `\n\n=== PDF FILE: ${file.originalname} ===\n${pdfText}\n=== END PDF ===`;
      } catch {
        fileContext = `\n\n=== PDF FILE: ${file.originalname} ===\n[Could not extract text — may be image-based.]\n=== END PDF ===`;
      }
    } else {
      const fileWithBuffer = file as { buffer?: Buffer };
      const text  = (fileWithBuffer.buffer ?? Buffer.from("")).toString("utf-8").slice(0, 12000);
      fileContext = `\n\n=== FILE: ${file.originalname} ===\n${text}\n=== END FILE ===`;
    }

    const reply = await runAI(prompt, fileContext, conversationId);
    persist(conversationId, prompt, reply);
    res.json({ reply });

  } catch (err: any) {
    console.error("PDF ROUTE ERROR:", err);
    res.status(500).json({ error: err?.message || "File processing failed" });
  }
});

router.get("/mode",  (_, res)  => res.json({ mode: currentMode, personality: personalities[currentMode] }));
router.post("/mode", (req, res) => {
  const { mode } = req.body;
  if (personalities[mode as Mode]) {
    currentMode = mode as Mode;
    addSystemLog(`Mode set to ${mode}`);
    res.json({ mode: currentMode, message: "Mode updated" });
  } else {
    res.status(400).json({ error: "Invalid mode" });
  }
});

export default router;
