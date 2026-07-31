export async function onRequest(context) {
  const { request } = context;
  // 利用 Cloudflare 的特性获取用户真实信息
  const cf = request.cf || {};
  
  const userInfo = {
    ip: request.headers.get('CF-Connecting-IP') || '获取失败',
    country: cf.country || '未知',
    city: cf.city || '未知',
    region: cf.region || '未知',
    latitude: cf.latitude || '',
    longitude: cf.longitude || ''
  };

  return new Response(JSON.stringify(userInfo), {
    headers: { 
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*' // 允许跨域
    }
  });
}
