// Wingify FE client (Node SDK) for the regional_pricing flag, reused across warm invocations.
import { init } from 'vwo-fme-node-sdk';

const MAX_SETTINGS_AGE_MS = 15_000;
let clientPromise = null;
let refreshedAt = 0;

export const FE_ENVIRONMENT = 'dev';

export async function feClient() {
  const sdkKey = process.env.VWO_SDK_KEY_DEV;
  if (!process.env.VWO_ACCOUNT_ID || !sdkKey) throw new Error('VWO_ACCOUNT_ID / VWO_SDK_KEY_DEV are not configured');
  if (!clientPromise) {
    clientPromise = init({
      accountId: process.env.VWO_ACCOUNT_ID,
      sdkKey,
      logger: { level: 'ERROR' },
      // Serverless functions freeze between requests, so send events immediately.
      isBatchingDisabled: true,
    }).catch((err) => {
      clientPromise = null;
      throw err;
    });
    refreshedAt = Date.now();
  }
  const client = await clientPromise;
  // Pick up dashboard changes (new rules, flag switched off) within ~15 seconds.
  if (Date.now() - refreshedAt > MAX_SETTINGS_AGE_MS) {
    refreshedAt = Date.now();
    await client.updateSettings().catch(() => {});
  }
  return client;
}

export function flagVariables(flag) {
  const raw = flag.getVariables() || [];
  return Array.isArray(raw) ? Object.fromEntries(raw.map((v) => [v.key, v.value])) : raw;
}
