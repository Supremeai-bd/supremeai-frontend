/**
 * Cloudflare Pages Same-Origin Reverse Proxy for SupremeAI API
 * Routes same-origin `/api/*` requests from `supremeai-studio.pages.dev`
 * directly to the upstream backend gateway (`supremeai-api-ulw0.onrender.com`),
 * eliminating cross-origin CORS preflights and third-party ad-blocker false positives,
 * while preserving SSE streaming (`text/event-stream`) without response buffering.
 */

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
  params: { path?: string | string[] };
}

const DEFAULT_UPSTREAM_ORIGIN = 'https://supremeai-api-ulw0.onrender.com';

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'x-forwarded-proto',
  'x-real-ip',
]);

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  // Handle CORS preflight cleanly even though same-origin shouldn't need one
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-SupremeAI-Key, Accept',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const incomingUrl = new URL(request.url);
  const upstreamOrigin = (env.SUPREMEAI_BACKEND_URL || DEFAULT_UPSTREAM_ORIGIN).replace(/\/+$/, '');
  const targetUrl = `${upstreamOrigin}${incomingUrl.pathname}${incomingUrl.search}`;

  const forwardedHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardedHeaders.set(key, value);
    }
  });
  forwardedHeaders.set('X-Forwarded-Host', incomingUrl.host);

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
    responseHeaders.delete('transfer-encoding');

    // Preserve streaming SSE headers without buffering
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
    return new Response(
      JSON.stringify({
        error: 'Upstream API gateway unreachable via same-origin proxy.',
        detail: err instanceof Error ? err.message : 'Proxy fetch error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
