# Deploy backend to your own VPS (Ubuntu 22.04/24.04)

End-to-end recipe for running the portfolio backend on a VPS alongside an
existing (unrelated) Telegram bot. Uses PostgreSQL, nginx reverse proxy,
Let's Encrypt TLS via `sslip.io` (no domain needed).

Replace placeholders:
- `<VPS_IP>` — public IPv4 of your VPS (e.g. `203.0.113.42`).
- `<VPS_IP_DASHED>` — same IP with dots replaced by dashes (e.g. `203-0-113-42`). sslip.io accepts both forms; dashed avoids ambiguity.
- `<BOT_TOKEN>` — Telegram bot token from BotFather (for the portfolio bot).
- `<ADMIN_ID>` — your Telegram numeric user id.
- `<DB_PASSWORD>` — any strong password, save it somewhere.

All commands run as root (or prefix with `sudo`).

---

## 1. System prep

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential ufw nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

## 2. Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

## 3. Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should print v20.x
npm -v
```

## 4. pm2 (process manager)

```bash
npm install -g pm2
pm2 startup systemd   # follow the command it prints (copy-paste the sudo line)
```

## 5. PostgreSQL: database + user

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE portfolio;
CREATE USER portfolio_user WITH ENCRYPTED PASSWORD '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE portfolio TO portfolio_user;
\c portfolio
GRANT ALL ON SCHEMA public TO portfolio_user;
EOF
```

Verify:
```bash
psql "postgresql://portfolio_user:<DB_PASSWORD>@localhost:5432/portfolio" -c "\conninfo"
```

## 6. Clone repo

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/cardistrytop179-alt/portfolio-ecosystem.git portfolio
cd portfolio/backend
npm install --no-audit --no-fund
npx prisma generate
```

## 7. Backend .env

```bash
cat > /opt/portfolio/backend/.env <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://portfolio_user:<DB_PASSWORD>@localhost:5432/portfolio
BOT_TOKEN=<BOT_TOKEN>
ADMIN_ID=<ADMIN_ID>
FRONTEND_URL=https://<your-vercel-domain>.vercel.app
BYN_USD_RATE=3.25
EOF
chmod 600 /opt/portfolio/backend/.env
```

Run migrations:
```bash
cd /opt/portfolio/backend
npx prisma migrate deploy || npx prisma db push
```

## 8. pm2 start

```bash
cd /opt/portfolio/backend
pm2 start src/server.js --name portfolio-backend --time --max-memory-restart 300M
pm2 save
pm2 logs portfolio-backend --lines 50   # Ctrl+C to exit
```

Verify backend locally:
```bash
curl http://127.0.0.1:3001/health
# {"status":"ok",...}
```

## 9. Nginx reverse proxy

Create `/etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    server_name <VPS_IP_DASHED>.sslip.io;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 30s;
    }
}
```

Enable and test:
```bash
ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
nginx -t
systemctl reload nginx
curl http://<VPS_IP_DASHED>.sslip.io/health
```

## 10. Let's Encrypt (HTTPS)

```bash
certbot --nginx -d <VPS_IP_DASHED>.sslip.io --non-interactive --agree-tos -m you@example.com --redirect
```

This auto-rewrites the nginx config to serve HTTPS and redirect HTTP→HTTPS.

Verify:
```bash
curl https://<VPS_IP_DASHED>.sslip.io/health
```

Renewal is scheduled automatically via `systemctl status certbot.timer`.

## 11. Point frontend to the new backend

On Vercel (Project → Settings → Environment Variables) set:
```
VITE_BACKEND_URL=https://<VPS_IP_DASHED>.sslip.io
```
Scope: Production (and Preview if desired). Redeploy the frontend.

Also update backend `.env` with the final Vercel URL if it was a placeholder:
```bash
nano /opt/portfolio/backend/.env
# set FRONTEND_URL=https://<your-vercel-domain>.vercel.app
pm2 restart portfolio-backend
```

## 12. Telegram webhook (optional)

If your bot uses webhooks (not long-polling), point Telegram at your new VPS:

```bash
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<VPS_IP_DASHED>.sslip.io/webhook"
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

## 13. Update / redeploy

```bash
cd /opt/portfolio
git pull
cd backend
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy || true
pm2 restart portfolio-backend
```

## Troubleshooting

- **`pm2 logs portfolio-backend`** — runtime errors.
- **`systemctl status nginx`** + **`tail -f /var/log/nginx/error.log`** — proxy issues.
- **`ss -tlnp | grep -E ':(80|443|3001)'`** — ports open.
- **`sudo -u postgres psql`** → `\l`, `\du` — DB/user exists.
- **CORS blocked**: make sure `FRONTEND_URL` in `.env` exactly matches your Vercel prod URL (with `https://`, no trailing slash).
- **Rate limit or cold IP**: `/api/analyze` is rate-limited to 20 req / 5 min per IP — normal.
- **sslip.io edge cases**: use the dashed form (`203-0-113-42.sslip.io`), some DNS resolvers dislike the dotted form.
- **Existing bot conflict**: only if both bots listen on the same port. Run `ss -tlnp` to verify the port you picked for the backend (default 3001 here) is free.

