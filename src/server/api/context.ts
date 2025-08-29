import { prisma } from "../db";

type CreateContextOptions = {
  session: unknown | null;
};

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async () => {
  // For now, return a basic context without auth
  // You can implement proper auth later
  return createInnerTRPCContext({
    session: null,
  });
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
