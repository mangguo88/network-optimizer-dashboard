# Network Optimizer Dashboard

Web-based network optimization dashboard deployable on **Cloudflare Pages** with zero build step.

## Features

- **节点测速 (Node Testing)**: TCP connect, HTTP latency, and ICMP ping testing
- **智能评分 (Smart Scoring)**: Latency, availability, and connection quality scoring
- **Cloudflare IP优选 (Cloudflare IP Optimization)**: Automatically tests and ranks Cloudflare edge IPs
- **VPS节点管理 (VPS Management)**: Add, remove, and manage custom VPS nodes
- **历史记录 (History)**: Test results saved locally with export capability
- **不稳定节点检测 (Unstable Node Detection)**: Flags high-latency or failing nodes
- **推荐排序 (Recommendations)**: Ranked results with best nodes highlighted

## Quick Start

### Local Development

```bash
# Serve locally
npx serve public

# Or use Python
python -m http.server 8000 --directory public
```

Then open `http://localhost:8000`

### Deploy to Cloudflare Pages

1. Fork this repository to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
3. Create a new project, connect your GitHub repo
4. Set:
   - **Publish directory**: `public`
   - **Build command**: (leave empty)
5. Deploy!

Or use Wrangler:
```bash
npm install -g wrangler
wrangler pages deploy .
```

## CLI Usage

This dashboard complements the Python CLI tool. For automated/server-side testing:

```bash
# Install the Python CLI
pip install -e .

# Test all nodes
net-opt optimize --method system_ping --timeout 5

# Monitor continuously
net-opt monitor --interval 30 --duration 300

# Add VPS nodes
net-opt add-node --name "VPS-Shanghai" --ip 123.45.67.89 --port 443 --group vps
```

## Configuration

Nodes are stored in browser `localStorage`. Default nodes include known Cloudflare DNS IPs. Add custom VPS nodes via the VPS management tab.

## License

MIT
