# 🚀 Quick Start Guide - CRM Portal

## Get Started in 5 Minutes

### 1. Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ pnpm package manager installed
- ✅ PostgreSQL database access
- ✅ Supabase account

### 2. Clone & Install
```bash
git clone <repository-url>
cd enquiry
pnpm install
```

### 3. Environment Setup
Create `.env.local`:
```env
DATABASE_URL="your-postgresql-connection-string"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development
```bash
pnpm dev
```
Visit: `http://localhost:3000`

---

## 🎯 First Steps After Setup

### 1. Create Your First Customer
1. Go to **Customers** → **New Customer**
2. Fill in customer name and office details
3. Click **Create Customer**

### 2. Add a Contact Person
1. In customer details, click **Add Contact**
2. Fill in contact information
3. Save the contact

### 3. Create an Enquiry
1. Go to **Enquiries** → **New Enquiry**
2. Select your customer and contact
3. Add enquiry description and details
4. Assign to a marketing person

### 4. Generate a Quotation
1. Go to **Quotations** → **New Quotation**
2. Select the enquiry
3. Add line items with pricing
4. Review and create quotation

### 5. Export PDF
1. Open the quotation details
2. Click **Export PDF**
3. Download professional quotation

---

## 🔑 Key Features Overview

| Feature | Location | Purpose |
|---------|----------|---------|
| **Dashboard** | `/dashboard` | Overview of business metrics |
| **Customers** | `/customers` | Manage customer profiles |
| **Enquiries** | `/enquiries` | Track customer requests |
| **Quotations** | `/quotations` | Create and manage quotes |
| **Communications** | `/communications` | Record customer interactions |
| **Tasks** | `/tasks` | Manage follow-ups and meetings |

---

## 🆘 Need Help?

- 📖 **Full Documentation**: See `PROJECT_DOCUMENTATION.md`
- 🐛 **Issues**: Check the troubleshooting section
- 💬 **Support**: Contact the development team

---

*Happy CRM-ing! 🎉*

