# 🏗 Technical Architecture - CRM Portal

## System Overview

The CRM Portal is built as a modern full-stack web application using Next.js with a focus on type safety, performance, and maintainability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router  │  React Components  │  UI Library        │
│  - Pages & Layouts   │  - Forms & Tables  │  - Radix UI        │
│  - Route Handling    │  - State Management│  - Tailwind CSS    │
│  - SSR/SSG          │  - Context API     │  - Lucide Icons    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  tRPC Router        │  Validation Layer  │  Business Logic     │
│  - Type-safe APIs   │  - Zod Schemas     │  - Data Processing  │
│  - Auto-generated   │  - Input Validation│  - Error Handling   │
│  - Client Hooks     │  - Type Inference  │  - Authorization    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Prisma ORM         │  Database Client   │  Connection Pool    │
│  - Type-safe Queries│  - PostgreSQL      │  - Connection Mgmt  │
│  - Schema Management│  - Supabase Hosted │  - Query Optimization│
│  - Migrations       │  - Real-time       │  - Transaction Mgmt │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Auth      │  File System      │  PDF Generation      │
│  - User Management  │  - Static Assets  │  - jsPDF Library     │
│  - JWT Tokens       │  - Uploads        │  - HTML to PDF       │
│  - Role-based Auth  │  - Caching        │  - Document Export   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Architecture

#### Next.js App Router
- **File-based Routing**: Automatic route generation from file structure
- **Server Components**: Server-side rendering for better performance
- **Client Components**: Interactive components with React hooks
- **Layout System**: Nested layouts for consistent UI structure

#### Component Architecture
```
src/components/
├── ui/                    # Reusable UI primitives
│   ├── button.tsx        # Button component
│   ├── input.tsx         # Input component
│   ├── dialog.tsx        # Modal dialogs
│   └── ...
├── layout/               # Layout components
│   └── NavigationLayout.tsx
├── providers/            # Context providers
│   ├── AuthProvider.tsx
│   ├── SessionProvider.tsx
│   └── UserSyncProvider.tsx
└── dashboard/            # Feature-specific components
    ├── StatCard.tsx
    ├── Charts.tsx
    └── RecentActivity.tsx
```

#### State Management
- **React Context**: Global state for authentication and user data
- **tRPC Hooks**: Server state management with automatic caching
- **React Hook Form**: Form state management with validation
- **Local State**: Component-level state with useState/useReducer

### Backend Architecture

#### tRPC API Design
```typescript
// API Router Structure
appRouter = {
  customer: customerRouter,      // Customer management
  enquiry: enquiryRouter,        // Enquiry management
  quotation: quotationRouter,    // Quotation management
  communication: communicationRouter, // Communication tracking
  dashboard: dashboardRouter,    // Analytics and reporting
  auth: authRouter,             // Authentication
  admin: adminRouter,           // Admin functions
  tasks: tasksRouter,           // Task management
  contact: contactRouter,       // Contact management
  location: locationRouter      // Location management
}
```

#### API Patterns
- **CRUD Operations**: Standard Create, Read, Update, Delete operations
- **Type Safety**: End-to-end type safety from database to frontend
- **Validation**: Zod schemas for input validation
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Pagination**: Efficient data loading for large datasets

### Database Architecture

#### Prisma Schema Design
```prisma
// Core entities with relationships
model Customer {
  id        String   @id @default(uuid())
  name      String
  isNew     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  locations      Location[]
  enquiries      Enquiry[]
  communications Communication[]
}

model Location {
  id         String   @id @default(uuid())
  customerId String
  name       String
  type       LocationType
  // ... other fields
  
  // Relationships
  customer   Customer   @relation(fields: [customerId], references: [id])
  contacts   Contact[]
  enquiries  Enquiry[]
}
```

#### Database Optimization
- **Indexes**: Strategic indexes on frequently queried fields
- **Foreign Keys**: Proper referential integrity
- **Constraints**: Data validation at database level
- **Migrations**: Version-controlled schema changes

### Authentication & Authorization

#### Supabase Integration
```typescript
// Authentication flow
1. User signs in via Supabase Auth
2. JWT token generated and stored
3. Token validated on each request
4. User data synced with local Employee table
5. Role-based permissions enforced
```

#### Role-based Access Control
```typescript
enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',  // Full system access
  MARKETING = 'MARKETING',          // Customer & enquiry management
  SALES = 'SALES',                  // Quotation management
  SUPPORT = 'SUPPORT'               // Communication tracking
}
```

### Performance Optimizations

#### Frontend Optimizations
- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Optimized bundle sizes
- **Caching**: React Query caching for API responses
- **SSR/SSG**: Server-side rendering for better SEO and performance

#### Backend Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Prisma query optimization
- **Caching**: API response caching where appropriate

#### Database Optimizations
- **Query Optimization**: Efficient SQL queries
- **Index Strategy**: Strategic database indexes
- **Connection Management**: Connection pooling and management
- **Data Archiving**: Historical data management

### Security Architecture

#### Data Protection
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Next.js CSRF protection

#### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Supabase handles password security
- **Session Management**: Secure session handling
- **Role-based Access**: Granular permission system

### Error Handling

#### Frontend Error Handling
```typescript
// Global error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>

// API error handling
const { data, error, isLoading } = api.customer.getAll.useQuery();
if (error) {
  // Handle error appropriately
}
```

#### Backend Error Handling
```typescript
// tRPC error handling
try {
  // Business logic
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to process request'
  });
}
```

### Monitoring & Logging

#### Application Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: API response times
- **User Analytics**: Usage patterns and metrics
- **Database Monitoring**: Query performance and health

#### Logging Strategy
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, Info, Warn, Error
- **Context Information**: Request IDs and user context
- **Log Aggregation**: Centralized log collection

### Deployment Architecture

#### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Next.js App   │    │   PostgreSQL    │
│   - SSL/TLS     │◄──►│   - SSR/SSG     │◄──►│   - Supabase    │
│   - CDN         │    │   - API Routes  │    │   - Backups     │
│   - Caching     │    │   - Static Files│    │   - Monitoring  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### CI/CD Pipeline
1. **Code Commit**: Git push triggers build
2. **Testing**: Automated tests run
3. **Build**: Production build created
4. **Deploy**: Automatic deployment to production
5. **Health Check**: Application health verification

### Scalability Considerations

#### Horizontal Scaling
- **Stateless Design**: No server-side state dependencies
- **Database Scaling**: Read replicas for query distribution
- **CDN Integration**: Static asset distribution
- **Load Balancing**: Multiple application instances

#### Performance Scaling
- **Database Optimization**: Query optimization and indexing
- **Caching Strategy**: Multi-level caching implementation
- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Resource Monitoring**: Proactive performance monitoring

### Development Workflow

#### Code Organization
- **Feature-based Structure**: Components grouped by feature
- **Shared Components**: Reusable UI components
- **Type Safety**: End-to-end TypeScript
- **Code Standards**: ESLint and Prettier configuration

#### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load and stress testing

### Future Enhancements

#### Planned Features
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Analytics**: More detailed reporting and insights
- **Mobile App**: React Native mobile application
- **API Versioning**: Backward-compatible API evolution
- **Microservices**: Service decomposition for better scalability

#### Technical Debt
- **Code Refactoring**: Continuous code improvement
- **Performance Optimization**: Ongoing performance enhancements
- **Security Updates**: Regular security patches and updates
- **Documentation**: Comprehensive documentation maintenance

---

*This technical architecture document provides a comprehensive overview of the system design and implementation details. It should be updated as the system evolves.*

