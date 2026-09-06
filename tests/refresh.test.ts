import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseOpenAiNews } from "@/lib/radar/sources/openai";
import { defaultSources } from "@/lib/data/default-sources";
import { buildFallbackBrief, selectBriefSignals, isBriefCurrent } from "@/lib/radar/brief";
import { selectDashboardSections } from "@/lib/radar/dashboard";
import { createRefreshCoordinator } from "@/lib/radar/refresh-job";
import { adapterRegistry } from "@/lib/radar/adapters";
import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";
import { writeStore } from "@/lib/data/store";
import type { Signal } from "@/lib/types";

const source = defaultSources.find((source) => source.id === "openai-news")!;
function signal(id: string, days = 0, extra: Partial<Signal> = {}): Signal {
  return {
    id, dedupeHash: id, title: id, url: `https://openai.com/index/${id}`, sourceId: source.id,
    sourceName: source.name, sourceType: "Official", company: "OpenAI", product: "API", region: "Global",
    category: "Model", publishedAt: new Date(Date.now() - days * 86400000).toISOString(),
    fetchedAt: new Date().toISOString(), summary: `${id} source detail`, rawContentSnippet: id,
    tags: ["API"], firstHandScore: 80, heatScore: 80, signalScore: 80, ...extra
  };
}

test("RSS follows changed headlines and dates, with no model-specific prerequisite", () => {
  const item = (title: string, date: string, url = "https://openai.com/index/update") =>
    `<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate><description>New API model features.</description></item>`;
  const parsed = parseOpenAiNews(`<rss>${item("A new API model", "2026-09-05")}${item("Undated", "bad")}${item("Foreign", "2026-09-04", "https://example.com")}</rss>`, source);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, "A new API model");
  assert.equal(parsed[0].publishedAt, "2026-09-05T00:00:00.000Z");
  assert.equal(parsed[0].status, undefined);
});

test("recent evidence outranks older developing announcements and balances companies", () => {
  const items = [signal("Astra", 20, { status: "developing", signalScore: 100 }), signal("new API", 0),
    signal("second API", 1), signal("other provider", 2, { company: "Anthropic", sourceId: "claude-api-release-notes" })];
  assert.equal(selectBriefSignals(items)[0].title, "new API");
  assert.ok(selectBriefSignals(items).some((item) => item.company === "Anthropic"));
  assert.equal(selectDashboardSections(items).radarSignals[0].title, "new API");
  assert.match(buildFallbackBrief(items).summary, /new API source detail/);
  assert.equal(buildFallbackBrief([signal("old", 100)]).sourceSignalIds.length, 0);
  assert.equal(isBriefCurrent(buildFallbackBrief([signal("old", 1)]), [signal("old", 100)]), false);
});

test("cold start refreshes once; simultaneous visitors share work; warm visits reuse it", async () => {
  let calls = 0;
  let time = 1000000;
  let finish!: () => void;
  const job = createRefreshCoordinator(async () => {
    calls++;
    await new Promise<void>((resolve) => { finish = resolve; });
    return { state: "success" };
  }, () => time);
  const first = job.start(true);
  assert.equal(job.status().state, "running");
  assert.equal(job.start(true), first);
  await Promise.resolve();
  finish(); await first;
  await job.start(true);
  assert.equal(calls, 1);
  time += 600001;
  const next = job.start(true); await Promise.resolve(); finish(); await next;
  assert.equal(calls, 2);
});

test("failed refresh releases the job and allows a manual retry", async () => {
  let fail = true;
  const job = createRefreshCoordinator(async () => {
    if (fail) throw new Error("test source failure");
    return { state: "success" };
  });
  await job.start(); assert.equal(job.status().state, "error");
  fail = false;
  await job.start(); assert.equal(job.status().state, "success");
});

test("pipeline removes retired model watch, reports unchanged and failed fetches honestly", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "radar-test-"));
  const original = adapterRegistry.get(source.id)!;
  const env = { ...process.env };
  process.env.RADAR_DATA_DIR = directory;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await writeStore({ sources: [], signals: [signal("old Astra", 0, { sourceId: "openai-frontier-watch" })], lastUpdatedAt: null });
    adapterRegistry.set(source.id, { sourceId: source.id, fetch: async () => [{
      title: "New API model", url: "https://openai.com/index/new-model", company: "OpenAI", product: "API",
      publishedAt: new Date().toISOString(), snippet: "The new API supports a documented model feature.", category: "Model"
    }] });
    const first = await refreshRadarDataWithOptions({ sourceIds: [source.id] });
    assert.equal(first.refreshReport?.newSignals, 1);
    assert.ok(!first.signals.some((item) => item.title === "old Astra"));
    const second = await refreshRadarDataWithOptions({ sourceIds: [source.id] });
    assert.equal(second.refreshReport?.newSignals, 0);
    assert.equal(second.brief?.generatedAt, first.brief?.generatedAt);
    adapterRegistry.set(source.id, { sourceId: source.id, fetch: async () => { throw new Error("offline"); } });
    const failed = await refreshRadarDataWithOptions({ sourceIds: [source.id] });
    assert.equal(failed.lastUpdatedAt, second.lastUpdatedAt);
    assert.equal(failed.refreshReport?.failedSources, 1);
    assert.deepEqual(failed.signals, second.signals);
  } finally {
    adapterRegistry.set(source.id, original);
    process.env = env;
    assert.ok(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(directory, { recursive: true, force: true });
  }
});
