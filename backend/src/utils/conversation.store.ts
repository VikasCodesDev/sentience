import fs from "fs";
import path from "path";

const CONV_PATH = path.join(process.cwd(), "data/conversations.json");

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type ConversationStore = Record<string, Conversation>;

export function loadConversations(): ConversationStore {
  try {
    if (!fs.existsSync(CONV_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONV_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConversations(store: ConversationStore) {
  fs.writeFileSync(CONV_PATH, JSON.stringify(store, null, 2));
}

export function getConversation(id: string): Conversation | null {
  const store = loadConversations();
  return store[id] || null;
}

export function upsertConversation(conv: Conversation) {
  const store = loadConversations();
  store[conv.id] = conv;
  saveConversations(store);
}

export function deleteConversation(id: string) {
  const store = loadConversations();
  delete store[id];
  saveConversations(store);
}

export function createConversation(id: string): Conversation {
  const conv: Conversation = {
    id,
    title: "New Conversation",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  upsertConversation(conv);
  return conv;
}
