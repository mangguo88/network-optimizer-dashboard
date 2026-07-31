export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        const count = parseInt(url.searchParams.get('count') || '20');

        const cfIps = [
            { ip: '1.1.1.1', name: 'Cloudflare DNS', country: 'Global', group: 'dns' },
            { ip: '1.0.0.1', name: 'Cloudflare DNS Secondary', country: 'Global', group: 'dns' },
            { ip: '1.1.1.2', name: 'Cloudflare Security DNS', country: 'Global', group: 'security' },
            { ip: '1.0.0.2', name: 'Cloudflare Security DNS Secondary', country: 'Global', group: 'security' },
            { ip: '1.1.1.3', name: 'Cloudflare Family DNS', country: 'Global', group: 'family' },
            { ip: '1.0.0.3', name: 'Cloudflare Family DNS Secondary', country: 'Global', group: 'family' },
            { ip: '2606:4700:4700::1111', name: 'Cloudflare DNS IPv6', country: 'Global', group: 'dns' },
            { ip: '2606:4700:4700::1001', name: 'Cloudflare Security IPv6', country: 'Global', group: 'security' },
            { ip: '2606:4700:4700::1112', name: 'Cloudflare Family IPv6', country: 'Global', group: 'family' },
        ];

        return new Response(JSON.stringify({
            ips: cfIps.slice(0, count),
            note: 'Known Cloudflare edge IPs for testing',
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
