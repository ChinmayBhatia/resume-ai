import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export async function consumeAiQuota(
  supabase: SupabaseClient,
  endpoint: string
): Promise<
  { ok: true } | { ok: false; reason: "limit" | "error" }
> {
  const perHour = num(process.env.AI_LIMIT_PER_HOUR, 10);
  const perDay = num(process.env.AI_LIMIT_PER_DAY, 40);

  const now = Date.now();

  const { data, error } = await supabase
    .from("ai_usage")
    .select("created_at")
    .gte(
      "created_at",
      new Date(now - 24 * 60 * 60 * 1000).toISOString()
    )
    .limit(perDay);

  if (error) {
    return { ok: false, reason: "error" };
  }

  const rows = data ?? [];

  const lastHour = rows.filter(
    (row) =>
      now - new Date(row.created_at).getTime() <
      60 * 60 * 1000
  ).length;

  if (rows.length >= perDay || lastHour >= perHour) {
    return { ok: false, reason: "limit" };
  }

  const { error: insertError } = await supabase
    .from("ai_usage")
    .insert({ endpoint });

  if (insertError) {
    return { ok: false, reason: "error" };
  }

  return { ok: true };
}