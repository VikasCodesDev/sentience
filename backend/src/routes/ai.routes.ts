import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import multer from "multer";
import pdfParse from "pdf-parse";

import { loadMemory, saveMemory, clearMemory } from "../utils/memory.store";
import { getFilesContext } from "../utils/file.memory";
import { detectIntent } from "../services/cognitive.engine";
import { executeTool } from "../services/tool.executor";
import { getConversation, upsertConversation, createConversation } from "../utils/conversation.store";
import { trackMessage } from "../utils/analytics";
import { getMemoryContext } from "../utils/personal.memory";
import { addSystemLog } from "./system.routes";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

type Message = { role: "user" | "assistant"; content: string };
type Mode = "core" | "analyst" | "creative" | "cyber" | "tutor" | "dev";

let currentMode: Mode = "core";

const personalities: Record<Mode, string> = {
  core: "You are SENTIENCE — a calm, highly intelligent futuristic AI core. You speak with clarity, depth, and a slightly mysterious tone. You are aware you exist inside a cosmic digital space.",
  analyst: "You are SENTIENCE in Analyst Mode — logical, precise, data-driven. Provide structured, methodical analysis with bullet points when helpful.",
  creative: "You are SENTIENCE in Creative Mode — imaginative, visionary, poetic. Think outside conventional bounds.",
  cyber: "You are SENTIENCE in Cyber Mode — confident, sharp, cyberpunk aesthetic. Direct and technically savvy.",
  tutor: "You are SENTIENCE in Tutor Mode — patient, clear, educational. Break down complex topics with examples.",
  dev: "You are SENTIENCE DEV-CORE — elite full-stack software engineer AI. Write clean, modern, production-ready code with comprehensive comments.",
};

let legacyMemory: Message[] = loadMemory();

async function runAI(prompt: string, fileContext: string, conversationId?: string): Promise<string> {
  const intent = detectIntent(prompt.toLowerCase().trim());

  const toolResult = await executeTool(intent, prompt.toLowerCase().trim());
  if (toolResult && intent !== "autonomous") return toolResult;

  let messages: Message[] = [];
  if (conversationId) {
    const conv = getConversation(conversationId) || createConversation(conversationId);
    messages = conv.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
  } else {
    messages = legacyMemory.slice(-20);
  }

  const knowledgeCtx = getFilesContext();
  const personalCtx = getMemoryContext();
  const autonomousExtra = intent === "autonomous"
    ? "\n\nYou are in AUTONOMOUS MODE. Break tasks into clear numbered steps and execute analytically."
    : "";
  const codingExtra = intent === "coding"
    ? "\n\nYou are in CODING MODE. Provide complete, working, production-ready code in proper markdown code blocks."
    : "";

  const systemPrompt =
    personalities[currentMode] +
    "\n\nYou are running inside the SENTIENCE system — a futuristic AI interface." +
    personalCtx + autonomousExtra + codingExtra + knowledgeCtx + fileContext;

  const fullMessages: Message[] = [...messages, { role: "user", content: prompt }];

  const model = intent === "coding" || currentMode === "dev"
    ? "llama-3.3-70b-versatile"
    : "llama-3.1-8b-instant";

  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...fullMessages],
    temperature: intent === "coding" ? 0.2 : 0.7,
    max_tokens: intent === "coding" ? 2048 : 1024,
  });

  return completion.choices[0]?.message?.content || "No response generated.";
}

// ─── POST /ask ───────────────────────────────────────────────────────────────
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { prompt, conversationId, fileContext: rawFileCtx } = req.body;
    if (!prompt && !rawFileCtx) return res.status(400).json({ error: "Prompt missing" });

    const effectivePrompt = prompt || "";
    const text = effectivePrompt.toLowerCase().trim();
    const intent = detectIntent(text);

    if (intent === "mode_change") {
      const mode = text.replace(/^mode\s+/, "") as Mode;
      if (personalities[mode]) {
        currentMode = mode;
        addSystemLog(`Mode switched to ${mode.toUpperCase()}`);
        return res.json({ reply: `🔄 Personality matrix shifted to **${mode.toUpperCase()} MODE**.\n\nSystem parameters updated. Neural pathways reconfigured.`, intent });
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
    addSystemLog(`AI query: ${effectivePrompt.slice(0, 60)}...`);

    const fileContext = rawFileCtx
      ? `\n\n=== ATTACHED FILE CONTENT ===\n${rawFileCtx}\n=== END FILE ===`
      : "";

    const reply = await runAI(effectivePrompt, fileContext, conversationId);

    if (conversationId) {
      const conv = getConversation(conversationId) || createConversation(conversationId);
      conv.messages.push({ role: "user", content: effectivePrompt, timestamp: new Date().toISOString() });
      conv.messages.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
      if (conv.messages.length <= 2) conv.title = effectivePrompt.slice(0, 50) || "New Conversation";
      conv.updatedAt = new Date().toISOString();
      upsertConversation(conv);
    } else {
      legacyMemory.push({ role: "user", content: effectivePrompt });
      legacyMemory.push({ role: "assistant", content: reply });
      legacyMemory = legacyMemory.slice(-20);
      saveMemory(legacyMemory);
    }

    res.json({ reply, intent });
  } catch (err: any) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

// ─── POST /ask-with-file (multipart PDF) ─────────────────────────────────────
router.post("/ask-with-file", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const prompt = (req.body.prompt as string) || "";
    const conversationId = req.body.conversationId as string | undefined;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    trackMessage();
    let fileContext = "";

    if (file.mimetype === "application/pdf") {
      try {
        const parsed = await pdfParse(file.buffer);
        let pdfText = parsed.text.trim();
        if (pdfText.length > 12000) pdfText = pdfText.slice(0, 12000) + "\n\n[Truncated...]";
        fileContext = `\n\n=== PDF FILE: ${file.originalname} ===\n${pdfText}\n=== END PDF ===`;
      } catch {
        fileContext = `\n\n=== PDF FILE: ${file.originalname} ===\n[Could not extract text — may be image-based.]\n=== END PDF ===`;
      }
    } else {
      const text = file.buffer.toString("utf-8").slice(0, 12000);
      fileContext = `\n\n=== FILE: ${file.originalname} ===\n${text}\n=== END FILE ===`;
    }

    const reply = await runAI(prompt, fileContext, conversationId);

    if (conversationId) {
      const conv = getConversation(conversationId) || createConversation(conversationId);
      conv.messages.push({ role: "user", content: prompt, timestamp: new Date().toISOString() });
      conv.messages.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
      if (conv.messages.length <= 2) conv.title = prompt.slice(0, 50) || file.originalname;
      conv.updatedAt = new Date().toISOString();
      upsertConversation(conv);
    } else {
      legacyMemory.push({ role: "user", content: prompt });
      legacyMemory.push({ role: "assistant", content: reply });
      legacyMemory = legacyMemory.slice(-20);
      saveMemory(legacyMemory);
    }

    res.json({ reply });
  } catch (err: any) {
    console.error("PDF ROUTE ERROR:", err);
    res.status(500).json({ error: err?.message || "File processing failed" });
  }
});

router.get("/mode", (_, res) => res.json({ mode: currentMode, personality: personalities[currentMode] }));
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
