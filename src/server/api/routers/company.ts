import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { companyFormSchema } from '@/app/customers/new-with-locations/_utils/validation';

export const companyRouter = createTRPCRouter({
  create: publicProcedure
    .input(companyFormSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        // Generate default company name if empty
        const companyName = input.companyName?.trim() ?? `Unnamed Company ${Date.now()}`;

        // Check if company with same name already exists (only if name was provided)
        if (input.companyName?.trim()) {
          const existingCompany = await prisma.company.findUnique({
            where: { name: companyName }
          });

          if (existingCompany) {
            throw new Error(`A company with the name "${companyName}" already exists. Please choose a different name.`);
          }
        }

        // Create company
        const company = await prisma.company.create({
          data: {
            name: companyName,
            // Purchase Order fields
            poRuptureDiscs: input.poRuptureDiscs,
            poThermowells: input.poThermowells,
            poHeatExchanger: input.poHeatExchanger,
            poMiscellaneous: input.poMiscellaneous,
            poWaterJetSteamJet: input.poWaterJetSteamJet,
            // Track who created this company
            createdById: ctx.currentUser?.id ?? null
          }
        });

        // Create offices with contacts (handle empty array)
        const offices = input.offices ?? [];
        for (let index = 0; index < offices.length; index++) {
          const office = offices[index];
          // Generate default office name if empty
          const officeName = office.name?.trim() ?? `Unnamed Office ${index + 1}`;
          
          const createdOffice = await prisma.office.create({
            data: {
              companyId: company.id,
              name: officeName,
              address: office.address ?? null,
              area: office.area ?? null,
              city: office.city ?? null,
              state: office.state ?? null,
              country: office.country ?? null,
              pincode: office.pincode ?? null,
              isHeadOffice: index === 0 // First office is head office
            }
          });

          // Create contacts for this office
          const contacts = office.contacts || [];
          if (contacts.length > 0) {
            await prisma.contactPerson.createMany({
              data: contacts.map(contact => ({
                name: contact.name ?? 'Unnamed Contact',
                designation: contact.designation ?? null,
                phoneNumber: contact.phoneNumber ?? null,
                emailId: contact.emailId ?? null,
                isPrimary: contact.isPrimary,
                officeId: createdOffice.id,
                companyId: company.id
              }))
            });
          }
        }

        // Create plants with contacts (handle empty array)
        const plants = input.plants ?? [];
        for (let index = 0; index < plants.length; index++) {
          const plant = plants[index];
          // Generate default plant name if empty
          const plantName = plant.name?.trim() ?? `Unnamed Plant ${index + 1}`;
          
          const createdPlant = await prisma.plant.create({
            data: {
              companyId: company.id,
              name: plantName,
              address: plant.address ?? null,
              area: plant.area ?? null,
              city: plant.city ?? null,
              state: plant.state ?? null,
              country: plant.country ?? null,
              pincode: plant.pincode ?? null,
              plantType: 'Manufacturing'
            }
          });

          // Create contacts for this plant
          const contacts = plant.contacts || [];
          if (contacts.length > 0) {
            await prisma.contactPerson.createMany({
              data: contacts.map(contact => ({
                name: contact.name ?? 'Unnamed Contact',
                designation: contact.designation ?? null,
                phoneNumber: contact.phoneNumber ?? null,
                emailId: contact.emailId ?? null,
                isPrimary: contact.isPrimary,
                plantId: createdPlant.id,
                companyId: company.id
              }))
            });
          }
        }

        return company;
      });
    }),

  getAll: publicProcedure
    .input(z.object({
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'type']).optional().default('name'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const sortBy = input?.sortBy ?? 'name';
      const sortOrder = input?.sortOrder ?? 'asc';
      
      // Build orderBy object
      let orderBy: Record<string, 'asc' | 'desc'>;
      if (sortBy === 'type') {
        // For type, we'll sort by a constant since all companies have the same type
        // We'll use name as a fallback for type sorting
        orderBy = { name: sortOrder };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }
      
      return ctx.prisma.company.findMany({
        include: {
          offices: {
            include: {
              contactPersons: true
            }
          },
          plants: {
            include: {
              contactPersons: true
            }
          },
          contactPersons: {
            include: {
              office: true,
              plant: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.company.findUnique({
        where: { id: input.id },
        include: {
          offices: {
            include: {
              contactPersons: true
            }
          },
          plants: {
            include: {
              contactPersons: true
            }
          },
          contactPersons: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      poRuptureDiscs: z.boolean(),
      poThermowells: z.boolean(),
      poHeatExchanger: z.boolean(),
      poMiscellaneous: z.boolean(),
      poWaterJetSteamJet: z.boolean(),
      existingGraphiteSuppliers: z.string().nullable(),
      problemsFaced: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.company.update({
        where: { id: input.id },
        data: {
          name: input.name,
          poRuptureDiscs: input.poRuptureDiscs,
          poThermowells: input.poThermowells,
          poHeatExchanger: input.poHeatExchanger,
          poMiscellaneous: input.poMiscellaneous,
          poWaterJetSteamJet: input.poWaterJetSteamJet,
          existingGraphiteSuppliers: input.existingGraphiteSuppliers,
          problemsFaced: input.problemsFaced,
        }
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        // Delete all related contact persons first
        await prisma.contactPerson.deleteMany({
          where: { companyId: input.id }
        });

        // Delete all offices and their contact persons
        const offices = await prisma.office.findMany({
          where: { companyId: input.id }
        });
        
        for (const office of offices) {
          await prisma.contactPerson.deleteMany({
            where: { officeId: office.id }
          });
        }
        
        await prisma.office.deleteMany({
          where: { companyId: input.id }
        });

        // Delete all plants and their contact persons
        const plants = await prisma.plant.findMany({
          where: { companyId: input.id }
        });
        
        for (const plant of plants) {
          await prisma.contactPerson.deleteMany({
            where: { plantId: plant.id }
          });
        }
        
        await prisma.plant.deleteMany({
          where: { companyId: input.id }
        });

        // Finally delete the company
        return prisma.company.delete({
          where: { id: input.id }
        });
      });
    })
});
