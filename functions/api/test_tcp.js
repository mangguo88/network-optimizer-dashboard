function handleGet(request) {
    const url = new URL(request.url);
    const host = url.searchParams.get('host');
    const port = parseInt(url.searchParams.get('port') || '443');
    const timeout = parseInt(url.searchParams.get('timeout') || '3000');

    if (!host) {
        return new Response(JSON.stringify({ error: 'host parameter required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const startTime = Date.now();
    try {
        const socket = new Socket();
        const sock = await socket.connect(host, port);
        const latency = Date.now() - startTime;
        await sock.close();

        return new Response(JSON.stringify({
            host,
            port,
            latency_ms: latency,
            status: 'success',
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        const latency = Date.now() - startTime;
        return new Response(JSON.stringify({
            host,
            port,
            latency_ms: -1,
            status: 'failed',
            error: err.message || 'Connection failed',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleGet(event.request));
});

export default {
    async fetch(request, env, context) {
        return handleGet(request);
    }
};
