/* eslint-disable no-console */
import { prismaClient } from "../prisma/index";

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
	"Environmental Science",
	"Engineering",
	"Medicine",
	"Law",
	"Education",
	"Architecture",
	"Design",
	"Arts",
	"Literature",
	"History",
	"Philosophy",
	"Linguistics",
	"Anthropology",
	"Geography",
	"Geology",
	"Astronomy",
	"Neuroscience",
	"Biotechnology",
	"Robotics",
	"Quantum Computing",
];

const countries = [
	"United States",
	"United Kingdom",
	"Canada",
	"Australia",
	"Germany",
	"Switzerland",
	"Japan",
	"South Korea",
	"Singapore",
	"Netherlands",
	"Sweden",
	"Norway",
	"Denmark",
	"Finland",
	"France",
	"Italy",
	"Spain",
	"Portugal",
	"Belgium",
	"Austria",
	"New Zealand",
	"Ireland",
	"Iceland",
	"Luxembourg",
	"Malta",
	"Cyprus",
	"Estonia",
	"Latvia",
	"Lithuania",
	"Slovenia",
	"Slovakia",
	"Czech Republic",
	"Poland",
	"Hungary",
	"Croatia",
	"Romania",
	"Bulgaria",
	"Greece",
	"Turkey",
	"Israel",
	"United Arab Emirates",
	"Qatar",
	"Kuwait",
	"Bahrain",
	"Oman",
	"Saudi Arabia",
	"South Africa",
	"Brazil",
	"Argentina",
	"Chile",
	"Mexico",
	"Colombia",
	"Peru",
	"Uruguay",
	"Paraguay",
	"Ecuador",
	"Bolivia",
	"Venezuela",
	"Guyana",
	"Suriname",
	"French Guiana",
	"China",
	"India",
	"Thailand",
	"Malaysia",
	"Indonesia",
	"Philippines",
	"Vietnam",
	"Cambodia",
	"Laos",
	"Myanmar",
	"Bangladesh",
	"Sri Lanka",
	"Nepal",
	"Bhutan",
	"Maldives",
	"Pakistan",
	"Afghanistan",
	"Iran",
	"Iraq",
	"Jordan",
	"Lebanon",
	"Syria",
	"Yemen",
	"Oman",
	"Kuwait",
	"Bahrain",
	"Qatar",
	"United Arab Emirates",
	"Saudi Arabia",
	"Egypt",
	"Libya",
	"Tunisia",
	"Algeria",
	"Morocco",
	"Sudan",
	"Ethiopia",
	"Kenya",
	"Uganda",
	"Tanzania",
	"Rwanda",
	"Burundi",
	"Democratic Republic of the Congo",
	"Republic of the Congo",
	"Central African Republic",
	"Chad",
	"Cameroon",
	"Nigeria",
	"Niger",
	"Mali",
	"Burkina Faso",
	"Ivory Coast",
	"Ghana",
	"Togo",
	"Benin",
	"Senegal",
	"Gambia",
	"Guinea-Bissau",
	"Guinea",
	"Sierra Leone",
	"Liberia",
	"Cape Verde",
	"Mauritania",
	"Madagascar",
	"Mauritius",
	"Seychelles",
	"Comoros",
	"Malawi",
	"Zambia",
	"Zimbabwe",
	"Botswana",
	"Namibia",
	"South Africa",
	"Lesotho",
	"Swaziland",
	"Mozambique",
	"Angola",
	"Gabon",
	"Equatorial Guinea",
	"São Tomé and Príncipe",
	"Russia",
	"Ukraine",
	"Belarus",
	"Moldova",
	"Romania",
	"Bulgaria",
	"Greece",
	"Turkey",
	"Georgia",
	"Armenia",
	"Azerbaijan",
	"Kazakhstan",
	"Uzbekistan",
	"Turkmenistan",
	"Tajikistan",
	"Kyrgyzstan",
	"Mongolia",
	"China",
	"North Korea",
	"South Korea",
	"Japan",
	"Taiwan",
	"Hong Kong",
	"Macau",
	"Vietnam",
	"Laos",
	"Cambodia",
	"Thailand",
	"Malaysia",
	"Singapore",
	"Brunei",
	"Indonesia",
	"Philippines",
	"East Timor",
	"Papua New Guinea",
	"Solomon Islands",
	"Vanuatu",
	"Fiji",
	"Tonga",
	"Samoa",
	"Kiribati",
	"Tuvalu",
	"Nauru",
	"Palau",
	"Marshall Islands",
	"Micronesia",
	"New Zealand",
	"Australia",
];

