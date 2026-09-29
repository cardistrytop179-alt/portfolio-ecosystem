Deploying `backend` to Render

1) Connect repository to Render
   - In Render dashboard choose **New** → **Web Service** and connect your GitHub repo.
   - If Render detects `render.yaml` it will use it to create the service automatically. If not, create a Web Service and set:
     - Root directory: `backend`
     - Environment: `Node`
     - Build Command: `npm ci && npm run build`
     - Start Command: `npm start`

2) Set environment variables (DO NOT commit them into git):
   - `BOT_TOKEN` — your Telegram bot token
   - `DATABASE_URL` — Postgres connection string
   - `ADMIN_ID` — your Telegram id
   - `FRONTEND_URL` — Vercel frontend URL (https://...)
   - `NODE_ENV=production`
   - Optionally `BYN_USD_RATE`

3) Migrations
    - After the service is created, open the Render shell for the service and run:
       ```bash
       npm run db:deploy
       ```
    - Or run `npx prisma migrate deploy` in the service shell.

Important notes about the build (fix for common error):
- If your Render deploy fails with "Cannot find package 'esbuild'" or a similar missing module error, update the build command in Render (or rely on the `render.yaml` in repo root) so that devDependencies are installed during the build.
- Recommended build command for the service (if you set Root = `backend`):
   ```bash
   npm ci --include=dev && npm run build
   ```
- If Render is building from the repo root (and runs `yarn install; yarn build`), either create a dedicated Web Service with Root = `backend` or change the service build command to the command above.
- Do NOT set `NODE_ENV=production` as a global env var that is applied during the install step; setting `NODE_ENV` globally can cause devDependencies to be skipped during install and break the build. Use `NODE_ENV=production` at runtime (start command) instead.

4) Webhook
   - Once the service is live (HTTPS), set Telegram webhook (only for production):
     ```bash
     curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -d url="https://<your-render-domain>/webhook"
     ```

5) Health check
   - Render will hit `/api/stats` (configured in `render.yaml`), ensure it returns 200.
