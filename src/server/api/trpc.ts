import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import { type TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

// Single user system - no authentication needed
export const protectedProcedure = t.procedure;
