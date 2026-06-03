import { SourceAdapter } from "@/lib/radar/adapter-utils";
import { anthropicApiAdapter, anthropicAppsAdapter } from "@/lib/radar/sources/anthropic";
import { deepSeekAdapter } from "@/lib/radar/sources/deepseek";
import { doubaoModelAdapter, doubaoProductAdapter } from "@/lib/radar/sources/doubao";
import { minimaxAdapter } from "@/lib/radar/sources/minimax";
import { openAiAdapter } from "@/lib/radar/sources/openai";

const adapters: SourceAdapter[] = [
  openAiAdapter,
  anthropicApiAdapter,
  anthropicAppsAdapter,
  deepSeekAdapter,
  minimaxAdapter,
  doubaoProductAdapter,
  doubaoModelAdapter
];

export const adapterRegistry = new Map(adapters.map((adapter) => [adapter.sourceId, adapter]));
