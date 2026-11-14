/**
 * Cloudflare Pages Same-Origin Reverse Proxy for SupremeAI API (`/api/*`).
 * Forwards all `/api/*` requests to `https://supremeai-api-ulw0.onrender.com/api/*`
 * (or `env.SUPREMEAI_BACKEND_URL` if configured), eliminating cross-domain CORS
 * preflights and third-party ad-blocker/tracker false positives while preserving
 * unbuffered SSE (`text/event-stream`) streaming.
 */

interface PagesContext {
  request: Request;
  env?: Record<string, string | undefined>;
  params?: { path?: string | string[] };
}

const DEFAULT_UPSTREAM_ORIGIN = 'https://supremeai-api-ulw0.onrender.com';

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'x-forwarded-proto',
  'x-real-ip',
]);

function applyCorsHeaders(headers: Headers, requestOrigin: string): void {
  headers.set('Access-Control-Allow-Origin', requestOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-SupremeAI-Key, Accept, Cache-Control'
  );
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Vary', 'Origin');
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env = {} } = context;
  const incomingUrl = new URL(request.url);
  const requestOrigin = request.headers.get('Origin') || incomingUrl.origin;

  if (request.method === 'OPTIONS') {
    const preflightHeaders = new Headers({
      'Access-Control-Max-Age': '86400',
    });
    applyCorsHeaders(preflightHeaders, requestOrigin);
    return new Response(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  const upstreamOrigin = (env.SUPREMEAI_BACKEND_URL || DEFAULT_UPSTREAM_ORIGIN).replace(/\/+$/, '');
  const targetUrl = `${upstreamOrigin}${incomingUrl.pathname}${incomingUrl.search}`;

  const forwardedHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardedHeaders.set(key, value);
    }
  });
  forwardedHeaders.set('X-Forwarded-Host', incomingUrl.host);
  forwardedHeaders.set('X-Forwarded-Proto', incomingUrl.protocol.replace(':', ''));

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    // Keep any upstream redirects same-origin so the Render URL is not exposed to the browser
    const location = responseHeaders.get('location');
    if (location && location.startsWith(upstreamOrigin)) {
      responseHeaders.set('location', location.slice(upstreamOrigin.length) || '/');
    }

    // Normalize CORS headers for same-origin and preview origins without duplicate values
    applyCorsHeaders(responseHeaders, requestOrigin);

    // Preserve streaming SSE responses without buffering
    const contentType = responseHeaders.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      responseHeaders.set('Cache-Control', 'no-cache, no-transform');
      responseHeaders.set('X-Accel-Buffering', 'no');
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const errorHeaders = new Headers({ 'Content-Type': 'application/json' });
    applyCorsHeaders(errorHeaders, requestOrigin);
    return new Response(
      JSON.stringify({
        error: 'Upstream API gateway unreachable via same-origin proxy.',
        detail: err instanceof Error ? err.message : 'Proxy fetch error',
      }),
      {
        status: 502,
        headers: errorHeaders,
      }
    );
  }
}
