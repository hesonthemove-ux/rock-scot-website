# ROCK.SCOT — Dev Build Handover Sheet
**Build:** v5.0 — Clean architecture rebuild  
**Date:** 2026-03-05 09:44  
**Prepared by:** Claude (Anthropic) + hesonthemove-ux  

---

## What Changed in This Build

### Critical Bugs Fixed

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| No header/nav on any page | `header.js` was in `<head>` — `document.body` is `null` at parse time, so `insertBefore` silently failed | Moved `<script src="js/header.js">` to just before `</body>` on all pages |
| Wire always shows "Connecting…" | Supabase SDK loaded from `cdn.jsdelivr.net` — Brave browser blocks third-party CDN scripts by default | Removed CDN; wire now uses native `fetch()` directly to Supabase REST API |
| Advertise buttons do nothing | `window.selectPackage` assigned at line 1088, but any JS error before that (caused by missing Supabase SDK) prevented assignment | Added forward declarations at top of script; CDN removed |
| FAQ items not opening | `faq-body` divs had inline `style="display:none"` — inline styles beat CSS class rules | Removed inline display:none; CSS class handles show/hide |
| Double top padding on pages | `header.js` added `body{padding-top:98px}` AND pages already had `margin-top:98px` on first sections | Removed body padding from header.js |

---

## Architecture

### header.js (v5.0)
Single file injected at end of every page body. Responsible for:
- Fixed header bar with logo, desktop nav, Listen Live button, hamburger
- Orange news ticker (THE WIRE) below header
- Full-screen mobile nav overlay with animated links
- Persistent player bar (slides up from bottom)
- Wire data fetching via Supabase REST API (no SDK needed)
- Homepage wire grid update (`#homepage-wire`)
- Ticker animation via `requestAnimationFrame` (no CSS keyframes)

**Guard:** `window.__rsLoaded` prevents double-injection if script somehow loads twice.  
**Body safety:** Checks `document.body` exists before injecting HTML; retries every 10ms if not.  
**Supabase:** Uses direct `fetch()` to REST API — works in Brave, Firefox, Safari without any CDN.

### Supabase Integration
- All pages use direct REST API via `fetch()`
- No Supabase SDK CDN dependency anywhere in public pages
- Key is hardcoded in each file (anon/public key — safe to expose)
- `supabase-config.js` retained for admin pages only (`admin-dashboard.html`, `login.html`, `customer-portal.html`)
- Wire data: table `wire_news`, filter `is_live=true`, ordered `created_at DESC`

### wire.html
- All old nav/hamburger/player code removed (was dead code referencing non-existent DOM elements)
- `loadStories()` uses `fetch()` directly to Supabase REST
- Realtime subscription replaced with 30s polling (realtime requires SDK)
- Placeholder stories shown if Supabase returns empty or errors

### advertise.html
- Forward declarations: `window.selectPackage`, `window.calculateQuote`, `window.onPackageChange` exposed at top of script before any async code
- Supabase REST client built inline (mini fetch-based implementation, no SDK)
- Campaign booking via Edge Function: `/functions/v1/book_campaign`

---

## File Inventory

| File | Purpose | Notes |
|------|---------|-------|
| `index.html` | Homepage | AEO entity block added; FAQ inline display:none removed |
| `wire.html` | News feed | Dead nav/player code removed; REST fetch only |
| `advertise.html` | Booking | Forward declarations fix; REST Supabase client |
| `coverage.html` | DAB map | Leaflet map, no changes to map logic |
| `js/header.js` | Persistent UI | v5.0 — all nav, ticker, player, wire data |
| `css/style.css` | Styles | 174 lines of dead nav/player CSS removed |

### Removed (dead code):
- `js/main.js` — no longer loaded anywhere (was conflicting with header.js)
- `js/persistent-player.js` — superseded by header.js player
- `js/analytics.js` — not loaded anywhere
- `js/cookie-consent.js` — not loaded anywhere
- All `cdn.jsdelivr.net` script tags from public pages
- Old `header`, `nav`, `.hamburger`, `.mobile-nav`, `#wire-ticker`, `#player-bar` CSS (174 lines)

