# ROCK.SCOT — Deploy to Raspberry Pi or GitHub

## Quick reference — terminal commands

**Important:** On the **Pi** the repo path is `~/rock-scot-website`. On the **Mac** it is `~/Rock\ Scot/rock-scot-website` (with a space). Never use the Pi path on the Mac or you'll get "No such file or directory".

**Push latest changes from Mac to GitHub:**
```bash
cd ~/Rock\ Scot/rock-scot-website
git add .
git commit -m "Update site"
git push origin main
```

**On the Pi — pull and run site (port 8081):**
```bash
ssh rockscot@192.168.0.200
cd ~/rock-scot-website
git pull
python3 -m http.server 8081
```
Then open **http://192.168.0.200:8081**

**If port 8081 is already in use, kill it then start:**
```bash
sudo kill $(sudo lsof -t -i :8081)
cd ~/rock-scot-website
python3 -m http.server 8081
```

---

## THE WIRE (news ticker) and redacted emails

**If the ticker stays on "Connecting to Scottish rock news…":**
- Ensure `js/supabase-config.js` has your real Supabase anon key (same project where you ran the SQL).
- In Supabase, run the **30-day retention** change: SQL Editor → run `supabase/migrations/009_wire_retention_30_days.sql`.
- Deploy the **fetch_wire_rss** Edge Function and call it on a schedule (e.g. every 30 min via [cron-job.org](https://cron-job.org) or Supabase Dashboard → Edge Functions → fetch_wire_rss → Invoke). That fills `wire_news` from RSS feeds so the ticker has content.

**If footer emails still show "(email protected)":**
- Do a **hard refresh**: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac), or clear the browser cache for the site. The site now uses plain `mailto:` links (no Cloudflare).

---

## Where is this project on your Mac?

- **In Cursor:** Your workspace is **"Rock Scot"**; the website files are in the folder **rock-scot-website** inside it.
- **In Finder:** Press **Cmd + Shift + H** (Go → Home), then open the folder **Rock Scot**, then **rock-scot-website**. Or use **Finder → Go → Go to Folder…** and paste: `~/Rock Scot/rock-scot-website`

---

## Option A: Deploy via GitHub (recommended)

### On your Mac

1. **Open Terminal**  
   - Spotlight: **Cmd + Space**, type **Terminal**, press Enter.  
   - Or: **Applications → Utilities → Terminal**.

2. **Go to the website folder and prepare Git:**
   ```bash
   cd ~/Rock\ Scot/rock-scot-website
   git init
   git add .
   git commit -m "ROCK.SCOT website and booking"
   ```

3. **Create a new repo on GitHub**  
   - Go to [github.com](https://github.com) → **+** → **New repository**.  
   - Name it e.g. **rock-scot-website**.  
   - Leave “Add a README” **unchecked**.  
   - Click **Create repository**.

4. **Push from your Mac** (replace `YOUR_USERNAME` with your GitHub username):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/rock-scot-website.git
   git branch -M main
   git push -u origin main
   ```
   - When asked, sign in with your GitHub username and a **Personal Access Token** (not your GitHub password).  
   - Create a token: GitHub → **Settings → Developer settings → Personal access tokens → Generate new token**; tick **repo**.

### On your Raspberry Pi (192.168.0.200)

1. **SSH into the Pi:**
   ```bash
   ssh rockscot@192.168.0.200
   ```

2. **Clone and run the site** (replace `YOUR_USERNAME` with your GitHub username):
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/rock-scot-website.git
   cd rock-scot-website
   python3 -m http.server 8080
   ```

3. **Open in a browser:**  
   **http://192.168.0.200:8080**

**To update the site later:** on the Pi run `cd ~/rock-scot-website && git pull`, then restart the server (Ctrl+C, then `python3 -m http.server 8080` again).

---

## Option B: Upload directly to the Pi (no GitHub)

### On your Mac

1. **Open Terminal** (Cmd + Space → type **Terminal** → Enter).

2. **Upload the site** (you’ll be asked for the Pi password for `rockscot`):
   ```bash
   cd ~/Rock\ Scot/rock-scot-website
   scp -r . rockscot@192.168.0.200:~/rock-scot-website/
   ```

### On your Raspberry Pi

1. **SSH in:**
   ```bash
   ssh rockscot@192.168.0.200
   ```

2. **Start the server:**
   ```bash
   cd ~/rock-scot-website
   python3 -m http.server 8080
   ```

3. **Open in a browser:**  
   **http://192.168.0.200:8080**

---

## Summary

| Step            | Option A (GitHub)              | Option B (Direct)                    |
|----------------|---------------------------------|--------------------------------------|
| On Mac         | `cd ~/Rock\ Scot/rock-scot-website`, then `git init`, `git add .`, `git commit`, add remote, `git push` | `cd ~/Rock\ Scot/rock-scot-website`, then `scp -r . rockscot@192.168.0.200:~/rock-scot-website/` |
| On Pi          | `git clone ...`, then `cd rock-scot-website` and `python3 -m http.server 8080` | `cd ~/rock-scot-website` and `python3 -m http.server 8080` |
| Update later   | On Pi: `git pull`               | On Mac: run `scp` again               |
