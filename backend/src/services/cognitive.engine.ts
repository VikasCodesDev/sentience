export type Intent =
  | "time"
  | "date"
  | "calc"
  | "weather"
  | "news"
  | "joke"
  | "quote"
  | "ip"
  | "memory_clear"
  | "mode_change"
  | "coding"
  | "autonomous"
  | "search"
  | "general";

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase().trim();

  if (t === "time" || t === "what time is it" || t === "current time") return "time";
  if (t === "date" || t === "what is today" || t === "today's date") return "date";
  if (t.startsWith("calc ") || t.startsWith("calculate ")) return "calc";
  if (t.startsWith("weather ") || t.startsWith("weather in ")) return "weather";
  if (t === "news" || t.startsWith("show news") || t.startsWith("latest news")) return "news";
  if (t === "joke" || t === "tell me a joke") return "joke";
  if (t === "quote" || t === "give me a quote" || t === "inspirational quote") return "quote";
  if (t === "ip" || t === "my ip" || t === "what is my ip") return "ip";
  if (t === "clear memory" || t === "reset memory" || t === "forget everything") return "memory_clear";
  if (t.startsWith("mode ")) return "mode_change";
  if (t.startsWith("search ") || t.startsWith("search for ") || t.startsWith("look up ")) return "search";

  // Autonomous task detection
  if (
    t.startsWith("plan ") ||
    t.startsWith("autonomously ") ||
    t.includes("step by step plan") ||
    t.includes("create a plan") ||
    t.startsWith("execute task:")
  ) {
    return "autonomous";
  }

  // Coding detection
  if (
    t.includes("write code") ||
    t.includes("write a function") ||
    t.includes("create a component") ||
    t.includes("build a") ||
    t.includes("implement") ||
    t.includes("debug") ||
    t.includes("fix this code") ||
    t.includes("algorithm") ||
    t.includes("in python") ||
    t.includes("in javascript") ||
    t.includes("in typescript") ||
    t.includes("in react") ||
    t.includes("in java") ||
    t.includes("in c++") ||
    (t.includes("code") && t.length > 15) ||
    t.includes("function(") ||
    t.includes("class ") ||
    t.includes("async ") ||
    t.includes("optimize") ||
    t.includes("refactor")
  ) {
    return "coding";
  }

  return "general";
}
