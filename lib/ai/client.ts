import { summarizeSnippet, suggestTags } from "@/lib/ai/fallback";
import { DashboardBrief, Signal, Tag } from "@/lib/types";

interface AiResult {
  summary: string;
  titleZh?: string;
  tags: Tag[];
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  url: string;
}

function parseJsonObject<T>(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

function coerceAiResult(parsed: Partial<AiResult>, title: string, snippet: string): AiResult {
  const titleZh = parsed.titleZh?.trim();

  return {
    summary: parsed.summary || summarizeSnippet(title, snippet),
    titleZh: titleZh && /[\u4e00-\u9fff]/.test(titleZh) ? titleZh : undefined,
    tags: (parsed.tags?.length ? parsed.tags : suggestTags(title, snippet)).slice(0, 4) as Tag[]
  };
}

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  if (process.env.DEEPSEEK_API_KEY) {
    providers.push({
      name: "deepseek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      url: `${process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"}/chat/completions`
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      url: "https://api.openai.com/v1/responses"
    });
  }

  return providers;
}

async function callOpenAiLikeProvider(provider: ProviderConfig, title: string, snippet: string, contentKind: string): Promise<AiResult> {
  if (provider.name === "openai") {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        input: [
          {
            role: "system",
            content:
              "You summarize first-hand AI product updates and AI research papers in one English sentence, create a concise Chinese title that explains the practical meaning for Chinese readers, and suggest up to four tags from: Agent, Coding, Search, Multimodal, Open Source, Enterprise, Model Release, API, Infrastructure, Research. For a paper, state the problem, method, and main result when available. Return JSON with summary, titleZh, and tags. The Chinese title must be natural Simplified Chinese, under 28 Chinese characters, and should not be a literal word-by-word translation."
          },
          {
            role: "user",
            content: `Content type: ${contentKind}\nTitle: ${title}\nSnippet: ${snippet}`
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "signal_enrichment",
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                titleZh: { type: "string" },
                tags: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["summary", "titleZh", "tags"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}`);
    }

    const payload = await response.json();
    const raw = payload.output?.[0]?.content?.[0]?.text;
    if (!raw) {
      throw new Error("Missing OpenAI response payload");
    }

    return coerceAiResult(parseJsonObject<Partial<AiResult>>(raw), title, snippet);
  }

  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize first-hand AI product updates and AI research papers in one English sentence, create a concise Chinese title that explains the practical meaning for Chinese readers, and suggest up to four tags from: Agent, Coding, Search, Multimodal, Open Source, Enterprise, Model Release, API, Infrastructure, Research. For a paper, state the problem, method, and main result when available. Return a JSON object with summary, titleZh, and tags. The Chinese title must be natural Simplified Chinese, under 28 Chinese characters, and should not be a literal word-by-word translation."
        },
        {
          role: "user",
          content: `Content type: ${contentKind}\nTitle: ${title}\nSnippet: ${snippet}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek error ${response.status}`);
  }

  const payload = await response.json();
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Missing DeepSeek response payload");
  }

  return coerceAiResult(parseJsonObject<Partial<AiResult>>(raw), title, snippet);
}

export async function enrichSignalWithAi(input: {
  title: string;
  snippet: string;
  contentKind?: string;
}): Promise<AiResult> {
  const providers = getProviders();

  for (const provider of providers) {
    try {
      return await callOpenAiLikeProvider(provider, input.title, input.snippet, input.contentKind ?? "AI product update");
    } catch {}
  }

  return {
    summary: summarizeSnippet(input.title, input.snippet),
    tags: suggestTags(input.title, input.snippet)
  };
}

interface BriefPayload {
  headline?: string;
  headlineZh?: string;
  summary?: string;
  summaryZh?: string;
  bullets?: string[];
  bulletsZh?: string[];
}

function selectBriefSignals(signals: Signal[]) {
  const productSignals = signals.filter((signal) => signal.category !== "Paper");
  const paperSignals = signals.filter((signal) => signal.category === "Paper");
  const byPriority = (a: Signal, b: Signal) =>
    b.signalScore - a.signalScore || +new Date(b.publishedAt) - +new Date(a.publishedAt);
  const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentProducts = productSignals.filter((signal) => +new Date(signal.publishedAt) >= recentCutoff).sort(byPriority);
  const selectedProducts = (recentProducts.length ? recentProducts : [...productSignals].sort(byPriority)).slice(0, 8);
  const selectedPapers = [...paperSignals].sort((a, b) => (a.sourceRank ?? 99) - (b.sourceRank ?? 99)).slice(0, 3);
  return [...selectedProducts, ...selectedPapers];
}

