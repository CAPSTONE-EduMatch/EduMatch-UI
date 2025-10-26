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
	"Information Systems",
	"Business Administration",
	"Economics",
	"Finance",
	"Marketing",
	"International Business",
	"Management",
	"Accounting",
	"Biology",
	"Chemistry",
	"Physics",
	"Mathematics",
	"Statistics",
	"Environmental Science",
	"Biotechnology",
	"Genetics",
	"Biochemistry",
	"Molecular Biology",
	"Psychology",
	"Sociology",
	"Political Science",
	"International Relations",
	"Public Policy",
	"Anthropology",
	"Engineering",
	"Mechanical Engineering",
	"Electrical Engineering",
	"Civil Engineering",
	"Chemical Engineering",
	"Biomedical Engineering",
	"Materials Science",
	"Medicine",
	"Public Health",
	"Nursing",
	"Pharmacy",
	"Dentistry",
	"Law",
	"Education",
	"Educational Psychology",
	"Architecture",
	"Urban Planning",
	"Design",
	"Arts",
	"Fine Arts",
	"Performing Arts",
	"Literature",
	"History",
	"Philosophy",
	"Linguistics",
	"Geography",
	"Geology",
	"Astronomy",
	"Neuroscience",
	"Robotics",
	"Quantum Computing",
	"Agricultural Science",
	"Communications",
	"Journalism",
	"Media Studies",
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

const attendanceTypes = [
	"Full-time",
	"Part-time",
	"Online",
	"Hybrid",
	"On-campus",
	"Distance Learning",
	"Evening",
	"Weekend",
];

const programDurations = [
	"Less than 1 year",
	"1 year",
	"1.5 years",
	"2 years",
	"2.5 years",
	"3 years",
	"4 years",
	"More than 4 years",
];

const researchAreas = [
	"Artificial Intelligence",
	"Machine Learning",
	"Deep Learning",
	"Natural Language Processing",
	"Computer Vision",
	"Data Science",
	"Big Data Analytics",
	"Cybersecurity",
	"Blockchain Technology",
	"Quantum Computing",
	"Internet of Things",
	"Cloud Computing",
	"Biotechnology",
	"Nanotechnology",
	"Materials Science",
	"Environmental Science",
	"Climate Change Research",
	"Renewable Energy",
	"Sustainable Development",
	"Biomedical Engineering",
	"Robotics",
	"Autonomous Systems",
	"Virtual Reality",
	"Augmented Reality",
	"Computational Biology",
	"Bioinformatics",
	"Genetics and Genomics",
	"Neuroscience",
	"Cognitive Science",
	"Space Technology",
	"Aerospace Engineering",
	"Energy Storage",
	"Smart Cities",
	"Digital Health",
	"Precision Medicine",
];

