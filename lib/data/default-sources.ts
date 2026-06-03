import { Source } from "@/lib/types";

export const defaultSources: Source[] = [
  {
    id: "claude-api-release-notes",
    name: "Anthropic API Release Notes",
    company: "Anthropic",
    product: "Claude API",
    url: "https://docs.anthropic.com/en/release-notes/api",
    sitemapUrl: "https://docs.anthropic.com/sitemap.xml",
    region: "Global",
    sourceType: "Official",
    priority: 10,
    fetchStrategy: "anthropic-api-release-notes",
    active: true,
    lastFetchedAt: null
  },
  {
    id: "openai-api-changelog",
    name: "OpenAI API Changelog",
    company: "OpenAI",
    product: "OpenAI API",
    url: "https://developers.openai.com/api/docs/changelog",
    fallbackUrls: ["https://platform.openai.com/docs/changelog"],
    sitemapUrl: "https://developers.openai.com/sitemap.xml",
    region: "Global",
    sourceType: "Official",
    priority: 10,
    fetchStrategy: "openai-api-changelog",
    active: true,
    lastFetchedAt: null
  },
  {
    id: "deepseek-api-updates",
    name: "DeepSeek API Change Log",
    company: "DeepSeek",
    product: "DeepSeek API",
    url: "https://api-docs.deepseek.com/updates/",
    fallbackUrls: ["https://api-docs.deepseek.com/zh-cn/updates"],
    region: "Global",
    sourceType: "Official",
    priority: 10,
    fetchStrategy: "deepseek-api-updates",
    active: true,
    lastFetchedAt: null
  },
  {
    id: "minimax-agent-changelog",
    name: "MiniMax Agent Changelog",
    company: "MiniMax",
    product: "MiniMax Agent",
    url: "https://agent.minimax.io/docs/changelog",
    fallbackUrls: ["https://agent.minimax.io/docs/llms.txt"],
    region: "Global",
    sourceType: "Official",
    priority: 9,
    fetchStrategy: "minimax-agent-changelog",
    active: true,
    lastFetchedAt: null
  },
  {
    id: "doubao-product-announcements",
    name: "Volcengine Ark Product Announcements",
    company: "ByteDance",
    product: "Doubao / Ark",
    url: "https://www.volcengine.com/docs/82379/1159177?lang=zh",
    fallbackUrls: ["https://www.volcengine.com/docs/82379/2172656?lang=zh"],
    region: "China",
    sourceType: "Official",
    priority: 10,
    fetchStrategy: "doubao-product-announcements",
    active: true,
    lastFetchedAt: null
  },
  {
    id: "doubao-model-announcements",
    name: "Volcengine Ark Model Announcements",
    company: "ByteDance",
    product: "Doubao / Ark Models",
    url: "https://www.volcengine.com/docs/82379/1159178?lang=zh",
    fallbackUrls: ["https://www.volcengine.com/docs/82379/1866361?lang=zh"],
    region: "China",
    sourceType: "Official",
    priority: 10,
    fetchStrategy: "doubao-model-announcements",
    active: true,
    lastFetchedAt: null
  }
];