const degreeLevels = [
	"Bachelor",
	"Master",
	"PhD",
	"Certificate",
	"Diploma",
	"Associate",
	"Postgraduate",
	"Undergraduate",
	"Graduate",
	"Doctorate",
];

const jobTypes = [
	"Full-time",
	"Part-time",
	"Contract",
	"Internship",
	"Research Assistant",
	"Teaching Assistant",
	"Graduate Assistant",
	"Postdoc",
	"Visiting Scholar",
	"Consultant",
];

const contractTypes = [
	"Permanent",
	"Fixed-term",
	"Temporary",
	"Project-based",
	"Seasonal",
	"Freelance",
	"Consulting",
	"Volunteer",
	"Unpaid",
	"Stipend",
];

const scholarshipTypes = [
	"Merit-based",
	"Need-based",
	"Academic Excellence",
	"Research Grant",
	"Travel Grant",
	"Conference Grant",
	"Publication Grant",
	"Equipment Grant",
	"Living Allowance",
	"Tuition Waiver",
	"Full Scholarship",
	"Partial Scholarship",
	"Government Scholarship",
	"Private Foundation",
	"Corporate Sponsorship",
	"International Organization",
	"Research Council",
	"Cultural Exchange Program",
	"Athletic Scholarship",
	"Need-based Grant",
];

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

async function cleanDatabase() {
	console.log("🗑️  Cleaning existing data...");

	// Delete in order to avoid foreign key constraints
	try {
		// Delete dependent records first
		// Delete dependent records first
		await prismaClient.applicationDetail.deleteMany({});
		await prismaClient.application.deleteMany({});
		await prismaClient.wishlist.deleteMany({});
		await prismaClient.message.deleteMany({});
		await prismaClient.notification.deleteMany({});
		await prismaClient.jobPost.deleteMany({});
		await prismaClient.programPost.deleteMany({});
		await prismaClient.scholarshipPost.deleteMany({});
		await prismaClient.opportunityPost.deleteMany({});
		await prismaClient.subscription.deleteMany({});
		await prismaClient.applicantDocument.deleteMany({});
		await prismaClient.institutionDocument.deleteMany({});

		// Delete records that reference applicants before deleting applicants
		await prismaClient.applicantInterest.deleteMany({});
		await prismaClient.applicantSubscription.deleteMany({});
		await prismaClient.supportRequirement.deleteMany({
			where: { applicant_id: { not: null } },
		});

		// Delete profiles before sub_disciplines (since profiles reference sub_disciplines)
		await prismaClient.applicant.deleteMany({});
		await prismaClient.institution.deleteMany({});

		// Delete Better Auth related tables
		await prismaClient.session.deleteMany({});
		await prismaClient.verification.deleteMany({});
		await prismaClient.account.deleteMany({});

		// Delete users before roles (since users reference roles)
		await prismaClient.user.deleteMany({});

		// Delete main entities
		await prismaClient.subdiscipline.deleteMany({});
		await prismaClient.discipline.deleteMany({});
		await prismaClient.plan.deleteMany({});
		await prismaClient.role.deleteMany({});

		console.log("✅ Database cleaned successfully");
	} catch (error) {
		console.error("Error cleaning database:", error);
		throw error;
	}
}

async function seedRoles() {
	console.log("👤 Seeding roles...");

	const roles = [
		{
			role_id: "1",
			name: "student",
			status: true,
		},
		{
			role_id: "2",
			name: "institution",
			status: true,
		},
		{
			role_id: "3",
			name: "admin",
			status: true,
		},
	];

	await prismaClient.role.createMany({
		data: roles,
	});

	console.log("✅ Roles seeded successfully");
}

async function seedPlans() {
	console.log("📋 Seeding plans...");

	const plans = [
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440101",
			name: "Basic Plan",
			description: "Basic plan for students",
			month_price: 0,
			year_price: 0,
			status: true,
			create_at: new Date(),
			type: false,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440102",
			name: "Premium Plan",
			description: "Premium plan for students",
			month_price: 10,
			year_price: 100,
			status: true,
			create_at: new Date(),
			type: false,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440103",
			name: "Enterprise Plan",
			description: "Enterprise plan for institutions",
			month_price: 50,
			year_price: 500,
			status: true,
			create_at: new Date(),
			type: true,
		},
	];

	await prismaClient.plan.createMany({
		data: plans,
	});

	console.log("✅ Plans seeded successfully");
}

async function seedDisciplines() {
	console.log("📚 Seeding disciplines...");

	const disciplines = fields.map((field, index) => ({
		discipline_id: (index + 1).toString(),
		name: field,
		status: true,
	}));

	await prismaClient.discipline.createMany({
		data: disciplines,
	});

	console.log("✅ Disciplines seeded successfully");
}

