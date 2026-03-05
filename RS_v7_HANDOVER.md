# ROCK.SCOT v7 — Handover

## What's Fixed

| Issue | Fix |
|-------|-----|
| Nav/header missing on all pages | JS syntax error in header.js — unescaped quotes in `onkeydown` inline handler. Replaced with delegated event listener using `data-hwi` attribute. No more inline JS string escaping. |
| Wire page shows raw modal content | wire.html footer used `.footer-content`/`.footer-section` CSS classes that don't exist in style.css. Replaced with `.footer-grid`/`.footer-col`/`.footer-brand` which are defined. The modal content was visible because CSS failed to load. |
| Stream not streaming | `togglePlay()` was appending a hidden `0×0` iframe — browsers block autoplay on invisible iframes. Now creates a visible 52px iframe inside `#rs-pb-iframe-wrap` in the player bar. |
| Wire list shows clamped summary | `buildRow()` now shows full first paragraph via `getFirstParagraph()`. Paragraphs > 220 chars are truncated at last sentence boundary. |
| "Read Full Story" opens new tab | Source link now opens a named popup window (`rockscot_source`, 1100×700). User stays on ROCK.SCOT. |
| Index wordy legal/AEO section | AEO entity section now collapsed by default with toggle button. Click arrow to expand. |
| Coverage page no demographics | Full audience demographics section added: gender split, age bars, household profile, lifestyle interests, purchase behaviour, listening behaviour. |
| No responsive layout on mobile | Full `@media` breakpoint system added to style.css (1024px, 768px, 600px, 480px). |

## Deploy (Pi: rockscot@192.168.0.1)
```bash
FILE_ID="PASTE_ID_HERE"
cd ~/rockscot-deploy
curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o /tmp/v7.zip
CONFIRM=$(grep -o 'confirm=[^&"]*' /tmp/gc.txt | head -1 | cut -d= -f2)
[ -n "$CONFIRM" ] && curl -Lb /tmp/gc.txt "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o /tmp/v7.zip
unzip -o /tmp/v7.zip -d /tmp/v7
cp /tmp/v7/js/header.js   ~/rock-scot-website/js/header.js
cp /tmp/v7/css/style.css  ~/rock-scot-website/css/style.css
cp /tmp/v7/index.html     ~/rock-scot-website/index.html
cp /tmp/v7/wire.html      ~/rock-scot-website/wire.html
cp /tmp/v7/advertise.html ~/rock-scot-website/advertise.html
cp /tmp/v7/coverage.html  ~/rock-scot-website/coverage.html
chmod -R o+rX ~/rock-scot-website
cp -r /tmp/v7/. . && git add -A && git commit -m "v7: nav fix, stream fix, wire para, demographics, collapsible AEO" && git push origin main
rm -rf /tmp/v7 /tmp/v7.zip /tmp/gc.txt && echo "✅ Done"
```
