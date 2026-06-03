# AI Tracker

一个面向研究和商业分析的 AI 官方动态追踪器。目标不是抓 AI 新闻，而是持续抓取官方产品更新页、changelog、release notes，并过滤掉活动、宣传、品牌文案。

## 当前覆盖

- OpenAI: `OpenAI API Changelog`
- Anthropic: `Anthropic API Release Notes` + `Claude App Release Notes`
- DeepSeek: `DeepSeek API Change Log`
- MiniMax: `MiniMax Agent Changelog`
- 豆包 / 火山方舟: `产品更新公告` + `模型发布公告`

## 这一版解决了什么

- 抓取架构从单文件硬编码改成了“每个站点一个适配器”
- 数据源配置与抓取逻辑解耦，后续新增公司只需要增加 source + adapter
- 过滤规则优先保留模型、API、平台、能力、定价、下线类更新
- 可选接入 `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 做摘要与标签增强

## 项目结构

- `app/`: Next.js 页面和 API
- `components/`: UI 组件
- `lib/data/`: source 配置和本地 JSON store
- `lib/radar/adapter-utils.ts`: 抓取公共工具
- `lib/radar/sources/`: 各站点适配器
- `lib/radar/fetchers.ts`: 抓取编排、去重、写库、导出
- `scripts/seed.ts`: 初始化 store
- `scripts/fetch.ts`: 手动执行抓取

## 运行

```bash
npm install
npm run seed
npm run dev
```

手动刷新数据：

```bash
npm run fetch
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

## 环境变量

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com

CRON_SECRET=your-secret
```

说明：

- 如果同时配置 `OPENAI_API_KEY` 和 `DEEPSEEK_API_KEY`，默认优先使用 OpenAI 做摘要增强
- 如果都不配置，则使用本地启发式摘要
- `CRON_SECRET` 用于保护定时抓取接口

## 输出

每次 `npm run seed` 或 `npm run fetch` 之后，会生成：

- `data/store.json`
- `data/exports/latest-links.json`
- `data/exports/latest-links-zh.md`

`latest-links-zh.md` 已经改成按公司聚合，方便继续喂给别的模型做深度分析。

## 当前限制

- 这仍然是轻量抓取器，不是通用爬虫平台
- 某些官方站点是前端渲染页面，适配器当前主要依赖 SSR 文本、页面锚点和静态结构
- 火山方舟公告页目前优先抓“公告入口页 + 公告标题”，如果后续需要更深内容，可继续补子页面解析
