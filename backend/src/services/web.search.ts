// Free real-time web search — no API key needed
// Uses DuckDuckGo Instant Answer API + Wikipedia fallback

export async function webSearch(query: string): Promise<string> {
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res    = await fetch(ddgUrl, { signal: AbortSignal.timeout(5000) });
    const data   = await res.json();

    const parts: string[] = [];

    if (data.AbstractText) parts.push(`Summary: ${data.AbstractText}`);
    if (data.Answer)       parts.push(`Answer: ${data.Answer}`);
    if (data.Definition)   parts.push(`Definition: ${data.Definition}`);

    if (data.RelatedTopics?.length > 0) {
      const topics = (data.RelatedTopics as any[])
        .filter(t => t.Text)
        .slice(0, 4)
        .map(t => `• ${t.Text}`);
      if (topics.length) parts.push("Related:\n" + topics.join("\n"));
    }

    // Wikipedia fallback
    if (parts.length === 0) {
      const term    = query.trim().split(" ").slice(0, 4).join("_");
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (wikiRes.ok) {
        const wiki = await wikiRes.json();
        if (wiki.extract) parts.push(`Wikipedia: ${wiki.extract.slice(0, 700)}`);
      }
    }

    return parts.length > 0
      ? parts.join("\n\n")
      : `No real-time results found for: "${query}"`;

  } catch (err: any) {
    return `Search unavailable (${err?.message || "timeout"}). Using training knowledge.`;
  }
}
