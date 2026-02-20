import fs from "fs";
import path from "path";

const VAULT_PATH = path.join(process.cwd(), "data/vault.json");

export interface VaultItem {
  id: string;
  type: "note" | "link" | "snippet" | "file" | "output";
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function loadVault(): VaultItem[] {
  try {
    if (!fs.existsSync(VAULT_PATH)) return [];
    return JSON.parse(fs.readFileSync(VAULT_PATH, "utf-8"));
  } catch { return []; }
}

export function saveVault(items: VaultItem[]) {
  fs.writeFileSync(VAULT_PATH, JSON.stringify(items, null, 2));
}

export function addVaultItem(item: Omit<VaultItem, "id" | "createdAt" | "updatedAt">): VaultItem {
  const vault = loadVault();
  const newItem: VaultItem = {
    ...item,
    id: "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vault.push(newItem);
  saveVault(vault);
  return newItem;
}

export function deleteVaultItem(id: string) {
  const vault = loadVault().filter(v => v.id !== id);
  saveVault(vault);
}

export function updateVaultItem(id: string, updates: Partial<VaultItem>) {
  const vault = loadVault();
  const idx = vault.findIndex(v => v.id === id);
  if (idx >= 0) {
    vault[idx] = { ...vault[idx], ...updates, updatedAt: new Date().toISOString() };
    saveVault(vault);
    return vault[idx];
  }
  return null;
}
