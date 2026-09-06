import { SourceAdapter } from "@/lib/radar/adapter-utils";
import { arxivAiPapersAdapter } from "@/lib/radar/sources/arxiv";
import { anthropicApiAdapter, anthropicAppsAdapter } from "@/lib/radar/sources/anthropic";
import { deepSeekAdapter } from "@/lib/radar/sources/deepseek";
import { doubaoModelAdapter, doubaoProductAdapter } from "@/lib/radar/sources/doubao";
import { minimaxAdapter } from "@/lib/radar/sources/minimax";
import { openAiAdapter, openAiNewsAdapter } from "@/lib/radar/sources/openai";
import { huggingFaceDailyPapersAdapter } from "@/lib/radar/sources/huggingface";

const adapters: SourceAdapter[] = [
  openAiAdapter,
  openAiNewsAdapter,
  anthropicApiAdapter,
  anthropicAppsAdapter,
  deepSeekAdapter,
  minimaxAdapter,
  doubaoProductAdapter,
  doubaoModelAdapter,
  arxivAiPapersAdapter,
  huggingFaceDailyPapersAdapter
];

export const adapterRegistry = new Map(adapters.map((adapter) => [adapter.sourceId, adapter]));
