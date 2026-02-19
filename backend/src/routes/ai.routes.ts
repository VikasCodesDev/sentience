import { loadMemory, saveMemory, clearMemory } from "../utils/memory.store";
import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/* ==============================
   🧠 Memory
================================ */

type Message = {
  role: "user" | "assistant";
  content: string;
};

let memory = loadMemory();

/* ==============================
   🎭 Personality Modes
================================ */

type Mode = "core" | "analyst" | "creative" | "cyber" | "tutor";

let currentMode: Mode = "core";

const personalities: Record<Mode, string> = {
  core: "You are SENTIENCE — a calm futuristic AI core.",
  analyst: "You are a logical and technical assistant.",
  creative: "You are an imaginative visionary AI.",
  cyber: "You are a confident cyberpunk hacker AI.",
  tutor: "You explain things clearly like a teacher.",
};

/* ==============================
   🕒 Current Info Helper
================================ */

function getSystemInfo() {
  return `
Current date: ${new Date().toDateString()}
Current time: ${new Date().toLocaleTimeString()}
Knowledge cutoff does NOT apply. Use tools when needed.
`;
}

/* ==============================
   🚀 AI ROUTE
================================ */

router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const text = prompt.toLowerCase().trim();

    /* ========= MODE SWITCH ========= */

    if (text.startsWith("mode ")) {
      const mode = text.replace("mode ", "") as Mode;

      if (personalities[mode]) {
        currentMode = mode;
        return res.json({
          reply: `Personality switched to ${mode.toUpperCase()} mode.`,
        });
      }

      return res.json({ reply: "Unknown mode." });
    }

    /* ========= MEMORY ========= */

    if (text === "clear memory") {
  memory = [];
  clearMemory();
  return res.json({ reply: "Memory cleared." });
}

    /* ========= LOCAL TOOLS ========= */

    if (text === "time") {
      return res.json({
        reply: new Date().toLocaleTimeString(),
      });
    }

    if (text === "date") {
      return res.json({
        reply: new Date().toDateString(),
      });
    }

    if (text.startsWith("calc ")) {
      try {
        const result = eval(text.replace("calc ", ""));
        return res.json({ reply: `Result: ${result}` });
      } catch {
        return res.json({ reply: "Invalid calculation." });
      }
    }

    /* ========= EXTERNAL TOOLS ========= */

    if (text.startsWith("weather ")) {
      const city = text.replace("weather ", "");
      const r = await fetch(`https://wttr.in/${city}?format=3`);
      const data = await r.text();
      return res.json({ reply: data });
    }

    if (text === "news") {
      const r = await fetch("https://api.sampleapis.com/futurama/episodes");
      const data = await r.json();
      const titles = data.slice(0, 5).map((n: any) => n.title).join("\n");
      return res.json({ reply: "Latest Headlines:\n" + titles });
    }

    if (text === "ip") {
      const r = await fetch("https://api.ipify.org?format=json");
      const data = await r.json();
      return res.json({ reply: `Your IP: ${data.ip}` });
    }

    if (text === "joke") {
      const r = await fetch("https://official-joke-api.appspot.com/random_joke");
      const data = await r.json();
      return res.json({
        reply: `${data.setup}\n${data.punchline}`,
      });
    }

    if (text === "quote") {
      const r = await fetch("https://api.quotable.io/random");
      const data = await r.json();
      return res.json({
        reply: `"${data.content}" — ${data.author}`,
      });
    }

    /* ========= SAVE MEMORY ========= */

    memory.push({ role: "user", content: prompt });
memory = memory.slice(-20); // larger context
saveMemory(memory);

    /* ========= AI FALLBACK ========= */

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content:
            personalities[currentMode] +
            "\n" +
            getSystemInfo() +
            "\nYou are running inside the SENTIENCE system.",
        },

        ...memory,
      ],

      temperature: 0.7,
      max_tokens: 512,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "No response generated.";

    memory.push({ role: "assistant", content: reply });
memory = memory.slice(-20);
saveMemory(memory);


    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;
