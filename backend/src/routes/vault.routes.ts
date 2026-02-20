import { Router } from "express";
import { loadVault, addVaultItem, deleteVaultItem, updateVaultItem } from "../utils/vault";

const router = Router();

router.get("/", (_, res) => {
  const vault = loadVault();
  res.json({ items: vault, count: vault.length });
});

router.post("/", (req, res) => {
  const { type, title, content, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const item = addVaultItem({ type: type || "note", title, content, tags: tags || [] });
  res.json({ success: true, item });
});

router.put("/:id", (req, res) => {
  const updated = updateVaultItem(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ success: true, item: updated });
});

router.delete("/:id", (req, res) => {
  deleteVaultItem(req.params.id);
  res.json({ success: true });
});

export default router;
