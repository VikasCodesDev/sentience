import { Router } from "express";
import {
  loadPersonalMemory, savePersonalMemory, addMemoryFact,
  setPreference, clearPersonalMemory, getMemoryContext
} from "../utils/personal.memory";

const router = Router();

router.get("/", (_, res) => {
  res.json(loadPersonalMemory());
});

router.post("/fact", (req, res) => {
  const { fact } = req.body;
  if (!fact) return res.status(400).json({ error: "fact required" });
  addMemoryFact(fact);
  res.json({ success: true, message: "Fact stored in personal memory." });
});

router.post("/preference", (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: "key and value required" });
  setPreference(key, value);
  res.json({ success: true });
});

router.post("/name", (req, res) => {
  const { name } = req.body;
  const m = loadPersonalMemory();
  m.name = name;
  savePersonalMemory(m);
  res.json({ success: true });
});

router.post("/goal", (req, res) => {
  const { goal } = req.body;
  const m = loadPersonalMemory();
  m.goals.push(goal);
  savePersonalMemory(m);
  res.json({ success: true });
});

router.delete("/", (_, res) => {
  clearPersonalMemory();
  res.json({ success: true, message: "Personal memory cleared." });
});

router.delete("/fact/:index", (req, res) => {
  const m = loadPersonalMemory();
  const idx = parseInt(req.params.index);
  if (!isNaN(idx) && idx >= 0 && idx < m.facts.length) {
    m.facts.splice(idx, 1);
    savePersonalMemory(m);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid index" });
  }
});

router.get("/context", (_, res) => {
  res.json({ context: getMemoryContext() });
});

export default router;
