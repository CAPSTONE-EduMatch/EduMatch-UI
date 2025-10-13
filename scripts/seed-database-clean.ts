import { prismaClient } from "../prisma";

// Sample data arrays for generating realistic content
const universities = [
	"Harvard University",
	"MIT",
	"Stanford University",
	"Oxford University",
	"Cambridge University",
	"ETH Zurich",
	"University of Tokyo",
	"Seoul National University",
	"National University of Singapore",
	"University of Toronto",
	"McGill University",
	"Australian National University",
	"University of Melbourne",
	"Technical University of Munich",
	"Imperial College London",
	"London School of Economics",
	"Yale University",
	"Princeton University",
	"Columbia University",
	"University of California Berkeley",
	"University of Chicago",
	"Cornell University",
	"University of Pennsylvania",
	"Johns Hopkins University",
];

const fields = [
	"Computer Science",
	"Data Science",
	"Artificial Intelligence",
	"Machine Learning",
	"Software Engineering",
	"Cybersecurity",
	"Business Administration",
	"Economics",
	"Finance",
	"Marketing",
	"International Business",
	"Biology",
	"Chemistry",
	"Physics",
	"Mathematics",
	"Statistics",
	"Psychology",
	"Sociology",
	"Political Science",
	"International Relations",
	"Engineering",
	"Electrical Engineering",
	"Mechanical Engineering",
	"Civil Engineering",
	"Environmental Science",
	"Medicine",
	"Public Health",
	"Law",
];

const degreeLevels = [
	"Bachelor",
	"Master",
	"PhD",
	"Postgraduate Diploma",
	"Certificate",
];

const providers = [
	"Government Scholarship",
	"University Merit Award",
	"Private Foundation",
	"Corporate Sponsorship",
	"International Organization",
	"Research Council",
	"Cultural Exchange Program",
	"Athletic Scholarship",
	"Need-based Grant",
];

const jobTypes = [
	"Research Assistant",
	"Postdoctoral Researcher",
	"Research Scientist",
	"Lab Manager",
	"Graduate Research Assistant",
	"Undergraduate Researcher",
	"Principal Investigator",
	"Research Associate",
];

// Helper functions
function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime())
	);
}

function generateProgramDescription(field: string, university: string): string {
	const descriptions = [
		`Join our world-renowned ${field} program at ${university}. This comprehensive curriculum combines theoretical knowledge with practical applications.`,
		`Advance your career with our cutting-edge ${field} program. ${university} offers state-of-the-art facilities and expert faculty guidance.`,
		`Transform your future through our innovative ${field} program. Experience hands-on learning and research opportunities at ${university}.`,
		`Excel in ${field} with our internationally recognized program. ${university} provides extensive industry connections and career support.`,
	];
	return getRandomElement(descriptions);
}

function generateScholarshipDescription(
	provider: string,
	field: string
): string {
	const descriptions = [
		`The ${provider} is proud to support exceptional students pursuing ${field}. This prestigious award recognizes academic excellence and leadership potential.`,
		`Empowering the next generation of ${field} professionals through the ${provider}. Recipients join a distinguished network of scholars and innovators.`,
		`${provider} scholarship supports talented individuals in ${field} with comprehensive financial assistance and mentorship opportunities.`,
		`Join an elite group of ${field} scholars supported by ${provider}. This award includes financial aid, networking, and career development support.`,
	];
	return getRandomElement(descriptions);
}

function generateResearchDescription(jobType: string, field: string): string {
	const descriptions = [
		`Exciting ${jobType} opportunity in ${field}. Join our dynamic research team and contribute to groundbreaking discoveries that shape the future.`,
		`We are seeking a motivated ${jobType} to work on cutting-edge ${field} research. This position offers excellent career development opportunities.`,
		`${jobType} position available in our world-class ${field} laboratory. Work alongside renowned researchers and access state-of-the-art equipment.`,
		`Join our research team as a ${jobType} and make meaningful contributions to ${field}. We offer competitive compensation and excellent benefits.`,
	];
	return getRandomElement(descriptions);
}

