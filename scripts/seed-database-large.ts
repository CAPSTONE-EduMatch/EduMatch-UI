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

const countries = [
	"United States",
	"United Kingdom",
	"Canada",
	"Australia",
	"Germany",
	"France",
	"Netherlands",
	"Switzerland",
	"Singapore",
	"Japan",
	"South Korea",
	"Sweden",
	"Denmark",
	"Norway",
	"Finland",
	"Austria",
	"Belgium",
	"Italy",
	"Spain",
	"Portugal",
	"New Zealand",
	"Ireland",
	"Luxembourg",
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

	// Delete in order to avoid foreign key constraints
	try {
		await prismaClient.application.deleteMany({});
		await prismaClient.postJob.deleteMany({});
		await prismaClient.postScholarship.deleteMany({});
		await prismaClient.postProgram.deleteMany({});
		await prismaClient.post.deleteMany({});
		await prismaClient.user.deleteMany({});
	} catch (error) {
		console.warn("Some tables might not exist yet:", error);
	}

	console.log("✅ Database cleaned successfully");
}

async function seedUsers() {
	console.log("👥 Seeding users...");

	const users = [];
	for (let i = 1; i <= 200; i++) {
		users.push({
			id: `user-${i}`,
			name: `Test User ${i}`,
			email: `user${i}@test.com`,
			emailVerified: true,
		});
	}

	await prismaClient.user.createMany({
		data: users,
	});

	console.log("✅ 200 Users seeded successfully");
}

async function seedPrograms() {
	console.log("🎓 Seeding programs...");

	const programPosts = [];
	const programDetails = [];

	// Create 130 program posts for better pagination testing
	for (let i = 1; i <= 130; i++) {
		const field = getRandomElement(fields);
		const university = getRandomElement(universities);
		const degreeLevel = getRandomElement(degreeLevels);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		programPosts.push({
			id: `prog-${i}`,
			title: `${degreeLevel} in ${field}`,
			content: generateProgramDescription(field, university),
			published: true,
			authorId: "user-1",
			createdAt,
		});

		programDetails.push({
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
			gpa: Math.round((Math.random() * 1.0 + 3.0) * 100) / 100, // GPA between 3.0 and 4.0
			gre: Math.floor(Math.random() * 140) + 260, // GRE score between 260-400
			gmat: Math.floor(Math.random() * 200) + 400, // GMAT score between 400-600
			tuition_fee: Math.floor(Math.random() * 50000) + 10000, // Fee between $10,000-$60,000
			fee_description:
				"Per academic year, includes tuition and mandatory fees",
			scholarship_info:
				"Merit-based scholarships available for qualified students",
		});
	}

	await prismaClient.post.createMany({
		data: programPosts,
	});

	await prismaClient.postProgram.createMany({
		data: programDetails,
	});

	console.log(`✅ ${programPosts.length} Programs seeded successfully`);
}

async function seedScholarships() {
	console.log("💰 Seeding scholarships...");

	const scholarshipPosts = [];
	const scholarshipDetails = [];

	// Create 50 scholarship posts
	for (let i = 1; i <= 50; i++) {
		const field = getRandomElement(fields);
		const provider = getRandomElement(providers);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		scholarshipPosts.push({
			id: `schol-${i}`,
			title: `${provider} - ${field} Excellence Award`,
			content: generateScholarshipDescription(provider, field),
			published: true,
			authorId: "user-1",
			createdAt,
		});

		scholarshipDetails.push({
			PostId: `schol-${i}`,
			type: getRandomElement([
				"Merit-based",
				"Need-based",
				"Diversity",
				"Research",
				"Athletic",
			]),
			grant: `$${Math.floor(Math.random() * 40000) + 10000} per year`,
			essay_required: Math.random() > 0.5,
			eligibility: `GPA ${(Math.random() * 0.5 + 3.5).toFixed(1)}+, ${field} major preferred`,
			detail: `Renewable scholarship supporting ${field} students with academic excellence`,
			number: Math.floor(Math.random() * 30) + 5, // 5-35 awards available
		});
	}

	await prismaClient.post.createMany({
		data: scholarshipPosts,
	});

	await prismaClient.postScholarship.createMany({
		data: scholarshipDetails,
	});

	console.log(
		`✅ ${scholarshipPosts.length} Scholarships seeded successfully`
	);
}

async function seedResearch() {
	console.log("🔬 Seeding research positions...");

	const researchPosts = [];
	const researchDetails = [];

	// Create 75 research positions
	for (let i = 1; i <= 75; i++) {
		const field = getRandomElement(fields);
		const jobType = getRandomElement(jobTypes);
		const university = getRandomElement(universities);
		const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());

		researchPosts.push({
			id: `research-${i}`,
			title: `${jobType} - ${field} Research Lab`,
			content: generateResearchDescription(jobType, field),
			published: true,
			authorId: "user-1",
			createdAt,
		});

		const isHourly =
			jobType.includes("Undergraduate") || jobType.includes("Part-time");
		const minSalary = isHourly
			? Math.floor(Math.random() * 10) + 15 // $15-25/hour
			: Math.floor(Math.random() * 30000) + 35000; // $35k-65k/year
		const maxSalary = isHourly
			? minSalary + Math.floor(Math.random() * 10) + 5
			: minSalary + Math.floor(Math.random() * 20000) + 10000;

		researchDetails.push({
			PostId: `research-${i}`,
			job_type: jobType,
			contract_type: getRandomElement([
				"Full-time",
				"Part-time",
				"Contract",
				"Temporary",
			]),
			min_salary: minSalary,
			max_salary: maxSalary,
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
		});
	}

	await prismaClient.post.createMany({
		data: researchPosts,
	});

	await prismaClient.postJob.createMany({
		data: researchDetails,
	});

	console.log(
		`✅ ${researchPosts.length} Research positions seeded successfully`
	);
}

async function seedApplications() {
	console.log("📄 Seeding applications...");

	const applications = [];

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

		applications.push({
			id: `app-${i + 1}`,
			postId: randomPostId,
			applicantId: randomUserId,
			submittedAt: getRandomDate(new Date(2023, 6, 1), new Date()), // Random date in last 6 months
			status: getRandomElement([
				"pending",
				"approved",
				"rejected",
				"under_review",
			]),
		});
	}

	await prismaClient.application.createMany({
		data: applications,
	});

	console.log(`✅ ${applications.length} Applications seeded successfully`);
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
