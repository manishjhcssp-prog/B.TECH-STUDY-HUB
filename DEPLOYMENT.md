# Publishing & Deploying B.Tech Study Hub

This repository contains a full-stack web application (React + Node.js/Express + SQLite + Study Materials) pre-configured for **1-click cloud deployment**.

---

## Option 1: Deploy on Render (Recommended — 100% Free)

Render provides free hosting for web services with automatic GitHub deployment.

### Steps:
1. Go to **[https://dashboard.render.com/](https://dashboard.render.com/)** and sign in with your GitHub account (`manishjhcssp-prog`).
2. Click **New +** → Select **Web Service** (or **Blueprint**).
3. Connect your repository: **`manishjhcssp-prog/B.TECH-STUDY-HUB`**.
4. Render will automatically read the provided `render.yaml` configuration!
   - **Name**: `btech-study-hub`
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Create Web Service** (or **Apply**).
6. In ~2 minutes, your website will be live at a public HTTPS URL like:
   `https://btech-study-hub.onrender.com`

---

## Option 2: Deploy on Railway

1. Go to **[https://railway.app/](https://railway.app/)** and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `manishjhcssp-prog/B.TECH-STUDY-HUB`.
4. Railway will automatically detect the `Dockerfile` or `package.json` and deploy it.
5. In your project settings, click **Generate Domain** to get a public URL like:
   `https://btech-study-hub.up.railway.app`

---

## Option 3: Instant Live URL via Cloudflare Tunnel / LocalTunnel

If you want an instant live public link right now directly from your running system to test on your mobile phone or share with classmates:

```powershell
npx localtunnel --port 5000
```
This gives you an instant public HTTPS link (e.g., `https://funny-cats-sing.loca.lt`) accessible from anywhere in the world!
