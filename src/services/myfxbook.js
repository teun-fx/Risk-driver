// All calls go through /api/myfxbook (Vercel serverless proxy) to avoid CORS.
const BASE = '/api/myfxbook';

async function call(action, params = {}) {
  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Myfxbook API error');
  return data;
}

export async function myfxbookLogin(email, password) {
  const data = await call('login', { email, password });
  // returns { session: "...", error: false }
  return data.session;
}

export async function myfxbookGetAccounts(session) {
  const data = await call('get-my-accounts', { session });
  // returns { accounts: [...], error: false }
  return data.accounts || [];
}

export async function myfxbookGetHistory(session, accountId) {
  const data = await call('get-history', { session, id: accountId });
  return data.history || [];
}

export async function myfxbookGetOpenTrades(session, accountId) {
  const data = await call('get-open-trades', { session, id: accountId });
  return data.openTrades || [];
}

export async function myfxbookLogout(session) {
  await call('logout', { session }).catch(() => {});
}
