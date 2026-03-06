# AppForge Deployment to Vercel

## Quick Deploy (GitHub Actions)

The easiest way - just push to GitHub!

1. **Connect Vercel to GitHub:**
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "Add New" → "Project"
   - Find "appforge" or "fernandogarzaaa"

2. **Import settings:**
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   Environment Variables:
     VITE_BASE44_API_KEY = (from your .env.local)
     VITE_BASE44_APP_ID = 699493e5ed3fd6b61dc0b599
   ```

3. **Deploy!**

---

## Manual Deploy (Vercel CLI)

```bash
# Install Vercel globally
npm i -g vercel

# Login
vercel login

# Deploy
cd appforge
vercel --prod
```

---

## Current Status

✅ Frontend build: Ready
✅ Vercel config: Ready  
✅ GitHub workflow: Ready

The only thing needed is connecting your Vercel account to the GitHub repo!
