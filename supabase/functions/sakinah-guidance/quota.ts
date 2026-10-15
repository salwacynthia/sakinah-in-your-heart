export const FREE_TIER_DAILY_LIMIT = 3;
const UNLIMITED_TIERS = ["plus", "family"];

export interface QuotaProfile {
  tier: string | null;
  reflection_count: number | null;
  last_reset_date: string | null;
}

/** Computes today's usage. Counts reset at the UTC calendar-day boundary. */
export function computeQuota(profile: QuotaProfile, now: Date = new Date()) {
  const todayStr = now.toISOString().slice(0, 10);
  const isNewDay = profile.last_reset_date !== todayStr;
  const used = isNewDay ? 0 : Math.max(0, profile.reflection_count ?? 0);
  const unlimited = UNLIMITED_TIERS.includes(profile.tier ?? "");
  const remaining = unlimited ? null : Math.max(0, FREE_TIER_DAILY_LIMIT - used);
  return {
    todayStr,
    used,
    unlimited,
    limit: FREE_TIER_DAILY_LIMIT,
    remaining,
    limitReached: !unlimited && used >= FREE_TIER_DAILY_LIMIT,
  };
}
