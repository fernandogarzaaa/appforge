# 🌍 Simple Guide: Putting Your Website Online

**Vercel** is just a tool that takes your code from GitHub and puts it on a website. You don't need to know code to use it.

## Step 1: Sign Up
1. Go to **[vercel.com](https://vercel.com)**.
2. Click **"Sign Up"**.
3. Choose **Determine with GitHub**. (This connects Vercel to your code).

## Step 2: Import Your Project
1. Once logged in, you will see a button **"Add New..."** -> **"Project"**.
2. You will see a list of your GitHub repositories.
3. Find **`appforge`** (or `appforge-main`) and click **"Import"**.

## Step 3: validte & Deploy
1. Vercel will show a configuration screen.
2. **Framework Preset**: Leave it as is (or select "Other").
3. **Root Directory**: Click "Edit" and select **`public`**. 
   * *Why?* Because your website file (`payment_portal.html`) is inside the `public` folder.
4. Click **"Deploy"**.

## Step 4: The Result
* Wait about 1 minute.
* You will see some confetti 🎉.
* Vercel will give you a **Domain** (e.g., `appforge.vercel.app`).
* Click that link, add `/payment_portal.html` to the end.
* **Example**: `https://appforge.vercel.app/payment_portal.html`

That's it! Your site is live.
