export type Region = "Global" | "China";

export type SourceType = "Official" | "Research";

export type FetchStrategy =
  | "openai-api-changelog"
  | "anthropic-api-release-notes"
  | "anthropic-claude-release-notes"
  | "deepseek-api-updates"
  | "minimax-agent-changelog"
  | "doubao-product-announcements"
  | "doubao-model-announcements"
  | "huggingface-daily-papers";

export type SignalCategory = "Feature" | "Model" | "Platform" | "Deprecation" | "Pricing" | "Paper";

export type Tag =
  | "Agent"
  | "Coding"
  | "Search"
  | "Multimodal"
  | "Open Source"
  | "Enterprise"
  | "Model Release"
  | "API"
  | "Infrastructure"
  | "Research";

export interface Signal {
  id: string;
  title: string;
  titleZh?: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  company: string;
  product: string;
  region: Region;
  category: SignalCategory;
  publishedAt: string;
  fetchedAt: string;
  summary: string;
  tags: Tag[];
  firstHandScore: number;
  heatScore: number;
  signalScore: number;
  rawContentSnippet: string;
  dedupeHash: string;
  sourceRank?: number;
}

export interface Source {
  id: string;
  name: string;
  company: string;
  product: string;
  url: string;
  feedUrls?: string[];
  fallbackUrls?: string[];
  sitemapUrl?: string;
  region: Region;
  sourceType: SourceType;
  priority: number;
  fetchStrategy: FetchStrategy;
  active: boolean;
  lastFetchedAt: string | null;
  lastSuccessfulAt?: string | null;
  lastFetchStatus?: "success" | "empty" | "error";
  lastFetchMessage?: string | null;
}

export interface TrendPoint {
  label: string;
  summary: string;
  count: number;
}

export interface TrendSummary {
  generatedAt: string;
  last7d: TrendPoint[];
  last30d: TrendPoint[];
  chinaVsGlobal: string;
}

export interface DashboardBrief {
  headline: string;
  headlineZh: string;
  summary: string;
  summaryZh: string;
  bullets: string[];
  bulletsZh: string[];
  generatedAt: string;
  sourceSignalIds: string[];
}

export interface RadarStore {
  sources: Source[];
  signals: Signal[];
  trendSummary: TrendSummary;
  brief?: DashboardBrief;
  lastUpdatedAt: string | null;
}
