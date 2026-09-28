// Fetch wrapper for the Lumen API. Sends the active FE environment so the server SDK matches the browser.
let feEnv = null;
export const setApiFeEnv = (env) => (feEnv = env);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (feEnv) headers['x-fe-env'] = feEnv;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}
