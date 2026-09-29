# Deploying the Mini App (HTTPS production)

This guide shows two recommended production paths: frontend -> Vercel (static HTTPS) and backend -> Render (Node service with HTTPS). Both provide trusted TLS and are suitable for Telegram Web Apps.

## Required env variables (backend)
- `BOT_TOKEN` — Telegram bot token
- `ADMIN_ID` — admin Telegram id
- `DATABASE_URL` — PostgreSQL connection string (if used)
- `FRONTEND_URL` — public HTTPS URL of the deployed frontend (e.g. https://your-app.vercel.app)
- `BYN_USD_RATE` — optional fallback exchange rate
- `NODE_ENV=production`

## Frontend — Vercel (recommended)
1. Install Vercel CLI (optional):

```bash
npm i -g vercel
```

2. From repo root, deploy the `frontend` folder (recommended):

```bash
cd frontend
vercel login
vercel --prod
```

or from the root (monorepo):

```bash
vercel --cwd frontend --prod
```

3. Take the deployed URL (e.g. `https://my-portfolio.vercel.app`) and set it as `FRONTEND_URL` in your backend environment (Render/Heroku/other).

## Cloudflare Pages (free, recommended for static builds)

Quick setup using Cloudflare Pages. This provides a free HTTPS domain and easy custom domain management via Cloudflare DNS.

1. Create a Pages project in the Cloudflare dashboard and connect your GitHub repo, or deploy from the command line with `wrangler`.

2. Build command: `npm ci && npm run build` — publish directory: `dist` (Vite default in this repo).

3. I added a GitHub Actions workflow `.github/workflows/deploy-cloudflare-pages.yml` that will publish `frontend/dist` to Pages when you push to `main`.

4. Required GitHub secrets (Repository → Settings → Secrets):
  - `CLOUDFLARE_API_TOKEN` — API token with Pages publish permissions
  - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account id
  - `CLOUDFLARE_PAGES_PROJECT_NAME` — Pages project name

5. Alternatively publish manually:

```bash
npx wrangler@latest pages publish frontend/dist --project-name=your-pages-project --branch=main
```

6. After deploy, set `FRONTEND_URL` in your backend environment to the Pages URL (e.g. `https://your-project.pages.dev` or your custom domain) and restart the backend.


## Backend — Render (recommended) / Heroku
- Option A: Render (connect GitHub repo)
  1. Create new Web Service on Render.
  2. Set the repository and set the root directory to `backend`.
  3. Build Command: `npm ci && npm run build`
  4. Start Command: `npm start` (or `node dist/server.js`)
  5. Add environment variables listed above in the Render dashboard and deploy.

- Option B: Heroku (quick)
  1. Create an app on Heroku.
  2. Connect GitHub repo or push code.
  3. Configure buildpack for Node.js
  4. Set the env vars and deploy.

## Setting Telegram webhook (optional)
If you prefer webhooks (production), set webhook to your backend URL:

```bash
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -d "url=https://your-backend.example.com/webhook"
```

If you keep polling mode (`bot.start()`), you don't need webhooks — polling is fine.

## CI/CD templates
There are example workflow templates in `.github/workflows/`:
- `deploy-frontend.yml` — Vercel action (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)
- `deploy-backend.yml` — placeholder; you can connect to Render from GitHub directly or adapt the workflow to your provider.

## Quick local test of production build
Build frontend and serve locally to verify production bundle:

```bash
# build frontend
npm run build:frontend
# serve with a simple static server (install serve globally if needed)
npm i -g serve
serve frontend/dist -l 5000
# open http://localhost:5000
```

When the frontend is deployed and publicly available over HTTPS, update `FRONTEND_URL` in your backend environment and restart the backend so Telegram's Web App button opens the correct HTTPS address.

---
If you want, I can:
- create the Vercel deployment (requires your Vercel token/permission),
- or connect the repo to Render (requires your Render access),
- or set up GitHub Actions to auto-deploy (you'll need to add secrets).
# Deploying the Mini App (HTTPS production)

This guide shows two recommended production paths: frontend -> Vercel (static HTTPS) and backend -> Render (Node service with HTTPS). Both provide trusted TLS and are suitable for Telegram Web Apps.

## Required env variables (backend)
- `BOT_TOKEN` — Telegram bot token
- `ADMIN_ID` — admin Telegram id
- `DATABASE_URL` — PostgreSQL connection string (if used)
- `FRONTEND_URL` — public HTTPS URL of the deployed frontend (e.g. https://your-app.vercel.app)
- `BYN_USD_RATE` — optional fallback exchange rate
- `NODE_ENV=production`

## Frontend — Vercel (recommended)
1. Install Vercel CLI (optional):

```bash
npm i -g vercel
```

2. From repo root, deploy the `frontend` folder (recommended):

```bash
cd frontend
vercel login
vercel --prod
```

or from the root (monorepo):

```bash
vercel --cwd frontend --prod
```

3. Take the deployed URL (e.g. `https://my-portfolio.vercel.app`) and set it as `FRONTEND_URL` in your backend environment (Render/Heroku/other).

## Cloudflare Pages (free, recommended for static builds)

Quick setup using Cloudflare Pages. This provides a free HTTPS domain and easy custom domain management via Cloudflare DNS.

1. Create a Pages project in the Cloudflare dashboard and connect your GitHub repo, or deploy from the command line with `wrangler`.

2. Build command: `npm ci && npm run build` — publish directory: `dist` (Vite default in this repo).

3. I added a GitHub Actions workflow `.github/workflows/deploy-cloudflare-pages.yml` that will publish `frontend/dist` to Pages when you push to `main`.

4. Required GitHub secrets (Repository → Settings → Secrets):
  - `CLOUDFLARE_API_TOKEN` — API token with Pages publish permissions
  - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account id
  - `CLOUDFLARE_PAGES_PROJECT_NAME` — Pages project name

5. Alternatively publish manually:

```bash
npx wrangler@latest pages publish frontend/dist --project-name=your-pages-project --branch=main
```

6. After deploy, set `FRONTEND_URL` in your backend environment to the Pages URL (e.g. `https://your-project.pages.dev` or your custom domain) and restart the backend.


## Backend — Render (recommended) / Heroku
- Option A: Render (connect GitHub repo)
  1. Create new Web Service on Render.
  2. Set the repository and set the root directory to `backend`.
  3. Build Command: `npm ci && npm run build`
  4. Start Command: `npm start` (or `node dist/server.js`)
  5. Add environment variables listed above in the Render dashboard and deploy.

- Option B: Heroku (quick)
  1. Create an app on Heroku.
  2. Connect GitHub repo or push code.
  3. Configure buildpack for Node.js
  4. Set the env vars and deploy.

## Setting Telegram webhook (optional)
If you prefer webhooks (production), set webhook to your backend URL:

```bash
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -d "url=https://your-backend.example.com/webhook"
```

If you keep polling mode (`bot.start()`), you don't need webhooks — polling is fine.

## CI/CD templates
There are example workflow templates in `.github/workflows/`:
- `deploy-frontend.yml` — Vercel action (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)
- `deploy-backend.yml` — placeholder; you can connect to Render from GitHub directly or adapt the workflow to your provider.

## Quick local test of production build
Build frontend and serve locally to verify production bundle:

```bash
# build frontend
npm run build:frontend
# serve with a simple static server (install serve globally if needed)
npm i -g serve
serve frontend/dist -l 5000
# open http://localhost:5000
```

When the frontend is deployed and publicly available over HTTPS, update `FRONTEND_URL` in your backend environment and restart the backend so Telegram's Web App button opens the correct HTTPS address.

---
If you want, I can:
- create the Vercel deployment (requires your Vercel token/permission),
- or connect the repo to Render (requires your Render access),
or set up GitHub Actions to auto-deploy (you'll need to add secrets).
