const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Supabase configuration
const SUPABASE_URL = "https://oranunegpkkawmafoeem.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const prisma = new PrismaClient();

async function syncSupabaseUsers() {
  try {
    console.log('Fetching users from Supabase...');
    
    // Fetch all users from Supabase auth
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching Supabase users:', error);
      return;
    }

    console.log(`Found ${users.users.length} users in Supabase`);

    for (const supabaseUser of users.users) {
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
          where: { email: supabaseUser.email },
        });

        if (existingEmployee) {
          console.log(`Employee already exists: ${existingEmployee.name} (${existingEmployee.email})`);
          
          // Update with Supabase user ID if not already connected
          if (!existingEmployee.userId) {
            await prisma.user.upsert({
              where: { supabaseId: supabaseUser.id },
              update: {
                email: supabaseUser.email,
              },
              create: {
                email: supabaseUser.email,
                supabaseId: supabaseUser.id,
              },
            });

            await prisma.employee.update({
              where: { id: existingEmployee.id },
              data: {
                userId: (await prisma.user.findUnique({
                  where: { supabaseId: supabaseUser.id }
                })).id,
              },
            });
            console.log(`Connected existing employee to Supabase user: ${existingEmployee.name}`);
          }
        } else {
          // Create new employee and user
          const newUser = await prisma.user.create({
            data: {
              email: supabaseUser.email,
              supabaseId: supabaseUser.id,
            },
          });

          const newEmployee = await prisma.employee.create({
            data: {
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Unknown User',
              email: supabaseUser.email,
              role: 'MARKETING', // Default role
              userId: newUser.id,
            },
          });

          console.log(`Created new employee: ${newEmployee.name} (${newEmployee.email})`);
        }
      } catch (userError) {
        console.error(`Error processing user ${supabaseUser.email}:`, userError);
      }
    }

    console.log('User synchronization completed!');
  } catch (error) {
    console.error('Error during user synchronization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncSupabaseUsers();

