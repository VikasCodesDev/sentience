import { Router } from "express";
import {
  loadConversations,
  getConversation,
  createConversation,
  deleteConversation,
  upsertConversation,
} from "../utils/conversation.store";

const router = Router();

/* LIST ALL CONVERSATIONS */
router.get("/", (_, res) => {
  const store = loadConversations();
  const convs = Object.values(store)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((c) => ({
      id: c.id,
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      preview: c.messages.at(-1)?.content.slice(0, 80) || "",
    }));
  res.json({ conversations: convs });
});

/* GET SINGLE CONVERSATION */
router.get("/:id", (req, res) => {
  const conv = getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  res.json(conv);
});

/* CREATE NEW */
router.post("/", (req, res) => {
  const id = "conv_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const conv = createConversation(id);
  res.json(conv);
});

/* DELETE */
router.delete("/:id", (req, res) => {
  deleteConversation(req.params.id);
  res.json({ success: true });
});

/* RENAME */
router.patch("/:id/title", (req, res) => {
  const conv = getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  conv.title = req.body.title || conv.title;
  conv.updatedAt = new Date().toISOString();
  upsertConversation(conv);
  res.json({ success: true });
});

/* CLEAR MESSAGES */
router.delete("/:id/messages", (req, res) => {
  const conv = getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  conv.messages = [];
  conv.updatedAt = new Date().toISOString();
  upsertConversation(conv);
  res.json({ success: true });
});

export default router;
