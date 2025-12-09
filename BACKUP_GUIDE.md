# Database Backup Guide

This guide explains how to backup your Supabase database before migrating to a new account.

## ⚠️ Important Notes

- **Always backup before migration**: This ensures you don't lose any data
- **Keep backups secure**: Database backups contain sensitive information
- **Test restore process**: Verify backups work before deleting original data
- **Multiple backup methods**: Use multiple methods for redundancy

---

## Method 1: Automated Script Backup (Recommended)

This method uses Prisma to export all data from your database into JSON files.

### Step 1: Run the Backup Script

```bash
pnpm backup-db
```

This will:
- Create a timestamped backup folder in `backups/backup-YYYY-MM-DDTHH-MM-SS/`
- Export all tables as JSON files
- Create a backup summary file

### Step 2: Verify Backup

Check the backup directory:
```bash
ls backups/backup-*/
```

You should see JSON files for each table:
- `Employee.json`
- `Customer.json`
- `Company.json`
- `Office.json`
- `Plant.json`
- `ContactPerson.json`
- `Location.json`
- `Contact.json`
- `Enquiry.json`
- `Quotation.json`
- `QuotationItem.json`
- `Communication.json`
- `Document.json`
- `backup-summary.json`

### Step 3: Store Backup Securely

- Copy the backup folder to a secure location (external drive, cloud storage)
- Keep multiple copies in different locations
- Verify file integrity before deleting original data

---

## Method 2: Supabase Dashboard Backup

Supabase provides built-in backup functionality through their dashboard.

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Select your project

### Step 2: Create Database Backup

1. Navigate to **Settings** → **Database**
2. Scroll down to **Database Backups** section
3. Click **Create Backup** or **Download Backup**
4. Choose backup format:
   - **SQL Dump** (recommended for full database restore)
   - **CSV Export** (for individual tables)

### Step 3: Download Backup

- For SQL Dump: Click **Download** to get a `.sql` file
- For CSV: Select tables and download individually

### Step 4: Store Backup

- Save the backup file(s) to a secure location
- Verify the file size matches expected database size
- Keep multiple copies

---

## Method 3: pg_dump (Advanced)

If you have PostgreSQL tools installed, you can use `pg_dump` directly.

### Prerequisites

- PostgreSQL client tools installed
- Database connection string from Supabase

### Step 1: Get Connection String

From Supabase Dashboard:
1. Go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the connection string (use **URI** format)

### Step 2: Run pg_dump

```bash
pg_dump "your-connection-string" > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Step 3: Compress Backup (Optional)

```bash
gzip backup-*.sql
```

---

## Restoring Data to New Supabase Account

### Option 1: Using Restore Script

1. **Set up new Supabase project**:
   - Create new project in Supabase
   - Get new connection string
   - Update `.env` file with new `DATABASE_URL` and `DIRECT_URL`

2. **Run Prisma migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Restore data**:
   ```bash
   pnpm restore-db
   ```
   Or specify a backup directory:
   ```bash
   pnpm restore-db backups/backup-2024-01-15T10-30-00
   ```

### Option 2: Using Supabase Dashboard

1. **Create new project** in Supabase dashboard
2. **Run migrations** in new project
3. **Import SQL backup**:
   - Go to **SQL Editor** in new project
   - Click **New Query**
   - Paste SQL backup content
   - Click **Run**

### Option 3: Using pg_restore

```bash
psql "new-connection-string" < backup-file.sql
```

---

## Backup Checklist

Before migrating to new Supabase account:

- [ ] Run automated backup script (`pnpm backup-db`)
- [ ] Create backup via Supabase Dashboard
- [ ] Verify all backup files are present
- [ ] Test restore process on a test database
- [ ] Store backups in multiple secure locations
- [ ] Document backup locations and dates
- [ ] Verify backup file sizes are reasonable
- [ ] Check backup summary file for table counts

---

## Troubleshooting

### Backup Script Fails

**Error**: Connection timeout
- **Solution**: Check `DATABASE_URL` in `.env` file
- **Solution**: Verify Supabase project is active

**Error**: Permission denied
- **Solution**: Check file system permissions
- **Solution**: Ensure `backups/` directory is writable

### Restore Script Fails

**Error**: Foreign key constraint violation
- **Solution**: Tables are restored in dependency order automatically
- **Solution**: If issues persist, restore tables manually in correct order

**Error**: Duplicate key violation
- **Solution**: Script uses `upsert` to handle duplicates
- **Solution**: Clear target database before restore if needed

---

## Backup File Structure

```
backups/
└── backup-2024-01-15T10-30-00/
    ├── Employee.json
    ├── Customer.json
    ├── Company.json
    ├── Office.json
    ├── Plant.json
    ├── ContactPerson.json
    ├── Location.json
    ├── Contact.json
    ├── Enquiry.json
    ├── Quotation.json
    ├── QuotationItem.json
    ├── Communication.json
    ├── Document.json
    └── backup-summary.json
```

---

## Security Best Practices

1. **Encrypt backups**: Use encryption for sensitive data backups
2. **Secure storage**: Store backups in encrypted cloud storage
3. **Access control**: Limit who can access backup files
4. **Regular backups**: Schedule regular backups before major changes
5. **Test restores**: Regularly test restore process to ensure backups work
6. **Delete old backups**: Securely delete old backups when no longer needed

---

## Support

If you encounter issues:
1. Check backup logs for error messages
2. Verify database connection strings
3. Ensure all environment variables are set correctly
4. Check Supabase project status and quotas

---

**Last Updated**: 2024
**Backup Script Version**: 1.0

