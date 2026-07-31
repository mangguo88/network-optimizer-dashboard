document.addEventListener('DOMContentLoaded', () => {
    // 1. 页面加载完毕后，自动获取本地 IP 和位置信息
    fetch('/api/geo')
        .then(res => res.json())
        .then(data => {
            const infoDiv = document.getElementById('my-network-info');
            infoDiv.innerHTML = `
                <p><strong>当前 IP:</strong> <span class="text-blue-500">${data.ip}</span></p>
                <p><strong>地理位置:</strong> ${data.country} - ${data.region} - ${data.city}</p>
            `;
        })
        .catch(err => {
            document.getElementById('my-network-info').innerText = "获取本地 IP 失败，请检查网络。";
        });

    // 2. 绑定“开始自动优选”按钮点击事件
    document.getElementById('start-test-btn').addEventListener('click', async () => {
        const tbody = document.getElementById('ip-table-body');
        const btn = document.getElementById('start-test-btn');
        
        btn.innerText = "正在测速中...";
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">正在从 API 加载 IP 库...</td></tr>';

        try {
            // 获取内置 IP 库
            const res = await fetch('/api/ips');
            const ips = await res.json();
            
            tbody.innerHTML = ''; // 清空表格
            
            // 开始对每个 IP 进行测速
            for (const item of ips) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-2 px-4 border-b">${item.desc}</td>
                    <td class="py-2 px-4 border-b font-mono">${item.ip}</td>
                    <td class="py-2 px-4 border-b" id="ping-${item.ip.replace(/\./g, '-')}">测速中...</td>
                    <td class="py-2 px-4 border-b">
                        <span class="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                    </td>
                `;
                tbody.appendChild(tr);
                
                // 执行测速逻辑
                testPing(item.ip).then(latency => {
                    const pingCell = document.getElementById(`ping-${item.ip.replace(/\./g, '-')}`);
                    const statusDot = pingCell.nextElementSibling.querySelector('span');
                    
                    if (latency === -1) {
                        pingCell.innerText = "超时/失败";
                        pingCell.classList.add('text-red-500');
                        statusDot.classList.replace('bg-yellow-400', 'bg-red-500');
                    } else {
                        pingCell.innerText = `${latency} ms`;
                        // 延迟小于 100 标绿，否则标黄
                        if(latency < 100) {
                            pingCell.classList.add('text-green-600', 'font-bold');
                            statusDot.classList.replace('bg-yellow-400', 'bg-green-500');
                        }
                    }
                });
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">加载 IP 库失败，请确保 API 正常工作。</td></tr>';
        } finally {
            btn.innerText = "重新测速";
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
});

// 模拟 Ping 延迟测速函数 (利用 http 请求模拟)
async function testPing(ip) {
    const start = Date.now();
    try {
        // 构建一个带超时控制的 Fetch 请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
        
        // 尝试加载一个极小资源或触发一次连接
        await fetch(`https://${ip}/favicon.ico`, { 
            mode: 'no-cors', 
            signal: controller.signal,
            cache: 'no-cache'
        });
        clearTimeout(timeoutId);
        return Date.now() - start;
    } catch (error) {
        // 若报错，仍可以计算耗时，但为了区分，如果是超时我们返回 -1
        const timeTaken = Date.now() - start;
        return timeTaken >= 2000 ? -1 : timeTaken;
    }
}
