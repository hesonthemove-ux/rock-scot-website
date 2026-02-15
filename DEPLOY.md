# ROCK.SCOT — Deploy to Raspberry Pi or GitHub

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
