# AI Tracker

一个面向研究和商业分析的 AI 动态追踪器。除了持续抓取官方产品更新页、changelog 和 release notes，也会从研究社区挑选适合日常 AI 训练与数据策略上报的论文，并过滤掉活动、宣传和品牌文案。

## 当前覆盖

- OpenAI: 官方最新 RSS 资讯 + `OpenAI API Changelog`；不固定追踪或置顶 Astra 等单个模型
- Anthropic: `Anthropic API Release Notes` + `Claude App Release Notes`
- DeepSeek: `DeepSeek API Change Log`
- MiniMax: `MiniMax Agent Changelog`
- 豆包 / 火山方舟: `产品更新公告` + `模型发布公告`
- AI 论文: `Hugging Face Daily Papers` 最近一期社区热度 Top 10
- arXiv: `cs.AI`、`cs.LG`、`cs.CL` 最新论文，并支持重点论文 ID 补充
- 旗舰价格: OpenAI、Anthropic、腾讯混元、DeepSeek、MiniMax、豆包各保留一个官方旗舰细分模型

## 这一版解决了什么

- 抓取架构从单文件硬编码改成了“每个站点一个适配器”
- 数据源配置与抓取逻辑解耦，后续新增公司只需要增加 source + adapter
- 过滤规则优先保留模型、API、平台、能力、定价、下线类更新
- 可选接入 `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY` 做摘要与标签增强
- arXiv 使用官方 Atom API，每 24 小时最多自动刷新一次，并与 Hugging Face 结果按论文 ID / 标题去重
- 每次刷新并行核验六家官方价格页，解析失败时保留最近一次成功价格并显示失败状态
- MiniMax 改抓官方静态计价文档；豆包会从火山方舟产品页自动发现当前前端价格包，避免动态页面导致长期解析失败
- 根据近期真实信号生成首页 AI Brief；无 API Key 时使用本地事实摘要回退

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

只刷新论文源：

```bash
npm run fetch -- --source=huggingface-daily-papers
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

- 如果同时配置 `OPENAI_API_KEY` 和 `DEEPSEEK_API_KEY`，默认优先使用 DeepSeek 做摘要增强
- 如果都不配置，则使用本地启发式摘要
- `CRON_SECRET` 用于保护定时抓取接口

## 输出

每次 `npm run seed` 或 `npm run fetch` 之后，会生成：

- `data/store.json`
- `data/exports/latest-links.json`
- `data/exports/latest-links-zh.md`
- `data/pricing-snapshot.json`

## 刷新数据持久化

网站现在会优先从持久存储读取并写入最近一次刷新结果，避免实例休眠或重启后回到部署包内的初始 JSON：

- Vercel：在项目 Storage 中连接一个 Private Blob，并提供 `BLOB_READ_WRITE_TOKEN`
- 其他支持持久磁盘的主机：把 `RADAR_DATA_DIR` 指向已挂载的持久目录
- 本地开发：两项都不配置时继续使用项目内 `data/` 目录

刷新保留每个产品源近 180 天的有限历史；本轮为空或失败时不会再删除上一次成功结果。首页“重点雷达”优先使用 30 天内信号，不足时最多回补至 90 天。

`latest-links-zh.md` 已经改成按公司聚合，方便继续喂给别的模型做深度分析。

### Render 部署

- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- 应用会显式监听 Render 提供的 `PORT` 和 `0.0.0.0`
- 免费方案无需增购服务：冷启动首次访问自动抓取；页面显示进度，完成后自动加载结果，无需再手动刷新。启动脚本不再额外启动独立抓取进程，避免两个进程同时改写数据
- 同一实例的自动检查间隔为 10 分钟；首次访问与返回浏览器标签页会触发检查，不靠定时保活。手动“更新资讯”仍可触发抓取（各来源自身频率限制继续生效）
- 新增、内容变化、无新增、部分失败会分别提示；失败时展示历史数据并说明状态，不把失败标成最新成功。首页事实摘要附原文链接，不为每次刷新强行生成新事件
- 免费实例休眠期间不能后台持续抓取，也不能持久保存本地更新。下次唤醒重新抓取可恢复当前资讯，但不能恢复已从来源移除的历史记录；平台冷启动等待仍然存在。参见 [Render 免费服务说明](https://render.com/docs/free)
- `GET /api/refresh` 查询任务状态；`POST /api/refresh` 启动任务并返回 202，客户端按实际状态等待完成。`POST /api/refresh?mode=auto` 使用自动检查冷却时间
- Render 默认文件系统会在重启或重新部署后清空。若已挂载 Persistent Disk，请把挂载路径和 `RADAR_DATA_DIR` 都设为 `/opt/render/project/src/data`；也可以继续使用 `BLOB_READ_WRITE_TOKEN` 保存刷新结果
- 不要把 `CRON_SECRET`、AI API Key 或 Blob Token 提交进 GitHub，应只配置在 Render Environment 中

## 当前限制

- 这仍然是轻量抓取器，不是通用爬虫平台
- 某些官方站点是前端渲染页面，适配器当前主要依赖 SSR 文本、页面锚点和静态结构
- 火山方舟公告页目前优先抓“公告入口页 + 公告标题”，如果后续需要更深内容，可继续补子页面解析