async function cleanDatabase() {
	console.log("🗑️  Cleaning existing data...");

	try {
		// Use raw SQL to truncate all tables and reset sequences
		// This bypasses foreign key constraints
		await prismaClient.$executeRaw`TRUNCATE TABLE "application", "application_attachment", "PostJob", "PostScholarship", "PostProgram", "Post", "Notification", "Email", "Wishlist", "mesage", "thread", "session", "account", "User" RESTART IDENTITY CASCADE;`;

		console.log("✅ Database cleaned successfully");
	} catch (error) {
		console.warn("Error during cleanup, trying alternative method:", error);

		// Fallback method: delete in correct order
		try {
			await prismaClient.application.deleteMany({});
			await prismaClient.application_attachment.deleteMany({});
			await prismaClient.postJob.deleteMany({});
			await prismaClient.postScholarship.deleteMany({});
			await prismaClient.postProgram.deleteMany({});
			await prismaClient.post.deleteMany({});
			await prismaClient.mesage.deleteMany({});
			await prismaClient.thread.deleteMany({});
			await prismaClient.notification.deleteMany({});
			await prismaClient.email.deleteMany({});
			await prismaClient.wishlist.deleteMany({});
			await prismaClient.session.deleteMany({});
			await prismaClient.account.deleteMany({});
			await prismaClient.user.deleteMany({});

			console.log("✅ Database cleaned successfully (fallback method)");
		} catch (fallbackError) {
			console.error("Failed to clean database:", fallbackError);
			throw fallbackError;
		}
	}
}

async function seedUsers() {
	console.log("👥 Seeding users...");

	// Create users one by one using upsert to handle duplicates
	for (let i = 1; i <= 200; i++) {
		await prismaClient.user.upsert({
			where: { id: `user-${i}` },
			update: {},
			create: {
				id: `user-${i}`,
				name: `Test User ${i}`,
				email: `user${i}@test.com`,
				emailVerified: true,
			},
		});
	}

	console.log("✅ 200 Users seeded successfully");
}

async function seedPrograms() {
	console.log("🎓 Seeding programs...");

	// Create 130 program posts for better pagination testing
	for (let i = 1; i <= 130; i++) {
		const field = getRandomElement(fields);
		const university = getRandomElement(universities);
		const degreeLevel = getRandomElement(degreeLevels);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		// Create post first
		await prismaClient.post.upsert({
			where: { id: `prog-${i}` },
			update: {},
			create: {
				id: `prog-${i}`,
				title: `${degreeLevel} in ${field}`,
				content: generateProgramDescription(field, university),
				published: true,
				authorId: "user-1",
				createdAt,
			},
		});

		// Then create program details
		await prismaClient.postProgram.upsert({
			where: { PostId: `prog-${i}` },
			update: {},
			create: {
				PostId: `prog-${i}`,
				duration: getRandomElement([
					"1 year",
					"2 years",
					"3 years",
					"4 years",
				]),
				degreeLevel,
				CourseInclude: `Core courses in ${field}, research methodology, and specialized electives`,
				professor_name: `Prof. ${getRandomElement([
					"Smith",
					"Johnson",
					"Brown",
					"Davis",
					"Wilson",
					"Miller",
					"Moore",
					"Taylor",
					"Anderson",
					"Thomas",
					"Jackson",
					"White",
				])}`,
				gpa: parseFloat((Math.random() * 1.0 + 3.0).toFixed(2)),
				gre: Math.floor(Math.random() * 140) + 260,
				gmat: Math.floor(Math.random() * 200) + 400,
				tuition_fee: parseFloat(
					(Math.random() * 50000 + 10000).toFixed(2)
				),
				fee_description:
					"Per academic year, includes tuition and mandatory fees",
				scholarship_info:
					"Merit-based scholarships available for qualified students",
			},
		});
	}

	console.log(`✅ 130 Programs seeded successfully`);
}

async function seedScholarships() {
	console.log("💰 Seeding scholarships...");

	// Create 50 scholarship posts
	for (let i = 1; i <= 50; i++) {
		const field = getRandomElement(fields);
		const provider = getRandomElement(providers);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		// Create post first
		await prismaClient.post.upsert({
			where: { id: `schol-${i}` },
			update: {},
			create: {
				id: `schol-${i}`,
				title: `${provider} - ${field} Excellence Award`,
				content: generateScholarshipDescription(provider, field),
				published: true,
				authorId: "user-1",
				createdAt,
			},
		});

		// Then create scholarship details
		await prismaClient.postScholarship.upsert({
			where: { PostId: `schol-${i}` },
			update: {},
			create: {
				PostId: `schol-${i}`,
				detail: `Renewable scholarship supporting ${field} students with academic excellence`,
				type: getRandomElement([
					"Merit-based",
					"Need-based",
					"Diversity",
					"Research",
					"Athletic",
				]),
				number: Math.floor(Math.random() * 30) + 5,
				grant: `$${Math.floor(Math.random() * 40000) + 10000} per year`,
				scholarship_coverage: "Full tuition and living expenses",
				essay_required: Math.random() > 0.5,
				eligibility: `GPA ${(Math.random() * 0.5 + 3.5).toFixed(1)}+, ${field} major preferred`,
			},
		});
	}

	console.log(`✅ 50 Scholarships seeded successfully`);
}

