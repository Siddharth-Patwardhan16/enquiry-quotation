# CRM Portal - Customer Enquiry & Quotation Management System

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Installation & Setup](#installation--setup)
6. [User Guide](#user-guide)
7. [API Documentation](#api-documentation)
8. [Development Guide](#development-guide)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

The CRM Portal is a comprehensive Customer Relationship Management system designed for managing customer enquiries, quotations, and communications. It provides a complete workflow from initial customer contact to quotation submission and tracking.

### Key Features

- **Customer Management**: Create and manage customer profiles with multiple office and plant locations
- **Enquiry Management**: Track customer enquiries with detailed requirements and specifications
- **Quotation System**: Generate professional quotations with line items, pricing, and terms
- **Communication Tracking**: Record and manage all customer communications
- **Dashboard Analytics**: Visual insights into business performance and trends
- **User Management**: Role-based access control with admin capabilities
- **PDF Export**: Generate professional quotation PDFs for customer delivery

---

## 🛠 Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Supabase** - Authentication and database hosting

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Package manager

---

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (tRPC)        │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React Pages   │    │ • API Routes    │    │ • Customer Data │
│ • Components    │    │ • Business Logic│    │ • Enquiries     │
│ • State Mgmt    │    │ • Validation    │    │ • Quotations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Authentication│    │   File System   │    │   External      │
│   (Supabase)    │    │   (PDF Export)  │    │   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin management
│   ├── api/               # API routes
│   ├── communications/    # Communication management
│   ├── customers/         # Customer management
│   ├── dashboard/         # Main dashboard
│   ├── enquiries/         # Enquiry management
│   ├── login/             # Authentication
│   ├── quotations/        # Quotation management
│   ├── settings/          # User settings
│   └── tasks/             # Task management
├── components/            # Reusable React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── ui/                # UI component library
├── lib/                   # Utilities and configurations
│   ├── validators/        # Zod validation schemas
│   ├── env.ts            # Environment configuration
│   └── supabase-*.ts     # Supabase configuration
├── server/               # Backend API
│   └── api/              # tRPC API routes
│       ├── routers/      # API route handlers
│       ├── context.ts    # tRPC context
│       └── root.ts       # API root configuration
├── trpc/                 # tRPC client configuration
└── types/                # TypeScript type definitions
```

---

## 🗄 Database Schema

### Core Entities

#### Customer
```sql
Customer {
  id: String (UUID, Primary Key)
  name: String (Required)
  isNew: Boolean (Default: true)
  createdAt: DateTime
  updatedAt: DateTime
  
  -- Relationships
  locations: Location[]
  enquiries: Enquiry[]
}
```

#### Location
```sql
Location {
  id: String (UUID, Primary Key)
  customerId: String (Foreign Key)
  name: String (Required)
  type: Enum (OFFICE | PLANT)
  address: String?
  city: String?
  state: String?
  country: String?
  receptionNumber: String?
  
  -- Relationships
  customer: Customer
  contacts: Contact[]
  enquiries: Enquiry[]
}
```

#### Contact
```sql
Contact {
  id: String (UUID, Primary Key)
  customerId: String (Foreign Key)
  locationId: String (Foreign Key)
  name: String (Required)
  designation: String?
  officialCellNumber: String?
  personalCellNumber: String?
  
  -- Relationships
  customer: Customer
  location: Location
}
```

#### Enquiry
```sql
Enquiry {
  id: Int (Primary Key, Auto-increment)
  customerId: String (Foreign Key)
  locationId: String (Foreign Key)
  contactId: String (Foreign Key)
  marketingPersonId: String (Foreign Key)
  description: String (Required)
  priority: Enum (LOW | MEDIUM | HIGH)
  source: String?
  expectedBudget: Decimal?
  status: Enum (OPEN | IN_PROGRESS | CLOSED)
  createdAt: DateTime
  updatedAt: DateTime
  
  -- Relationships
  customer: Customer
  location: Location
  contact: Contact
  marketingPerson: Employee
  quotations: Quotation[]
  communications: Communication[]
}
```

#### Quotation
```sql
Quotation {
  id: String (UUID, Primary Key)
  enquiryId: Int (Foreign Key)
  quotationNumber: String (Required, Unique)
  revisionNumber: Int (Default: 0)
  quotationDate: DateTime?
  validityPeriod: DateTime?
  paymentTerms: String?
  deliverySchedule: String?
  specialInstructions: String?
  currency: String (Default: 'INR')
  subtotal: Decimal
  tax: Decimal
  totalValue: Decimal
  status: Enum (DRAFT | LIVE | SUBMITTED | WON | LOST | RECEIVED)
  lostReason: String?
  purchaseOrderNumber: String?
  createdAt: DateTime
  updatedAt: DateTime
  
  -- Relationships
  enquiry: Enquiry
  items: QuotationItem[]
}
```

#### QuotationItem
```sql
QuotationItem {
  id: String (UUID, Primary Key)
  quotationId: String (Foreign Key)
  materialDescription: String (Required)
  specifications: String?
  quantity: Int (Required)
  pricePerUnit: Decimal (Required)
  total: Decimal (Calculated)
  
  -- Relationships
  quotation: Quotation
}
```

#### Communication
```sql
Communication {
  id: String (UUID, Primary Key)
  customerId: String (Foreign Key)
  contactId: String (Foreign Key)
  enquiryId: Int? (Foreign Key, Optional)
  subject: String (Required)
  generalDescription: String?
  briefDescription: String (Required)
  type: Enum (TELEPHONIC | VIRTUAL_MEETING | EMAIL | PLANT_VISIT | OFFICE_VISIT)
  nextCommunicationDate: DateTime?
  nextCommunicationMode: String?
  createdAt: DateTime
  updatedAt: DateTime
  
  -- Relationships
  customer: Customer
  contact: Contact
  enquiry: Enquiry?
}
```

#### Employee
```sql
Employee {
  id: String (UUID, Primary Key)
  userId: String? (Foreign Key)
  name: String (Required)
  email: String (Required, Unique)
  role: Enum (ADMINISTRATOR | MARKETING | SALES | SUPPORT)
  createdAt: DateTime
  updatedAt: DateTime
  
  -- Relationships
  user: User?
  enquiries: Enquiry[]
}
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- PostgreSQL database
- Supabase account (for authentication)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd enquiry
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/enquiry_db"
DIRECT_URL="postgresql://username:password@localhost:5432/enquiry_db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed with dummy data
pnpm dummy-data
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## 👥 User Guide

### Authentication

1. **Login**: Navigate to `/login` and enter your credentials
2. **Role-based Access**: Different user roles have different permissions:
   - **Administrator**: Full system access, user management
   - **Marketing**: Customer and enquiry management
   - **Sales**: Quotation management
   - **Support**: Communication tracking

### Dashboard

The dashboard provides an overview of:
- **Statistics**: Total customers, enquiries, quotations, and deals won
- **Charts**: Monthly trends, lost reasons analysis, quotation value tracking
- **Recent Activity**: Latest enquiries and quotations
- **Admin Access**: User management (for administrators)

### Customer Management

#### Creating a Customer

1. Navigate to **Customers** → **New Customer**
2. Fill in basic information:
   - Customer name (required)
   - Office details (name, address, contact info)
   - Plant details (optional)
   - Purchase order types received
   - Additional information
3. Click **Create Customer**

#### Managing Customer Locations

- Each customer can have multiple office and plant locations
- Locations can have multiple contacts
- Use the location management interface to add/edit locations

### Enquiry Management

#### Creating an Enquiry

1. Navigate to **Enquiries** → **New Enquiry**
2. Select customer, location, and contact person
3. Fill in enquiry details:
   - Description (required)
   - Priority level
   - Source
   - Expected budget
4. Assign to a marketing person
5. Click **Create Enquiry**

#### Managing Enquiries

- View all enquiries in the enquiries list
- Filter by status, priority, or customer
- Update enquiry status as it progresses
- Link communications to specific enquiries

### Quotation Management

#### Creating a Quotation

1. Navigate to **Quotations** → **New Quotation**
2. Select the related enquiry
3. Fill in quotation details:
   - Quotation number (required, must be unique)
   - Revision number
   - Dates and validity period
   - Payment terms and delivery schedule
   - Special instructions
4. Add line items:
   - Material description
   - Specifications
   - Quantity and unit price
   - Total is calculated automatically
5. Review totals (subtotal, tax, grand total)
6. Click **Create Quotation**

#### Managing Quotations

- **View**: See detailed quotation information
- **Edit**: Modify quotation details and line items
- **Delete**: Remove quotations (with confirmation)
- **Status Updates**: Change quotation status (Draft → Live → Submitted → Won/Lost)
- **PDF Export**: Generate professional PDF quotations

#### Quotation Status Workflow

```
DRAFT → LIVE → SUBMITTED → WON/LOST
                ↓
            RECEIVED (with PO)
```

### Communication Management

#### Recording Communications

1. Navigate to **Communications** → **New Communication**
2. Select customer and contact person
3. Optionally link to a specific enquiry
4. Fill in communication details:
   - Subject (required)
   - General description
   - Brief description (required)
   - Communication type (Phone, Email, Meeting, Visit)
   - Next communication date and mode
5. Click **Create Communication**

#### Managing Communications

- View all communications in chronological order
- Search and filter by customer, type, or date
- Link communications to specific enquiries
- Track follow-up actions

### Task Management

The tasks section helps manage:
- **Meeting Management**: Schedule and track customer meetings
- **Quotation Status Updates**: Monitor quotation progress
- **Follow-up Actions**: Track pending communications

---

## 🔌 API Documentation

### tRPC API Structure

The API is built using tRPC for end-to-end type safety. All API calls are automatically typed.

#### Customer API

```typescript
// Get all customers
api.customer.getAll.useQuery()

// Create customer
api.customer.create.useMutation({
  data: {
    name: string,
    isNew: boolean,
    offices: Array<{
      name: string,
      address?: string,
      city?: string,
      state?: string,
      country?: string,
      receptionNumber?: string
    }>,
    plants: Array<{...}>,
    // ... other fields
  }
})

// Update customer
api.customer.update.useMutation({
  data: {
    id: string,
    ...updateData
  }
})

// Delete customer
api.customer.delete.useMutation({
  data: { id: string }
})
```

#### Enquiry API

```typescript
// Get all enquiries
api.enquiry.getAll.useQuery()

// Create enquiry
api.enquiry.create.useMutation({
  data: {
    customerId: string,
    locationId: string,
    contactId: string,
    marketingPersonId: string,
    description: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    source?: string,
    expectedBudget?: number
  }
})
```

#### Quotation API

```typescript
// Get all quotations
api.quotation.getAll.useQuery()

// Get quotation by ID
api.quotation.getById.useQuery({ id: string })

// Create quotation
api.quotation.create.useMutation({
  data: {
    enquiryId: number,
    quotationNumber: string,
    items: Array<{
      materialDescription: string,
      specifications?: string,
      quantity: number,
      pricePerUnit: number
    }>,
    // ... other fields
  }
})

// Update quotation
api.quotation.update.useMutation({
  data: {
    id: string,
    ...updateData
  }
})

// Delete quotation
api.quotation.delete.useMutation({
  data: { id: string }
})

// Update quotation status
api.quotation.updateStatus.useMutation({
  data: {
    quotationId: string,
    status: 'DRAFT' | 'LIVE' | 'SUBMITTED' | 'WON' | 'LOST' | 'RECEIVED',
    lostReason?: string,
    purchaseOrderNumber?: string
  }
})
```

#### Communication API

```typescript
// Get all communications
api.communication.getAll.useQuery()

// Create communication
api.communication.create.useMutation({
  data: {
    customerId: string,
    contactId: string,
    enquiryId?: number,
    subject: string,
    generalDescription?: string,
    briefDescription: string,
    type: 'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT',
    nextCommunicationDate?: Date,
    nextCommunicationMode?: string
  }
})
```

#### Dashboard API

```typescript
// Get dashboard statistics
api.dashboard.getStats.useQuery()

// Get lost reasons data
api.dashboard.getLostReasons.useQuery()

// Get monthly enquiry trends
api.dashboard.getMonthlyEnquiryTrends.useQuery()

// Get recent enquiries
api.dashboard.getRecentEnquiries.useQuery()

// Get recent quotations
api.dashboard.getRecentQuotations.useQuery()

// Get quotation value vs live data
api.dashboard.getQuotationValueVsLive.useQuery()
```

---

## 👨‍💻 Development Guide

### Adding New Features

#### 1. Database Changes

1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update types and validators

#### 2. API Development

1. Create/update router in `src/server/api/routers/`
2. Add validation schemas in `src/lib/validators/`
3. Export router in `src/server/api/root.ts`

#### 3. Frontend Development

1. Create components in appropriate directories
2. Add pages in `src/app/`
3. Use tRPC hooks for API calls
4. Implement proper error handling

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint rules
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for async operations
- Use React Hook Form for form management
- Validate data with Zod schemas

### Testing

```bash
# Run linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

---

## 🚀 Deployment

### Production Build

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Build application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Ensure all production environment variables are set:
- Database connection strings
- Supabase credentials
- NextAuth configuration
- Any other service credentials

### Database Migration

For production deployments:
1. Backup existing database
2. Run migrations: `npx prisma db push`
3. Verify data integrity
4. Deploy application

### Performance Optimization

- Enable Next.js production optimizations
- Configure CDN for static assets
- Set up database connection pooling
- Monitor application performance
- Implement proper caching strategies

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: Cannot connect to database
**Solution**: 
- Check DATABASE_URL in environment variables
- Verify database server is running
- Check network connectivity
- Verify credentials

#### 2. Authentication Issues

**Problem**: Login not working
**Solution**:
- Check Supabase configuration
- Verify environment variables
- Check user permissions in Supabase
- Clear browser cache and cookies

#### 3. Build Errors

**Problem**: Build fails with TypeScript errors
**Solution**:
- Run `npx prisma generate`
- Check for type mismatches
- Verify all imports are correct
- Run `pnpm lint` to identify issues

#### 4. PDF Export Issues

**Problem**: PDF generation fails
**Solution**:
- Check browser compatibility
- Verify jsPDF library is installed
- Check for CORS issues
- Ensure quotation data is complete

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
```

### Logs

Check application logs for:
- Database connection issues
- API errors
- Authentication problems
- Performance bottlenecks

### Support

For technical support:
1. Check this documentation
2. Review error logs
3. Check GitHub issues
4. Contact development team

---

## 📝 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🔄 Version History

- **v1.0.0** - Initial release with basic CRM functionality
- **v1.1.0** - Added quotation management and PDF export
- **v1.2.0** - Enhanced communication tracking
- **v1.3.0** - Added dashboard analytics and reporting
- **v1.4.0** - Improved user management and role-based access

---

*This documentation is maintained alongside the codebase. Please update it when making significant changes to the system.*

