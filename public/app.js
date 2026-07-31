class NetworkDashboard {
    constructor() {
        this.nodes = this.loadNodes();
        this.history = this.loadHistory();
        this.settings = this.loadSettings();
        this.cfResults = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderNodes();
        this.renderHistory();
        this.updateStats();
        this.applySettings();
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        document.getElementById('btn-test-all').addEventListener('click', () => {
            this.testAllNodes();
        });

        document.getElementById('btn-add-vps').addEventListener('click', () => {
            this.addVpsNode();
        });

        document.getElementById('btn-cf-optimize').addEventListener('click', () => {
            this.cfOptimize();
        });

        document.getElementById('btn-cf-optimize-50').addEventListener('click', () => {
            this.cfOptimize(50);
        });

        document.getElementById('btn-cf-optimize-100').addEventListener('click', () => {
            this.cfOptimize(100);
        });

        document.getElementById('btn-copy-best-ip').addEventListener('click', () => {
            this.copyBestIp();
        });

        document.getElementById('btn-export-history').addEventListener('click', () => {
            this.exportHistory();
        });

        document.getElementById('btn-clear-history').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('btn-save-settings').addEventListener('click', () => {
            this.saveSettings();
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    loadNodes() {
        const stored = localStorage.getItem('network_nodes');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [
            { name: 'Cloudflare DNS', host: '1.1.1.1', port: 443, group: 'cloudflare' },
            { name: 'Cloudflare DNS Secondary', host: '1.0.0.1', port: 443, group: 'cloudflare' },
            { name: 'Cloudflare Security DNS', host: '1.1.1.2', port: 443, group: 'cloudflare' },
            { name: 'Cloudflare DNS IPv6', host: '2606:4700:4700::1111', port: 443, group: 'cloudflare' },
        ];
    }

    saveNodes() {
        localStorage.setItem('network_nodes', JSON.stringify(this.nodes));
    }

    loadHistory() {
        const stored = localStorage.getItem('network_history');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveHistory() {
        localStorage.setItem('network_history', JSON.stringify(this.history));
    }

    loadSettings() {
        const stored = localStorage.getItem('network_settings');
        if (stored) {
            try {
                return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
            } catch (e) {
                return this.getDefaultSettings();
            }
        }
        return this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            timeout: 5,
            parallel: 20,
            retries: 2,
            saveHistory: true,
        };
    }

    saveSettings() {
        localStorage.setItem('network_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        document.getElementById('setting-timeout').value = this.settings.timeout;
        document.getElementById('setting-parallel').value = this.settings.parallel;
        document.getElementById('setting-retries').value = this.settings.retries;
        document.getElementById('setting-save-history').checked = this.settings.saveHistory;
    }

    addVpsNode() {
        const name = document.getElementById('vps-name').value.trim();
        const ip = document.getElementById('vps-ip').value.trim();
        const port = parseInt(document.getElementById('vps-port').value);

        if (!name || !ip) {
            this.showNotification('请输入节点名称和IP地址', 'error');
            return;
        }

        this.nodes.push({ name, host: ip, port, group: 'vps' });
        this.saveNodes();
        this.renderNodes();
        this.updateStats();

        document.getElementById('vps-name').value = '';
        document.getElementById('vps-ip').value = '';
        this.showNotification(`节点 "${name}" 添加成功`, 'success');
    }

    renderNodes() {
        const tbody = document.getElementById('vps-list-body');
        tbody.innerHTML = '';

        if (this.nodes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="hint">暂无节点</td></tr>';
            return;
        }

        this.nodes.forEach((node, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${node.name}</td>
                <td>${node.host}</td>
                <td>${node.port}</td>
                <td>
                    <button class="btn btn-warning" onclick="dashboard.removeNode(${index})" style="padding: 3px 8px; font-size: 0.75rem;">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    removeNode(index) {
        const removed = this.nodes.splice(index, 1);
        this.saveNodes();
        this.renderNodes();
        this.updateStats();
        this.showNotification(`节点 "${removed[0].name}" 已删除`, 'success');
    }

    updateStats() {
        document.getElementById('stat-total-nodes').textContent = this.nodes.length;
    }

    async testAllNodes() {
        const btn = document.getElementById('btn-test-all');
        const methods = Array.from(document.querySelectorAll('input[name="method"]:checked'))
            .map(cb => cb.value);

        if (methods.length === 0) {
            this.showNotification('请选择至少一种测试方法', 'error');
            return;
        }

        if (this.nodes.length === 0) {
            this.showNotification('请先添加节点', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ 测试中...';

        const results = [];
        const chunkSize = this.settings.parallel;
        
        for (let i = 0; i < this.nodes.length; i += chunkSize) {
            const chunk = this.nodes.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
                chunk.map(node => this.testNode(node, methods))
            );
            results.push(...chunkResults);
        }

        btn.disabled = false;
        btn.textContent = '🚀 开始测速全部节点';

        this.renderResults(results);
        this.updateRecommendations(results);
        this.updateUnstable(results);
        this.updateStats();

        if (this.settings.saveHistory) {
            this.addToHistory(results);
        }
    }

    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async testNode(node, methods) {
        const result = {
            node_name: node.name,
            host: node.host,
            port: node.port,
            tcp_latency: null,
            http_latency: null,
            icmp_latency: null,
            status: 'failed',
            error: null,
            score: 0,
        };

        const timeout = this.settings.timeout * 1000;

        if (methods.includes('tcp')) {
            try {
                const start = performance.now();
                const resp = await this.fetchWithTimeout(
                    `/api/test_tcp?host=${encodeURIComponent(node.host)}&port=${node.port}&timeout=${timeout}`,
                    { method: 'GET' },
                    timeout + 2000
                );
                const elapsed = performance.now() - start;
                if (resp.ok) {
                    const data = await resp.json();
                    result.tcp_latency = data.latency_ms > 0 ? data.latency_ms : elapsed;
                }
            } catch (e) {
                result.tcp_latency = null;
                if (!result.error) result.error = e.message;
            }
        }

        if (methods.includes('http')) {
            try {
                const start = performance.now();
                await this.fetchWithTimeout(
                    `https://${node.host}:${node.port}/`,
                    { method: 'GET', mode: 'no-cors' },
                    timeout
                );
                result.http_latency = Math.round(performance.now() - start);
            } catch (e) {
                result.http_latency = null;
                if (!result.error) result.error = e.message;
            }

            try {
                const start = performance.now();
                const resp = await this.fetchWithTimeout(
                    `/api/test_http?host=${encodeURIComponent(node.host)}&timeout=${timeout}`,
                    { method: 'GET' },
                    timeout + 2000
                );
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.status === 'success' && (data.latency_ms > 0 || result.http_latency === null)) {
                        result.http_latency = data.latency_ms;
                    }
                }
            } catch (e) {
                if (result.http_latency === null) result.error = e.message;
            }
        }

        if (methods.includes('icmp')) {
            try {
                const start = performance.now();
                const resp = await this.fetchWithTimeout(
                    `/api/test_tcp?host=${encodeURIComponent(node.host)}&port=80&timeout=${timeout}`,
                    { method: 'GET' },
                    timeout + 2000
                );
                if (resp.ok) {
                    const data = await resp.json();
                    result.icmp_latency = data.latency_ms;
                }
            } catch (e) {
                result.icmp_latency = null;
            }
        }

        result.status = this.determineStatus(result, methods);
        result.score = this.calculateScore(result, methods);

        return result;
    }

    determineStatus(result, methods) {
        if (methods.includes('tcp') && result.tcp_latency && result.tcp_latency > 0) return 'success';
        if (methods.includes('http') && result.http_latency && result.http_latency > 0) return 'success';
        if (methods.includes('icmp') && result.icmp_latency && result.icmp_latency > 0) return 'success';
        return 'failed';
    }

    calculateScore(result, methods) {
        let score = 0;
        let weights = 0;

        if (result.tcp_latency && result.tcp_latency > 0) {
            const latScore = Math.max(0, 100 - (result.tcp_latency / 5));
            score += latScore * 0.4;
            weights += 0.4;
        }

        if (result.http_latency && result.http_latency > 0) {
            const latScore = Math.max(0, 100 - (result.http_latency / 5));
            score += latScore * 0.4;
            weights += 0.4;
        }

        if (result.icmp_latency && result.icmp_latency > 0) {
            const latScore = Math.max(0, 100 - (result.icmp_latency / 5));
            score += latScore * 0.2;
            weights += 0.2;
        }

        if (result.status === 'failed') {
            score = 0;
        } else {
            score = weights > 0 ? (score / weights) : 0;
        }

        return Math.round(score);
    }

    renderResults(results) {
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';

        results.sort((a, b) => b.score - a.score);

        results.forEach((r, index) => {
            const scoreClass = r.score >= 80 ? 'score-excellent' :
                              r.score >= 60 ? 'score-good' :
                              r.score >= 30 ? 'score-warning' : 'score-bad';

            const statusClass = r.status === 'success' ? 'status-success' :
                               r.status === 'failed' ? 'status-failed' : 'status-timeout';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${r.node_name}</td>
                <td>${r.host}</td>
                <td>${r.tcp_latency ? r.tcp_latency.toFixed(1) : '-1'}</td>
                <td>${r.http_latency ? r.http_latency.toFixed(1) : '-1'}</td>
                <td class="${statusClass}">${r.status === 'success' ? '✓ 可用' : '✗ 不可用'}</td>
                <td><span class="score-badge ${scoreClass}">${r.score}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateRecommendations(results) {
        const container = document.getElementById('recommendations-list');
        const goodResults = results
            .filter(r => r.status === 'success')
            .sort((a, b) => a.tcp_latency - b.tcp_latency)
            .slice(0, 5);

        if (goodResults.length === 0) {
            container.innerHTML = '<p class="hint">暂无可用节点</p>';
            return;
        }

        container.innerHTML = '';
        goodResults.forEach(r => {
            const div = document.createElement('div');
            div.className = 'recommendation-item ' + (r === goodResults[0] ? 'best' : '');
            const latencyStr = r.tcp_latency ? r.tcp_latency.toFixed(1) : r.http_latency ? r.http_latency.toFixed(1) : '-';
            div.innerHTML = `
                <div>
                    <div class="name">${r.node_name}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">${r.host}:${r.port}</div>
                </div>
                <div class="latency">${latencyStr}ms</div>
            `;
            container.appendChild(div);
        });
    }

    updateUnstable(results) {
        const container = document.getElementById('unstable-list');
        const unstable = results.filter(r =>
            r.status === 'failed' ||
            (r.tcp_latency && r.tcp_latency > 500) ||
            (r.http_latency && r.http_latency > 500)
        );

        if (unstable.length === 0) {
            container.innerHTML = '<p class="hint">暂无不稳定节点</p>';
            return;
        }

        container.innerHTML = '';
        unstable.forEach(r => {
            const div = document.createElement('div');
            div.className = 'recommendation-item';
            const reasons = [];
            if (r.status === 'failed') reasons.push('连接失败');
            if (r.tcp_latency && r.tcp_latency > 500) reasons.push(`高延迟(${Math.round(r.tcp_latency)}ms)`);
            if (r.http_latency && r.http_latency > 500) reasons.push(`高延迟(${Math.round(r.http_latency)}ms)`);

            div.innerHTML = `
                <div>
                    <div class="name" style="color: var(--red);">${r.node_name}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">${r.host}</div>
                </div>
                <div style="color: var(--red);">${reasons.join(', ')}</div>
            `;
            container.appendChild(div);
        });
    }

    addToHistory(results) {
        const entry = {
            timestamp: new Date().toISOString(),
            time_str: new Date().toLocaleString('zh-CN'),
            node_count: results.length,
            best_node: results.find(r => r.status === 'success')?.node_name || 'N/A',
            avg_latency: results
                .filter(r => r.tcp_latency && r.tcp_latency > 0)
                .reduce((acc, r) => acc + r.tcp_latency, 0) / 
                Math.max(1, results.filter(r => r.tcp_latency && r.tcp_latency > 0).length),
            nodes: results.map(r => ({
                name: r.node_name,
                host: r.host,
                tcp_latency: r.tcp_latency,
                http_latency: r.http_latency,
                status: r.status,
                score: r.score,
            })),
        };
        entry.avg_latency = Math.round(entry.avg_latency || 0);
        this.history.unshift(entry);
        if (this.history.length > 100) this.history = this.history.slice(0, 100);
        this.saveHistory();
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        if (this.history.length === 0) {
            container.innerHTML = '<p class="hint">暂无历史记录</p>';
            return;
        }

        container.innerHTML = '';
        this.history.slice(0, 20).forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="time">${entry.time_str}</div>
                <div class="node-count">节点数: ${entry.node_count} | 最佳: ${entry.best_node} | 平均延迟: ${entry.avg_latency}ms</div>
                <div class="progress-bar" style="margin-top: 5px;">
                    <div class="progress-bar-fill" style="width: ${Math.min(100, (entry.best_score || 0))}%;"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    exportHistory() {
        if (this.history.length === 0) {
            this.showNotification('暂无历史记录可导出', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-test-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('历史记录已导出', 'success');
    }

    clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) return;
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        this.showNotification('历史记录已清空', 'success');
    }

    saveSettings() {
        this.settings = {
            timeout: parseInt(document.getElementById('setting-timeout').value) || 5,
            parallel: parseInt(document.getElementById('setting-parallel').value) || 20,
            retries: parseInt(document.getElementById('setting-retries').value) || 2,
            saveHistory: document.getElementById('setting-save-history').checked,
        };
        this.saveSettings();
        this.showNotification('设置已保存', 'success');
    }

    async cfOptimize(count = 50) {
        const customCount = parseInt(document.getElementById('cf-count').value);
        if (customCount > 0) count = customCount;

        const btn = document.getElementById('btn-cf-optimize');
        const btn50 = document.getElementById('btn-cf-optimize-50');
        const btn100 = document.getElementById('btn-cf-optimize-100');
        btn.disabled = true;
        btn50.disabled = true;
        btn100.disabled = true;
        btn.textContent = `⏳ 测试${count}个IP...`;

        try {
            const resp = await this.fetchWithTimeout(
                `/api/cf_ips?count=${count}`,
                { method: 'GET' },
                10000
            );

            if (!resp.ok) {
                throw new Error('Failed to fetch CF IPs');
            }

            const data = await resp.json();
            const cfIps = data.ips.map(ip => ({
                name: ip.name,
                host: ip.ip,
                port: 443,
                group: 'cloudflare',
            }));

            const availEl = document.getElementById('cf-availability');
            if (data.total_available) {
                availEl.textContent = `共${data.total_available}个IP (${data.known_count}内置 + ${data.expanded_count}从CIDR范围)`;
            }

            const results = [];
            const chunkSize = 10;
            for (let i = 0; i < cfIps.length; i += chunkSize) {
                const chunk = cfIps.slice(i, i + chunkSize);
                const chunkResults = await Promise.all(
                    chunk.map(node => this.testNode(node, ['tcp']))
                );
                results.push(...chunkResults);
            }

            results.sort((a, b) => {
                if (a.tcp_latency && b.tcp_latency) return a.tcp_latency - b.tcp_latency;
                return 0;
            });

            this.cfResults = results;
            this.renderCfResults(results);
        } catch (error) {
            console.error('CF optimize error:', error);
        } finally {
             btn.disabled = false;
            btn50.disabled = false;
            btn100.disabled = false;
            btn.textContent = '🚀 开始Cloudflare IP优选';
        }
    }

    renderCfResults(results) {
        const tbody = document.getElementById('cf-results-body');
        tbody.innerHTML = '';

        const displayResults = results.slice(0, 20);

        displayResults.forEach((r, index) => {
            const row = document.createElement('tr');
            const latency = r.tcp_latency && r.tcp_latency > 0 ? r.tcp_latency.toFixed(1) : '-1';
            const statusClass = r.status === 'success' ? 'status-success' : 'status-failed';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${r.host}</td>
                <td>${r.node_name}</td>
                <td>${latency}</td>
                <td class="${statusClass}">${r.status === 'success' ? '✓ 可用' : '✗ 不可用'}</td>
            `;
            tbody.appendChild(row);
        });

        const copyBtn = document.getElementById('btn-copy-best-ip');
        const best = results.find(r => r.status === 'success' && r.tcp_latency && r.tcp_latency > 0);
        if (best) {
            copyBtn.disabled = false;
            copyBtn.onclick = () => {
                copyBtn.onclick = () => navigator.clipboard.writeText(best.host);
                this.showNotification(`最佳IP ${best.host} 已复制`, 'success');
            };
        } else {
            copyBtn.disabled = true;
        }
    }

    copyBestIp() {
        if (this.cfResults.length === 0) return;
        const best = this.cfResults.find(r => r.status === 'success' && r.tcp_latency && r.tcp_latency > 0);
        if (best) {
            navigator.clipboard.writeText(best.host).then(() => {
                this.showNotification(`最佳IP ${best.host} 已复制到剪贴板`, 'success');
            });
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s, fadeOut 3s forwards;
            ${type === 'success' ? 'background: #00ff88; color: #0a0a0e;' : 'background: #ff4757; color: #fff;'}
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new NetworkDashboard();
});
