type Message = {
  role: "user" | "assistant";
  content: string;
};

const memory: Message[] = [];

export function addUserMessage(text: string) {
  memory.push({ role: "user", content: text });
}

export function addAIMessage(text: string) {
  memory.push({ role: "assistant", content: text });
}

export function getMemory(): Message[] {
  return memory.slice(-10); // last 10 messages only
}

export function clearMemory() {
  memory.length = 0;
}
