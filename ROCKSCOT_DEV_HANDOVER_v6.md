# ROCK.SCOT — Dev Build Handover Sheet v6
**Build:** v6.0 — Wire redesign, responsive layout, modal system
**Changes from v5:**

## Fixes in this build

### Wire page
- Replaced 3-column card grid with clean **list layout** (`wire-stories-list` / `wire-story-row`)
- Stories show title + 2-line summary clamp only — no full text on the list
- Click any row → **popout modal** with full summary + "Read Full Story at Source ↗" button
- Source link only appears inside the modal, not on the card row
- Stories capped at **20 per load** with "Show More (N remaining)" button
- Search and genre filter now wired up (`filterStories()` function was missing — added)
- `genreClass()` simplified to output CSS modifier classes matching style.css
- Inline `<style>` block removed — all styles now in style.css

### Index homepage
- Wire grid restored to **3-column horizontal** layout (was collapsing to 1-column)
- Wire cards on homepage now open a **popout modal** instead of linking directly to source
- Modal HTML + JS (`hwOpenModal`, `hwCloseModal`) added to index.html

### Mobile / responsive (was completely absent)
- Added full `@media` breakpoint system to style.css (was 0 media queries)
- Breakpoints: 1024px, 768px, 600px, 480px
- All grids respond: genres (4→2), coverage (4→2→1), advertise (3→1), footer (4→2→1)
- Tom Russell section stacks on mobile
- Schedule rows collapse columns on small screens
- Hero buttons stack on mobile
- Wire controls stack to full-width on mobile

## Deploy command (Pi: rockscot@192.168.0.1)
```bash
FILE_ID="PASTE_DRIVE_ID"
cd ~/rockscot-deploy
curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o /tmp/v6.zip
CONFIRM=$(grep -o 'confirm=[^&"]*' /tmp/gc.txt | head -1 | cut -d= -f2)
[ -n "$CONFIRM" ] && curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o /tmp/v6.zip
unzip -o /tmp/v6.zip -d /tmp/v6
cp /tmp/v6/js/header.js  ~/rock-scot-website/js/header.js
cp /tmp/v6/css/style.css ~/rock-scot-website/css/style.css
cp /tmp/v6/index.html    ~/rock-scot-website/index.html
cp /tmp/v6/wire.html     ~/rock-scot-website/wire.html
cp /tmp/v6/advertise.html ~/rock-scot-website/advertise.html
cp /tmp/v6/coverage.html ~/rock-scot-website/coverage.html
chmod -R o+rX ~/rock-scot-website
cp -r /tmp/v6/. .
git add -A && git commit -m "v6: wire list layout, modals, responsive breakpoints" && git push origin main
rm -rf /tmp/v6 /tmp/v6.zip /tmp/gc.txt
echo "Done"
```

## Outstanding
- [ ] Seed more stories into `wire_news` Supabase table to test pagination
- [ ] Confirm advertise Edge Function `book_campaign` is deployed
- [ ] Remove dead JS files from repo: main.js, persistent-player.js, analytics.js, cookie-consent.js
