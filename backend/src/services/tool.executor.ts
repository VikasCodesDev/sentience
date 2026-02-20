import { Intent, detectIntent } from "./cognitive.engine";
import { trackTool } from "../utils/analytics";

export async function executeTool(intent: Intent, text: string): Promise<string | null> {
  switch (intent) {
    case "time": {
      trackTool("time");
      const now = new Date();
      return `Current time: ${now.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
    }

    case "date": {
      trackTool("date");
      const now = new Date();
      return `Today is ${now.toDateString()} — ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
    }

    case "calc": {
      trackTool("calc");
      try {
        const expr = text.replace(/^calc(ulate)?\s+/i, "");
        // Safe eval using Function
        const result = Function(`"use strict"; return (${expr})`)();
        return `Calculation: ${expr} = ${result}`;
      } catch {
        return "Invalid calculation expression.";
      }
    }

    case "weather": {
      trackTool("weather");
      try {
        const city = text.replace(/^weather\s+(in\s+)?/i, "");
        const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=4`);
        const data = await r.text();
        return `Weather for ${city}:\n${data}`;
      } catch {
        return "Could not fetch weather data.";
      }
    }

    case "news": {
      trackTool("news");
      try {
        const r = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
        const ids = await r.json();
        const top5 = ids.slice(0, 5);
        const stories = await Promise.all(
          top5.map(async (id: number) => {
            const s = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return s.json();
          })
        );
        return (
          "🔥 Top Tech Headlines (Hacker News):\n" +
          stories
            .filter((s) => s?.title)
            .map((s, i) => `${i + 1}. ${s.title}`)
            .join("\n")
        );
      } catch {
        return "Could not fetch news at this time.";
      }
    }

    case "joke": {
      trackTool("joke");
      try {
        const r = await fetch("https://official-joke-api.appspot.com/random_joke");
        const j = await r.json();
        return `😄 ${j.setup}\n\n${j.punchline}`;
      } catch {
        return "Joke server offline. Here's one: Why do programmers prefer dark mode? Because light attracts bugs! 🐛";
      }
    }

    case "quote": {
      trackTool("quote");
      const quotes = [
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
        { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { content: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
      ];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      return `💭 "${q.content}" — ${q.author}`;
    }

    case "ip": {
      trackTool("ip");
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        const d = await r.json();
        return `🌐 Your public IP: ${d.ip}`;
      } catch {
        return "Could not fetch IP address.";
      }
    }

    case "search": {
      trackTool("search");
      const query = text.replace(/^(search\s+for|search|look up)\s+/i, "");
      return `🔍 Search query registered: "${query}"\n\nNote: For real-time web search, integrate a search API like SerpAPI or Brave Search. Currently returning simulated results.\n\nSuggested searches:\n- Try asking me to explain ${query}\n- Or ask for information about ${query}`;
    }

    case "autonomous": {
      trackTool("autonomous");
      return null; // Let AI handle with special system prompt
    }

    default:
      return null;
  }
}
