export type PriceDateKind = "official_page" | "official_announcement" | "not_stated";

export interface PriceDateEvidence {
  kind: PriceDateKind;
  date: string | null;
  title?: string;
  url?: string;
  siteName?: string;
  checkedAt?: string;
}

export interface PriceSnapshotEntry {
  company: string;
  anchorLabel: string;
  product: string;
  headlinePrice: string;
  secondaryPrice?: string;
  basis: string;
  note: string;
  sourceUrl: string;
  officialUpdatedAt: string | null;
  verifiedAt: string;
  dateEvidence?: PriceDateEvidence;
}

export const pricingSnapshot: PriceSnapshotEntry[] = [
  {
    company: "OpenAI",
    anchorLabel: "Flagship",
    product: "GPT-5.5",
    headlinePrice: "$5 / 1M input",
    secondaryPrice: "$30 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://openai.com/api/pricing/",
    officialUpdatedAt: null,
    verifiedAt: "2026-06-02T00:00:00.000Z"
  },
  {
    company: "Anthropic",
    anchorLabel: "Flagship",
    product: "Claude Opus 4.8",
    headlinePrice: "$5 / MTok input",
    secondaryPrice: "$25 / MTok output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    officialUpdatedAt: null,
    verifiedAt: "2026-06-02T00:00:00.000Z"
  },
  {
    company: "Google",
    anchorLabel: "Flagship",
    product: "Gemini 3.5 Flash",
    headlinePrice: "$1.50 / 1M input",
    secondaryPrice: "$9 / 1M output",
    basis: "API token",
    note: "Official Google pricing page states: Last updated 2026-06-02 UTC.",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    officialUpdatedAt: "2026-06-02T00:00:00.000Z",
    verifiedAt: "2026-06-02T00:00:00.000Z"
  },
  {
    company: "DeepSeek",
    anchorLabel: "Flagship",
    product: "DeepSeek-V4-Pro",
    headlinePrice: "$0.435 / 1M input",
    secondaryPrice: "$0.87 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    officialUpdatedAt: null,
    verifiedAt: "2026-06-02T00:00:00.000Z"
  },
  {
    company: "MiniMax",
    anchorLabel: "Flagship",
    product: "MiniMax-M2.7-highspeed",
    headlinePrice: "$0.6 / 1M input",
    secondaryPrice: "$2.4 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://platform.minimax.io/docs/guides/pricing-paygo",
    officialUpdatedAt: null,
    verifiedAt: "2026-06-02T00:00:00.000Z"
  },
  {
    company: "豆包 / 方舟",
    anchorLabel: "Flagship",
    product: "Agent Plan Max",
    headlinePrice: "1000元 / 月",
    secondaryPrice: "Large 500 / Medium 200",
    basis: "Subscription",
    note: "Official Volcengine page states: 最近更新时间：2026.05.28 15:27:23.",
    sourceUrl: "https://www.volcengine.com/docs/82379/2366394?lang=zh",
    officialUpdatedAt: "2026-05-28T15:27:23+08:00",
    verifiedAt: "2026-06-02T00:00:00.000Z"
  }
];
