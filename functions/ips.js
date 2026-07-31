export async function onRequest() {
  // 这里内置你的优选 IP 库（可以自行添加更多）
  const ipList = [
    { ip: "1.1.1.1", desc: "Cloudflare 官方" },
    { ip: "1.0.0.1", desc: "Cloudflare 备用" },
    { ip: "8.8.8.8", desc: "Google DNS" },
    { ip: "223.5.5.5", desc: "阿里 DNS (国内优选)" },
    { ip: "119.29.29.29", desc: "腾讯 DNS (国内优选)" }
  ];

  return new Response(JSON.stringify(ipList), {
    headers: { 
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
