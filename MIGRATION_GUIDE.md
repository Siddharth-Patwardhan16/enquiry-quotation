# Database Migration Guide - Setting Up New Supabase Account

This guide will help you set up your new Supabase database and migrate your schema.

## Step 1: Verify Your Connection Strings

### Get Connection Strings from New Supabase Project

1. **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your new project**
3. **Navigate to Settings → Database**
4. **Find "Connection string" section**

### You Need Two Connection Strings:

1. **Connection Pooling (for DATABASE_URL)**:
   - Use the **"URI"** format
   - Should look like: `postgresql://postgres:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Port 6543** (pooler port)

2. **Direct Connection (for DIRECT_URL)**:
   - Use the **"URI"** format  
   - Should look like: `postgresql://postgres:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - **Port 5432** (direct port)

### Update Your .env Files

Make sure both `.env` and `.env.local` have:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

**Important Notes**:
- Replace `[PASSWORD]` with your actual database password
- Replace `[region]` with your actual region (e.g., `ap-southeast-2`)
- The password is shown when you first create the project, or you can reset it in Settings → Database

---

## Step 2: Verify Database Connection

Test the connection:

```bash
npx prisma db pull
```

If this works, you're connected! If not, check:
- Password is correct
- Connection strings are correct
- Database is active (not paused)
- Network/firewall allows connection

---

## Step 3: Create Tables in New Database

You have **two options**:

### Option A: Using Prisma (Recommended)

This will create all tables based on your Prisma schema:

```bash
# Push schema directly (creates tables from schema.prisma)
npx prisma db push
```

Or apply migrations:

```bash
# Apply all migrations (creates tables from migration history)
npx prisma migrate deploy
```

### Option B: Using Supabase SQL Editor

If Prisma connection doesn't work, use Supabase Dashboard:

1. **Go to SQL Editor** in Supabase Dashboard
2. **Click "New Query"**
3. **Run this command** to see your current migrations:

```sql
-- Check if _prisma_migrations table exists
SELECT * FROM _prisma_migrations;
```

4. **Or manually create tables** by running the SQL from your migration files:
   - Go to `prisma/migrations/` folder
   - Open each migration's `migration.sql` file
   - Copy and paste into SQL Editor
   - Run in order (oldest first)

---

## Step 4: Verify Tables Are Created

### Check in Supabase Dashboard:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see all your tables:
   - Employee
   - Customer
   - Company
   - Office
   - Plant
   - ContactPerson
   - Location
   - Contact
   - Enquiry
   - Quotation
   - QuotationItem
   - Communication
   - Document

### Or check via Prisma:

```bash
npx prisma studio
```

This opens a visual database browser where you can see all tables.

---

## Step 5: Generate Prisma Client

After tables are created, generate the Prisma client:

```bash
npx prisma generate
```

---

## Step 6: Restore Your Data

Once tables are created, restore your data from backup:

```bash
pnpm restore-db
```

This will restore all your data from the backup we created earlier.

---

## Troubleshooting

### Error: "Can't reach database server"

**Possible causes**:
1. **Database is paused**: Go to Supabase Dashboard → Settings → General → Resume project
2. **Wrong connection string**: Double-check the connection strings
3. **Wrong password**: Reset password in Settings → Database
4. **Network issues**: Check firewall/VPN settings
5. **Region mismatch**: Ensure connection string matches your project region

### Error: "Connection timeout"

**Solutions**:
- Use the **Direct Connection** (port 5432) for migrations
- Check if your IP needs to be whitelisted (Settings → Database → Connection Pooling)
- Try using **Connection Pooling** (port 6543) for application use

### Error: "Table already exists"

**Solution**:
- Tables might already exist from a previous attempt
- Use `npx prisma migrate reset` to start fresh (⚠️ **WARNING**: This deletes all data!)
- Or manually drop tables in Supabase SQL Editor

### Tables show 0 count after creation

**This is normal!** Tables are created empty. You need to:
1. Restore data from backup: `pnpm restore-db`
2. Or start fresh if this is a new setup

---

## Quick Checklist

- [ ] New Supabase project created
- [ ] Connection strings copied from Supabase Dashboard
- [ ] `.env` and `.env.local` updated with new connection strings
- [ ] Database connection verified (`npx prisma db pull`)
- [ ] Tables created (`npx prisma db push` or `npx prisma migrate deploy`)
- [ ] Tables verified in Supabase Dashboard
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Data restored from backup (`pnpm restore-db`)
- [ ] Application tested with new database

---

## Next Steps After Migration

1. **Update Supabase URL and Keys**:
   - Update `SUPABASE_URL` in `.env`
   - Update `SUPABASE_ANON_KEY` in `.env`
   - Update `src/lib/supabase-config.ts` if hardcoded

2. **Test Application**:
   - Run `pnpm dev`
   - Test all major features
   - Verify data is accessible

3. **Update Environment Variables**:
   - Update production environment variables
   - Update any CI/CD configurations

---

**Need Help?** Check the Supabase documentation or verify your connection strings match exactly what's shown in the dashboard.

