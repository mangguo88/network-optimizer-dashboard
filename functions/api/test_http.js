function handleHttpTest(request) {
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
        const resp = fetch(targetUrl, {
            method: 'GET',
            cf: { cacheTtl: 0 },
            signal: AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined,
        });
        const result = await resp;
        const latency = Date.now() - startTime;
        const body = await result.text();

        return new Response(JSON.stringify({
            host,
            latency_ms: latency,
            status: 'success',
            http_status: result.status,
            trace: body,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        const latency = Date.now() - startTime;
        let errorMessage = err.message || 'Fetch failed';
        if (err.name === 'AbortError') errorMessage = 'Request timed out';

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

export default {
    async fetch(request, env, context) {
        return handleHttpTest(request);
    }
};
