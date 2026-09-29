// Tiny document store on top of Netlify Blobs.
// Keys are namespaced like "users/<id>", "email/<email>", "projects/<userId>".
import { getStore } from '@netlify/blobs';

// Get the store per call: Netlify hands each invocation a short-lived Blobs token,
// so a store cached across warm invocations fails once that token expires.
function db() {
  return getStore({ name: 'lumen-db', consistency: 'strong' });
}

export async function get(key, fallback = null) {
  const value = await db().get(key, { type: 'json' });
  return value ?? fallback;
}

export async function set(key, value) {
  await db().setJSON(key, value);
  return value;
}

export async function del(key) {
  await db().delete(key);
}

export async function list(prefix) {
  const { blobs } = await db().list({ prefix });
  return blobs.map((b) => b.key);
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
