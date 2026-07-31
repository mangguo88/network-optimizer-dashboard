export async function GET({ request }) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '20');
  const include = url.searchParams.get('include') || 'all';

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

  const ranges = [
    '172.64.0.0/16', '104.16.0.0/12', '173.245.48.0/20',
    '2400:cb00::/32', '2610:20:0:0::/48', '2a06:4880::/32',
  ];

  const response = {
    ips: cfIps.slice(0, count),
    ranges: ranges,
    note: 'These are known Cloudflare edge IPs. For full IP ranges, see https://www.cloudflare.com/ips/',
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
