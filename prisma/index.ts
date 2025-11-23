import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	throw new Error(
		"DATABASE_URL environment variable is not set. Please check your .env file."
	);
}

// Create PostgreSQL adapter for Prisma 7
// AWS RDS requires SSL connections
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_URL?.includes("rds.amazonaws.com")
		? {
				rejectUnauthorized: false, // AWS RDS uses self-signed certificates
			}
		: undefined,
});

// Handle pool errors
pool.on("error", (err) => {
	/* eslint-disable no-console */
	console.error("Unexpected error on idle PostgreSQL client", err);
	/* eslint-enable no-console */
	process.exit(-1);
});

const prismaPg = new PrismaPg(pool);

export const prismaClient =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter: prismaPg,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production")
	globalForPrisma.prisma = prismaClient;

export async function connectDatabase() {
	// Only connect on server side
	if (typeof window === "undefined") {
		try {
			await prismaClient.$connect();
			/* eslint-disable no-console */
			console.log("✅ Connected to the database");
			/* eslint-enable no-console */
		} catch (error: any) {
			/* eslint-disable no-console */
			console.error(
				"❌ Failed to connect to database:",
				error?.message || error
			);
			if (error?.code === "P1010") {
				console.error(
					"💡 Database access denied. Please check:",
					"\n  1. DATABASE_URL is correct in your .env file",
					"\n  2. Database user has proper permissions",
					"\n  3. Database exists and is accessible",
					"\n  4. For AWS RDS: SSL is enabled (already configured)"
				);
			}
			if (
				error?.message?.includes("no encryption") ||
				error?.message?.includes("pg_hba.conf")
			) {
				console.error(
					"💡 SSL/Encryption required. For AWS RDS, SSL is now enabled automatically."
				);
			}
			/* eslint-enable no-console */
			throw error;
		}
	}
}
