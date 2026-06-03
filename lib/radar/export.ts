import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RadarStore, Signal } from "@/lib/types";

const exportDir = path.join(process.cwd(), "data", "exports");
const markdownFile = path.join(exportDir, "latest-links-zh.md");
const jsonFile = path.join(exportDir, "latest-links.json");

function formatDate(value: string) {
  return format(new Date(value), "yyyy-MM-dd HH:mm", { locale: zhCN });
}

function buildSignalLine(signal: Signal) {
  return [
    `- [${signal.title}](${signal.url})`,
    `  - 公司: ${signal.company}`,
    `  - 产品: ${signal.product}`,
    `  - 来源: ${signal.sourceName} / ${signal.region}`,
    `  - 类型: ${signal.category}`,
    `  - 发布时间: ${formatDate(signal.publishedAt)}`,
    `  - 标签: ${signal.tags.join(", ")}`,
    `  - 评分: 一手 ${signal.firstHandScore} / 热度 ${signal.heatScore} / 综合 ${signal.signalScore}`,
    `  - 摘要: ${signal.summary}`
  ].join("\n");
}

function buildMarkdown(store: RadarStore) {
  const signals = [...store.signals].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const groupedByCompany = new Map<string, Signal[]>();

  for (const signal of signals) {
    if (!groupedByCompany.has(signal.company)) {
      groupedByCompany.set(signal.company, []);
    }
    groupedByCompany.get(signal.company)!.push(signal);
  }

  const promptBlock = [
    "你是互联网商业分析师，不是泛泛总结助手。",
    "请先过滤掉营销宣传和活动类内容，只保留产品、模型、API、平台能力、定价、下线相关更新。",
    "然后按公司分别总结：OpenAI、Anthropic、DeepSeek、MiniMax、ByteDance/Doubao。",
    "每家公司重点回答：",
    "1. 本次更新究竟改了什么产品能力",
    "2. 这对开发者、企业客户或终端用户意味着什么",
    "3. 这更像是功能补丁、平台能力扩张、模型升级，还是商业化动作",
    "4. 哪些更新最值得持续跟踪"
  ].join("\n");

  const sections = [...groupedByCompany.entries()].flatMap(([company, companySignals]) => [
    `## ${company}`,
    "",
    ...companySignals.slice(0, 20).map(buildSignalLine),
    ""
  ]);

  return [
    "# AI Tracker 官方动态阅读包",
    "",
    `生成时间: ${store.lastUpdatedAt ? formatDate(store.lastUpdatedAt) : "未生成"}`,
    `信号总数: ${signals.length}`,
    "",
    "## 可直接交给 AI 的分析提示词",
    "",
    "```text",
    promptBlock,
    "```",
    "",
    "## 最新信号",
    "",
    ...signals.slice(0, 15).map(buildSignalLine),
    "",
    ...sections
  ].join("\n");
}

export async function writeRadarExports(store: RadarStore) {
  await mkdir(exportDir, { recursive: true });
  await writeFile(markdownFile, buildMarkdown(store), "utf8");
  await writeFile(jsonFile, JSON.stringify(store, null, 2), "utf8");

  return {
    markdownFile,
    jsonFile
  };
}
