import { summarizeSnippet, suggestTags } from "@/lib/ai/fallback";
import { Tag } from "@/lib/types";

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

function parseJsonObject(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned) as Partial<AiResult>;
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

async function callOpenAiLikeProvider(provider: ProviderConfig, title: string, snippet: string): Promise<AiResult> {
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
              "You summarize first-hand AI product updates in one English sentence, create a concise Chinese title that explains the business/product meaning for Chinese readers, and suggest up to four tags from: Agent, Coding, Search, Multimodal, Open Source, Enterprise, Model Release, API, Infrastructure. Return JSON with summary, titleZh, and tags. The Chinese title must be natural Simplified Chinese, under 28 Chinese characters, and should not be a literal word-by-word translation."
          },
          {
            role: "user",
            content: `Title: ${title}\nSnippet: ${snippet}`
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

    return coerceAiResult(parseJsonObject(raw), title, snippet);
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
            "You summarize first-hand AI product updates in one English sentence, create a concise Chinese title that explains the business/product meaning for Chinese readers, and suggest up to four tags from: Agent, Coding, Search, Multimodal, Open Source, Enterprise, Model Release, API, Infrastructure. Return a JSON object with summary, titleZh, and tags. The Chinese title must be natural Simplified Chinese, under 28 Chinese characters, and should not be a literal word-by-word translation."
        },
        {
          role: "user",
          content: `Title: ${title}\nSnippet: ${snippet}`
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

  return coerceAiResult(parseJsonObject(raw), title, snippet);
}

export async function enrichSignalWithAi(input: {
  title: string;
  snippet: string;
}): Promise<AiResult> {
  const providers = getProviders();

  for (const provider of providers) {
    try {
      return await callOpenAiLikeProvider(provider, input.title, input.snippet);
    } catch {}
  }

  return {
    summary: summarizeSnippet(input.title, input.snippet),
    tags: suggestTags(input.title, input.snippet)
  };
}
