import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

async function main() {
  // Your main function logic here
  await prismaClient.$connect();
  // Add your application logic here
  console.log("Connected to the database");
}

main()