/* eslint-disable no-console */
/**
 * Demo Seed Database Script
 *
 * Seeds the database with beautiful, realistic demo data including:
 * - 150 Students + 100 Institutions + 50 Admins (300 users total)
 * - 200 Programs + 150 Scholarships + 150 Jobs (500 opportunities)
 * - 300+ Wishlists
 * - 200+ Applications
 * - 500+ Notifications
 * - All with real, displayable images
 */

import dotenv from "dotenv";
import planData from "../../planDb.json";
import { prismaClient } from "../../prisma/index";

// Import data generators
import { researchAreas } from "./config/sample-data";
import {
	generateUniqueId,
	getRandomApplicationStatus,
	getRandomDate,
	getRandomElement,
	getRandomSubdisciplineIds,
} from "./data/helpers";
import { generateInstitutionProfiles } from "./data/institutions";
import {
	generateJobPosts,
	generateOpportunityPosts,
	generateProgramPosts,
	generateScholarshipPosts,
} from "./data/opportunities";
import {
	generateAdmins,
	generateApplicantProfiles,
	generateInstitutionUsers,
	generateStudents,
} from "./data/users";

dotenv.config();

// Configuration
const CONFIG = {
	STUDENTS: 150,
	INSTITUTIONS: 100,
	ADMINS: 50,
	PROGRAMS: 200,
	SCHOLARSHIPS: 150,
	JOBS: 150,
	WISHLISTS_PER_STUDENT_AVG: 3,
	APPLICATIONS: 200,
	NOTIFICATIONS: 500,
	DISCIPLINES: Math.min(81, researchAreas.length), // Limit to available research areas
	SUBDISCIPLINES_PER_DISCIPLINE_AVG: 3,
};

/**
 * Clean all existing data from the database
 */
async function cleanDatabase() {
	console.log("🗑️  Cleaning existing data...");

	try {
		// Delete in order to respect foreign key constraints
		await prismaClient.applicationDetail.deleteMany({});
		await prismaClient.application.deleteMany({});
		await prismaClient.wishlist.deleteMany({});
		await prismaClient.message.deleteMany({});
		await prismaClient.notification.deleteMany({});
		await prismaClient.postCertificate.deleteMany({});
		await prismaClient.postDocument.deleteMany({});
		await prismaClient.programScholarship.deleteMany({});
		await prismaClient.postSubdiscipline.deleteMany({});
		await prismaClient.jobPost.deleteMany({});
		await prismaClient.programPost.deleteMany({});
		await prismaClient.scholarshipPost.deleteMany({});
		await prismaClient.opportunityPost.deleteMany({});
		await prismaClient.subscription.deleteMany({});
		await prismaClient.applicantDocument.deleteMany({});
		await prismaClient.institutionDocument.deleteMany({});
		await prismaClient.applicantInterest.deleteMany({});
		await prismaClient.applicantSubscription.deleteMany({});
		await prismaClient.institutionSubdiscipline.deleteMany({});
		await prismaClient.institutionSubscription.deleteMany({});
		await prismaClient.supportRequirement.deleteMany({});
		await prismaClient.applicant.deleteMany({});
		await prismaClient.institution.deleteMany({});
		await prismaClient.session.deleteMany({});
		await prismaClient.verification.deleteMany({});
		await prismaClient.account.deleteMany({});
		await prismaClient.user.deleteMany({});
		await prismaClient.subdiscipline.deleteMany({});
		await prismaClient.discipline.deleteMany({});
		await prismaClient.documentType.deleteMany({});
		await prismaClient.plan.deleteMany({});
		await prismaClient.role.deleteMany({});

		console.log("✅ Database cleaned successfully");
	} catch (error) {
		console.error("❌ Error cleaning database:", error);
		throw error;
	}
}

/**
 * Seed roles
 */
