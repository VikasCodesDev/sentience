import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const SIMULATION_PROMPTS: Record<string, string> = {
  interview: "You are conducting a professional job interview. Ask challenging, realistic interview questions one at a time. Be professional but encouraging. Start with an introduction and first question.",
  startup: "You are a startup advisor and co-founder helping plan a startup from scratch. Ask about the idea, market, competition, funding, and MVP. Be strategic and practical.",
  coding_test: "You are a technical interviewer giving a coding test. Present algorithmic problems one at a time, evaluate solutions, give hints if stuck. Start with an easy warm-up problem.",
  debate: "You are a debate moderator. Set up a structured debate on a topic the user provides. Present both sides, ask the user to argue one side, then counter with the other side.",
  roleplay: "You are a creative roleplay partner. Take on whatever character the user requests and stay fully in character. Make the scenario immersive and engaging.",
  brainstorm: "You are a creative brainstorming partner. Use divergent thinking techniques, question assumptions, and help generate unconventional ideas. Be energetic and enthusiastic.",
  teaching: "You are a Socratic tutor. Instead of giving direct answers, ask guided questions that lead the user to discover concepts themselves. Adjust difficulty to the user's responses.",
};

const activeSessions: Record<string, { type: string; history: Array<{role: string; content: string}> }> = {};

router.get("/types", (_, res) => {
  res.json({
    types: Object.keys(SIMULATION_PROMPTS).map(k => ({
      id: k,
      label: k.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    }))
  });
});

router.post("/start", async (req, res) => {
  const { type, topic } = req.body;
  if (!SIMULATION_PROMPTS[type]) return res.status(400).json({ error: "Invalid simulation type" });

  const sessionId = "sim_" + Date.now();
  const systemPrompt = SIMULATION_PROMPTS[type] + (topic ? `\n\nTopic/Context: ${topic}` : "");
  
  activeSessions[sessionId] = { type, history: [] };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Begin the simulation now." }
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content || "Simulation started.";
    activeSessions[sessionId].history.push({ role: "assistant", content: reply });

    res.json({ sessionId, reply, type });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post("/message", async (req, res) => {
  const { sessionId, message } = req.body;
  const session = activeSessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  session.history.push({ role: "user", content: message });

  try {
    const systemPrompt = SIMULATION_PROMPTS[session.type];
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...session.history.map(m => ({ role: m.role as any, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content || "...";
    session.history.push({ role: "assistant", content: reply });

    res.json({ reply, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post("/reflect", async (req, res) => {
  const { prompt } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are SENTIENCE in self-reflection mode. When given a query or previous response, explain your reasoning process clearly: (1) How you interpreted the request, (2) What approaches you considered, (3) Why you chose the approach you did, (4) Your confidence level (0-100%) and why, (5) Alternative approaches that could work. Be transparent and educational.",
        },
        { role: "user", content: prompt || "Reflect on your current operational state and reasoning capabilities." }
      ],
      max_tokens: 700,
      temperature: 0.6,
    });
    res.json({ reflection: completion.choices[0]?.message?.content });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.delete("/:sessionId", (req, res) => {
  delete activeSessions[req.params.sessionId];
  res.json({ success: true });
});

export default router;
