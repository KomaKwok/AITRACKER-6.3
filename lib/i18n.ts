import { cookies } from "next/headers";

export type Locale = "zh" | "en";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("ai-radar-locale")?.value;
  return value === "en" ? "en" : "zh";
}

export const dictionary = {
  zh: {
    nav: {
      dashboard: "\u4eea\u8868\u76d8",
      signals: "\u4fe1\u53f7\u6d41",
      sources: "\u4fe1\u53f7\u6e90",
      method: "\u65b9\u6cd5\u8bf4\u660e"
    },
    app: {
      title: "AI Radar",
      subtitle: "\u8ffd\u8e2a\u5168\u7403\u4e0e\u4e2d\u56fd\u5e02\u573a\u7684\u4e00\u624b AI \u4ea7\u54c1\u4fe1\u53f7",
      switchToZh: "\u4e2d\u6587",
      switchToEn: "English"
    },
    refresh: {
      button: "\u624b\u52a8\u5237\u65b0",
      loading: "\u5237\u65b0\u4e2d...",
      done: "\u5237\u65b0\u5b8c\u6210\u3002",
      failed: "\u5237\u65b0\u5931\u8d25\u3002",
      waiting: "\u6b63\u5728\u8bf7\u6c42\u5b98\u65b9\u6e90\uff0c\u53ef\u80fd\u9700\u8981\u5341\u51e0\u79d2\u3002"
    },
    dashboard: {
      eyebrow: "\u6301\u7eed\u8ffd\u8e2a",
      heroTitle: "\u5728 AI \u65b0\u95fb\u88ab\u7a00\u91ca\u6210\u6cdb\u8d44\u8baf\u4e4b\u524d\uff0c\u5148\u770b\u5230\u4e00\u624b\u4ea7\u54c1\u52a8\u6001\u3002",
      heroDescription: "",
      coverage: "\u4fe1\u53f7\u6e90\u8986\u76d6",
      officialMix: "\u5b98\u65b9\u6e90\u5360\u6bd4",
      lastRefresh: "\u4e0a\u6b21\u5237\u65b0",
      refreshTitle: "\u5237\u65b0",
      refreshDescription: "\u53ef\u624b\u52a8\u89e6\u53d1\u6293\u53d6\u6d41\u7a0b\uff0c\u5b9a\u65f6\u4efb\u52a1\u4e5f\u53ef\u590d\u7528\u540c\u4e00\u63a5\u53e3\u3002",
      totalSources: "\u603b\u4fe1\u53f7\u6e90",
      totalSourcesDetail: "\u5df2\u914d\u7f6e\u7684\u5168\u7403\u4e0e\u4e2d\u56fd\u5e02\u573a\u8986\u76d6\u3002",
      new24h: "24 \u5c0f\u65f6\u65b0\u589e",
      new24hDetail: "\u6700\u65b0\u9c9c\u7684\u4ea7\u54c1\u52a8\u6001\u4fe1\u53f7\u3002",
      new7d: "7 \u5929\u65b0\u589e",
      new7dDetail: "\u6700\u8fd1\u4e00\u5468\u7684\u8ffd\u8e2a\u7a97\u53e3\u3002",
      lastUpdated: "\u6700\u540e\u66f4\u65b0\u65f6\u95f4",
      lastUpdatedDetail: "\u76f4\u89c2\u5c55\u793a\u7cfb\u7edf\u6301\u7eed\u76d1\u63a7\u80fd\u529b\u3002",
      todayWeekTitle: "\u4eca\u65e5 / \u672c\u5468\u4fe1\u53f7",
      todayWeekDescription: "\u6309\u65f6\u6548\u4f18\u5148\u5c55\u793a\u6700\u65b0\u5f52\u4e00\u5316\u4fe1\u53f7\u3002",
      radarTitle: "\u91cd\u70b9\u96f7\u8fbe",
      radarDescription: "\u6309\u7efc\u5408\u4fe1\u53f7\u5206\u6392\u5e8f\u7684\u9ad8\u4f18\u5148\u7ea7\u66f4\u65b0\u3002",
      trendTitle: "\u8d8b\u52bf\u603b\u7ed3",
      trendDescription: "\u57fa\u4e8e\u6eda\u52a8\u4fe1\u53f7\u6d41\u751f\u6210\u7684\u8fd1\u671f\u4e3b\u9898\u6982\u89c8\u3002",
      last7d: "\u8fd1 7 \u5929",
      last30d: "\u8fd1 30 \u5929",
      chinaVsGlobalTitle: "\u4e2d\u56fd vs \u5168\u7403",
      chinaVsGlobalDescription: "\u5bf9\u4e2d\u56fd\u5b98\u65b9\u4ea7\u54c1\u52a8\u6001\u4e0e\u5168\u7403\u524d\u6cbf\u4ea7\u54c1\u8282\u594f\u7684\u7b80\u660e\u5bf9\u6bd4\u3002",
      global: "\u5168\u7403",
      globalDescription: "\u4fe1\u53f7\u66f4\u504f\u5411 Agent\u3001API\u3001SDK \u53d1\u5e03\u548c\u5f00\u53d1\u8005\u751f\u6001\u9a8c\u8bc1\u3002",
      china: "\u4e2d\u56fd",
      chinaDescription: "\u4fe1\u53f7\u66f4\u96c6\u4e2d\u5728\u5b98\u65b9\u6a21\u578b\u53d1\u5e03\u3001\u52a9\u624b\u80fd\u529b\u5347\u7ea7\u548c\u4f01\u4e1a\u5316\u5305\u88c5\u3002"
    },
    signalsPage: {
      eyebrow: "\u4fe1\u53f7\u6d41",
      title: "\u5f52\u4e00\u5316\u4fe1\u53f7\u5217\u8868",
      description:
        "\u4f60\u53ef\u4ee5\u6309\u533a\u57df\u3001\u6765\u6e90\u7c7b\u578b\u3001\u6807\u7b7e\u548c\u65f6\u95f4\u8303\u56f4\u7b5b\u9009\uff0c\u4e5f\u53ef\u4ee5\u6309\u6700\u65b0\u6216\u4fe1\u53f7\u5206\u6392\u5e8f\uff0c\u4fbf\u4e8e\u6f14\u793a\u7ed3\u6784\u5316\u8ffd\u8e2a\u80fd\u529b\u3002",
      apply: "\u5e94\u7528\u7b5b\u9009",
      region: "\u533a\u57df",
      sourceType: "\u6765\u6e90\u7c7b\u578b",
      tag: "\u6807\u7b7e",
      timeRange: "\u65f6\u95f4\u8303\u56f4",
      sort: "\u6392\u5e8f",
      all: "\u5168\u90e8",
      newest: "\u6700\u65b0",
      score: "\u6700\u9ad8\u5206"
    },
    sourcesPage: {
      eyebrow: "\u4fe1\u53f7\u6e90",
      title: "\u5df2\u914d\u7f6e\u7684\u8ffd\u8e2a\u6765\u6e90",
      description:
        "AI Radar \u4f18\u5148\u4f7f\u7528\u5b98\u65b9\u4ea7\u54c1\u9875\u9762\u3001\u516c\u5f00\u5f00\u53d1\u8005\u751f\u6001\u548c\u8f7b\u91cf\u9002\u914d\u5668\uff0c\u800c\u4e0d\u662f\u8106\u5f31\u7684\u767b\u5f55\u722c\u866b\u3002\u6bcf\u4e2a\u6765\u6e90\u90fd\u5c55\u793a\u4f18\u5148\u7ea7\u3001\u6293\u53d6\u65b9\u5f0f\u3001\u72b6\u6001\u548c\u6700\u540e\u6293\u53d6\u65f6\u95f4\u3002"
    },
    methodPage: {
      eyebrow: "\u5173\u4e8e / \u65b9\u6cd5",
      title: "AI Radar \u5982\u4f55\u5b9a\u4e49 AI \u52a8\u6001\u8ffd\u8e2a",
      intro:
        "\u8fd9\u4e2a MVP \u628a AI \u52a8\u6001\u5b9a\u4e49\u4e3a\u4e00\u624b\u4ea7\u54c1\u4e0e\u80fd\u529b\u4fe1\u53f7\uff0c\u800c\u4e0d\u662f\u6cdb\u5a92\u4f53\u62a5\u9053\u3002\u6700\u6709\u4ef7\u503c\u7684\u66f4\u65b0\u901a\u5e38\u6765\u81ea\u5b98\u65b9\u53d1\u5e03\u9762\u3001GitHub \u53d1\u5e03\u52a8\u6001\uff0c\u4ee5\u53ca\u80fd\u9a8c\u8bc1\u751f\u6001\u70ed\u5ea6\u7684\u5f00\u53d1\u8005\u793e\u533a\u3002",
      whyTitle: "\u4e3a\u4ec0\u4e48\u4f18\u5148\u4e00\u624b\u6765\u6e90",
      whyBody:
        "\u5b98\u65b9\u4ea7\u54c1\u9875\u3001\u535a\u5ba2\u548c release notes \u5f80\u5f80\u6700\u65e9\u66b4\u9732\u771f\u5b9e\u4ea7\u54c1\u610f\u56fe\uff1bGitHub \u53d1\u5e03\u80fd\u53cd\u6620\u5f00\u53d1\u8005\u53ef\u6267\u884c\u7684\u4ea7\u54c1\u8fdb\u5c55\uff1bHacker News \u548c Product Hunt \u66f4\u9002\u5408\u4f5c\u4e3a\u70ed\u5ea6\u4f20\u611f\u5668\uff0c\u800c\u4e0d\u662f\u4e3b\u4e8b\u5b9e\u6e90\u3002",
      scoringTitle: "\u4fe1\u53f7\u8bc4\u5206\u903b\u8f91",
      scoringBody:
        "\u7cfb\u7edf\u91c7\u7528\u56db\u4e2a\u7ef4\u5ea6\u7684\u7efc\u5408\u8bc4\u5206\uff1a\u6765\u6e90\u76f4\u63a5\u6027\u3001\u66f4\u65b0\u5f3a\u5ea6\u3001\u65f6\u6548\u6027\u548c\u5206\u6790\u76f8\u5173\u6027\u3002\u5c55\u793a\u5c42\u7edf\u4e00\u4f7f\u7528\u7efc\u5408\u4fe1\u53f7\u5206\uff0c\u907f\u514d\u591a\u5957\u5206\u6570\u5bf9\u4f7f\u7528\u8005\u9020\u6210\u7406\u89e3\u8bef\u5dee\u3002",
      loopTitle: "\u6301\u7eed\u8ffd\u8e2a\u95ed\u73af",
      loopBody:
        "\u7edf\u4e00\u7684\u670d\u52a1\u7aef\u6d41\u6c34\u7ebf\u8d1f\u8d23\u6293\u53d6\u3001\u89e3\u6790\u3001\u5f52\u4e00\u5316\u3001\u53bb\u91cd\u3001\u6253\u6807\u7b7e\u3001\u6458\u8981\u3001\u8bc4\u5206\u548c\u8d8b\u52bf\u751f\u6210\u3002\u624b\u52a8\u5237\u65b0\u4e0e\u5b9a\u65f6\u4efb\u52a1\u5171\u7528\u540c\u4e00\u5957\u80fd\u529b\u3002",
      refTitle: "\u8bc4\u5206\u53c2\u8003",
      firstHandTitle: "\u6765\u6e90\u76f4\u63a5\u6027",
      firstHandBody:
        "\u7528\u4e8e\u8861\u91cf\u4e00\u6761\u66f4\u65b0\u8ddd\u79bb\u5b98\u65b9\u4ea7\u54c1\u52a8\u4f5c\u6709\u591a\u8fd1\uff0c\u4e3b\u8981\u53d7\u6293\u53d6\u65b9\u5f0f\uff08release notes / changelog / RSS \u7b49\uff09\u548c\u6765\u6e90\u4f18\u5148\u7ea7\u5f71\u54cd\u3002",
      signalTitle: "\u4fe1\u53f7\u5206",
      signalBody:
        "\u4fe1\u53f7\u5206\u662f\u5f53\u524d\u9875\u9762\u7edf\u4e00\u5bf9\u5916\u5c55\u793a\u7684\u4e3b\u5206\u6570\uff0c\u7531\u6765\u6e90\u76f4\u63a5\u6027\u3001\u66f4\u65b0\u5f3a\u5ea6\u3001\u65f6\u6548\u6027\u548c\u5206\u6790\u76f8\u5173\u6027\u56db\u4e2a\u7ef4\u5ea6\u52a0\u6743\u5f97\u51fa\u3002"
    },
    common: {
      never: "\u4ece\u672a",
      active: "\u542f\u7528\u4e2d",
      inactive: "\u672a\u542f\u7528",
      topSignal: "\u91cd\u70b9\u4fe1\u53f7",
      strongSignal: "\u9ad8\u5206\u4fe1\u53f7",
      watch: "\u89c2\u5bdf\u4e2d",
      visit: "\u8bbf\u95ee",
      lastFetched: "\u6700\u540e\u6293\u53d6",
      lastSuccess: "\u4e0a\u6b21\u6210\u529f",
      fetchVia: "\u6293\u53d6\u65b9\u5f0f",
      status: "\u6293\u53d6\u72b6\u6001",
      details: "\u8be6\u60c5",
      success: "\u6210\u529f",
      empty: "\u65e0\u65b0\u7ed3\u679c",
      error: "\u53d7\u9650/\u5931\u8d25",
      published: "\u53d1\u5e03\u65f6\u95f4",
      type: "\u7c7b\u578b",
      region: "\u533a\u57df",
      signal: "\u4fe1\u53f7",
      score: "\u8bc4\u5206",
      priority: "\u4f18\u5148\u7ea7"
    }
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      signals: "Signals",
      sources: "Sources",
      method: "Method"
    },
    app: {
      title: "AI Radar",
      subtitle: "Track first-hand AI product signals across global and China markets",
      switchToZh: "\u4e2d\u6587",
      switchToEn: "English"
    },
    refresh: {
      button: "Manual refresh",
      loading: "Refreshing...",
      done: "Refresh complete.",
      failed: "Refresh failed.",
      waiting: "Querying official sources. This can take a little while."
    },
    dashboard: {
      eyebrow: "Continuous tracking",
      heroTitle: "Track first-hand AI product signals before they flatten into generic news.",
      heroDescription:
        "AI Radar prioritizes official release surfaces, GitHub developer motion, and high-signal ecosystem channels so reviewers can instantly see ongoing tracking capability.",
      coverage: "Source coverage",
      officialMix: "Official-heavy mix",
      lastRefresh: "Last refresh",
      refreshTitle: "Refresh",
      refreshDescription: "Kick the fetch pipeline manually. Scheduled jobs can hit the same route.",
      totalSources: "Total sources",
      totalSourcesDetail: "Configured global and China coverage.",
      new24h: "New in 24h",
      new24hDetail: "Freshest product signals.",
      new7d: "New in 7d",
      new7dDetail: "Recent tracking window.",
      lastUpdated: "Last updated",
      lastUpdatedDetail: "Visible proof of continuous monitoring.",
      todayWeekTitle: "Today / This Week Signals",
      todayWeekDescription: "Latest normalized signals with a bias toward recency.",
      radarTitle: "Priority Radar",
      radarDescription: "Highest-priority updates ranked by the unified signal score.",
      trendTitle: "Trend Summary",
      trendDescription: "Recent themes generated from the rolling signal stream.",
      last7d: "Last 7d",
      last30d: "Last 30d",
      chinaVsGlobalTitle: "China vs Global",
      chinaVsGlobalDescription: "A compact comparison between domestic official sources and frontier global product motion.",
      global: "Global",
      globalDescription: "Signals lean toward agents, APIs, SDK releases, and developer ecosystem validation.",
      china: "China",
      chinaDescription: "Signals are concentrated in official model releases, assistant capabilities, and enterprise positioning."
    },
    signalsPage: {
      eyebrow: "Signals",
      title: "Normalized signal stream",
      description:
        "Filter the feed by region, source type, tag, and recency. This page is optimized for demoing structured tracking rather than a generic news wall.",
      apply: "Apply filters",
      region: "Region",
      sourceType: "Source type",
      tag: "Tag",
      timeRange: "Time range",
      sort: "Sort",
      all: "All",
      newest: "Newest",
      score: "Highest score"
    },
    sourcesPage: {
      eyebrow: "Sources",
      title: "Configured source coverage",
      description:
        "AI Radar favors official product surfaces, public developer ecosystems, and lightweight adapters over brittle scraping. Each source shows priority, fetch strategy, status, and last fetch time."
    },
    methodPage: {
      eyebrow: "About / Method",
      title: "How AI Radar defines AI dynamics tracking",
      intro:
        "This MVP treats AI dynamics as first-hand product and capability signals, not broad media coverage. The highest-value updates come from official release surfaces, GitHub release activity, and developer communities that validate ecosystem traction.",
      whyTitle: "Why first-hand sources win",
      whyBody:
        "Official product pages, blogs, and release notes surface the earliest credible product intent. GitHub releases expose practical developer motion. HN and Product Hunt act as heat sensors rather than primary truth.",
      scoringTitle: "Signal scoring logic",
      scoringBody:
        "Scoring now uses four dimensions: source directness, update materiality, freshness, and analytical relevance. The product surface shows a single unified signal score to avoid confusion between multiple visible ranking systems.",
      loopTitle: "Continuous tracking loop",
      loopBody:
        "A shared server-side pipeline handles fetch, parse, normalize, dedupe, tag, summarize, score, and trend generation. The same refresh route supports manual refresh and cron-based runs.",
      refTitle: "Scoring reference",
      firstHandTitle: "Source directness",
      firstHandBody:
        "Measures how close an item is to an official product action. Release notes, changelogs, and official feeds score highest, followed by other official update surfaces.",
      signalTitle: "Signal score",
      signalBody: "This is the primary score shown across the UI. It combines source directness, update materiality, freshness, and analytical relevance into one ranking value."
    },
    common: {
      never: "Never",
      active: "Active",
      inactive: "Inactive",
      topSignal: "Top Signal",
      strongSignal: "Strong Signal",
      watch: "Watch",
      visit: "Visit",
      lastFetched: "Last fetched",
      lastSuccess: "Last success",
      fetchVia: "Fetch via",
      status: "Status",
      details: "Details",
      success: "Success",
      empty: "No new items",
      error: "Blocked / failed",
      published: "Published",
      type: "Type",
      region: "Region",
      signal: "Signal",
      score: "Score",
      priority: "Priority"
    }
  }
} as const;

export async function getDictionary() {
  const locale = await getLocale();
  return {
    locale,
    t: dictionary[locale]
  };
}