function buildFallbackBrief(signals: Signal[]): DashboardBrief {
  const selected = selectBriefSignals(signals);
  const companies = [...new Set(selected.filter((signal) => signal.category !== "Paper").map((signal) => signal.company))].slice(0, 3);
  const tagCounts = new Map<string, number>();
  selected.forEach((signal) => signal.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)));
  const themes = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  const bullets = selected.slice(0, 3).map((signal) => signal.title);
  const bulletsZh = selected.slice(0, 3).map((signal) => signal.titleZh ?? signal.title);

  return {
    headline: `AI activity is clustering around ${themes.join(", ") || "model and platform updates"}`,
    headlineZh: `近期 AI 动态集中在${themes.join("、") || "模型与平台能力"}`,
    summary: `${companies.join(", ") || "Tracked providers"} are driving the latest verified product activity, while the research feed adds practical signals on training and evaluation.`,
    summaryZh: `${companies.join("、") || "已追踪厂商"}贡献了近期主要产品变化，论文源则补充了训练、评测与 Agent 方向的前沿信号。`,
    bullets,
    bulletsZh,
    generatedAt: new Date().toISOString(),
    sourceSignalIds: selected.map((signal) => signal.id)
  };
}

function coerceBrief(payload: BriefPayload, signals: Signal[]): DashboardBrief {
  const fallback = buildFallbackBrief(signals);
  return {
    headline: payload.headline?.trim() || fallback.headline,
    headlineZh: payload.headlineZh?.trim() || fallback.headlineZh,
    summary: payload.summary?.trim() || fallback.summary,
    summaryZh: payload.summaryZh?.trim() || fallback.summaryZh,
    bullets: payload.bullets?.filter(Boolean).slice(0, 3) ?? fallback.bullets,
    bulletsZh: payload.bulletsZh?.filter(Boolean).slice(0, 3) ?? fallback.bulletsZh,
    generatedAt: new Date().toISOString(),
    sourceSignalIds: fallback.sourceSignalIds
  };
}

async function callBriefProvider(provider: ProviderConfig, signals: Signal[]) {
  const selected = selectBriefSignals(signals);
  const evidence = selected.map((signal) => ({
    id: signal.id,
    title: signal.title,
    titleZh: signal.titleZh,
    company: signal.company,
    category: signal.category,
    publishedAt: signal.publishedAt,
    summary: signal.summary,
    tags: signal.tags
  }));
  const system =
    "Create a concise bilingual AI market brief from only the supplied verified signals. Explain what changed and why it matters; do not invent facts, numbers, causality, or company intent. Return JSON with headline, headlineZh, summary, summaryZh, bullets, bulletsZh. Headlines should be under 18 words / 24 Chinese characters. Summaries should be 1-2 sentences. Return exactly 3 factual bullets in each language.";

  if (provider.name === "openai") {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: provider.model,
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(evidence) }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "dashboard_brief",
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                headlineZh: { type: "string" },
                summary: { type: "string" },
                summaryZh: { type: "string" },
                bullets: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                bulletsZh: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }
              },
              required: ["headline", "headlineZh", "summary", "summaryZh", "bullets", "bulletsZh"],
              additionalProperties: false
            }
          }
        }
      })
    });
    if (!response.ok) throw new Error(`OpenAI brief error ${response.status}`);
    const payload = await response.json();
    const raw = payload.output?.[0]?.content?.[0]?.text;
    if (!raw) throw new Error("Missing OpenAI brief payload");
    return coerceBrief(parseJsonObject<BriefPayload>(raw), signals);
  }

  const response = await fetch(provider.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(evidence) }
      ]
    })
  });
  if (!response.ok) throw new Error(`DeepSeek brief error ${response.status}`);
  const payload = await response.json();
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Missing DeepSeek brief payload");
  return coerceBrief(parseJsonObject<BriefPayload>(raw), signals);
}

export async function generateDashboardBrief(signals: Signal[]) {
  for (const provider of getProviders()) {
    try {
      return await callBriefProvider(provider, signals);
    } catch {}
  }

  return buildFallbackBrief(signals);
}
