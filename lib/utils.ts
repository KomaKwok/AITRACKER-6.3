import { formatDistanceToNowStrict, isAfter, parseISO, subDays } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Locale } from "@/lib/i18n";

const unreliableRecencySourceIds = new Set([
  "doubao-product-announcements",
  "doubao-model-announcements"
]);

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatRelativeDate(value: string | null, locale: Locale = "en") {
  if (!value) {
    return locale === "zh" ? "\u4ece\u672a" : "Never";
  }

  return formatDistanceToNowStrict(parseISO(value), {
    addSuffix: true,
    locale: locale === "zh" ? zhCN : enUS
  });
}

export function withinDays(date: string, days: number) {
  return isAfter(parseISO(date), subDays(new Date(), days));
}

export function hasReliableRecency(sourceId: string) {
  return !unreliableRecencySourceIds.has(sourceId);
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function scoreToTone(score: number) {
  if (score >= 80) {
    return "bg-emerald-500";
  }
  if (score >= 60) {
    return "bg-amber-500";
  }
  return "bg-slate-400";
}
