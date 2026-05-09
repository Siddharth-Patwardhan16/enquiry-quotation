import { prisma } from "../db";
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config';

const supabaseServerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getCurrentUser = async (req?: Request) => {
  try {
    const authHeader = req?.headers.get('authorization') ?? req?.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!bearerToken) {
      return null;
    }

    const { data, error } = await supabaseServerClient.auth.getUser(bearerToken);
    if (error || !data.user?.email) {
      return null;
    }

    const email = data.user.email;
    const fallbackName = email.split('@')[0] ?? 'Unknown User';
    const metadata = data.user.user_metadata as { full_name?: string } | null;
    const name = metadata?.full_name ?? fallbackName;

    let employee = await prisma.employee.findUnique({
      where: { email }
    });

    employee ??= await prisma.employee.create({
      data: {
        id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        email,
        role: 'MARKETING',
      },
    });

    if (employee.name !== name) {
      employee = await prisma.employee.update({
        where: { email },
        data: { name },
      });
    }

    return employee;
  } catch {
    return null;
  }
};

const createInnerTRPCContext = async (req?: Request) => {
  const currentUser = await getCurrentUser(req);
  
  return {
    prisma,
    currentUser,
  };
};

export const createTRPCContext = (req?: Request) => {
  return createInnerTRPCContext(req);
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