async function seedSubdisciplines() {
	console.log("📖 Seeding subdisciplines...");

	const subdisciplines = [];

	// Create subdisciplines for each discipline
	for (let i = 0; i < fields.length; i++) {
		const discipline = fields[i];
		const numSubdisciplines = Math.floor(Math.random() * 5) + 2; // 2-6 subdisciplines per discipline

		for (let j = 0; j < numSubdisciplines; j++) {
			subdisciplines.push({
				subdiscipline_id: (subdisciplines.length + 1).toString(), // Explicitly set id
				discipline_id: (i + 1).toString(), // Use integer discipline ID
				name: `${discipline} - Specialization ${j + 1}`,
				status: true,
			});
		}
	}

	await prismaClient.subdiscipline.createMany({
		data: subdisciplines,
	});

	console.log("✅ Subdisciplines seeded successfully");
}

async function seedUsers() {
	console.log("👥 Seeding users...");

	const users = [];

	// Create student users (10 students)
	for (let i = 1; i <= 10; i++) {
		users.push({
			id: `user-${i.toString().padStart(3, "0")}`,
			name: `Student ${i}`,
			email: `student${i}@test.com`,
			emailVerified: true,
			image: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`,
			role: "student",
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-01-01")
			),
			updatedAt: new Date(),
		});
	}

	// Create institution users (10 institutions)
	for (let i = 11; i <= 20; i++) {
		users.push({
			id: `user-${i.toString().padStart(3, "0")}`,
			name: `Institution ${i - 10}`,
			email: `institution${i - 10}@test.com`,
			emailVerified: true,
			image: `https://api.dicebear.com/7.x/avataaars/svg?seed=institution${i - 10}`,
			role: "institution",
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-01-01")
			),
			updatedAt: new Date(),
		});
	}

	// Create admin users (10 admins)
	for (let i = 21; i <= 30; i++) {
		users.push({
			id: `user-${i.toString().padStart(3, "0")}`,
			name: `Admin ${i - 20}`,
			email: `admin${i - 20}@test.com`,
			emailVerified: true,
			image: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${i - 20}`,
			role: "admin",
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-01-01")
			),
			updatedAt: new Date(),
		});
	}

	await prismaClient.user.createMany({
		data: users,
	});

	console.log(
		"✅ 30 Users seeded successfully (10 students + 10 institutions + 10 admins)"
	);
}

async function seedApplicants() {
	console.log("🎓 Seeding student profiles...");

	const studentProfiles = [];
	for (let i = 1; i <= 10; i++) {
		studentProfiles.push({
			applicant_id: `user-${i.toString().padStart(3, "0")}`, // Use user ID as profile ID
			user_id: `user-${i.toString().padStart(3, "0")}`, // Link to user account
			first_name: `John`,
			last_name: `Doe${i}`,
			birthday: getRandomDate(
				new Date("1990-01-01"),
				new Date("2005-01-01")
			),
			gender: Math.random() > 0.5, // true for male, false for female
			phone_number: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			graduated: Math.random() > 0.5,
			level: getRandomElement([
				"High School",
				"Bachelor",
				"Master",
				"PhD",
			]),
			university: getRandomElement(universities),
			gpa: Math.random() * 2 + 2.5, // 2.5-4.5 GPA
			subdiscipline_id: (Math.floor(Math.random() * 100) + 1).toString(),
			favorite_countries: [getRandomElement(countries)],
		});
	}

	await prismaClient.applicant.createMany({
		data: studentProfiles,
	});

	console.log("✅ 10 Student profiles seeded successfully");
}

async function seedInstitutions() {
	console.log("🏛️ Seeding institution profiles...");

	const institutionProfiles = [];
	for (let i = 1; i <= 10; i++) {
		const university = getRandomElement(universities);
		institutionProfiles.push({
			institution_id: `user-${(i + 10).toString().padStart(3, "0")}`, // Link to user account (users 11-20)
			user_id: `user-${(i + 10).toString().padStart(3, "0")}`,
			logo: `https://api.dicebear.com/7.x/initials/svg?seed=${university}`,
			name: university,
			abbreviation: university
				.split(" ")
				.map((word) => word[0])
				.join("")
				.substring(0, 5),
			hotline: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			type: getRandomElement([
				"University",
				"College",
				"Research Institute",
				"Technical School",
			]),
			website: `https://${university.toLowerCase().replace(/\s+/g, "")}.edu`,
			country: getRandomElement(countries),
			address: `${Math.floor(Math.random() * 9999) + 1} University Ave, City, ${getRandomElement(countries)}`,
			rep_name: `Dr. ${getRandomElement(["John", "Jane", "Michael", "Sarah", "David", "Lisa"])} ${getRandomElement(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"])}`,
			rep_appellation: "Dr.", // This seems to be a schema error, using dummy date
			rep_position: getRandomElement([
				"Dean",
				"Director",
				"President",
				"Vice President",
				"Head of Department",
			]),
			rep_email: `rep${i}@${university.toLowerCase().replace(/\s+/g, "")}.edu`,
			rep_phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			about: `Leading educational institution specializing in research and academic excellence. ${university} is committed to providing world-class education and fostering innovation.`,
			cover_image: `https://api.dicebear.com/7.x/shapes/svg?seed=${university}`,
		});
	}

	for (const profile of institutionProfiles) {
		await prismaClient.institution.create({
			data: profile,
		});
	}

	console.log("✅ 10 Institution profiles seeded successfully");
}

