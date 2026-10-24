import { db } from "./db";

const DAILY_LIMIT = Number(process.env.DAILY_AI_CALL_LIMIT) || 150;

// Stored in the DB (not in-memory) because Vercel's serverless functions
// don't share memory between invocations -- an in-memory counter would
// silently do nothing once deployed. Reuses the existing UserPreference
// table instead of adding a new one. Not perfectly atomic under heavy
// concurrency, which is an acceptable tradeoff for a single-user app whose
// actual goal is "don't let a runaway loop torch today's free-tier quota,"
// not precise billing-grade metering.
export async function checkAndIncrementRateLimit(
  bucket: string,
): Promise<{ ok: boolean; count: number; limit: number }> {
  const key = `rate_limit:${bucket}:${new Date().toISOString().slice(0, 10)}`;

  const count = await db.$transaction(async (tx) => {
    const existing = await tx.userPreference.findUnique({ where: { key } });
    const next = existing ? parseInt(existing.value, 10) + 1 : 1;

    await tx.userPreference.upsert({
      where: { key },
      create: { key, value: String(next) },
      update: { value: String(next) },
    });

    return next;
  });

  return { ok: count <= DAILY_LIMIT, count, limit: DAILY_LIMIT };
}
