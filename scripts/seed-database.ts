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

async function cleanDatabase() {
	// eslint-disable-next-line no-console
	console.log("🗑️  Cleaning existing data...");

	// Delete in order to avoid foreign key constraints - handle tables that might not exist
	try {
		await prismaClient.application.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		await prismaClient.postJob.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		await prismaClient.postScholarship.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		await prismaClient.postProgram.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		await prismaClient.post.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		// await prismaClient.institutionProfile.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}
	try {
		await prismaClient.user.deleteMany({});
	} catch (error) {
		// Ignore if table doesn't exist
	}

	// eslint-disable-next-line no-console
	console.log("✅ Database cleaned successfully");
}

async function seedUsers() {
	// eslint-disable-next-line no-console
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

	// eslint-disable-next-line no-console
	console.log("✅ 200 Users seeded successfully");
}

// Helper functions for generating realistic data
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

async function seedPrograms() {
	// eslint-disable-next-line no-console
	console.log("🎓 Seeding programs...");

	const programPosts = [];
	const programDetails = [];

	// Create 50 program posts for better pagination testing
	for (let i = 1; i <= 50; i++) {
		const field = getRandomElement(fields);
		const university = getRandomElement(universities);
		const degreeLevel = getRandomElement(degreeLevels);
		const country = getRandomElement(countries);
		const createdAt = new Date(
			Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
		); // Random date within last year

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
			professor_name: `Prof. ${getRandomElement(["Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor"])}`,
			gpa: Math.random() * 1.0 + 3.0, // GPA between 3.0 and 4.0
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

	// eslint-disable-next-line no-console
	console.log("✅ Programs seeded successfully");
}

async function seedScholarships() {
	// eslint-disable-next-line no-console
	console.log("💰 Seeding scholarships...");

	// Create scholarship posts
	await prismaClient.post.createMany({
		data: [
			{
				id: "schol-1",
				title: "Presidential Excellence Scholarship",
				content:
					"Full tuition scholarship for exceptional students demonstrating academic excellence, leadership, and community service.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "schol-2",
				title: "STEM Diversity Fellowship",
				content:
					"Supporting underrepresented minorities in STEM fields. Includes mentorship and research opportunities.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "schol-3",
				title: "International Student Merit Award",
				content:
					"Merit-based scholarship for outstanding international students pursuing graduate studies.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "schol-4",
				title: "Women in Technology Grant",
				content:
					"Supporting women pursuing degrees in computer science, engineering, and related technology fields.",
				published: true,
				authorId: "admin-1",
			},
		],
	});

	// Create PostScholarship data
	await prismaClient.postScholarship.createMany({
		data: [
			{
				PostId: "schol-1",
				type: "Merit-based",
				grant: "$75,000 per year",
				essay_required: true,
				eligibility:
					"GPA 3.8+, leadership experience, community service",
				detail: "Full tuition coverage for up to 4 years of undergraduate study",
				number: 10,
			},
			{
				PostId: "schol-2",
				type: "Diversity Fellowship",
				grant: "$50,000 plus research stipend",
				essay_required: true,
				eligibility: "Underrepresented minority in STEM, GPA 3.5+",
				detail: "Fellowship includes mentorship program and summer research",
				number: 15,
			},
			{
				PostId: "schol-3",
				type: "International Merit",
				grant: "$40,000 per year",
				essay_required: false,
				eligibility: "International student, GPA 3.7+, TOEFL 100+",
				detail: "Renewable scholarship for graduate students",
				number: 20,
			},
			{
				PostId: "schol-4",
				type: "Gender Diversity",
				grant: "$30,000 per year",
				essay_required: true,
				eligibility: "Female student in technology field, GPA 3.6+",
				detail: "Supports women in STEM with networking opportunities",
				number: 25,
			},
		],
	});

	// eslint-disable-next-line no-console
	console.log("✅ Scholarships seeded successfully");
}

async function seedResearch() {
	// eslint-disable-next-line no-console
	console.log("🔬 Seeding research positions...");

	// Create research posts
	await prismaClient.post.createMany({
		data: [
			{
				id: "research-1",
				title: "PhD Research Assistant - Machine Learning Lab",
				content:
					"Join our cutting-edge ML research lab working on neural networks, computer vision, and AI safety. Competitive stipend and benefits.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "research-2",
				title: "Postdoctoral Researcher - Biotechnology Institute",
				content:
					"Research position in gene therapy and CRISPR technology. Collaborate with leading scientists in breakthrough medical research.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "research-3",
				title: "Undergraduate Research Opportunity - Data Science",
				content:
					"Paid research position for undergraduate students. Work on real-world data science projects with faculty mentorship.",
				published: true,
				authorId: "admin-1",
			},
			{
				id: "research-4",
				title: "Research Scientist - Quantum Computing Lab",
				content:
					"Full-time research position developing quantum algorithms and quantum machine learning applications.",
				published: true,
				authorId: "admin-1",
			},
		],
	});

	// Create PostJob data
	await prismaClient.postJob.createMany({
		data: [
			{
				PostId: "research-1",
				job_type: "Research Assistant",
				contract_type: "Full-time",
				min_salary: 35000,
				max_salary: 40000,
				other_requirement:
					"Strong programming skills in Python/PyTorch",
			},
			{
				PostId: "research-2",
				job_type: "Postdoctoral Researcher",
				contract_type: "Full-time",
				min_salary: 65000,
				max_salary: 75000,
				other_requirement:
					"PhD in Biology, Chemistry, or related field",
			},
			{
				PostId: "research-3",
				job_type: "Undergraduate Researcher",
				contract_type: "Part-time",
				min_salary: 20,
				max_salary: 25,
				other_requirement: "Currently enrolled undergraduate, GPA 3.5+",
			},
			{
				PostId: "research-4",
				job_type: "Research Scientist",
				contract_type: "Full-time",
				min_salary: 120000,
				max_salary: 150000,
				other_requirement:
					"PhD in Physics, Computer Science, or Mathematics",
			},
		],
	});

	// eslint-disable-next-line no-console
	console.log("✅ Research positions seeded successfully");
}

async function seedApplications() {
	// eslint-disable-next-line no-console
	console.log("📄 Seeding applications...");

	const applications = [];
	const postIds = [
		"prog-1",
		"prog-2",
		"prog-3",
		"prog-4",
		"prog-5",
		"schol-1",
		"schol-2",
		"schol-3",
		"schol-4",
		"research-1",
		"research-2",
		"research-3",
		"research-4",
	];

	// Create random applications for popularity testing
	for (let i = 0; i < 50; i++) {
		const randomPostId =
			postIds[Math.floor(Math.random() * postIds.length)];
		applications.push({
			id: `app-${i + 1}`,
			postId: randomPostId,
			applicantId: `user-${i + 1}`,
			submittedAt: new Date(
				Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
			), // Random date within last 30 days
			status: ["pending", "approved", "rejected"][
				Math.floor(Math.random() * 3)
			],
		});
	}

	await prismaClient.application.createMany({
		data: applications,
	});

	// eslint-disable-next-line no-console
	console.log("✅ Applications seeded successfully");
}

async function main() {
	try {
		await cleanDatabase();
		await seedUsers();
		await seedPrograms();
		await seedScholarships();
		await seedResearch();
		await seedApplications();

		// eslint-disable-next-line no-console
		console.log("🎉 Database seeding completed successfully!");
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error seeding database:", error);
		throw error;
	} finally {
		await prismaClient.$disconnect();
	}
}

main().catch(async (e) => {
	// eslint-disable-next-line no-console
	console.error(e);
	await prismaClient.$disconnect();
	process.exit(1);
});
