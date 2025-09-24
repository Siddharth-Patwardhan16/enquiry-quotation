import { prisma } from "../db";

const createInnerTRPCContext = () => {
  return {
    prisma,
  };
};

export const createTRPCContext = () => {
  return createInnerTRPCContext();
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