const labTypes = [
	"Computer Science Lab",
	"AI Research Lab",
	"Data Science Lab",
	"Robotics Lab",
	"Biomedical Research Lab",
	"Materials Science Lab",
	"Environmental Research Lab",
	"Neuroscience Lab",
	"Physics Lab",
	"Chemistry Lab",
	"Engineering Lab",
	"Biotechnology Lab",
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

async function cleanDatabase() {
	console.log("🗑️  Cleaning existing data...");

	// Delete in order to avoid foreign key constraints
	try {
		// Delete dependent records first
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

		// Delete records that reference applicants and institutions
		await prismaClient.applicantInterest.deleteMany({});
		await prismaClient.applicantSubscription.deleteMany({});
		await prismaClient.institutionSubdiscipline.deleteMany({});
		await prismaClient.institutionSubscription.deleteMany({});
		await prismaClient.supportRequirement.deleteMany({});

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
		await prismaClient.documentType.deleteMany({});
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
			priceId: "price_basic_monthly",
			name: "Basic Plan",
			description: "Basic plan for students",
			month_price: 0,
			year_price: 0,
			status: true,
			create_at: new Date(),
			type: 0,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440102",
			priceId: "price_premium_monthly",
			name: "Premium Plan",
			description: "Premium plan for students",
			month_price: 10,
			year_price: 100,
			status: true,
			create_at: new Date(),
			type: 0,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440103",
			priceId: "price_enterprise_monthly",
			name: "Enterprise Plan",
			description: "Enterprise plan for institutions",
			month_price: 50,
			year_price: 500,
			status: true,
			create_at: new Date(),
			type: 1,
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

async function seedDocumentTypes() {
	console.log("📄 Seeding document types...");

	const documentTypes = [
		{
			document_type_id: "1",
			name: "Research Proposal",
			description:
				"Upload your research proposal document here. This should outline your intended research methodology and objectives.",
		},
		{
			document_type_id: "2",
			name: "CV/Resume",
			description:
				"Upload your curriculum vitae or resume. Please ensure it includes your academic and professional experience.",
		},
		{
			document_type_id: "3",
			name: "Portfolio",
			description:
				"Upload your portfolio showcasing your work, projects, and achievements relevant to your field of study.",
		},
		{
			document_type_id: "4",
			name: "Academic Transcript",
			description:
				"Upload your official academic transcripts from previous institutions.",
		},
		{
			document_type_id: "5",
			name: "Personal Statement",
			description:
				"Upload your personal statement or statement of purpose explaining your academic goals and motivations.",
		},
		{
			document_type_id: "6",
			name: "Recommendation Letter",
			description:
				"Upload letters of recommendation from academic or professional references.",
		},
		{
			document_type_id: "7",
			name: "Language Certificate",
			description:
				"Upload language proficiency certificates (TOEFL, IELTS, etc.) if required.",
		},
		{
			document_type_id: "8",
			name: "Passport Copy",
			description:
				"Upload a copy of your passport for international applications.",
		},
		{
			document_type_id: "9",
			name: "Degree Certificate",
			description:
				"Upload your degree certificates or diplomas from completed academic programs.",
		},
		{
			document_type_id: "10",
			name: "Research Paper",
			description:
				"Upload your research papers, publications, or academic writing samples.",
		},
		{
			document_type_id: "11",
			name: "Institution Verification",
			description:
				"Upload documents verifying your institutional affiliation or enrollment status.",
		},
		{
			document_type_id: "12",
			name: "Required Documents",
			description:
				"Upload any other required documents as specified in the application requirements.",
		},
	];

	await prismaClient.documentType.createMany({
		data: documentTypes,
	});

	console.log("✅ 12 Document types seeded successfully");
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
		const country = getRandomElement(countries);

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
			location: `${university}, ${country}`,
			other_info: `This is a comprehensive ${field} program at ${university}. The program is designed to provide students with cutting-edge knowledge and practical skills in ${field}. Students will have access to state-of-the-art facilities, world-class faculty, and diverse research opportunities. The program emphasizes both theoretical foundations and practical applications, preparing graduates for successful careers in academia and industry.`,
			institution_id: `user-${(Math.floor(Math.random() * 10) + 11).toString().padStart(3, "0")}`,
			status: status,
			degree_level: getRandomElement(degreeLevels),
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
			duration: getRandomElement(programDurations),
			attendance: getRandomElement(attendanceTypes),
			course_include: `Core courses in ${getRandomElement(fields)}, electives, research project, thesis`,
			gpa: Math.random() * 2 + 2.5, // 2.5-4.5 GPA
			gre: Math.floor(Math.random() * 200) + 300, // 300-500 GRE
			gmat: Math.floor(Math.random() * 200) + 500, // 500-700 GMAT
			tuition_fee: Math.floor(Math.random() * 50000) + 10000, // $10k-$60k
			fee_description:
				"Tuition fees include all academic costs, library access, and student services",
			scholarship_info:
				"Various scholarship opportunities available for qualified students",
			language_requirement: getRandomElement([
				"IELTS 6.5 or TOEFL 90",
				"IELTS 7.0 or TOEFL 100",
				"IELTS 6.0 or TOEFL 80",
				"No language requirement",
				"Native English speaker or equivalent",
			]),
			professor_name: `Dr. ${getRandomElement(["John", "Jane", "Michael", "Sarah", "David", "Lisa"])} ${getRandomElement(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"])}`,
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
		const field = getRandomElement(fields);
		const scholarshipType = getRandomElement(scholarshipTypes);
		const grantAmount = Math.floor(Math.random() * 50000) + 5000;
		const coverage = getRandomElement([
			"Full",
			"Partial",
			"Tuition Only",
			"Living Expenses",
			"Research Costs",
		]);

		scholarshipPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			description: `${scholarshipType} scholarship for outstanding ${field} students. This scholarship supports students who demonstrate academic excellence and research potential in ${field}. Recipients will have access to mentorship opportunities and research resources.`,
			type: scholarshipType,
			number: Math.floor(Math.random() * 20) + 1, // 1-20 scholarships available
			grant: `$${grantAmount.toLocaleString()}`,
			scholarship_coverage: coverage,
			essay_required: Math.random() > 0.4, // 60% require essays
			eligibility: `Open to ${getRandomElement(degreeLevels)} students with strong academic record in ${field} or related fields. Minimum GPA requirement applies.`,
			award_amount: grantAmount,
			award_duration: getRandomElement([
				"1 year",
				"2 years",
				"3 years",
				"4 years",
				"Duration of study",
			]),
			renewable: Math.random() > 0.3, // 70% are renewable
		});
	}

	await prismaClient.scholarshipPost.createMany({
		data: scholarshipPosts,
	});

	console.log("✅ 50 Scholarship posts seeded successfully");
}