async function seedRoles() {
	console.log("👤 Seeding roles...");

	const roles = [
		{ role_id: "1", name: "student", status: true },
		{ role_id: "2", name: "institution", status: true },
		{ role_id: "3", name: "admin", status: true },
	];

	await prismaClient.role.createMany({ data: roles });
	console.log("✅ 3 Roles seeded");
}

/**
 * Seed plans - using upsert like seed-pricing-plans.ts
 */
function transformFeaturesToCumulative() {
	// Find plans by hierarchy
	const freePlan = planData.find((p) => p.hierarchy === 0);
	const standardPlan = planData.find((p) => p.hierarchy === 1);
	const premiumPlan = planData.find((p) => p.hierarchy === 2);

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

async function seedPlans() {
	console.log("📋 Seeding plans...");

	const transformedPlans = transformFeaturesToCumulative();

	// Upsert Free Plan
	await prismaClient.plan.upsert({
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

	// Upsert Standard Plan
	await prismaClient.plan.upsert({
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

	// Upsert Premium Plan
	await prismaClient.plan.upsert({
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

	// Also seed Institution Plan if needed
	const institutionPlan = planData.find((p) => p.type === 2);
	if (institutionPlan) {
		await prismaClient.plan.upsert({
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
	}

	const planCount = institutionPlan ? 4 : 3;
	console.log(`✅ ${planCount} Plans seeded`);
}

/**
 * Seed disciplines
 */
async function seedDisciplines() {
	console.log("📚 Seeding disciplines...");

	const disciplines = researchAreas
		.slice(0, CONFIG.DISCIPLINES)
		.map((area, index) => ({
			discipline_id: (index + 1).toString(),
			name: area,
			status: true,
		}));

	await prismaClient.discipline.createMany({ data: disciplines });
	console.log(`✅ ${CONFIG.DISCIPLINES} Disciplines seeded`);
}

/**
 * Seed subdisciplines
 */
async function seedSubdisciplines() {
	console.log("📖 Seeding subdisciplines...");

	const subdisciplines = [];

	for (let i = 0; i < CONFIG.DISCIPLINES; i++) {
		const numSubdisciplines = Math.floor(Math.random() * 3) + 2; // 2-4 subdisciplines per discipline

		for (let j = 0; j < numSubdisciplines; j++) {
			subdisciplines.push({
				subdiscipline_id: (subdisciplines.length + 1).toString(),
				discipline_id: (i + 1).toString(),
				name: `${researchAreas[i]} - Specialization ${j + 1}`,
				status: true,
			});
		}
	}

	await prismaClient.subdiscipline.createMany({ data: subdisciplines });
	console.log(`✅ ${subdisciplines.length} Subdisciplines seeded`);

	return subdisciplines.length;
}

/**
 * Seed document types
 */
async function seedDocumentTypes() {
	console.log("📄 Seeding document types...");

	const documentTypes = [
		{
			document_type_id: "1",
			name: "Research Proposal",
			description:
				"Research proposal outlining methodology and objectives",
		},
		{
			document_type_id: "2",
			name: "CV/Resume",
			description:
				"Curriculum vitae with academic and professional experience",
		},
		{
			document_type_id: "3",
			name: "Portfolio",
			description: "Portfolio showcasing work and achievements",
		},
		{
			document_type_id: "4",
			name: "Academic Transcript",
			description: "Official academic transcripts",
		},
		{
			document_type_id: "5",
			name: "Personal Statement",
			description: "Statement of purpose or personal statement",
		},
		{
			document_type_id: "6",
			name: "Recommendation Letter",
			description: "Letters of recommendation",
		},
		{
			document_type_id: "7",
			name: "Language Certificate",
			description:
				"Language proficiency certificates (TOEFL, IELTS, etc.)",
		},
		{
			document_type_id: "8",
			name: "Passport Copy",
			description: "Copy of passport for international applications",
		},
		{
			document_type_id: "9",
			name: "Degree Certificate",
			description: "Degree certificates or diplomas",
		},
		{
			document_type_id: "10",
			name: "Research Paper",
			description: "Research papers or publications",
		},
		{
			document_type_id: "11",
			name: "Institution Verification",
			description: "Institutional affiliation documents",
		},
		{
			document_type_id: "12",
			name: "Required Documents",
			description: "Other required documents",
		},
	];

	await prismaClient.documentType.createMany({ data: documentTypes });
	console.log("✅ 12 Document types seeded");
}

/**
 * Seed users and profiles
 */
async function seedUsersAndProfiles(subdisciplineCount: number) {
	console.log("👥 Seeding users and profiles...");

	// Generate users
	const students = generateStudents(CONFIG.STUDENTS);
	const institutions = generateInstitutionUsers(
		CONFIG.INSTITUTIONS,
		CONFIG.STUDENTS + 1
	);
	const admins = generateAdmins(
		CONFIG.ADMINS,
		CONFIG.STUDENTS + CONFIG.INSTITUTIONS + 1
	);

	const allUsers = [...students, ...institutions, ...admins];

	// Create users
	await prismaClient.user.createMany({ data: allUsers });
	console.log(
		`✅ ${allUsers.length} Users seeded (${CONFIG.STUDENTS} students, ${CONFIG.INSTITUTIONS} institutions, ${CONFIG.ADMINS} admins)`
	);

	// Generate and create applicant profiles
	const applicants = generateApplicantProfiles(students, subdisciplineCount);
	await prismaClient.applicant.createMany({ data: applicants });
	console.log(`✅ ${applicants.length} Applicant profiles seeded`);

	// Generate and create institution profiles
	const institutionProfiles = generateInstitutionProfiles(institutions);
	await prismaClient.institution.createMany({ data: institutionProfiles });
	console.log(`✅ ${institutionProfiles.length} Institution profiles seeded`);

	return { students, institutions, admins, allUsers };
}

/**
 * Seed opportunity posts (programs, scholarships, jobs)
 */
async function seedOpportunities(institutionUsers: any[]) {
	console.log("🎓 Seeding opportunity posts...");

	const totalOpportunities =
		CONFIG.PROGRAMS + CONFIG.SCHOLARSHIPS + CONFIG.JOBS;
	const institutionIds = institutionUsers.map((u) => u.id);

	// Create base opportunity posts
	const opportunityPosts = generateOpportunityPosts(
		totalOpportunities,
		institutionIds
	);
	await prismaClient.opportunityPost.createMany({ data: opportunityPosts });
	console.log(`✅ ${totalOpportunities} Opportunity posts created`);

	// Create program posts
	const programs = generateProgramPosts(
		opportunityPosts,
		institutionIds,
		CONFIG.PROGRAMS
	);
	await prismaClient.programPost.createMany({ data: programs });
	console.log(`✅ ${CONFIG.PROGRAMS} Program posts seeded`);

	// Create scholarship posts
	const scholarships = generateScholarshipPosts(
		opportunityPosts,
		institutionIds,
		CONFIG.PROGRAMS,
		CONFIG.SCHOLARSHIPS
	);
	await prismaClient.scholarshipPost.createMany({ data: scholarships });
	console.log(`✅ ${CONFIG.SCHOLARSHIPS} Scholarship posts seeded`);

	// Create job posts
	const jobs = generateJobPosts(
		opportunityPosts,
		institutionIds,
		CONFIG.PROGRAMS + CONFIG.SCHOLARSHIPS,
		CONFIG.JOBS
	);
	await prismaClient.jobPost.createMany({ data: jobs });
	console.log(`✅ ${CONFIG.JOBS} Job posts seeded`);

	return { opportunityPosts, programs, scholarships, jobs };
}

/**
 * Seed post subdisciplines
 */
async function seedPostSubdisciplines(
	opportunityPosts: any[],
	subdisciplineCount: number
) {
	console.log("🔗 Seeding post subdisciplines...");

	const postSubdisciplines = [];

	for (const post of opportunityPosts) {
		const subdisciplineIds = getRandomSubdisciplineIds(
			1,
			3,
			subdisciplineCount
		);

		for (const subdisciplineId of subdisciplineIds) {
			postSubdisciplines.push({
				post_id: post.post_id,
				subdiscipline_id: subdisciplineId,
				add_at: new Date(),
			});
		}
	}

	await prismaClient.postSubdiscipline.createMany({
		data: postSubdisciplines,
	});
	console.log(`✅ ${postSubdisciplines.length} Post subdisciplines seeded`);
}

/**
 * Seed post certificates
 */
async function seedPostCertificates(programs: any[]) {
	console.log("🎖️  Seeding post certificates...");

	const certificates = [];
	const languageCerts = [
		{ name: "IELTS", score: "6.5" },
		{ name: "TOEFL iBT", score: "90" },
		{ name: "Cambridge English", score: "180" },
		{ name: "PTE Academic", score: "65" },
	];

	for (const program of programs) {
		// 80% of programs require language certificate
		if (Math.random() > 0.2) {
			const cert = getRandomElement(languageCerts);
			certificates.push({
				certificate_id: `cert-${program.post_id}-${cert.name.toLowerCase().replace(/\s+/g, "-")}`,
				post_id: program.post_id,
				name: cert.name,
				score: cert.score,
			});
		}

		// 20% require GRE/GMAT
		if (Math.random() > 0.8) {
			const test =
				Math.random() > 0.5
					? { name: "GRE", score: "320" }
					: { name: "GMAT", score: "600" };
			certificates.push({
				certificate_id: `cert-${program.post_id}-${test.name.toLowerCase()}`,
				post_id: program.post_id,
				name: test.name,
				score: test.score,
			});
		}
	}

	await prismaClient.postCertificate.createMany({ data: certificates });
	console.log(`✅ ${certificates.length} Post certificates seeded`);
}

/**
 * Seed wishlists
 */
async function seedWishlists(students: any[], opportunityPosts: any[]) {
	console.log("❤️  Seeding wishlists...");

	const wishlists = [];
	const usedCombinations = new Set();

	for (const student of students) {
		const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items per student

		for (let i = 0; i < numItems; i++) {
			const post = getRandomElement(opportunityPosts);
			const combination = `${student.id}-${post.post_id}`;

			if (!usedCombinations.has(combination)) {
				usedCombinations.add(combination);
				wishlists.push({
					applicant_id: student.id,
					post_id: post.post_id,
					add_at: getRandomDate(new Date("2024-06-01"), new Date()),
				});
			}
		}
	}

	await prismaClient.wishlist.createMany({ data: wishlists });
	console.log(`✅ ${wishlists.length} Wishlists seeded`);
}

/**
 * Seed applications
 */
async function seedApplications(students: any[], opportunityPosts: any[]) {
	console.log("📋 Seeding applications...");

	const applications = [];

	for (let i = 0; i < CONFIG.APPLICATIONS; i++) {
		const student = getRandomElement(students);
		const post = getRandomElement(opportunityPosts);

		applications.push({
			application_id: generateUniqueId("application", i + 1, 4),
			applicant_id: student.id,
			post_id: post.post_id,
			apply_at: getRandomDate(new Date("2024-01-01"), new Date()),
			status: getRandomApplicationStatus(),
			reapply_count: 0,
		});
	}

	await prismaClient.application.createMany({ data: applications });
	console.log(`✅ ${CONFIG.APPLICATIONS} Applications seeded`);
}

/**
 * Seed notifications
 */
async function seedNotifications(allUsers: any[]) {
	console.log("🔔 Seeding notifications...");

	const notifications = [];
	const notificationTypes = [
		{
			type: "APPLICATION_UPDATE",
			title: "Application Status Updated",
			body: "Your application status has been updated",
		},
		{
			type: "NEW_OPPORTUNITY",
			title: "New Opportunity Available",
			body: "A new opportunity matching your interests is now available",
		},
		{
			type: "DEADLINE_REMINDER",
			title: "Deadline Approaching",
			body: "Application deadline is approaching in 7 days",
		},
		{
			type: "MESSAGE_RECEIVED",
			title: "New Message",
			body: "You have received a new message",
		},
		{
			type: "SCHOLARSHIP_AWARDED",
			title: "Scholarship Awarded",
			body: "Congratulations! You have been awarded a scholarship",
		},
	];

	for (let i = 0; i < CONFIG.NOTIFICATIONS; i++) {
		const user = getRandomElement(allUsers);
		const notifType = getRandomElement(notificationTypes);
		const sendDate = getRandomDate(new Date("2024-01-01"), new Date());
		const isRead = Math.random() > 0.4; // 40% read

		notifications.push({
			notification_id: generateUniqueId("notification", i + 1, 4),
			user_id: user.id,
			type: notifType.type,
			title: notifType.title,
			body: notifType.body,
			url: `https://edumatch.com/dashboard/${notifType.type.toLowerCase()}`,
			send_at: sendDate,
			read_at: isRead
				? new Date(sendDate.getTime() + Math.random() * 86400000)
				: null, // read within 24 hours if read
			create_at: new Date(sendDate.getTime() - Math.random() * 3600000), // created up to 1 hour before send
		});
	}

	await prismaClient.notification.createMany({ data: notifications });
	console.log(`✅ ${CONFIG.NOTIFICATIONS} Notifications seeded`);
}

/**
 * Seed subscriptions
 */
async function seedSubscriptions(students: any[], institutions: any[]) {
	console.log("💳 Seeding subscriptions...");

	const subscriptions = [];
	const plans = ["free", "standard", "premium"];

	// Student subscriptions (70% of students)
	const studentSubCount = Math.floor(CONFIG.STUDENTS * 0.7);
	for (let i = 0; i < studentSubCount; i++) {
		const student = students[i];
		const plan = getRandomElement(plans);
		const status =
			Math.random() > 0.15
				? "active"
				: getRandomElement(["inactive", "cancelled", "expired"]);

		const periodStart = getRandomDate(new Date("2024-01-01"), new Date());
		const periodEnd = new Date(periodStart);
		periodEnd.setMonth(periodEnd.getMonth() + 1);

		subscriptions.push({
			id: generateUniqueId("app-sub", i + 1, 4),
			referenceId: student.id,
			plan,
			status,
			periodStart,
			periodEnd,
			cancelAtPeriodEnd: status === "cancelled",
			seats: 1,
		});
	}

	// Institution subscriptions (90% of institutions)
	const instSubCount = Math.floor(CONFIG.INSTITUTIONS * 0.9);
	for (let i = 0; i < instSubCount; i++) {
		const institution = institutions[i];
		const plan =
			Math.random() > 0.5
				? "premium"
				: getRandomElement(["standard", "free"]);
		const status =
			Math.random() > 0.1
				? "active"
				: getRandomElement(["inactive", "cancelled"]);

		const periodStart = getRandomDate(new Date("2024-01-01"), new Date());
		const periodEnd = new Date(periodStart);
		periodEnd.setMonth(periodEnd.getMonth() + 1);

		subscriptions.push({
			id: generateUniqueId("inst-sub", i + 1, 4),
			referenceId: institution.id,
			plan,
			status,
			periodStart,
			periodEnd,
			cancelAtPeriodEnd: status === "cancelled",
			seats: plan === "premium" ? 5 : 1,
		});
	}

	await prismaClient.subscription.createMany({ data: subscriptions });
	console.log(`✅ ${subscriptions.length} Subscriptions seeded`);
}

/**
 * Main function
 */
async function main() {
	console.log("");
	console.log("═══════════════════════════════════════════════════");
	console.log("🌱 DEMO SEED DATABASE - Starting...");
	console.log("═══════════════════════════════════════════════════");
	console.log("");

	try {
		const startTime = Date.now();

		// Step 1: Clean database
		await cleanDatabase();

		// Step 2: Seed core tables
		await seedRoles();
		await seedPlans();
		await seedDisciplines();
		const subdisciplineCount = await seedSubdisciplines();
		await seedDocumentTypes();

		// Step 3: Seed users and profiles
		const { students, institutions, admins, allUsers } =
			await seedUsersAndProfiles(subdisciplineCount);

		// Step 4: Seed opportunities
		const { opportunityPosts, programs, scholarships, jobs } =
			await seedOpportunities(institutions);

		// Step 5: Seed relationships
		await seedPostSubdisciplines(opportunityPosts, subdisciplineCount);
		await seedPostCertificates(programs);
		await seedWishlists(students, opportunityPosts);
		await seedApplications(students, opportunityPosts);
		await seedNotifications(allUsers);
		await seedSubscriptions(students, institutions);

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);

		// Summary
		console.log("");
		console.log("═══════════════════════════════════════════════════");
		console.log("🎉 DEMO DATABASE SEEDED SUCCESSFULLY!");
		console.log("═══════════════════════════════════════════════════");
		console.log("");
		console.log("📊 Summary:");
		console.log(`   ⏱️  Execution Time: ${duration}s`);
		console.log("");
		console.log("   👤 Users & Profiles:");
		console.log(
			`      • ${CONFIG.STUDENTS} Students with complete profiles`
		);
		console.log(`      • ${CONFIG.INSTITUTIONS} Institutions with logos`);
		console.log(`      • ${CONFIG.ADMINS} Admins`);
		console.log(
			`      • Total: ${CONFIG.STUDENTS + CONFIG.INSTITUTIONS + CONFIG.ADMINS} users`
		);
		console.log("");
		console.log("   🎓 Opportunities:");
		console.log(`      • ${CONFIG.PROGRAMS} Program posts`);
		console.log(`      • ${CONFIG.SCHOLARSHIPS} Scholarship posts`);
		console.log(`      • ${CONFIG.JOBS} Job posts`);
		console.log(
			`      • Total: ${CONFIG.PROGRAMS + CONFIG.SCHOLARSHIPS + CONFIG.JOBS} opportunities`
		);
		console.log("");
		console.log("   📚 Core Data:");
		console.log(`      • ${CONFIG.DISCIPLINES} Disciplines`);
		console.log(`      • ${subdisciplineCount} Subdisciplines`);
		console.log("      • 12 Document types");
		console.log("      • 3 Plans");
		console.log("      • 3 Roles");
		console.log("");
		console.log("   💼 Activity:");
		console.log(`      • ${CONFIG.APPLICATIONS} Applications`);
		console.log(`      • 300+ Wishlists`);
		console.log(`      • ${CONFIG.NOTIFICATIONS} Notifications`);
		console.log("      • 200+ Subscriptions");
		console.log("");
		console.log("   🖼️  Images:");
		console.log("      • All user avatars (DiceBear API)");
		console.log("      • All institution logos (curated array)");
		console.log("      • All institution covers (curated array)");
		console.log("      • Total: 400+ images");
		console.log("");
		console.log("═══════════════════════════════════════════════════");
		console.log("✅ Ready for demo! All images are displayable.");
		console.log("═══════════════════════════════════════════════════");
		console.log("");
	} catch (error) {
		console.error("");
		console.error("═══════════════════════════════════════════════════");
		console.error("❌ ERROR DURING SEEDING");
		console.error("═══════════════════════════════════════════════════");
		console.error(error);
		console.error("");
		process.exit(1);
	} finally {
		await prismaClient.$disconnect();
	}
}

main();
