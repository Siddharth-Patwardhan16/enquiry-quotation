import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { companyFormSchema } from '@/app/customers/new-with-locations/_utils/validation';

export const companyRouter = createTRPCRouter({
  create: publicProcedure
    .input(companyFormSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        // Check if company with same name already exists
        const existingCompany = await prisma.company.findUnique({
          where: { name: input.companyName }
        });

        if (existingCompany) {
          throw new Error(`A company with the name "${input.companyName}" already exists. Please choose a different name.`);
        }

        // Create company
        const company = await prisma.company.create({
          data: {
            name: input.companyName,
            website: input.website ?? null,
            industry: input.industry ?? null,
            // Purchase Order fields
            poRuptureDiscs: input.poRuptureDiscs,
            poThermowells: input.poThermowells,
            poHeatExchanger: input.poHeatExchanger,
            poMiscellaneous: input.poMiscellaneous,
            poWaterJetSteamJet: input.poWaterJetSteamJet,
            // Additional Information fields
            existingGraphiteSuppliers: input.existingGraphiteSuppliers ?? null,
            problemsFaced: input.problemsFaced ?? null,
            // Track who created this company
            createdById: ctx.currentUser?.id ?? null
          }
        });

        // Create offices with contacts
        for (const office of input.offices) {
          const createdOffice = await prisma.office.create({
            data: {
              companyId: company.id,
              name: office.name,
              address: office.address,
              area: office.area ?? null,
              city: office.city,
              state: office.state,
              country: office.country,
              pincode: office.pincode ?? null,
              isHeadOffice: input.offices.indexOf(office) === 0 // First office is head office
            }
          });

          // Create contacts for this office
          if (office.contacts.length > 0) {
            await prisma.contactPerson.createMany({
              data: office.contacts.map(contact => ({
                name: contact.name,
                designation: contact.designation,
                phoneNumber: contact.phoneNumber,
                emailId: contact.emailId,
                isPrimary: contact.isPrimary,
                officeId: createdOffice.id,
                companyId: company.id
              }))
            });
          }
        }

        // Create plants with contacts
        for (const plant of input.plants) {
          const createdPlant = await prisma.plant.create({
            data: {
              companyId: company.id,
              name: plant.name,
              address: plant.address,
              area: plant.area ?? null,
              city: plant.city,
              state: plant.state,
              country: plant.country,
              pincode: plant.pincode ?? null,
              plantType: 'Manufacturing'
            }
          });

          // Create contacts for this plant
          if (plant.contacts.length > 0) {
            await prisma.contactPerson.createMany({
              data: plant.contacts.map(contact => ({
                name: contact.name,
                designation: contact.designation,
                phoneNumber: contact.phoneNumber,
                emailId: contact.emailId,
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
    .query(async ({ ctx }) => {
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
          contactPersons: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
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
