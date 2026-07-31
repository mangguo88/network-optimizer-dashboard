export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        const hostsParam = url.searchParams.get('host');
        const port = parseInt(url.searchParams.get('port') || '443');
        const timeout = parseInt(url.searchParams.get('timeout') || '3000');

        if (!hostsParam) {
            return new Response(JSON.stringify({ error: 'host parameter required (comma-separated)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const hosts = hostsParam.split(',').map(h => h.trim()).filter(Boolean);

        const results = await Promise.all(hosts.map(async (host) => {
            const startTime = Date.now();
            let status = 'failed';
            let latency = -1;
            let error = '';
            try {
                const targetUrl = `https://${host}`;
                const resp = await fetch(targetUrl, {
                    method: 'GET',
                    cf: { cacheTtl: 0 },
                });
                latency = Date.now() - startTime;
                if (resp.ok || resp.status === 200 || resp.status === 301 || resp.status === 302) {
                    status = 'success';
                } else {
                    error = `HTTP ${resp.status}`;
                }
            } catch (err) {
                latency = Date.now() - startTime;
                error = err.message || 'Fetch failed';
                if (err.name === 'AbortError') error = 'Timeout';
            }
            return { host, port, latency_ms: latency, status, error, timestamp: Date.now() };
        }));

        const successful = results.filter(r => r.status === 'success');
        const sorted = [...successful].sort((a, b) => a.latency_ms - b.latency_ms);
        const ranked = results.map(r => ({
            ...r,
            rank: r.status === 'success' ? sorted.findIndex(s => s.host === r.host) + 1 : -1,
        }));

        return new Response(JSON.stringify({
            results: ranked,
            summary: {
                total: results.length,
                successful: successful.length,
                failed: results.length - successful.length,
                best: successful.length > 0 ? sorted[0].host : null,
                avg_latency: successful.length > 0
                    ? Math.round(successful.reduce((a, r) => a + r.latency_ms, 0) / successful.length)
                    : -1,
            },
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
