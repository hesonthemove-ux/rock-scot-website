# Rock.Scot Website Documentation

## Overview
Rock.Scot is a performance-focused, mobile-first rock radio website. It utilizes a static frontend with dynamic data injection via server-side PHP proxies.

## Infrastructure & Technology
- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Backend:** PHP 8.x proxies used to communicate with Supabase.
- **Database:** Supabase (PostgreSQL).
- **Hosting:** Currently served on Raspberry Pi; designed to be portable to any standard web host supporting PHP.

## Architecture Highlights
### 1. Security & Proxy Pattern
To protect Supabase keys, the frontend does not connect directly to the database. All API requests are routed through:
- `djs-proxy.php`: Fetches presenter data.
- `rates-proxy.php`: Fetches site settings/advertising rates.



### 2. Audio Player Management
The radio player implements a buffer-clearing mechanism to prevent the stream from staying active in the background.
- **Method:** `player.src = "";` followed by `player.load();` ensures the stream connection is fully severed when "Stop" is clicked.

### 3. Responsive Layout
- **Design System:** Mobile-first, utilizing CSS Grid and Media Queries.
- **Asset Handling:** Emoji-based icons have been replaced with **Inline SVG art** for high-fidelity scaling across all device resolutions.

## Debugging
If data fails to load (prices or DJ roster):
1. Open the browser **F12 Developer Tools**.
2. Check the **Network** tab for the status of `djs-proxy.php` or `rates-proxy.php`.
3. Check the **Console** tab for `updatePrices()` or `loadDJs()` error logs.

## Deployment Notes
- All changes are tracked in the `main` branch.
- Ensure the web server has permissions for the `.php` proxy files.
