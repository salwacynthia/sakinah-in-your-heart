import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeQuota } from "./quota.ts";

const day = new Date("2026-10-15T12:00:00Z");

Deno.test("free user with 0 used today has 3 remaining", () => {
  const q = computeQuota({ tier: "free", reflection_count: 0, last_reset_date: "2026-10-15" }, day);
  assertEquals(q.remaining, 3);
  assertEquals(q.limitReached, false);
});

Deno.test("free user with 3 used today is blocked", () => {
  const q = computeQuota({ tier: "free", reflection_count: 3, last_reset_date: "2026-10-15" }, day);
  assertEquals(q.remaining, 0);
  assertEquals(q.limitReached, true);
});

Deno.test("count resets on a new UTC day", () => {
  const q = computeQuota(
    { tier: "free", reflection_count: 3, last_reset_date: "2026-10-14" },
    new Date("2026-10-15T00:00:01Z"),
  );
  assertEquals(q.used, 0);
  assertEquals(q.remaining, 3);
});

Deno.test("does not reset just before UTC midnight", () => {
  const q = computeQuota(
    { tier: "free", reflection_count: 3, last_reset_date: "2026-10-15" },
    new Date("2026-10-15T23:59:59Z"),
  );
  assertEquals(q.limitReached, true);
});

Deno.test("unknown tier is treated as free, not unlimited", () => {
  const q = computeQuota({ tier: "premium", reflection_count: 3, last_reset_date: "2026-10-15" }, day);
  assertEquals(q.unlimited, false);
  assertEquals(q.limitReached, true);
});

Deno.test("plus tier is unlimited", () => {
  const q = computeQuota({ tier: "plus", reflection_count: 50, last_reset_date: "2026-10-15" }, day);
  assertEquals(q.limitReached, false);
  assertEquals(q.remaining, null);
});
