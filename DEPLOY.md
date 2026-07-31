# Cloudflare Pages Configuration

This project is designed to be deployed on **Cloudflare Pages** with zero configuration.

## Deployment

### Option 1: Via Cloudflare Dashboard
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Create a new project
3. Connect your GitHub repository
4. Build settings:
   - **Framework preset**: Custom
   - **Build command**: (leave empty - no build step needed)
   - **Publish directory**: `public`
5. Click "Save and Deploy"

### Option 2: Via Wrangler CLI
```bash
npm install -g wrangler
wrangler pages deploy .
```

### Option 3: Via GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy .
          directory: ./public
```

## Architecture

### Frontend (`public/`)
- Pure HTML/CSS/JavaScript - no build step required
- Runs entirely in the browser
- Uses `localStorage` for node configuration and history

### Backend (`functions/`)
- Cloudflare Workers Functions for server-side testing
- `api/test_tcp.js` - TCP connect latency testing via Cloudflare Workers TCP Sockets
- `api/test_http.js` - HTTP latency testing via fetch
- `api/batch_test.js` - Batch testing multiple hosts
- `api/cf_ips.js` - Returns known Cloudflare IP addresses for optimization

## Notes

- The Workers Functions run at Cloudflare's edge, providing testing from multiple geographic locations
- Browser-based HTTP tests measure latency from the user's local network
- TCP socket tests use Cloudflare's edge network for more accurate edge-to-node latency
