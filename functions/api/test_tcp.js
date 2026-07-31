import { connect } from 'cloudflare:sockets';

export default {
    async fetch(request, env, context) {
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
        let sock;
        try {
            const opts = {
                host: host,
                port: port,
                timeout: timeout,
            };
            sock = await connect(opts);
            sock.close();
            const latency = Date.now() - startTime;

            return new Response(JSON.stringify({
                host,
                port,
                latency_ms: latency,
                status: 'success',
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (err) {
            if (sock) {
                try { sock.close(); } catch {}
            }
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
};