> These files still exist in the repo — delete them when confirmed working.

---

## Server / Infrastructure

| Component | Detail |
|-----------|--------|
| Server | Raspberry Pi, internal `192.168.0.1`, external `82.7.194.110` |
| Web server | Apache 2.4, serving `/rock` via `Alias` to `/home/rockscot/rock-scot-website` |
| Process manager | PM2 for Caledonia TX (`/tx` proxy to port 3000) |
| Deploy repo | `/home/rockscot/rockscot-deploy` |
| Live site | `/home/rockscot/rock-scot-website` |
| GitHub | `https://github.com/hesonthemove-ux/rock-scot-website.git` |
| Apache config | `/etc/apache2/sites-enabled/000-default.conf` |
| Permissions | `chmod -R o+rX /home/rockscot/rock-scot-website` required after deploy |

### Known Apache quirk
Two backup files in the live directory have locked permissions:
```
js/analytics.js.bak.2026-02-15-234324
js/supabase-config.js.bak.2026-02-15-234324
```
`chmod` throws "Operation not permitted" on these — harmless, they aren't served.  
Remove with: `sudo rm /home/rockscot/rock-scot-website/js/*.bak.*`

---

## Supabase Project

| Setting | Value |
|---------|-------|
| Project ref | `pwzeapvopeeoahpyicdm` |
| URL | `https://pwzeapvopeeoahpyicdm.supabase.co` |
| Anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (see source) |
| wire_news seed | 3 rows present (ROCK.SCOT IS LIVE, TOM RUSSELL, INVERCLYDE) |
| RLS | `public_read_wire` policy: anon SELECT where `is_live = TRUE` |

### To add wire stories:
Insert into `wire_news` with `is_live = true`. Stories auto-purge after 30 days (trigger on table).

---

## Deployment Command

```bash
FILE_ID="PASTE_DRIVE_FILE_ID_HERE"
cd ~/rockscot-deploy
curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o /tmp/v5.zip
CONFIRM=$(grep -o 'confirm=[^&"]*' /tmp/gc.txt | head -1 | cut -d= -f2)
[ -n "$CONFIRM" ] && curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o /tmp/v5.zip
unzip -o /tmp/v5.zip -d /tmp/v5
cp /tmp/v5/js/header.js ~/rock-scot-website/js/header.js
cp /tmp/v5/index.html ~/rock-scot-website/index.html
cp /tmp/v5/wire.html ~/rock-scot-website/wire.html
cp /tmp/v5/advertise.html ~/rock-scot-website/advertise.html
cp /tmp/v5/coverage.html ~/rock-scot-website/coverage.html
cp /tmp/v5/css/style.css ~/rock-scot-website/css/style.css
chmod -R o+rX ~/rock-scot-website
cp -r /tmp/v5/. .
git add -A && git commit -m "v5: clean build" && git push origin main
rm -rf /tmp/v5 /tmp/v5.zip /tmp/gc.txt
```

---

## Next Steps / Outstanding Items

- [ ] Add real news stories to `wire_news` table in Supabase
- [ ] Confirm advertise booking flow submits to Edge Function correctly  
- [ ] Remove dead JS files from repo: `main.js`, `persistent-player.js`, `analytics.js`, `cookie-consent.js`
- [ ] Remove `*.bak.*` files from live server: `sudo rm /home/rockscot/rock-scot-website/js/*.bak.*`
- [ ] Set up RSS ingestion to auto-populate `wire_news` table
- [ ] Test in Chrome (not just Brave) to confirm consistent behaviour
- [ ] Verify Supabase Edge Function `book_campaign` is deployed and live

---

*This sheet is included in the deploy zip for reference. It is not linked from any public page.*
