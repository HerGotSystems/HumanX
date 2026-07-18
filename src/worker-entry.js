import humanxWorker from './worker.js';
import { handleUntestedRequest } from './untested.js';

function safeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/untested/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type,x-humanx-admin'
        }});
      }
      const isAdmin = safeEqual(request.headers.get('x-humanx-admin'), env.HUMANX_ADMIN_TOKEN);
      const response = await handleUntestedRequest(request, env, { isAdmin });
      const headers = new Headers(response.headers);
      headers.set('access-control-allow-origin', '*');
      headers.set('x-content-type-options', 'nosniff');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return humanxWorker.fetch(request, env, ctx);
  }
};