async function seedOpportunityPosts() {
	console.log("📝 Seeding opportunity posts...");

	const posts = [];
	const now = new Date();

	for (let i = 1; i <= 200; i++) {
		const field = getRandomElement(fields);
		const university = getRandomElement(universities);

		// 70% PUBLISHED, 30% DRAFT
		const status: "PUBLISHED" | "DRAFT" =
			Math.random() < 0.7 ? "PUBLISHED" : "DRAFT";

		// Create random start_date in the past (within last 30 days)
		const startDate = new Date(
			now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
		);

		// Create end_date between 30 to 180 days in the future from start_date
		const daysUntilDeadline = Math.floor(Math.random() * 150) + 30; // 30-180 days
		const endDate = new Date(
			startDate.getTime() + daysUntilDeadline * 24 * 60 * 60 * 1000
		);

		posts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			title: `${university} ${field} Program`,
			start_date: startDate,
			end_date: endDate,
			create_at: startDate,
			institution_id: `user-${(Math.floor(Math.random() * 10) + 11).toString().padStart(3, "0")}`,
			status: status,
		});
	}

	await prismaClient.opportunityPost.createMany({
		data: posts,
	});

	const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
	const draftCount = posts.filter((p) => p.status === "DRAFT").length;

	console.log(
		`✅ 200 Opportunity posts seeded successfully (${publishedCount} PUBLISHED, ${draftCount} DRAFT)`
	);
}

async function seedProgramPosts() {
	console.log("🎓 Seeding program posts...");

	const programPosts = [];
	for (let i = 1; i <= 100; i++) {
		programPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			duration: `${Math.floor(Math.random() * 4) + 1} years`,
			degree_level: getRandomElement(["Bachelor", "Master", "PhD"]),
			course_include: `Core courses in ${getRandomElement(fields)}, electives, research project, thesis`,
			gpa: Math.random() * 2 + 2.5, // 2.5-4.5 GPA
			gre: Math.floor(Math.random() * 200) + 300, // 300-500 GRE
			gmat: Math.floor(Math.random() * 200) + 500, // 500-700 GMAT
			tuition_fee: Math.floor(Math.random() * 50000) + 10000, // $10k-$60k
			fee_description:
				"Tuition fees include all academic costs, library access, and student services",
			scholarship_info:
				"Various scholarship opportunities available for qualified students",
			attendance: getRandomElement(["Full-time", "Part-time"]),
		});
	}

	await prismaClient.programPost.createMany({
		data: programPosts,
	});

	console.log("✅ 100 Program posts seeded successfully");
}

async function seedScholarshipPosts() {
	console.log("💰 Seeding scholarship posts...");

	const scholarshipPosts = [];
	for (let i = 101; i <= 150; i++) {
		scholarshipPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			description: `Scholarship for ${getRandomElement(fields)} students`,
			type: getRandomElement(scholarshipTypes),
			number: Math.floor(Math.random() * 50) + 1,
			grant: `$${Math.floor(Math.random() * 50000) + 5000}`,
			scholarship_coverage: getRandomElement([
				"Full",
				"Partial",
				"Tuition Only",
				"Living Expenses",
			]),
			essay_required: Math.random() > 0.5,
			eligibility:
				"Open to all qualified students with strong academic record",
		});
	}

	await prismaClient.scholarshipPost.createMany({
		data: scholarshipPosts,
	});

	console.log("✅ 50 Scholarship posts seeded successfully");
}

