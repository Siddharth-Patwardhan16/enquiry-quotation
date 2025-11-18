# How to Add CRON_SECRET to Vercel

## 🔐 Step 1: Generate a Secret (Already Done!)

A secure random secret has been generated for you:

```
acb84ed9f3c0fbce20be6b8a9981b164c6b20e11e1c0e93efbc11d97b1b3b4cb
```

**Or generate a new one anytime:**
```bash
node scripts/generate-cron-secret.js
```

---

## 📝 Step 2: Add to Vercel Dashboard

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign in to your account

2. **Select Your Project**
   - Click on your project name from the dashboard

3. **Navigate to Settings**
   - Click **"Settings"** in the top navigation bar
   - Or click **"Settings"** from the left sidebar

4. **Open Environment Variables**
   - In the left sidebar, click **"Environment Variables"**
   - You'll see a list of existing environment variables (if any)

5. **Add New Variable**
   - Click the **"Add New"** button (usually at the top right)
   - A form will appear with three fields:
     - **Key**: Type `CRON_SECRET` (exactly as shown, case-sensitive)
     - **Value**: Paste the secret: `acb84ed9f3c0fbce20be6b8a9981b164c6b20e11e1c0e93efbc11d97b1b3b4cb`
     - **Environments**: Check all three boxes:
       - ☑ Production
       - ☑ Preview  
       - ☑ Development

6. **Save**
   - Click **"Save"** button
   - The variable will appear in your list

7. **Redeploy**
   - Go to **"Deployments"** tab
   - Click the **three dots (⋯)** on your latest deployment
   - Click **"Redeploy"**
   - Or simply push a new commit to trigger automatic deployment

---

### Option B: Via Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add the environment variable
vercel env add CRON_SECRET

# When prompted, paste the secret value
# Select all environments (Production, Preview, Development)

# Pull the latest environment variables (optional)
vercel env pull .env.local
```

---

## ✅ Step 3: Verify It's Working

After redeploying, you can verify the cron job is working:

1. **Check Vercel Dashboard**
   - Go to your project → **"Cron Jobs"** tab (if available)
   - Or check **"Deployments"** → Click on a deployment → **"Functions"** tab
   - Look for `/api/cron` in the list

2. **Check Logs**
   - Go to **"Deployments"** → Click on latest deployment
   - Click **"Functions"** tab
   - Find `/api/cron` and check its logs
   - You should see successful requests every 10 minutes

3. **Test Manually (Optional)**
   ```bash
   # Replace YOUR_SECRET with your actual CRON_SECRET
   curl -H "Authorization: Bearer YOUR_SECRET" https://yourdomain.com/api/cron
   ```
   
   Expected response:
   ```json
   {
     "ok": true,
     "message": "Database keep-alive ping successful",
     "timestamp": "2025-01-XX...",
     "database": "connected",
     "recordFound": true
   }
   ```

---

## 🔒 Security Notes

- ✅ **Never commit** the CRON_SECRET to your git repository
- ✅ The secret is stored securely in Vercel's environment variables
- ✅ Only Vercel Cron Jobs can call the endpoint with the correct secret
- ✅ If someone tries to call it without the secret, they'll get a 401 Unauthorized error

---

## 🎯 Quick Reference

**Your CRON_SECRET:**
```
acb84ed9f3c0fbce20be6b8a9981b164c6b20e11e1c0e93efbc11d97b1b3b4cb
```

**Vercel Dashboard Path:**
```
Dashboard → Your Project → Settings → Environment Variables → Add New
```

**What to Enter:**
- **Key**: `CRON_SECRET`
- **Value**: `acb84ed9f3c0fbce20be6b8a9981b164c6b20e11e1c0e93efbc11d97b1b3b4cb`
- **Environments**: All (Production, Preview, Development)

---

## 🆘 Troubleshooting

### Secret Not Working?
- Make sure you **redeployed** after adding the variable
- Check that the key is exactly `CRON_SECRET` (case-sensitive)
- Verify all environments are selected
- Check Vercel logs for any errors

### Want to Generate a New Secret?
```bash
node scripts/generate-cron-secret.js
```

Then update the value in Vercel Dashboard.

---

**That's it!** Once you add the secret and redeploy, your cron job will start running automatically every 10 minutes. 🎉

