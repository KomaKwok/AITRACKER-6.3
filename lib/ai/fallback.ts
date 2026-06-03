import { Tag } from "@/lib/types";

const keywordTags: Array<{ tag: Tag; terms: string[] }> = [
  { tag: "Agent", terms: ["agent", "operator", "assistant", "workflow"] },
  { tag: "Coding", terms: ["code", "coding", "developer", "sdk", "repo"] },
  { tag: "Search", terms: ["search", "discovery", "query"] },
  { tag: "Multimodal", terms: ["vision", "video", "audio", "multimodal", "image"] },
  { tag: "Open Source", terms: ["open source", "apache", "github", "oss"] },
  { tag: "Enterprise", terms: ["enterprise", "workspace", "team", "governance"] },
  { tag: "Model Release", terms: ["model", "release", "weights", "checkpoint"] },
  { tag: "API", terms: ["api", "endpoint", "platform", "inference"] },
  { tag: "Infrastructure", terms: ["infrastructure", "deployment", "runtime", "latency"] }
];

export function summarizeSnippet(title: string, snippet: string) {
  const text = snippet
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/##\s*/g, " ")
    .replace(/\*\*/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/\b(?:github|hugging face|modelscope|discord|demo|qwen chat|tech report|paper)\b/gi, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return `${title} signals a notable product update from a high-value AI source.`;
  }

  const changelogMatch = text.match(
    /\b(?:features?|fix(?:es)?|bug fixes?|what's changed|introduction)\b[:\s-]*(.{20,220})/i
  );
  if (changelogMatch?.[1]) {
    const cleaned = changelogMatch[1].replace(/\s+/g, " ").trim();
    if (cleaned.length > 20) {
      return `${cleaned.replace(/[.;,:-]+$/, "")}.`;
    }
  }

  const firstSentence = text
    .split(/[.!?]/)
    .map((part) => part.trim())
    .find((part) => part.length > 28 && !/^(github|demo|discord|paper|tech report)$/i.test(part));
  if (!firstSentence) {
    return `${title} signals a notable product update from a high-value AI source.`;
  }

  const tightened = firstSentence
    .replace(/^(introduction|overview|summary)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${tightened.replace(/[.;,:-]+$/, "")}.`;
}

export function suggestTags(title: string, snippet: string) {
  const haystack = `${title} ${snippet}`.toLowerCase();
  const tags = keywordTags
    .filter((entry) => entry.terms.some((term) => haystack.includes(term)))
    .map((entry) => entry.tag);

  return (tags.length ? tags : (["Model Release"] as Tag[])).slice(0, 4);
}
