import { differenceInHours, parseISO } from "date-fns";
import { clamp } from "@/lib/utils";
import { SourceType, Tag } from "@/lib/types";

const tagWeights: Partial<Record<Tag, number>> = {
  Agent: 12,
  Coding: 10,
  Search: 8,
  Multimodal: 10,
  "Open Source": 11,
  Enterprise: 7,
  "Model Release": 14,
  API: 10,
  Infrastructure: 9
};

const highMaterialityTerms = [
  "released",
  "launch",
  "introducing",
  "new model",
  "ga",
  "general availability",
  "context window",
  "pricing",
  "billing",
  "tool calling",
  "embedding",
  "api"
];

const mediumMaterialityTerms = [
  "preview",
  "beta",
  "improved",
  "upgrade",
  "support",
  "faster",
  "developer",
  "sdk",
  "platform",
  "rollout"
];

const analyticalTerms = [
  "model",
  "api",
  "pricing",
  "billing",
  "enterprise",
  "tool",
  "agent",
  "search",
  "multimodal",
  "context",
  "embedding",
  "deployment",
  "security"
];

function countMatches(haystack: string, terms: string[]) {
  return terms.reduce((count, term) => count + (haystack.includes(term) ? 1 : 0), 0);
}

export function calculateFreshnessScore(publishedAt: string) {
  const ageHours = differenceInHours(new Date(), parseISO(publishedAt));
  if (ageHours <= 24) {
    return 100;
  }
  if (ageHours <= 72) {
    return 85;
  }
  if (ageHours <= 168) {
    return 70;
  }
  if (ageHours <= 24 * 30) {
    return 50;
  }
  if (ageHours <= 24 * 90) {
    return 30;
  }
  return 10;
}

export function calculateFirstHandScore(input: {
  sourceType: SourceType;
  fetchStrategy: string;
  priority: number;
}) {
  const strategy = input.fetchStrategy.toLowerCase();
  let base = 45;

  if (strategy.includes("release-notes") || strategy.includes("changelog")) {
    base = 96;
  } else if (strategy.includes("rss") || strategy.includes("atom") || strategy.includes("feed")) {
    base = 88;
  } else if (strategy.includes("help-center")) {
    base = 84;
  } else if (strategy.includes("news")) {
    base = 76;
  } else if (input.sourceType === "Official") {
    base = 80;
  }

  return clamp(base + input.priority - 5);
}

export function calculateUpdateMaterialityScore(input: {
  title: string;
  snippet: string;
  tags: Tag[];
}) {
  const haystack = `${input.title} ${input.snippet}`.toLowerCase();
  const tagBoost = input.tags.reduce((acc, tag) => acc + (tagWeights[tag] ?? 4), 0);
  const highHits = countMatches(haystack, highMaterialityTerms);
  const mediumHits = countMatches(haystack, mediumMaterialityTerms);

  const score = 45 + highHits * 16 + mediumHits * 8 + tagBoost / 2;
  return clamp(score);
}

export function calculateAnalyticalRelevanceScore(input: {
  title: string;
  snippet: string;
  tags: Tag[];
}) {
  const haystack = `${input.title} ${input.snippet}`.toLowerCase();
  const tagBoost = input.tags.reduce((acc, tag) => acc + (tagWeights[tag] ?? 4), 0);
  const analyticalHits = countMatches(haystack, analyticalTerms);

  return clamp(40 + analyticalHits * 10 + tagBoost / 2);
}

export function calculateHeatScore(input: {
  title: string;
  snippet: string;
  tags: Tag[];
}) {
  return calculateAnalyticalRelevanceScore(input);
}

export function calculateSignalScore(input: {
  publishedAt: string;
  sourceType: SourceType;
  fetchStrategy: string;
  title: string;
  snippet: string;
  tags: Tag[];
  priority: number;
}) {
  const sourceDirectness = calculateFirstHandScore({
    sourceType: input.sourceType,
    fetchStrategy: input.fetchStrategy,
    priority: input.priority
  });
  const materiality = calculateUpdateMaterialityScore({
    title: input.title,
    snippet: input.snippet,
    tags: input.tags
  });
  const freshness = calculateFreshnessScore(input.publishedAt);
  const analyticalRelevance = calculateAnalyticalRelevanceScore({
    title: input.title,
    snippet: input.snippet,
    tags: input.tags
  });

  return clamp(
    Math.round(
      sourceDirectness * 0.35 +
        materiality * 0.3 +
        freshness * 0.2 +
        analyticalRelevance * 0.15
    )
  );
}
