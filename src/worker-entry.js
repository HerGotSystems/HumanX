import humanxWorker from './worker.js';
import { handleUntestedRequest } from './untested.js';

const UNTESTED_SESSION_LIMIT = 30;
const UNTESTED_SESSION_WINDOW_MS = 60 * 60 * 1000;

function safeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function enforceUntestedSessionRateLimit(request, env) {
  const now = Date.now();
  const key = `untested-session:${clientIp(request)}`;
  try {
    const row = await env.DB.prepare('SELECT hits,window_start FROM rate_limits WHERE "key"=?').bind(key).first();
    if (!row || now - Number(row.window_start || 0) >= UNTESTED_SESSION_WINDOW_MS) {
      await env.DB.prepare('INSERT INTO rate_limits ("key",hits,window_start) VALUES (?,1,?) ON CONFLICT("key") DO UPDATE SET hits=1,window_start=excluded.window_start').bind(key, now).run();
      return null;
    }
    if (Number(row.hits || 0) >= UNTESTED_SESSION_LIMIT) {
      return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many UNTESTED sessions. Try again later.' }), {
        status: 429,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }
    await env.DB.prepare('UPDATE rate_limits SET hits=hits+1 WHERE "key"=?').bind(key).run();
    return null;
  } catch {
    return new Response(JSON.stringify({ error: 'RATE_LIMIT_UNAVAILABLE', message: 'Write protection is temporarily unavailable. Try again later.' }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
}

function withUntestedHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,x-humanx-admin');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/untested/')) return humanxWorker.fetch(request, env, ctx);

    if (request.method === 'OPTIONS') return withUntestedHeaders(new Response(null, { status: 204 }));

    if (!env.DB) {
      return withUntestedHeaders(new Response(JSON.stringify({ error: 'DATABASE_UNAVAILABLE' }), {
        status: 503,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      }));
    }

    if (url.pathname === '/api/untested/session' && request.method === 'POST') {
      const limited = await enforceUntestedSessionRateLimit(request, env);
      if (limited) return withUntestedHeaders(limited);
    }

    const isAdmin = safeEqual(request.headers.get('x-humanx-admin'), env.HUMANX_ADMIN_TOKEN);
    const response = await handleUntestedRequest(request, env, { isAdmin });
    return withUntestedHeaders(response);
  }
};
