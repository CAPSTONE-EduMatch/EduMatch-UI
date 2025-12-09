/* eslint-disable no-console */
import dotenv from "dotenv";
import { prismaClient } from "../prisma/index";
dotenv.config();

/**
 * Clean Database Script
 *
 * This script removes all data from the database EXCEPT:
 * - Plan table
 * - DocumentType table
 * - Role table
 *
 * These tables are preserved as they contain essential reference data.
 *
 * Usage: npx tsx scripts/clean-database.ts
 */

async function cleanDatabase() {
	console.log(
		"🗑️  Cleaning database (keeping Plan, DocumentType, and Role tables)...\n"
	);

	try {
		// Delete in order to avoid foreign key constraints
		// Start with most dependent records first

		console.log("📋 Deleting application-related records...");
		await prismaClient.applicationDetail.deleteMany({});
		await prismaClient.applicationProfileSnapshot.deleteMany({});
		await prismaClient.application.deleteMany({});

		console.log("📋 Deleting wishlist records...");
		await prismaClient.wishlist.deleteMany({});

		console.log("📋 Deleting messaging records...");
		await prismaClient.message.deleteMany({});
		await prismaClient.box.deleteMany({});

		console.log("📋 Deleting notification records...");
		await prismaClient.notification.deleteMany({});
		await prismaClient.notificationSetting.deleteMany({});

		console.log("📋 Deleting post-related records...");
		await prismaClient.postCertificate.deleteMany({});
		await prismaClient.postDocument.deleteMany({});
		await prismaClient.postSubdiscipline.deleteMany({});
		await prismaClient.programScholarship.deleteMany({});
		await prismaClient.jobPost.deleteMany({});
		await prismaClient.programPost.deleteMany({});
		await prismaClient.scholarshipPost.deleteMany({});
		await prismaClient.opportunityPost.deleteMany({});

		console.log("📋 Deleting subscription records...");
		await prismaClient.subscription.deleteMany({});
		await prismaClient.applicantSubscription.deleteMany({});
		await prismaClient.institutionSubscription.deleteMany({});

		console.log("📋 Deleting document records...");
		await prismaClient.applicantDocument.deleteMany({});
		await prismaClient.institutionDocument.deleteMany({});

		console.log("📋 Deleting institution info requests...");
		await prismaClient.institutionInfoRequest.deleteMany({});

		console.log("📋 Deleting relationship records...");
		await prismaClient.applicantInterest.deleteMany({});
		await prismaClient.institutionSubdiscipline.deleteMany({});
		await prismaClient.supportRequirement.deleteMany({});

		console.log("📋 Deleting profile records...");
		await prismaClient.applicant.deleteMany({});
		await prismaClient.institution.deleteMany({});

		console.log("📋 Deleting Better Auth related records...");
		await prismaClient.session.deleteMany({});
		await prismaClient.verification.deleteMany({});
		await prismaClient.account.deleteMany({});

		console.log("📋 Deleting user records...");
		await prismaClient.user.deleteMany({});

		console.log("📋 Deleting discipline and subdiscipline records...");
		await prismaClient.subdiscipline.deleteMany({});
		await prismaClient.discipline.deleteMany({});

		console.log("📋 Deleting invoice records...");
		await prismaClient.invoice.deleteMany({});

		// NOTE: We are NOT deleting:
		// - Plan table (kept for subscription plans)
		// - DocumentType table (kept for document type references)
		// - Role table (kept for user role references)

		console.log("\n✅ Database cleaned successfully!");
		console.log("📌 Preserved tables:");
		console.log("   - Plan");
		console.log("   - DocumentType");
		console.log("   - Role");
	} catch (error: any) {
		console.error("❌ Error cleaning database:", error);
		throw error;
	}
}

async function main() {
	try {
		await prismaClient.$connect();
		console.log("✅ Connected to database\n");

		await cleanDatabase();

		await prismaClient.$disconnect();
		console.log("\n✅ Disconnected from database");
	} catch (error: any) {
		console.error("❌ Script failed:", error);
		await prismaClient.$disconnect();
		process.exit(1);
	}
}

// Run the script
main();