async function seedResearch() {
	console.log("🔬 Seeding research positions...");

	// Create 75 research positions
	for (let i = 1; i <= 75; i++) {
		const field = getRandomElement(fields);
		const jobType = getRandomElement(jobTypes);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		// Create post first
		await prismaClient.post.upsert({
			where: { id: `research-${i}` },
			update: {},
			create: {
				id: `research-${i}`,
				title: `${jobType} - ${field} Research Lab`,
				content: generateResearchDescription(jobType, field),
				published: true,
				authorId: "user-1",
				createdAt,
			},
		});

		const isHourly =
			jobType.includes("Undergraduate") || jobType.includes("Part-time");
		const minSalary = isHourly
			? Math.floor(Math.random() * 10) + 15
			: Math.floor(Math.random() * 30000) + 35000;
		const maxSalary = isHourly
			? minSalary + Math.floor(Math.random() * 10) + 5
			: minSalary + Math.floor(Math.random() * 20000) + 10000;

		// Then create job details
		await prismaClient.postJob.upsert({
			where: { PostId: `research-${i}` },
			update: {},
			create: {
				PostId: `research-${i}`,
				job_type: jobType,
				contract_type: getRandomElement([
					"Full-time",
					"Part-time",
					"Contract",
					"Temporary",
				]),
				min_salary: parseFloat(minSalary.toFixed(2)),
				max_salary: parseFloat(maxSalary.toFixed(2)),
				salary_description: isHourly ? "Per hour" : "Per year",
				benefit:
					"Health insurance, retirement plan, professional development funds",
				main_responsibility: `Conduct research in ${field}, data analysis, manuscript preparation`,
				qualification_requirement: `Degree in ${field} or related field, research experience preferred`,
				experience_requirement: getRandomElement([
					"0-2 years",
					"2-5 years",
					"5+ years",
					"PhD required",
				]),
				assessment_criteria:
					"Technical skills, research experience, communication abilities",
				other_requirement: `Strong background in ${field}, programming skills advantageous`,
			},
		});
	}

	console.log(`✅ 75 Research positions seeded successfully`);
}

async function seedApplications() {
	console.log("📄 Seeding applications...");

	// Collect all post IDs
	const programIds = Array.from({ length: 130 }, (_, i) => `prog-${i + 1}`);
	const scholarshipIds = Array.from(
		{ length: 50 },
		(_, i) => `schol-${i + 1}`
	);
	const researchIds = Array.from(
		{ length: 75 },
		(_, i) => `research-${i + 1}`
	);
	const allPostIds = [...programIds, ...scholarshipIds, ...researchIds];

	// Create 500 applications for better popularity testing
	for (let i = 0; i < 500; i++) {
		const randomPostId = getRandomElement(allPostIds);
		const randomUserId = `user-${Math.floor(Math.random() * 200) + 1}`;

		await prismaClient.application.upsert({
			where: { id: `app-${i + 1}` },
			update: {},
			create: {
				id: `app-${i + 1}`,
				postId: randomPostId,
				applicantId: randomUserId,
				submittedAt: getRandomDate(new Date(2023, 6, 1), new Date()),
				status: getRandomElement([
					"pending",
					"approved",
					"rejected",
					"under_review",
				]),
			},
		});
	}

	console.log(`✅ 500 Applications seeded successfully`);
}

async function main() {
	try {
		await cleanDatabase();
		await seedUsers();
		await seedPrograms();
		await seedScholarships();
		await seedResearch();
		await seedApplications();

		console.log("🎉 Database seeding completed successfully!");
		console.log("📊 Summary:");
		console.log("  - 200 Users");
		console.log("  - 130 Programs");
		console.log("  - 50 Scholarships");
		console.log("  - 75 Research Positions");
		console.log("  - 500 Applications");
		console.log(
			"  - Total: 955 records for comprehensive pagination testing"
		);
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	} finally {
		await prismaClient.$disconnect();
	}
}

main().catch(async (e) => {
	console.error(e);
	await prismaClient.$disconnect();
	process.exit(1);
});
