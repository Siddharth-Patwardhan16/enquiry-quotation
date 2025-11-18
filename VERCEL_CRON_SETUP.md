# Vercel Cron Job Setup for Supabase Keep-Alive

This project includes a Vercel Cron Job that pings your Supabase database every 10 minutes to prevent it from going into a paused state.

## ✅ What's Already Set Up

1. **Cron API Route**: `src/app/api/cron/route.ts`
   - Handles GET and POST requests
   - Secured with CRON_SECRET authentication
   - Performs lightweight database query to keep connection alive

2. **Vercel Configuration**: `vercel.json`
   - Scheduled to run every 10 minutes (`*/10 * * * *`)
   - Points to `/api/cron` endpoint

## 🔐 Required: Set Up CRON_SECRET

You need to add the `CRON_SECRET` environment variable in Vercel:

### Steps:

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add a new environment variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secure string (e.g., use `openssl rand -hex 32` or any password generator)
   - **Environment**: Select all environments (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your project for the changes to take effect

### Generate a Secure Secret (Optional):

```bash
# On Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 How It Works

1. **Vercel Cron** automatically calls `https://yourdomain.com/api/cron` every 10 minutes
2. Vercel adds the `Authorization: Bearer <CRON_SECRET>` header automatically
3. The API route verifies the secret
4. Performs a lightweight database query (selects one Employee record)
5. Returns success response

This keeps your Supabase database active and prevents it from pausing.

## 🧪 Testing Locally

You can test the endpoint locally (for development only):

```bash
# Test with curl
curl -H "Authorization: Bearer your-cron-secret-here" http://localhost:3000/api/cron
```

**Note**: In production, only Vercel Cron Jobs can call this endpoint with the correct secret.

## 📊 Monitoring

After deployment, you can monitor the cron job in:
- **Vercel Dashboard → Your Project → Cron Jobs**
- Check the logs to see successful pings

## ⚙️ Customization

### Change Schedule

Edit `vercel.json` to change the frequency:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    }
  ]
}
```

Common schedules:
- `*/5 * * * *` - Every 5 minutes
- `*/10 * * * *` - Every 10 minutes (current)
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour

### Change Database Query

Edit `src/app/api/cron/route.ts` to query a different table or add more operations.

## 🔒 Security Notes

- The `CRON_SECRET` should be a strong, random string
- Never commit the secret to version control
- Only Vercel Cron Jobs should have access to this endpoint
- The endpoint returns 401 Unauthorized if the secret doesn't match

## ✅ Verification

After deployment, verify it's working:

1. Check Vercel dashboard for cron job execution logs
2. The endpoint should return:
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

**Status**: ✅ Ready to deploy! Just add the `CRON_SECRET` environment variable in Vercel.

