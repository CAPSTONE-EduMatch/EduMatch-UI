import { config } from "dotenv";
// Load environment variables before importing prisma
config();

console.log("cwd:", process.cwd());
console.log(".env exists:", require("fs").existsSync(".env"));
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "not set");

import planData from "../planDb.json";
import { prismaClient as prisma } from "../prisma";

// Transform features to cumulative format
function transformFeaturesToCumulative() {
	// Find plans by hierarchy
	const freePlan = planData.find((p) => p.hierarchy === 0);
	const standardPlan = planData.find((p) => p.hierarchy === 1);
	const premiumPlan = planData.find((p) => p.hierarchy === 2);
	// const { prismaClient: prisma } = await import("../prisma");
	if (!freePlan || !standardPlan || !premiumPlan) {
		throw new Error("Missing required plan data");
	}

	// Free plan features (as-is)
	const freeFeatures = freePlan.features;

	// Standard plan: Free features + Standard-specific features (remove "Everything in Free")
	const standardSpecificFeatures = standardPlan.features.filter(
		(f) => f !== "Everything in Free"
	);
	const standardCumulativeFeatures = [
		...freeFeatures,
		...standardSpecificFeatures,
	];

	// Premium plan: Free + Standard + Premium-specific features (remove "Everything in Standard")
	const premiumSpecificFeatures = premiumPlan.features.filter(
		(f) => f !== "Everything in Standard"
	);
	const premiumCumulativeFeatures = [
		...freeFeatures,
		...standardSpecificFeatures,
		...premiumSpecificFeatures,
	];

	return {
		free: { ...freePlan, features: freeFeatures },
		standard: { ...standardPlan, features: standardCumulativeFeatures },
		premium: { ...premiumPlan, features: premiumCumulativeFeatures },
	};
}

async function seedPricingPlans() {
	try {
		console.log("🌱 Starting pricing plans seed...");

		const transformedPlans = transformFeaturesToCumulative();

		// Upsert Free Plan
		console.log("📦 Upserting Free Plan...");
		await prisma.plan.upsert({
			where: { plan_id: transformedPlans.free.plan_id },
			update: {
				priceId: transformedPlans.free.priceId,
				name: transformedPlans.free.name,
				description: transformedPlans.free.description,
				features: transformedPlans.free.features,
				month_price: transformedPlans.free.month_price,
				year_price: transformedPlans.free.year_price,
				status: transformedPlans.free.status,
				type: transformedPlans.free.type,
				hierarchy: transformedPlans.free.hierarchy,
			},
			create: {
				plan_id: transformedPlans.free.plan_id,
				priceId: transformedPlans.free.priceId,
				name: transformedPlans.free.name,
				description: transformedPlans.free.description,
				features: transformedPlans.free.features,
				month_price: transformedPlans.free.month_price,
				year_price: transformedPlans.free.year_price,
				status: transformedPlans.free.status,
				create_at: new Date(transformedPlans.free.create_at),
				type: transformedPlans.free.type,
				hierarchy: transformedPlans.free.hierarchy,
			},
		});
		console.log(
			`✅ Free Plan: ${transformedPlans.free.features.length} features`
		);

		// Upsert Standard Plan
		console.log("📦 Upserting Standard Plan...");
		await prisma.plan.upsert({
			where: { plan_id: transformedPlans.standard.plan_id },
			update: {
				priceId: transformedPlans.standard.priceId,
				name: transformedPlans.standard.name,
				description: transformedPlans.standard.description,
				features: transformedPlans.standard.features,
				month_price: transformedPlans.standard.month_price,
				year_price: transformedPlans.standard.year_price,
				status: transformedPlans.standard.status,
				type: transformedPlans.standard.type,
				hierarchy: transformedPlans.standard.hierarchy,
			},
			create: {
				plan_id: transformedPlans.standard.plan_id,
				priceId: transformedPlans.standard.priceId,
				name: transformedPlans.standard.name,
				description: transformedPlans.standard.description,
				features: transformedPlans.standard.features,
				month_price: transformedPlans.standard.month_price,
				year_price: transformedPlans.standard.year_price,
				status: transformedPlans.standard.status,
				create_at: new Date(transformedPlans.standard.create_at),
				type: transformedPlans.standard.type,
				hierarchy: transformedPlans.standard.hierarchy,
			},
		});
		console.log(
			`✅ Standard Plan: ${transformedPlans.standard.features.length} features`
		);

		// Upsert Premium Plan
		console.log("📦 Upserting Premium Plan...");
		await prisma.plan.upsert({
			where: { plan_id: transformedPlans.premium.plan_id },
			update: {
				priceId: transformedPlans.premium.priceId,
				name: transformedPlans.premium.name,
				description: transformedPlans.premium.description,
				features: transformedPlans.premium.features,
				month_price: transformedPlans.premium.month_price,
				year_price: transformedPlans.premium.year_price,
				status: transformedPlans.premium.status,
				type: transformedPlans.premium.type,
				hierarchy: transformedPlans.premium.hierarchy,
			},
			create: {
				plan_id: transformedPlans.premium.plan_id,
				priceId: transformedPlans.premium.priceId,
				name: transformedPlans.premium.name,
				description: transformedPlans.premium.description,
				features: transformedPlans.premium.features,
				month_price: transformedPlans.premium.month_price,
				year_price: transformedPlans.premium.year_price,
				status: transformedPlans.premium.status,
				create_at: new Date(transformedPlans.premium.create_at),
				type: transformedPlans.premium.type,
				hierarchy: transformedPlans.premium.hierarchy,
			},
		});
		console.log(
			`✅ Premium Plan: ${transformedPlans.premium.features.length} features`
		);

		// Also seed Institution Plan if needed
		const institutionPlan = planData.find((p) => p.type === 2);
		if (institutionPlan) {
			console.log("📦 Upserting Institution Plan...");
			await prisma.plan.upsert({
				where: { plan_id: institutionPlan.plan_id },
				update: {
					priceId: institutionPlan.priceId,
					name: institutionPlan.name,
					description: institutionPlan.description,
					features: institutionPlan.features,
					month_price: institutionPlan.month_price,
					year_price: institutionPlan.year_price,
					status: institutionPlan.status,
					type: institutionPlan.type,
					hierarchy: institutionPlan.hierarchy,
				},
				create: {
					plan_id: institutionPlan.plan_id,
					priceId: institutionPlan.priceId,
					name: institutionPlan.name,
					description: institutionPlan.description,
					features: institutionPlan.features,
					month_price: institutionPlan.month_price,
					year_price: institutionPlan.year_price,
					status: institutionPlan.status,
					create_at: new Date(institutionPlan.create_at),
					type: institutionPlan.type,
					hierarchy: institutionPlan.hierarchy,
				},
			});
			console.log(
				`✅ Institution Plan: ${institutionPlan.features.length} features`
			);
		}

		console.log("✅ Pricing plans seed completed successfully!");
	} catch (error) {
		console.error("❌ Error seeding pricing plans:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedPricingPlans()
	.then(() => {
		console.log("🎉 Seed script finished!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Seed script failed:", error);
		process.exit(1);
	});
