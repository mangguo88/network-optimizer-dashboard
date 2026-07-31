export async function GET({ request }) {
  const url = new URL(request.url);
  const host = url.searchParams.get('host');
  const timeout = parseInt(url.searchParams.get('timeout') || '5000');

  if (!host) {
    return new Response(JSON.stringify({ error: 'host parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();
  try {
    const targetUrl = `https://${host}/cdn-cgi/trace`;
    const resp = await fetch(targetUrl, {
      method: 'GET',
      cf: { cacheTtl: 0 },
      signal: AbortSignal.timeout(timeout),
    });
    const latency = Date.now() - startTime;
    const body = await resp.text();

    return new Response(JSON.stringify({
      host,
      latency_ms: latency,
      status: 'success',
      http_status: resp.status,
      trace: body,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    let errorMessage = err.message || 'Fetch failed';
    try {
      if (err.name === 'AbortError') errorMessage = 'Request timed out';
    } catch {}

    return new Response(JSON.stringify({
      host,
      latency_ms: -1,
      status: 'failed',
      error: errorMessage,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