async function seedJobPosts() {
	console.log("💼 Seeding job posts (research labs)...");

	const jobPosts = [];
	for (let i = 151; i <= 200; i++) {
		const researchArea = getRandomElement(researchAreas);
		const labType = getRandomElement(labTypes);
		const university = getRandomElement(universities);
		const field = getRandomElement(fields);
		const isResearchLab = Math.random() > 0.3; // 70% are research labs, 30% are regular jobs

		const minSalary = Math.floor(Math.random() * 30000) + 30000; // $30k-$60k
		const maxSalary = minSalary + Math.floor(Math.random() * 50000) + 20000; // +$20k-$70k

		if (isResearchLab) {
			jobPosts.push({
				post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
				contract_type: getRandomElement([
					"Fixed-term",
					"Permanent",
					"Project-based",
					"Postdoc",
				]),
				job_type: getRandomElement([
					"Research Assistant",
					"Teaching Assistant",
					"Graduate Assistant",
					"Postdoc",
					"Research Scientist",
					"Lab Technician",
				]),
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description:
					"Competitive salary with comprehensive benefits package including health insurance and research funds",
				benefit:
					"Health insurance, research funding, conference travel support, professional development opportunities, laboratory access",
				main_responsibility: `Conduct cutting-edge research in ${researchArea}. Collaborate with interdisciplinary teams, publish research findings, and contribute to grant applications.`,
				qualification_requirement: `${getRandomElement(["PhD", "Master", "Bachelor"])} degree in ${field} or related field. Strong analytical and research skills required.`,
				experience_requirement: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} years of research experience`,
				assessment_criteria:
					"Research experience, publication record, technical skills, and potential for independent research",
				other_requirement:
					"Strong communication skills, ability to work independently and in teams, proficiency in relevant software/tools",
				attendance: getRandomElement(["Full-time", "Part-time"]),
				// Research lab specific fields
				lab_type: labType,
				lab_director: `Dr. ${getRandomElement(["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily"])} ${getRandomElement(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"])}`,
				lab_facilities: `State-of-the-art ${labType.toLowerCase()} with advanced equipment for ${researchArea.toLowerCase()} research. Clean rooms, high-performance computing cluster, and specialized instrumentation.`,
				lab_capacity: Math.floor(Math.random() * 20) + 5, // 5-25 people
				lab_website: `https://${researchArea.toLowerCase().replace(/\s+/g, "")}-lab.${university.toLowerCase().replace(/\s+/g, "")}.edu`,
				lab_contact_email: `lab-contact@${university.toLowerCase().replace(/\s+/g, "")}.edu`,
				research_areas: researchArea,
				research_focus: `Primary focus on ${researchArea} with applications in ${getRandomElement(["healthcare", "technology", "environment", "industry", "education"])}. We investigate novel approaches and develop innovative solutions.`,
				research_experience: `Minimum ${Math.floor(Math.random() * 3) + 1} years of experience in ${researchArea} or related fields`,
				research_proposal:
					Math.random() > 0.5
						? "Research proposal required as part of application"
						: null,
				academic_background: `Strong background in ${field}, ${getRandomElement(fields)}, or related discipline`,
				technical_skills: `Proficiency in ${getRandomElement(["Python", "R", "MATLAB", "C++", "Java"])}, ${getRandomElement(["machine learning", "data analysis", "statistical modeling", "experimental design"])}, and relevant research methodologies`,
				recommendations:
					Math.random() > 0.3
						? "3 letters of recommendation required"
						: "2 letters of recommendation required",
				application_documents:
					"CV, cover letter, research statement, transcripts, and letters of recommendation",
			});
		} else {
			// Regular job positions
			jobPosts.push({
				post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
				contract_type: getRandomElement(contractTypes),
				job_type: getRandomElement(jobTypes),
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description: "Competitive salary with benefits package",
				benefit:
					"Health insurance, retirement plan, professional development opportunities",
				main_responsibility: `Lead ${field} initiatives and contribute to innovative projects. Collaborate with cross-functional teams and drive strategic outcomes.`,
				qualification_requirement: `${getRandomElement(["PhD", "Master", "Bachelor"])} degree in ${field} or relevant field`,
				experience_requirement: `${Math.floor(Math.random() * 5) + 1} years of relevant experience`,
				assessment_criteria:
					"Academic excellence, relevant experience, technical skills, and communication abilities",
				other_requirement:
					"Strong analytical and problem-solving skills, ability to work in fast-paced environment",
				attendance: getRandomElement(["Full-time", "Part-time"]),
			});
		}
	}

	await prismaClient.jobPost.createMany({
		data: jobPosts,
	});

	console.log("✅ 50 Job posts (research labs) seeded successfully");
}

async function seedPostDocuments() {
	console.log("📎 Seeding post documents...");

	const postDocuments = [];

	// Định nghĩa các loại documents có thể yêu cầu
	const availableDocs = [
		{
			typeId: "1",
			name: "Research Proposal",
			description:
				"Upload a detailed research proposal outlining your research methodology and objectives",
		},
		{
			typeId: "2",
			name: "CV/Resume",
			description: "Upload your updated curriculum vitae or resume",
		},
		{
			typeId: "3",
			name: "Portfolio",
			description:
				"Upload your portfolio showcasing relevant work and projects",
		},
		{
			typeId: "4",
			name: "Academic Transcript",
			description:
				"Upload official academic transcripts from your previous institutions",
		},
		{
			typeId: "5",
			name: "Personal Statement",
			description:
				"Upload your personal statement explaining your academic goals and motivations",
		},
		{
			typeId: "6",
			name: "Recommendation Letter",
			description:
				"Upload letters of recommendation from academic or professional references",
		},
		{
			typeId: "7",
			name: "Language Certificate",
			description:
				"Upload language proficiency certificates (TOEFL, IELTS, etc.) if required",
		},
		{
			typeId: "8",
			name: "Passport Copy",
			description:
				"Upload a copy of your passport for international applications",
		},
		{
			typeId: "9",
			name: "Degree Certificate",
			description:
				"Upload your degree certificates or diplomas from completed academic programs",
		},
		{
			typeId: "10",
			name: "Research Paper",
			description:
				"Upload your research papers, publications, or academic writing samples",
		},
		{
			typeId: "11",
			name: "Institution Verification",
			description:
				"Upload documents verifying your institutional affiliation or enrollment status",
		},
		{
			typeId: "12",
			name: "Required Documents",
			description:
				"Upload any other required documents as specified in the application requirements",
		},
	];

	// Seed PostDocument cho tất cả posts (posts 1-200)
	for (let i = 1; i <= 200; i++) {
		const postId = `post-opportunity-${i.toString().padStart(4, "0")}`;

		// Chọn ngẫu nhiên 1 document type cho mỗi post
		const selectedDoc = getRandomElement(availableDocs);

		postDocuments.push({
			document_id: `${postId}-doc-1`,
			post_id: postId,
			document_type_id: selectedDoc.typeId,
			name: selectedDoc.name,
			description: selectedDoc.description,
		});
	}

	await prismaClient.postDocument.createMany({
		data: postDocuments,
	});

	console.log(
		`✅ ${postDocuments.length} Post documents seeded successfully`
	);
}

async function seedPostCertificates() {
	console.log("🎖️ Seeding post certificates...");

	const postCertificates = [];

	// Thêm certificates cho program posts (80% trong số chúng)
	for (let i = 1; i <= 100; i++) {
		const postId = `post-opportunity-${i.toString().padStart(4, "0")}`;

		if (Math.random() > 0.2) {
			// 80% programs yêu cầu language cert
			// Chọn 1-2 language certificates
			const languageCerts = [
				{ name: "IELTS", score: "6.5" },
				{ name: "TOEFL", score: "90" },
				{ name: "Cambridge English", score: "180" },
				{ name: "PTE Academic", score: "65" },
			];

			const numCerts = Math.random() > 0.5 ? 1 : 2;
			for (let j = 0; j < numCerts; j++) {
				const cert = languageCerts[j];
				postCertificates.push({
					certificate_id: `cert-${postId}-${cert.name.toLowerCase().replace(/\s+/g, "-")}`,
					post_id: postId,
					name: cert.name,
					score: cert.score,
				});
			}
		}

		// Thêm GRE/GMAT cho một số programs (30%)
		if (Math.random() > 0.7) {
			const testCerts = [
				{ name: "GRE", score: "320" },
				{ name: "GMAT", score: "600" },
			];
			const testCert = Math.random() > 0.5 ? testCerts[0] : testCerts[1];
			postCertificates.push({
				certificate_id: `cert-${postId}-${testCert.name.toLowerCase()}`,
				post_id: postId,
				name: testCert.name,
				score: testCert.score,
			});
		}
	}

	await prismaClient.postCertificate.createMany({
		data: postCertificates,
	});

	console.log(
		`✅ ${postCertificates.length} Post certificates seeded successfully`
	);
}

async function seedPostSubdisciplines() {
	console.log("🔗 Seeding post subdisciplines...");

	const postSubdisciplines = [];

	// Seed PostSubdiscipline cho tất cả posts (posts 1-200)
	for (let i = 1; i <= 200; i++) {
		const postId = `post-opportunity-${i.toString().padStart(4, "0")}`;

		// Mỗi post sẽ có 1-3 subdisciplines
		const numSubdisciplines = Math.floor(Math.random() * 3) + 1; // 1-3 subdisciplines
		const usedSubdisciplines = new Set();

		for (let j = 0; j < numSubdisciplines; j++) {
			let subdisciplineId;
			do {
				// Chọn ngẫu nhiên subdiscipline từ 1-150 (tổng số subdisciplines có thể có)
				subdisciplineId = (
					Math.floor(Math.random() * 150) + 1
				).toString();
			} while (usedSubdisciplines.has(subdisciplineId));

			usedSubdisciplines.add(subdisciplineId);

			postSubdisciplines.push({
				post_id: postId,
				subdiscipline_id: subdisciplineId,
				add_at: new Date(),
			});
		}
	}

	await prismaClient.postSubdiscipline.createMany({
		data: postSubdisciplines,
	});

	console.log(
		`✅ ${postSubdisciplines.length} Post subdisciplines seeded successfully`
	);
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

async function seedProgramScholarships() {
	console.log("🔗 Seeding program scholarships...");

	const programScholarships = [];
	const usedCombinations = new Set();

	// Tạo liên kết giữa program posts (1-100) và scholarship posts (101-150)
	for (let i = 1; i <= 100; i++) {
		const programPostId = `post-opportunity-${i.toString().padStart(4, "0")}`;

		// 60% programs sẽ có liên kết với scholarships
		if (Math.random() < 0.6) {
			// Mỗi program có thể liên kết với 1-3 scholarships
			const numScholarships = Math.floor(Math.random() * 3) + 1; // 1-3 scholarships

			for (let j = 0; j < numScholarships; j++) {
				let scholarshipPostId;
				let combination;

				do {
					// Chọn ngẫu nhiên scholarship post từ 101-150
					const scholarshipIndex =
						Math.floor(Math.random() * 50) + 101;
					scholarshipPostId = `post-opportunity-${scholarshipIndex.toString().padStart(4, "0")}`;
					combination = `${programPostId}-${scholarshipPostId}`;
				} while (usedCombinations.has(combination));

				usedCombinations.add(combination);

				programScholarships.push({
					program_post_id: programPostId,
					scholarship_post_id: scholarshipPostId,
				});
			}
		}
	}

	await prismaClient.programScholarship.createMany({
		data: programScholarships,
	});

	console.log(
		`✅ ${programScholarships.length} Program scholarships seeded successfully`
	);
}

async function main() {
	console.log("🌱 Starting comprehensive database seeding...");

	try {
		await cleanDatabase();
		await seedRoles();
		await seedPlans();
		await seedDisciplines();
		await seedSubdisciplines();
		await seedDocumentTypes();
		await seedUsers();
		await seedApplicants();
		await seedInstitutions();
		await seedOpportunityPosts();
		await seedProgramPosts();
		await seedScholarshipPosts();
		await seedJobPosts();
		await seedPostDocuments();
		await seedPostCertificates();
		await seedPostSubdisciplines();
		await seedWishlists();
		await seedApplications();
		await seedNotifications();
		await seedProgramScholarships();

		console.log("🎉 Database seeding completed successfully!");
		console.log("📊 Summary:");
		console.log("   - 3 Roles (student, institution, admin)");
		console.log("   - 3 Plans");
		console.log("   - 40 Disciplines");
		console.log("   - 100+ Subdisciplines");
		console.log("   - 8 Document Types");
		console.log(
			"   - 30 Users (10 students + 10 institutions + 10 admins)"
		);
		console.log("   - 10 Applicant Profiles");
		console.log("   - 10 Institution Profiles");
		console.log("   - 200 Opportunity Posts");
		console.log("   - 100 Program Posts");
		console.log("   - 50 Scholarship Posts");
		console.log("   - 50 Job Posts");
		console.log("   - Post Documents (with detailed descriptions)");
		console.log("   - Post Certificates (language and standardized tests)");
		console.log(
			"   - Post Subdisciplines (relationships between posts and fields)"
		);
		console.log(
			"   - Program Scholarships (relationships between programs and scholarships)"
		);
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
