// Server-side Wingify FE client (Node SDK), one per environment, reused across warm invocations.
import { init } from 'vwo-fme-node-sdk';
import { FE_ENVIRONMENTS } from '../../../shared/feContext.js';

const clients = {};
const refreshedAt = {};
const MAX_SETTINGS_AGE_MS = 15_000;

export function sdkKeyFor(env) {
  return process.env[`VWO_SDK_KEY_${env.toUpperCase()}`];
}

// Netlify CONTEXT: production -> prod, branch deploy of "staging" -> staging, everything else -> dev.
export function defaultEnv() {
  if (process.env.FE_DEFAULT_ENV) return process.env.FE_DEFAULT_ENV;
  const ctx = process.env.CONTEXT;
  if (ctx === 'production') return 'prod';
  if (ctx === 'branch-deploy' && process.env.BRANCH === 'staging') return 'staging';
  return 'dev';
}

export function envFromRequest(req) {
  const requested = req.headers.get('x-fe-env');
  return FE_ENVIRONMENTS.includes(requested) ? requested : defaultEnv();
}

export async function feClient(env) {
  const sdkKey = sdkKeyFor(env);
  if (!sdkKey) throw new Error(`No SDK key configured for "${env}"`);
  if (!clients[env]) {
    clients[env] = init({
      accountId: process.env.VWO_ACCOUNT_ID,
      sdkKey,
      logger: { level: 'ERROR' },
      // Serverless functions freeze between requests, so send events immediately.
      isBatchingDisabled: true,
      shouldWaitForTrackingCalls: true,
    }).catch((err) => {
      delete clients[env];
      throw err;
    });
    refreshedAt[env] = Date.now();
  }
  const client = await clients[env];
  // A warm function can outlive many dashboard edits; refresh settings if they are getting old.
  if (Date.now() - refreshedAt[env] > MAX_SETTINGS_AGE_MS) {
    refreshedAt[env] = Date.now();
    await client.updateSettings().catch(() => {});
  }
  return client;
}

export async function refreshAll() {
  const envs = Object.keys(clients);
  await Promise.all(envs.map(async (env) => (await clients[env]).updateSettings()));
  envs.forEach((env) => (refreshedAt[env] = Date.now()));
  return envs;
}