async function seedJobPosts() {
	console.log("💼 Seeding job posts...");

	const jobPosts = [];
	for (let i = 151; i <= 200; i++) {
		jobPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			contract_type: getRandomElement(contractTypes),
			job_type: getRandomElement(jobTypes),
			min_salary: Math.floor(Math.random() * 50000) + 30000, // $30k-$80k
			max_salary: Math.floor(Math.random() * 100000) + 80000, // $80k-$180k
			salary_description: "Competitive salary with benefits package",
			benefit:
				"Health insurance, retirement plan, professional development",
			main_responsibility: `Research and development in ${getRandomElement(fields)}`,
			qualification_requirement:
				"PhD or Master's degree in relevant field",
			experience_requirement: `${Math.floor(Math.random() * 5) + 1} years of experience`,
			assessment_criteria:
				"Academic excellence, research potential, communication skills",
			other_requirement: "Strong analytical and problem-solving skills",
			attendance: getRandomElement(["Full-time", "Part-time"]),
		});
	}

	await prismaClient.jobPost.createMany({
		data: jobPosts,
	});

	console.log("✅ 50 Job posts seeded successfully");
}

async function seedWishlists() {
	console.log("❤️ Seeding wishlists...");

	const wishlists = [];
	const usedCombinations = new Set();

	for (let i = 1; i <= 100; i++) {
		const numWishlistItems = Math.floor(Math.random() * 10) + 1; // 1-10 items per user

		for (let j = 0; j < numWishlistItems; j++) {
			let applicantId, postId, combination;
			do {
				applicantId = `user-${String(Math.floor(Math.random() * 10) + 1).padStart(3, "0")}`;
				postId = `post-opportunity-${String(Math.floor(Math.random() * 200) + 1).padStart(4, "0")}`;
				combination = `${applicantId}-${postId}`;
			} while (usedCombinations.has(combination));

			usedCombinations.add(combination);
			wishlists.push({
				applicant_id: applicantId,
				post_id: postId,
				add_at: new Date(),
			});
		}
	}

	await prismaClient.wishlist.createMany({
		data: wishlists,
	});

	console.log("✅ Wishlists seeded successfully");
}

async function seedApplications() {
	console.log("📋 Seeding applications...");

	const applications = [];
	for (let i = 1; i <= 5; i++) {
		applications.push({
			application_id: `application-${i.toString().padStart(4, "0")}`,
			post_id: `post-opportunity-${String(Math.floor(Math.random() * 200) + 1).padStart(4, "0")}`,
			applicant_id: `user-${String(Math.floor(Math.random() * 10) + 1).padStart(3, "0")}`,
			apply_at: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-01-01")
			),
		});
	}

	await prismaClient.application.createMany({
		data: applications,
	});

	console.log("✅ Applications seeded successfully");
}

async function seedNotifications() {
	console.log("🔔 Seeding notifications...");

	const notifications = [];
	for (let i = 1; i <= 100; i++) {
		notifications.push({
			notification_id: `notification-${i.toString().padStart(4, "0")}`,
			user_id: `user-${String(Math.floor(Math.random() * 30) + 1).padStart(3, "0")}`,
			title: `Notification ${i}`,
			body: `This is a test notification for user ${i}`,
			type: "GENERAL",
			url: `https://example.com/notification/${i}`,
			send_at: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-01-01")
			),
		});
	}

	await prismaClient.notification.createMany({
		data: notifications,
	});

	console.log("✅ 100 Notifications seeded successfully");
}

async function main() {
	console.log("🌱 Starting comprehensive database seeding...");

	try {
		await cleanDatabase();
		await seedRoles();
		await seedPlans();
		await seedDisciplines();
		await seedSubdisciplines();
		await seedUsers();
		await seedApplicants();
		await seedInstitutions();
		await seedOpportunityPosts();
		await seedProgramPosts();
		await seedScholarshipPosts();
		await seedJobPosts();
		await seedWishlists();
		await seedApplications();
		await seedNotifications();

		console.log("🎉 Database seeding completed successfully!");
		console.log("📊 Summary:");
		console.log("   - 3 Roles (student, institution, admin)");
		console.log("   - 3 Plans");
		console.log("   - 40 Disciplines");
		console.log("   - 100+ Subdisciplines");
		console.log(
			"   - 30 Users (10 students + 10 institutions + 10 admins)"
		);
		console.log("   - 10 Applicant Profiles");
		console.log("   - 10 Institution Profiles");
		console.log("   - 200 Opportunity Posts");
		console.log("   - 100 Program Posts");
		console.log("   - 50 Scholarship Posts");
		console.log("   - 50 Job Posts");
		console.log("   - Wishlist items");
		console.log("   - 50 Applications");
		console.log("   - 100 Notifications");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		process.exit(1);
	} finally {
		await prismaClient.$disconnect();
	}
}

main();
