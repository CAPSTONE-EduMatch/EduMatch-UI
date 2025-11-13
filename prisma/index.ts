import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prismaClient =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: ["query"],
	});

if (process.env.NODE_ENV !== "production")
	globalForPrisma.prisma = prismaClient;

export async function connectDatabase() {
	// Only connect on server side
	if (typeof window === "undefined") {
		try {
			await prismaClient.$connect();
			/* eslint-disable no-console */
			console.log("Connected to the database");
		} catch (error) {
			console.error("Failed to connect to database:", error);
			/* eslint-enable no-console */
		}
	}
}
