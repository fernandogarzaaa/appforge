
# 🚀 Quantum Deployment Guide

> **Objective**: Publish the "Quantum Commerce" node and "Payment Portal" to the live internet.

You have two components to host:
1. **Frontend**: The Payment Portal & Legal Docs (`public/*.html`).
2. **Backend**: The Transaction Listener (`examples/solana_commerce_prod.js`).

---

## 🅰️ Option A: The "Serverless" Route (Easiest)

### 1. Frontend (Vercel)
*Best for: `payment_portal.html`, `privacy.html`, `terms.html`*

1. **Push to GitHub**: Ensure your latest code is on GitHub.
2. **Go to [Vercel.com](https://vercel.com)** and Sign Up.
3. **Import Project**: Select your `appforge-main` repository.
4. **Settings**:
    * **Framework Preset**: Other / Static
    * **Root Directory**: `public` (This is important! It tells Vercel to serve the HTML files).
5. **Deploy**: Click "Deploy".
    * **Result**: You get a URL like `https://quantum-engine.vercel.app`.
    * **Your Portal**: `https://quantum-engine.vercel.app/payment_portal.html`

### 2. Backend (Railway / Render)
*Best for: `server.js` (API & Emailer)*

1. **Go to [Railway.app](https://railway.app)**.
2. **New Service**: connect your GitHub repo.
3. **Start Command**:
    * Railway should auto-detect `npm run start:server`.
    * If not, use: `node server.js`
4. **Environment Variables** (Required):
    * `EMAIL_USER`: Your Gmail address.
    * `EMAIL_PASS`: Your Gmail App Password.
    * `PORT`: `3000` (or let Railway assign it).
5. **Get URL**: Railway will give you a domain (e.g., `https://backend.railway.app`).
6. **Update Frontend**:
    * Open `public/payment_portal.html`.
    * Replace `http://localhost:3000` with your new Railway URL.
    * Push changes to GitHub to update Vercel.

---

## 🅱️ Option B: The "Dedicated" Route (Pro)

*Best for: High-Frequency Traders who want total control.*

1. **Rent a VPS**: DigitalOcean Droplet or AWS EC2 (Ubuntu).
2. **SSH into Server**: `ssh root@your-ip`
3. **Clone & Install**:
    ```bash
    git clone https://github.com/fernandogarzaaa/appforge.git
    cd appforge
    npm install
    npm install pm2 -g
    ```
4. **Start Backend**:
    ```bash
    pm2 start examples/solana_commerce_prod.js --name "quantum-commerce"
    ```
5. **Serve Frontend (Nginx)**:
    * Install Nginx (`apt install nginx`).
    * Point config to `/root/appforge/public`.

---

## ✅ Checklist for Launch
1. [ ] **Wallet**: Is `TREASURY_WALLET` correct in `server.js` AND `payment_portal.html`?
2. [ ] **Email**: Did you set `EMAIL_USER` / `EMAIL_PASS` in Railway?
3. [ ] **Connection**: Did you update the `API_URL` in `payment_portal.html`?
4. [ ] **Testing**: Click "Pay", Sign (Phantom), and Check Email for License.

*The Swarm is ready to ascend to the Cloud.* ☁️
