import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';
import { Prisma } from '@prisma/client';

// Validation schemas
const CommunicationEntrySchema = z.object({
  info: z.string().min(1, 'Enter communication details'),
});

const CreateCommunicationSchema = z.object({
  date: z.string().optional(),
  companyId: z.string().optional(),
  subject: z.string().optional(),
  enquiryRelated: z.string().optional(),
  enquiryId: z.number().optional(),
  description: z.string().optional(),
  entries: z.array(CommunicationEntrySchema).min(1).optional(),
  type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']).default('TELEPHONIC'),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
  contactId: z.string().optional(),
});

const UpdateCommunicationSchema = CreateCommunicationSchema.extend({
  id: z.string(),
});

const formatCommunicationEntries = (entries: { info: string }[]) =>
  entries
    .map((entry, index) => `Communication ${index + 1}:\n${entry.info.trim()}`)
    .join('\n\n');

// Shared `include` for the communication list views (getAll / getPaginated) so both
// stay in sync with what attachEnquiryData()'s consumers actually render.
const communicationListInclude = {
  company: {
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  contactPerson: {
    select: {
      id: true,
      name: true,
      designation: true,
      phoneNumber: true,
      emailId: true,
    },
  },
  employee: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} satisfies Prisma.CommunicationInclude;

type CommunicationListRow = Prisma.CommunicationGetPayload<{ include: typeof communicationListInclude }>;

const enquiryForCommunicationSelect = {
  id: true,
  quotationNumber: true,
  subject: true,
  office: {
    select: {
      id: true,
      name: true,
      contactPersons: {
        select: {
          id: true,
          name: true,
          designation: true,
          phoneNumber: true,
          emailId: true,
          isPrimary: true,
        },
      },
    },
  },
  plant: {
    select: {
      id: true,
      name: true,
      contactPersons: {
        select: {
          id: true,
          name: true,
          designation: true,
          phoneNumber: true,
          emailId: true,
          isPrimary: true,
        },
      },
    },
  },
} satisfies Prisma.EnquirySelect;

// Batched lookup (fixes N+1): instead of one enquiry.findUnique + one
// quotation.findUnique per communication (run inside a connection_limit=1 pool, this
// was hundreds of sequential round trips per page load), resolve the distinct
// enquiryRelated ids once, fetch all referenced enquiries in a single query, then all
// referenced quotations in a single query, and stitch everything back together in memory.
async function attachEnquiryData<T extends CommunicationListRow>(comms: T[]) {
  // Prefer the enquiryId foreign key (set by the drawer/task flows); fall back to the
  // legacy free-text enquiryRelated field for older rows.
  const resolveEnquiryId = (comm: { enquiryId: number | null; enquiryRelated: string | null }): number | null => {
    if (comm.enquiryId !== null && comm.enquiryId !== undefined) {
      return comm.enquiryId;
    }
    if (!comm.enquiryRelated) {
      return null;
    }
    const parsed = Number.parseInt(comm.enquiryRelated, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const enquiryIds = [
    ...new Set(
      comms
        .map(resolveEnquiryId)
        .filter((id): id is number => id !== null),
    ),
  ];

  const enquiries =
    enquiryIds.length > 0
      ? await db.enquiry.findMany({
          where: { id: { in: enquiryIds } },
          select: enquiryForCommunicationSelect,
        })
      : [];
  const enquiryMap = new Map(enquiries.map((enquiry) => [enquiry.id, enquiry]));

  const quotationNumbers = [
    ...new Set(enquiries.map((enquiry) => enquiry.quotationNumber).filter((qn): qn is string => !!qn)),
  ];

  const quotations =
    quotationNumbers.length > 0
      ? await db.quotation.findMany({
          where: { quotationNumber: { in: quotationNumbers } },
          select: { quotationNumber: true, status: true, totalValue: true },
        })
      : [];
  const quotationMap = new Map(quotations.map((quotation) => [quotation.quotationNumber, quotation]));

  return comms.map((comm) => {
    const resolvedId = resolveEnquiryId(comm);
    const enquiry = resolvedId !== null ? enquiryMap.get(resolvedId) : undefined;

    if (!enquiry) {
      return {
        ...comm,
        enquiry: null,
      };
    }

    const quotation = enquiry.quotationNumber ? quotationMap.get(enquiry.quotationNumber) : undefined;

    return {
      ...comm,
      enquiry: {
        ...enquiry,
        quotationStatus: quotation?.status ?? null,
        quotationTotalValue: quotation?.totalValue ? Number(quotation.totalValue) : null,
      },
    };
  });
}

export const communicationRouter = createTRPCRouter({
  // Get all communications with related data and filtering support
  getAll: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']).optional(),
      customerId: z.string().optional(),
      hasQuotation: z.enum(['with', 'without']).optional(),
    }))
    .query(async ({ input }) => {
    try {
      // Build where clause for filtering
      const where: Prisma.CommunicationWhereInput = {};

      if (input.type) {
        where.type = input.type;
      }

      if (input.customerId) {
        where.companyId = input.customerId;
      }

      const communications = await db.communication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: communicationListInclude,
      });

      // Fetch enquiry (and quotation) information for communications that have
      // enquiryRelated, batched instead of per-row.
      let communicationsWithEnquiry = await attachEnquiryData(communications);

      // Apply client-side filters that require enquiry data
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        communicationsWithEnquiry = communicationsWithEnquiry.filter(comm => {
          const subject: string = comm.subject ?? '';
          const customerName: string = comm.company?.name ?? '';
          const contactName: string = comm.contactPerson?.name ??
            comm.enquiry?.office?.contactPersons?.[0]?.name ??
            comm.enquiry?.plant?.contactPersons?.[0]?.name ?? '';
          const description: string = comm.description ?? '';
          const quotationNumber: string = comm.enquiry?.quotationNumber ?? '';

          return subject.toLowerCase().includes(searchLower) ||
                 customerName.toLowerCase().includes(searchLower) ||
                 contactName.toLowerCase().includes(searchLower) ||
                 description.toLowerCase().includes(searchLower) ||
                 quotationNumber.toLowerCase().includes(searchLower);
        });
      }

      if (input.hasQuotation) {
        if (input.hasQuotation === 'with') {
          communicationsWithEnquiry = communicationsWithEnquiry.filter(comm =>
            comm.enquiry?.quotationNumber ?? false
          );
        } else if (input.hasQuotation === 'without') {
          communicationsWithEnquiry = communicationsWithEnquiry.filter(comm =>
            !comm.enquiry?.quotationNumber
          );
        }
      }

      return communicationsWithEnquiry;
    } catch {
      // Error fetching communications
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch communications',
      });
    }
  }),

  // Paginated list for the communications list page: server-side search/filter +
  // the same batched enquiry/quotation attachment as getAll, instead of fetching and
  // filtering the whole table on every keystroke.
  getPaginated: publicProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
      search: z.string().optional(),
      type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']).optional(),
      customerId: z.string().optional(),
      hasQuotation: z.enum(['with', 'without']).optional(),
      quotationStatus: z.enum(['LIVE', 'SUBMITTED', 'WON', 'LOST', 'BUDGETARY', 'DEAD', 'RECEIVED']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 25;
        const skip = (page - 1) * pageSize;

        const andConditions: Prisma.CommunicationWhereInput[] = [];

        if (input.type) {
          andConditions.push({ type: input.type });
        }

        if (input.customerId) {
          andConditions.push({ companyId: input.customerId });
        }

        if (input.search?.trim()) {
          const query = input.search.trim();
          andConditions.push({
            OR: [
              { subject: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { company: { name: { contains: query, mode: 'insensitive' } } },
              { contactPerson: { name: { contains: query, mode: 'insensitive' } } },
              { enquiry: { quotationNumber: { contains: query, mode: 'insensitive' } } },
            ],
          });
        }

        if (input.hasQuotation === 'with') {
          andConditions.push({ enquiry: { quotationNumber: { not: null } } });
        } else if (input.hasQuotation === 'without') {
          andConditions.push({
            OR: [{ enquiryId: null }, { enquiry: { quotationNumber: null } }],
          });
        }

        if (input.quotationStatus) {
          andConditions.push({ enquiry: { quotations: { some: { status: input.quotationStatus } } } });
        }

        const where: Prisma.CommunicationWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

        const [total, items] = await Promise.all([
          db.communication.count({ where }),
          db.communication.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: communicationListInclude,
          }),
        ]);

        const itemsWithEnquiry = await attachEnquiryData(items);
        const totalPages = Math.ceil(total / pageSize);

        return {
          items: itemsWithEnquiry,
          total,
          page,
          pageSize,
          totalPages,
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communications',
        });
      }
    }),

  // Get communication by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const communication = await db.communication.findUnique({
          where: { id: input.id },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        if (!communication) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Communication not found',
          });
        }

        return communication;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        // Error fetching communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communication',
        });
      }
    }),

  // Get communications by enquiry ID
  getCommunicationsByEnquiryId: publicProcedure
    .input(z.object({ enquiryId: z.number() }))
    .query(async ({ input }) => {
      try {
        const communications = await db.communication.findMany({
          where: { enquiryId: input.enquiryId },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communications;
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communications for enquiry',
        });
      }
    }),

  // Create new communication
  create: publicProcedure
    .input(CreateCommunicationSchema)
    .mutation(async ({ input }) => {
      try {
        // Find the first available employee (preferably marketing role)
        const employee = await db.employee.findFirst({
          where: { role: 'MARKETING' },
        });

        // If enquiryId is provided, fetch enquiry to get companyId/customerId if not provided
        let companyId = input.companyId;
        let customerId: string | undefined = undefined;

        if (input.enquiryId) {
          const enquiry = await db.enquiry.findUnique({
            where: { id: input.enquiryId },
            select: {
              companyId: true,
              customerId: true,
              subject: true,
            },
          });

          if (enquiry) {
            // Use enquiry's companyId/customerId if not provided in input
            if (!companyId && enquiry.companyId) {
              companyId = enquiry.companyId;
            }
            if (!input.companyId && enquiry.customerId) {
              customerId = enquiry.customerId;
            }
          }
        }

        const description =
          input.entries && input.entries.length > 0
            ? formatCommunicationEntries(input.entries)
            : (input.description ?? '');

        const communication = await db.communication.create({
          data: {
            subject: input.subject ?? '',
            description,
            type: input.type ?? 'TELEPHONIC',
            enquiryRelated: input.enquiryRelated,
            enquiryId: input.enquiryId ?? null,
            nextCommunicationDate: input.nextCommunicationDate ? new Date(input.nextCommunicationDate) : null,
            proposedNextAction: input.proposedNextAction,
            companyId: companyId,
            ...(customerId && { customerId }),
            ...(input.contactId && { contactId: input.contactId }),
            employeeId: employee?.id ?? null,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communication;
      } catch (error) {
        // Error creating communication
        
        // Provide more specific error messages
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A communication with this information already exists.',
          });
        }
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid customer or contact ID provided.',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create communication: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
        });
      }
    }),

  // Update communication
  update: publicProcedure
    .input(UpdateCommunicationSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, entries, ...updateData } = input;

        const description =
          entries && entries.length > 0
            ? formatCommunicationEntries(entries)
            : updateData.description;

        const communication = await db.communication.update({
          where: { id },
          data: {
            subject: updateData.subject,
            description,
            type: updateData.type,
            enquiryRelated: updateData.enquiryRelated,
            nextCommunicationDate: updateData.nextCommunicationDate ? new Date(updateData.nextCommunicationDate) : null,
            proposedNextAction: updateData.proposedNextAction,
            companyId: updateData.companyId,
            contactId: updateData.contactId ?? null, // Handle optional contactId
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communication;
      } catch {
        // Error updating communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update communication',
        });
      }
    }),

  // Delete communication
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.communication.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch {
        // Error deleting communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete communication',
        });
      }
    }),

  // Get communications by customer
  getByCustomer: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.communication.findMany({
          where: { customerId: input.customerId },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });
      } catch {
        // Error fetching customer communications
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer communications',
        });
      }
    }),

  // Get communications by type
  getByType: publicProcedure
    .input(z.object({ 
      type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']) 
    }))
    .query(async ({ input }) => {
      try {
        return await db.communication.findMany({
          where: { type: input.type },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });
      } catch {
        // Error fetching communications by type
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communications by type',
        });
      }
    }),

  // Get upcoming communications (with nextCommunicationDate)
  getUpcoming: publicProcedure.query(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await db.communication.findMany({
        where: {
          nextCommunicationDate: {
            gte: today,
          },
        },
        orderBy: { nextCommunicationDate: 'asc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              isNew: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          contactPerson: {
            select: {
              id: true,
              name: true,
              designation: true,
              phoneNumber: true,
              emailId: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
    } catch {
      // Error fetching upcoming communications
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch upcoming communications',
      });
    }
  }),

  // Update communication status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'FOLLOW_UP_REQUIRED', 'WON', 'LOST']).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: {
          status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'FOLLOW_UP_REQUIRED' | 'WON' | 'LOST';
          description?: string;
        } = {};
        
        if (input.status !== undefined) {
          updateData.status = input.status;
        }
        
        if (input.description !== undefined) {
          updateData.description = input.description;
        }

        const updatedCommunication = await db.communication.update({
          where: { id: input.id },
          data: updateData,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
              },
            },
          },
        });

        return updatedCommunication;
      } catch {
        // Error updating communication status
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update communication status',
        });
      }
    }),
});

