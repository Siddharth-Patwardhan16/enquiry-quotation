import { authRouter } from './routers/auth';
import { adminRouter } from './routers/admin';
import { companyRouter } from './routers/company';
import { customerRouter } from './routers/customer';
import { contactRouter } from './routers/contact';
import { employeeRouter } from './routers/employee';
import { enquiryRouter } from './routers/enquiry';
import { quotationRouter } from './routers/quotation';
import { dashboardRouter } from './routers/dashboard';
import { tasksRouter } from './routers/tasks';
import { communicationRouter } from './routers/communication';
import { locationRouter } from './routers/location';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  company: companyRouter,
  customer: customerRouter,
  contact: contactRouter,
  employee: employeeRouter,
  enquiry: enquiryRouter,
  quotation: quotationRouter,
  dashboard: dashboardRouter,
  tasks: tasksRouter,
  communication: communicationRouter,
  location: locationRouter,
});

export type AppRouter = typeof appRouter;