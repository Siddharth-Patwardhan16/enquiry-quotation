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
      offices: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        address: z.string().nullable().optional(),
        area: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        pincode: z.string().nullable().optional(),
        isHeadOffice: z.boolean().optional(),
        contactPersons: z.array(z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          designation: z.string().nullable().optional(),
          phoneNumber: z.string().nullable().optional(),
          emailId: z.string().nullable().optional(),
          isPrimary: z.boolean().optional(),
        })).optional(),
      })).optional(),
      plants: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        address: z.string().nullable().optional(),
        area: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        pincode: z.string().nullable().optional(),
        plantType: z.string().nullable().optional(),
        contactPersons: z.array(z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          designation: z.string().nullable().optional(),
          phoneNumber: z.string().nullable().optional(),
          emailId: z.string().nullable().optional(),
          isPrimary: z.boolean().optional(),
        })).optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        // Update company basic info
        const company = await prisma.company.update({
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

        // Handle offices update
        if (input.offices !== undefined) {
          // Get existing office IDs
          const existingOffices = await prisma.office.findMany({
            where: { companyId: input.id },
            select: { id: true }
          });
          const existingOfficeIds = new Set(existingOffices.map(o => o.id));
          const submittedOfficeIds = new Set(
            input.offices
              .map(o => o.id)
              .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-'))
          );

          // Delete offices that are no longer in the list
          const officesToDelete = Array.from(existingOfficeIds).filter(id => !submittedOfficeIds.has(id));
          if (officesToDelete.length > 0) {
            await prisma.office.deleteMany({
              where: { id: { in: officesToDelete }, companyId: input.id }
            });
          }

          // Update or create offices
          for (let index = 0; index < input.offices.length; index++) {
            const office = input.offices[index];
            const officeName = office.name?.trim() ? office.name.trim() : `Unnamed Office ${index + 1}`;
            
            if (office.id && !office.id.startsWith('temp-') && existingOfficeIds.has(office.id)) {
              // Update existing office
              const updatedOffice = await prisma.office.update({
                where: { id: office.id },
                data: {
                  name: officeName,
                  address: office.address ?? null,
                  area: office.area ?? null,
                  city: office.city ?? null,
                  state: office.state ?? null,
                  country: office.country ?? null,
                  pincode: office.pincode ?? null,
                  isHeadOffice: office.isHeadOffice ?? (index === 0),
                }
              });

              // Handle contact persons for this office
              if (office.contactPersons) {
                // Delete existing contacts
                await prisma.contactPerson.deleteMany({
                  where: { officeId: office.id }
                });

                // Create new contacts
                if (office.contactPersons.length > 0) {
                  await prisma.contactPerson.createMany({
                    data: office.contactPersons.map(contact => ({
                      name: contact.name?.trim() ? contact.name : 'Unnamed Contact',
                      designation: contact.designation ?? null,
                      phoneNumber: contact.phoneNumber ?? null,
                      emailId: contact.emailId ?? null,
                      isPrimary: contact.isPrimary ?? false,
                      officeId: updatedOffice.id,
                      companyId: input.id
                    }))
                  });
                }
              }
            } else {
              // Create new office
              const createdOffice = await prisma.office.create({
                data: {
                  companyId: input.id,
                  name: officeName,
                  address: office.address ?? null,
                  area: office.area ?? null,
                  city: office.city ?? null,
                  state: office.state ?? null,
                  country: office.country ?? null,
                  pincode: office.pincode ?? null,
                  isHeadOffice: office.isHeadOffice ?? (index === 0),
                }
              });

              // Create contacts for this office
              if (office.contactPersons && office.contactPersons.length > 0) {
                await prisma.contactPerson.createMany({
                  data: office.contactPersons.map(contact => ({
                    name: contact.name?.trim() ? contact.name : 'Unnamed Contact',
                    designation: contact.designation ?? null,
                    phoneNumber: contact.phoneNumber ?? null,
                    emailId: contact.emailId ?? null,
                    isPrimary: contact.isPrimary ?? false,
                    officeId: createdOffice.id,
                    companyId: input.id
                  }))
                });
              }
            }
          }
        }

        // Handle plants update
        if (input.plants !== undefined) {
          // Get existing plant IDs
          const existingPlants = await prisma.plant.findMany({
            where: { companyId: input.id },
            select: { id: true }
          });
          const existingPlantIds = new Set(existingPlants.map(p => p.id));
          const submittedPlantIds = new Set(
            input.plants
              .map(p => p.id)
              .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-'))
          );

          // Delete plants that are no longer in the list
          const plantsToDelete = Array.from(existingPlantIds).filter(id => !submittedPlantIds.has(id));
          if (plantsToDelete.length > 0) {
            await prisma.plant.deleteMany({
              where: { id: { in: plantsToDelete }, companyId: input.id }
            });
          }

          // Update or create plants
          for (let index = 0; index < input.plants.length; index++) {
            const plant = input.plants[index];
            const plantName = plant.name?.trim() ? plant.name.trim() : `Unnamed Plant ${index + 1}`;
            
            if (plant.id && !plant.id.startsWith('temp-') && existingPlantIds.has(plant.id)) {
              // Update existing plant
              const updatedPlant = await prisma.plant.update({
                where: { id: plant.id },
                data: {
                  name: plantName,
                  address: plant.address ?? null,
                  area: plant.area ?? null,
                  city: plant.city ?? null,
                  state: plant.state ?? null,
                  country: plant.country ?? null,
                  pincode: plant.pincode ?? null,
                  plantType: plant.plantType ?? null,
                }
              });

              // Handle contact persons for this plant
              if (plant.contactPersons) {
                // Delete existing contacts
                await prisma.contactPerson.deleteMany({
                  where: { plantId: plant.id }
                });

                // Create new contacts
                if (plant.contactPersons.length > 0) {
                  await prisma.contactPerson.createMany({
                    data: plant.contactPersons.map(contact => ({
                      name: contact.name?.trim() ? contact.name : 'Unnamed Contact',
                      designation: contact.designation ?? null,
                      phoneNumber: contact.phoneNumber ?? null,
                      emailId: contact.emailId ?? null,
                      isPrimary: contact.isPrimary ?? false,
                      plantId: updatedPlant.id,
                      companyId: input.id
                    }))
                  });
                }
              }
            } else {
              // Create new plant
              const createdPlant = await prisma.plant.create({
                data: {
                  companyId: input.id,
                  name: plantName,
                  address: plant.address ?? null,
                  area: plant.area ?? null,
                  city: plant.city ?? null,
                  state: plant.state ?? null,
                  country: plant.country ?? null,
                  pincode: plant.pincode ?? null,
                  plantType: plant.plantType ?? null,
                }
              });

              // Create contacts for this plant
              if (plant.contactPersons && plant.contactPersons.length > 0) {
                await prisma.contactPerson.createMany({
                  data: plant.contactPersons.map(contact => ({
                    name: contact.name?.trim() ? contact.name : 'Unnamed Contact',
                    designation: contact.designation ?? null,
                    phoneNumber: contact.phoneNumber ?? null,
                    emailId: contact.emailId ?? null,
                    isPrimary: contact.isPrimary ?? false,
                    plantId: createdPlant.id,
                    companyId: input.id
                  }))
                });
              }
            }
          }
        }

        return company;
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
