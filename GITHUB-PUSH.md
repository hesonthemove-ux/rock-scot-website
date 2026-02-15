# Push to GitHub — hesonthemove-ux

## 1. Clear any saved (wrong) password

In **Terminal** run:

```bash
git credential-osxkeychain erase
```

Then type this **exactly** (replace YOUR_TOKEN with your real token), press Enter, then press **Ctrl+D** once:

```
host=github.com
protocol=https
username=hesonthemove-ux
password=YOUR_TOKEN
```

(You won’t see what you type. Paste the token, then Ctrl+D.)

---

## 2. Add remote and push

From the website folder:

```bash
cd ~/Rock\ Scot/rock-scot-website
git remote add origin https://github.com/hesonthemove-ux/rock-scot-website.git
git branch -M main
git push -u origin main
```

When it asks for **Password**, paste your **Personal Access Token** (not your GitHub password).  
Nothing will appear as you paste — that’s normal. Press Enter.

---

## 3. If it still says “Authentication failed”

Use the token in the URL **once** (then we’ll remove it):

```bash
git remote set-url origin https://hesonthemove-ux:YOUR_TOKEN_HERE@github.com/hesonthemove-ux/rock-scot-website.git
git push -u origin main
```

After a successful push, remove the token from the URL:

```bash
git remote set-url origin https://github.com/hesonthemove-ux/rock-scot-website.git
```

---

## 4. Check your token

- GitHub → **Settings** → **Developer settings** → **Personal access tokens**.
- The token must have **repo** (full control) checked.
- If you’re on “Fine-grained” tokens, the repo **rock-scot-website** must have **Read and write** under “Repository permissions”.
- Copy the token again (no spaces at start/end) and try step 2 or 3.
