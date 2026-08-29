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
  lastAttemptedAt?: string;
  verificationStatus?: "verified" | "stale";
  verificationMessage?: string;
  priceChangedAt?: string;
  dateEvidence?: PriceDateEvidence;
}

export const pricingSnapshot: PriceSnapshotEntry[] = [
  {
    company: "OpenAI",
    anchorLabel: "Flagship",
    product: "GPT-5.6 Sol",
    headlinePrice: "$4 / 1M input",
    secondaryPrice: "$20 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://developers.openai.com/api/docs/models",
    officialUpdatedAt: null,
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Verified against the official flagship model catalog."
  },
  {
    company: "Anthropic",
    anchorLabel: "Flagship",
    product: "Claude Opus 5",
    headlinePrice: "$5 / MTok input",
    secondaryPrice: "$25 / MTok output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    officialUpdatedAt: null,
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Verified against the official model pricing table."
  },
  {
    company: "腾讯混元",
    anchorLabel: "Flagship",
    product: "Hy3",
    headlinePrice: "¥1 / 1M input",
    secondaryPrice: "¥4 / 1M output",
    basis: "API token",
    note: "Tencent TokenHub lists Hy3 as its current flagship text and reasoning model.",
    sourceUrl: "https://cloud.tencent.com/document/product/1823/130055",
    officialUpdatedAt: "2026-08-21T15:42:52+08:00",
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Verified against Tencent TokenHub model pricing."
  },
  {
    company: "DeepSeek",
    anchorLabel: "Flagship",
    product: "DeepSeek-V4-Pro",
    headlinePrice: "¥3 / 1M input",
    secondaryPrice: "¥6 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://www.deepseek.com/platform/",
    officialUpdatedAt: null,
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Verified against DeepSeek's official API pricing."
  },
  {
    company: "MiniMax",
    anchorLabel: "Flagship",
    product: "MiniMax-M3",
    headlinePrice: "$0.3 / 1M input",
    secondaryPrice: "$1.2 / 1M output",
    basis: "API token",
    note: "Official pricing page does not expose a clear last-updated date in fetched page content.",
    sourceUrl: "https://platform.minimax.io/subscribe/token-plan?tab=api-enterprise",
    officialUpdatedAt: null,
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Uses the current <=512K context promotional API rate."
  },
  {
    company: "豆包 / 方舟",
    anchorLabel: "Flagship",
    product: "Doubao-Seed-Evolving",
    headlinePrice: "¥6 / 1M input",
    secondaryPrice: "¥30 / 1M output",
    basis: "API token",
    note: "Current flagship Coding and Agent model rate shown by Volcano Engine.",
    sourceUrl: "https://www.volcengine.com/product/yunque",
    officialUpdatedAt: null,
    verifiedAt: "2026-08-22T00:00:00.000Z",
    verificationStatus: "verified",
    verificationMessage: "Verified against the official Doubao product pricing page."
  }
];
