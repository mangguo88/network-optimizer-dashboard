function expandCidr(cidr) {
    const [prefix, prefixLenStr] = cidr.split('/');
    const prefixLen = parseInt(prefixLenStr);
    if (!prefix || !prefixLen) return [];

    if (prefix.includes(':')) {
        return [];
    }

    const parts = prefix.split('.').map(Number);
    if (parts.length !== 4) return [];

    const base = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    const mask = -(0xFFFFFFFF << (32 - prefixLen)) >>> 0;
    const network = base & mask;

    if (prefixLen < 24) return [];

    const results = [];
    const ipCount = Math.min(256, Math.pow(2, 32 - prefixLen));
    for (let i = 0; i < ipCount; i++) {
        const ip = network + i;
        results.push(`${(ip >>> 24) & 0xFF}.${(ip >>> 16) & 0xFF}.${(ip >>> 8) & 0xFF}.${ip & 0xFF}`);
    }
    return results;
}

export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        const count = parseInt(url.searchParams.get('count') || '50');
        const region = url.searchParams.get('region') || 'all';

        const knownIps = [
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

        const cidrRanges = [
            '104.16.0.0/24',
            '104.20.0.0/24',
            '104.24.0.0/24',
            '104.28.0.0/24',
            '104.30.0.0/24',
            '104.31.0.0/24',
            '162.158.0.0/24',
            '162.159.0.0/24',
            '172.64.0.0/24',
            '172.64.32.0/24',
            '172.64.64.0/24',
            '172.64.96.0/24',
            '172.64.128.0/24',
            '172.64.160.0/24',
            '173.245.48.0/24',
            '141.101.0.0/24',
            '190.93.0.0/24',
            '188.114.0.0/24',
            '197.234.240.0/24',
            '198.41.128.0/24',
            '199.27.128.0/24',
            '188.215.0.0/24',
        ];

        const expandedIps = [];
        for (const cidr of cidrRanges) {
            const ips = expandCidr(cidr);
            for (const ip of ips) {
                const lastOctet = parseInt(ip.split('.')[3]);
                if (lastOctet === 1 || lastOctet === 10 || lastOctet === 100 || lastOctet === 200 || lastOctet === 5) {
                    expandedIps.push({
                        ip,
                        name: `CF Edge (${cidr})`,
                        country: 'Edge',
                        group: 'edge',
                    });
                }
            }
        }

        const allIps = [...knownIps, ...expandedIps];
        const shuffled = allIps.sort(() => Math.random() - 0.5);

        return new Response(JSON.stringify({
            ips: shuffled.slice(0, count),
            known_count: knownIps.length,
            expanded_count: expandedIps.length,
            total_available: allIps.length,
            cidr_ranges: cidrRanges,
            note: `Generated ${allIps.length} Cloudflare IPs (${knownIps.length} known + ${expandedIps.length} from CIDR ranges)`,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
