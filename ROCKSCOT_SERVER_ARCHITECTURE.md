# ROCK.SCOT — Server Architecture & Deployment Rules
**Last updated:** 2026-03-05  
**Applies to:** Pi at 192.168.0.1 (external: 82.7.194.110)  
**User:** rockscot  

---

## Current Stable PM2 State

| App | Type | Port | PM2 Start Command |
|-----|------|------|-------------------|
| `caledoniatx` | Next.js app | 3000 | `npm start` in `~/caledoniatx` |
| `rockscot` | Static site | 8081 | `python3 -m http.server 8081` in `~/rock-scot-website` |

Both are saved with `pm2 save` and auto-start via systemd.

---

## What Went Wrong (Root Cause, Fixed)

PM2 was running `npm start` from `~/rockscot-deploy` — a directory with no valid `package.json`.  
The process crashed immediately, PM2 auto-restarted it, and it looped **10,336 times**.  
CPU hit **150–200%**. Separately, both processes tried to bind to port **3000**, causing `EADDRINUSE`.

**Fix:** Rockscot now runs as a plain static server on port 8081.  
They no longer compete for a port. The crash loop is gone.

---

## ROCKSCOT Deploy Process (Static Site — Always)

Rockscot is **not** a Node app. It has no `package.json`, no build step, no `npm start`.

```bash
# 1. Check state before touching anything
pm2 list

# 2. Upload zip to Drive, get FILE_ID, then on Pi:
FILE_ID="PASTE_ID_HERE"
cd ~/rockscot-deploy
curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o /tmp/rs.zip
CONFIRM=$(grep -o 'confirm=[^&"]*' /tmp/gc.txt | head -1 | cut -d= -f2)
[ -n "$CONFIRM" ] && curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o /tmp/rs.zip

# 3. Deploy files
unzip -o /tmp/rs.zip -d /tmp/rs
cp /tmp/rs/js/header.js    ~/rock-scot-website/js/header.js
cp /tmp/rs/css/style.css   ~/rock-scot-website/css/style.css
cp /tmp/rs/index.html      ~/rock-scot-website/index.html
cp /tmp/rs/wire.html       ~/rock-scot-website/wire.html
cp /tmp/rs/advertise.html  ~/rock-scot-website/advertise.html
cp /tmp/rs/coverage.html   ~/rock-scot-website/coverage.html
chmod -R o+rX ~/rock-scot-website

# 4. Commit to GitHub
cp -r /tmp/rs/. .
git add -A && git commit -m "deploy: vX" && git push origin main

# 5. Rockscot static server does NOT need restarting — python serves files directly
# Only restart if the process is down:
# pm2 restart rockscot

# 6. Cleanup
rm -rf /tmp/rs /tmp/rs.zip /tmp/gc.txt
```

> ⚠️ **Never run `pm2 restart rockscot` as part of a normal deploy.**  
> The static server reads files directly from disk. Copying files IS the deploy.

---

## CALEDONIATX Deploy Process (Next.js App)

```bash
# 1. Always check first
pm2 list
# Confirm: rockscot is running, nothing else is on port 3000

# 2. Build and restart
cd ~/caledoniatx
npm install
npm run build
pm2 restart caledoniatx

# 3. Verify
pm2 list
# caledoniatx should show restarts: 0 (or low), uptime growing
```

> ⚠️ **Never run `pm2 delete all`** — this kills rockscot too and it won't auto-recover correctly.  
> **Never use port 3000 for anything else.**  
> **Never run `npm start` inside `~/rockscot-deploy`.**

---

## Rules — Memorise These

1. **One app = one port.** Rockscot → 8081. Caledonia → 3000. Never swap, never share.
2. **Check `pm2 list` before every deploy** of either app.
3. **CPU spike?** Run `pm2 list` immediately and check restart count. If restarts > 100, something is crash-looping.
4. **Rockscot deploy = file copy only.** No build step, no pm2 restart needed.
5. **Caledonia deploy = build then restart.** Always `npm run build` before `pm2 restart`.
6. **Never delete all PM2 processes.** Use `pm2 restart <name>` or `pm2 stop <name>`.
7. **pm2 save** after any intentional change to PM2 state.

---

## Fixing a Crash Loop (If It Happens Again)

```bash
pm2 list                          # identify the looping process
pm2 stop <name>                   # stop it
pm2 logs <name> --lines 50        # read the actual error
# fix the underlying cause, then:
pm2 start <correct command> --name <name>
pm2 save
```

---

## Apache / Reverse Proxy

Apache is handling the public routing:

```apache
# Rockscot static site (via Python server on 8081)
ProxyPass /rock http://localhost:8081/
ProxyPassReverse /rock http://localhost:8081/

# Caledonia TX Next.js app (port 3000)
ProxyPass /tx http://localhost:3000/
ProxyPassReverse /tx http://localhost:3000/
```

Config file: `/etc/apache2/sites-enabled/000-default.conf`

> If Rockscot ever becomes a Next.js app in future, it **must** use port **3001** (not 3000).  
> Update Apache ProxyPass accordingly. Never share 3000.

---

## Quick Health Check

```bash
pm2 list                          # both processes running, restarts low
curl -s http://localhost:8081/ | head -5    # rockscot responding
curl -s http://localhost:3000/ | head -5    # caledoniatx responding
```

---

*This document lives in ~/rockscot-deploy/ROCKSCOT_SERVER_ARCHITECTURE.md*  
*Copy it there on next deploy so it's always on the Pi.*
