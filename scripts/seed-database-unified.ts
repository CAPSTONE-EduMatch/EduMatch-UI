/* eslint-disable no-console */
import dotenv from "dotenv";
import { prismaClient } from "../prisma/index";
dotenv.config();

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
	// Free plan features     Account registration & OTP verification
	// Create & update personal profile (GPA, skills, research topic, etc.)
	// Basic scholarship, program & research group search
	// View scholarship details & requirements
	// Receive deadline reminders for saved scholarships/programs
	// Send messages to scholarship staff / professors
	// Standard plan features
	// 	Advanced scholarship matching algorithms
	// Priority application tracking
	// Extended program database access
	// Email notifications & reminders
	// Direct messaging with admissions staff
	// Application deadline calendar sync
	// Basic analytics dashboard
	// Premium plan features
	//     All Standard Plan features
	// AI-powered essay review & suggestions
	// One-on-one consultation calls
	// Custom scholarship recommendations
	// Application document templates
	// Interview preparation resources
	// Exclusive webinars & workshops
	// Priority customer support
	const plans = [
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440101",
			priceId: "N/A",
			name: "Free Plan",
			description: "Basic plan for students",
			features: [
				"Account registration & OTP verification",
				"Create & update personal profile (GPA, skills, research topic, etc.)",
				"Basic scholarship, program & research group search",
				"View scholarship details & requirements",
				"Receive deadline reminders for saved scholarships/programs",
				"Send messages to scholarship staff / professors",
			],
			month_price: 0,
			year_price: 0,
			status: true,
			create_at: new Date(),
			type: 0,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440102",
			priceId:
				process.env.STRIPE_STANDARD_PRICE_ID ||
				"price_1SFXgR1f58RNYg0098jAKotV",
			name: "Standard Plan",
			description:
				"Perfect for active scholarship hunters and applicants",
			features: [
				"Everything in Free",
				"Advanced scholarship matching algorithms",
				"Priority application tracking",
				"Extended program database access",
				"Email notifications & reminders",
				"Direct messaging with admissions staff",
				"Application deadline calendar sync",
				"Basic analytics dashboard",
			],
			month_price: 10,
			year_price: 100,
			status: true,
			create_at: new Date(),
			type: 0,
		},
		{
			plan_id: "550e8400-e29b-41d4-a716-446655440103",
			priceId:
				process.env.STRIPE_PREMIUM_PRICE_ID ||
				"price_1S4fZ61f58RNYg00FWakIrLm",
			name: "Premium Plan",
			description: "Premium plan for institutions",
			features: [
				"Everything in Standard",
				"AI-powered essay review & suggestions",
				"One-on-one consultation calls",
				"Custom scholarship recommendations",
				"Application document templates",
				"Interview preparation resources",
				"Exclusive webinars & workshops",
				"Priority customer support",
			],
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

	// Create student users (100 students)
	for (let i = 1; i <= 100; i++) {
		users.push({
			id: `user-${i.toString().padStart(4, "0")}`,
			name: `Student ${i}`,
			email: `student${i}@test.com`,
			emailVerified: Math.random() > 0.1, // 90% verified
			image: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`,
			role: "student",
			banned: Math.random() > 0.95, // 5% banned
			banReason:
				Math.random() > 0.95 ? "Violation of terms of service" : null,
			banExpires:
				Math.random() > 0.95
					? getRandomDate(new Date(), new Date("2026-12-31"))
					: null,
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-12-01")
			),
			updatedAt: new Date(),
		});
	}

	// Create institution users (50 institutions)
	for (let i = 101; i <= 150; i++) {
		const university = getRandomElement(universities);
		users.push({
			id: `user-${i.toString().padStart(4, "0")}`,
			name: university,
			email: `institution${i - 100}@test.com`,
			emailVerified: Math.random() > 0.05, // 95% verified
			image: `https://api.dicebear.com/7.x/initials/svg?seed=${university}`,
			role: "institution",
			banned: false,
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-12-01")
			),
			updatedAt: new Date(),
		});
	}

	// Create admin users (20 admins)
	for (let i = 151; i <= 170; i++) {
		users.push({
			id: `user-${i.toString().padStart(4, "0")}`,
			name: `Admin ${i - 150}`,
			email: `admin${i - 150}@test.com`,
			emailVerified: true,
			image: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${i - 150}`,
			role: "admin",
			banned: false,
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-12-01")
			),
			updatedAt: new Date(),
		});
	}

	await prismaClient.user.createMany({
		data: users,
	});

	console.log(
		"✅ 170 Users seeded successfully (100 students + 50 institutions + 20 admins)"
	);
}

async function seedApplicants() {
	console.log("🎓 Seeding student profiles...");

	const firstNames = [
		"John",
		"Jane",
		"Michael",
		"Sarah",
		"David",
		"Emily",
		"James",
		"Emma",
		"Robert",
		"Olivia",
		"William",
		"Ava",
		"Daniel",
		"Sophia",
		"Matthew",
		"Isabella",
		"Christopher",
		"Mia",
		"Andrew",
		"Charlotte",
	];
	const lastNames = [
		"Smith",
		"Johnson",
		"Williams",
		"Brown",
		"Jones",
		"Garcia",
		"Miller",
		"Davis",
		"Rodriguez",
		"Martinez",
		"Hernandez",
		"Lopez",
		"Gonzalez",
		"Wilson",
		"Anderson",
		"Thomas",
		"Taylor",
		"Moore",
		"Jackson",
		"Martin",
	];

	const studentProfiles = [];
	for (let i = 1; i <= 100; i++) {
		const favoriteCountriesCount = Math.floor(Math.random() * 3) + 1; // 1-3 countries
		const favoriteCountriesList: string[] = [];
		for (let j = 0; j < favoriteCountriesCount; j++) {
			const country = getRandomElement(countries);
			if (!favoriteCountriesList.includes(country)) {
				favoriteCountriesList.push(country);
			}
		}

		studentProfiles.push({
			applicant_id: `user-${i.toString().padStart(4, "0")}`,
			user_id: `user-${i.toString().padStart(4, "0")}`,
			first_name: getRandomElement(firstNames),
			last_name: getRandomElement(lastNames),
			birthday: getRandomDate(
				new Date("1990-01-01"),
				new Date("2005-01-01")
			),
			gender: Math.random() > 0.5,
			nationality: getRandomElement(countries),
			phone_number: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			country_code: "+1",
			graduated: Math.random() > 0.3, // 70% graduated
			level: getRandomElement(degreeLevels),
			university: getRandomElement(universities),
			gpa: parseFloat((Math.random() * 1.5 + 2.5).toFixed(2)), // 2.5-4.0 GPA
			subdiscipline_id: (Math.floor(Math.random() * 100) + 1).toString(),
			country_of_study: getRandomElement(countries),
			has_foreign_language: Math.random() > 0.4, // 60% have foreign language
			favorite_countries: favoriteCountriesList,
		});
	}

	await prismaClient.applicant.createMany({
		data: studentProfiles,
	});

	console.log("✅ 100 Student profiles seeded successfully");
}

async function seedInstitutions() {
	console.log("🏛️ Seeding institution profiles...");

	const institutionTypes = [
		"University",
		"College",
		"Research Institute",
		"Technical School",
		"Institute of Technology",
		"Community College",
	];
	const repTitles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
	const repFirstNames = [
		"John",
		"Jane",
		"Michael",
		"Sarah",
		"David",
		"Lisa",
		"Robert",
		"Emily",
		"William",
		"Emma",
	];
	const repLastNames = [
		"Smith",
		"Johnson",
		"Williams",
		"Brown",
		"Jones",
		"Garcia",
		"Miller",
		"Davis",
		"Wilson",
		"Moore",
	];
	const positions = [
		"Dean",
		"Director",
		"President",
		"Vice President",
		"Head of Department",
		"Provost",
		"Registrar",
		"Chancellor",
	];

	const institutionProfiles = [];
	for (let i = 1; i <= 50; i++) {
		const university = universities[(i - 1) % universities.length];
		const repTitle = getRandomElement(repTitles);
		const repFirst = getRandomElement(repFirstNames);
		const repLast = getRandomElement(repLastNames);
		const institutionCountry = getRandomElement(countries);

		institutionProfiles.push({
			institution_id: `user-${(i + 100).toString().padStart(4, "0")}`,
			user_id: `user-${(i + 100).toString().padStart(4, "0")}`,
			logo: `https://api.dicebear.com/7.x/initials/svg?seed=${university}`,
			name: university,
			abbreviation: university
				.split(" ")
				.map((word) => word[0])
				.join("")
				.substring(0, 5)
				.toUpperCase(),
			hotline: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			hotline_code: "+1",
			type: getRandomElement(institutionTypes),
			website: `https://${university
				.toLowerCase()
				.replace(/\s+/g, "")
				.replace(/[^a-z0-9]/g, "")}.edu`,
			country: institutionCountry,
			address: `${Math.floor(Math.random() * 9999) + 1} University Ave, ${university} Campus, ${institutionCountry}`,
			rep_name: `${repTitle} ${repFirst} ${repLast}`,
			rep_appellation: repTitle,
			rep_position: getRandomElement(positions),
			rep_email: `${repFirst.toLowerCase()}.${repLast.toLowerCase()}@${university
				.toLowerCase()
				.replace(/\s+/g, "")
				.replace(/[^a-z0-9]/g, "")}.edu`,
			rep_phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
			rep_phone_code: "+1",
			email: `info@${university
				.toLowerCase()
				.replace(/\s+/g, "")
				.replace(/[^a-z0-9]/g, "")}.edu`,
			about: `${university} is a leading educational institution specializing in research and academic excellence. We are committed to providing world-class education and fostering innovation across multiple disciplines. Our institution has been serving students globally for decades, offering comprehensive programs and cutting-edge research opportunities.`,
			cover_image: `https://api.dicebear.com/7.x/shapes/svg?seed=${university}-cover`,
		});
	}

	for (const profile of institutionProfiles) {
		await prismaClient.institution.create({
			data: profile,
		});
	}

	console.log("✅ 50 Institution profiles seeded successfully");
}

async function seedOpportunityPosts() {
	console.log("📝 Seeding opportunity posts...");

	const posts = [];
	const now = new Date();

	// Create 500 opportunity posts for more diverse testing data
	for (let i = 1; i <= 500; i++) {
		const field = getRandomElement(fields);
		const institutionIndex = Math.floor(Math.random() * 50) + 1;
		const institution_id = `user-${(institutionIndex + 100).toString().padStart(4, "0")}`;
		const university =
			universities[(institutionIndex - 1) % universities.length];
		const country = getRandomElement(countries);

		// 75% PUBLISHED, 20% DRAFT, 5% CLOSED
		const statusRoll = Math.random();
		let status: "PUBLISHED" | "DRAFT" | "CLOSED";
		if (statusRoll < 0.75) status = "PUBLISHED";
		else if (statusRoll < 0.95) status = "DRAFT";
		else status = "CLOSED";

		// Create random start_date (some in past, some in future)
		const daysFromNow = Math.floor(Math.random() * 120) - 30; // -30 to +90 days
		const startDate = new Date(
			now.getTime() + daysFromNow * 24 * 60 * 60 * 1000
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
			institution_id: institution_id,
			status: status,
			degree_level: getRandomElement(degreeLevels),
		});
	}

	await prismaClient.opportunityPost.createMany({
		data: posts,
	});

	const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
	const draftCount = posts.filter((p) => p.status === "DRAFT").length;
	const closedCount = posts.filter((p) => p.status === "CLOSED").length;

	console.log(
		`✅ 500 Opportunity posts seeded successfully (${publishedCount} PUBLISHED, ${draftCount} DRAFT, ${closedCount} CLOSED)`
	);
}

async function seedProgramPosts() {
	console.log("🎓 Seeding program posts...");

	const languageRequirements = [
		"IELTS 6.5 or TOEFL 90",
		"IELTS 7.0 or TOEFL 100",
		"IELTS 6.0 or TOEFL 80",
		"IELTS 7.5 or TOEFL 105",
		"No language requirement",
		"Native English speaker or equivalent",
		"TOEFL 85 minimum",
		"IELTS 6.5 minimum",
	];

	const programPosts = [];
	// Create programs for first 300 posts (60% are programs)
	for (let i = 1; i <= 300; i++) {
		const field = getRandomElement(fields);
		programPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			duration: getRandomElement(programDurations),
			attendance: getRandomElement(attendanceTypes),
			course_include: `Core courses in ${field}, advanced electives, capstone project, research methodology, and thesis/dissertation work. Includes practical training and industry collaboration opportunities.`,
			gpa: parseFloat((Math.random() * 1.5 + 2.5).toFixed(2)), // 2.5-4.0 GPA
			gre:
				Math.random() > 0.3
					? Math.floor(Math.random() * 170) + 290
					: null, // 290-340 GRE or null
			gmat:
				Math.random() > 0.6
					? Math.floor(Math.random() * 200) + 500
					: null, // 500-700 GMAT or null
			tuition_fee: Math.floor(Math.random() * 60000) + 10000, // $10k-$70k
			fee_description:
				"Tuition fees include all academic costs, library access, student services, technology fees, and access to research facilities. Some lab fees may apply for specialized courses.",
			scholarship_info:
				"Various scholarship opportunities available for qualified students including merit-based, need-based, and research assistantships. International students may qualify for additional funding.",
			language_requirement: getRandomElement(languageRequirements),
			professor_name: `${getRandomElement(["Dr.", "Prof."])} ${getRandomElement(["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily"])} ${getRandomElement(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"])}`,
		});
	}

	await prismaClient.programPost.createMany({
		data: programPosts,
	});

	console.log("✅ 300 Program posts seeded successfully");
}

async function seedScholarshipPosts() {
	console.log("💰 Seeding scholarship posts...");

	const coverageTypes = [
		"Full Tuition + Living Allowance",
		"Full Tuition Only",
		"Partial Tuition (50-75%)",
		"Partial Tuition (25-50%)",
		"Living Expenses Only",
		"Research Costs + Travel",
		"Tuition Waiver",
		"Monthly Stipend",
	];

	const scholarshipPosts = [];
	// Create scholarships for posts 301-400 (20% of total posts)
	for (let i = 301; i <= 400; i++) {
		const field = getRandomElement(fields);
		const scholarshipType = getRandomElement(scholarshipTypes);
		const grantAmount = Math.floor(Math.random() * 50000) + 5000; // $5k-$55k
		const coverage = getRandomElement(coverageTypes);
		const numberOfAwards = Math.floor(Math.random() * 30) + 1; // 1-30 scholarships

		scholarshipPosts.push({
			post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
			description: `${scholarshipType} scholarship for outstanding ${field} students. This scholarship supports students who demonstrate academic excellence, research potential, and leadership qualities in ${field}. Recipients will have access to exclusive mentorship opportunities, networking events, and research resources. The scholarship aims to promote diversity and inclusion in higher education while fostering the next generation of scholars and researchers.`,
			type: scholarshipType,
			number: numberOfAwards,
			grant: `$${grantAmount.toLocaleString()} per year`,
			scholarship_coverage: coverage,
			essay_required: Math.random() > 0.35, // 65% require essays
			eligibility: `Open to ${getRandomElement(degreeLevels)} students with strong academic record in ${field} or related fields. Minimum GPA of ${(Math.random() * 0.5 + 3.0).toFixed(1)} required. International students are encouraged to apply. Demonstrated financial need and/or academic merit required.`,
			award_amount: grantAmount,
			award_duration: getRandomElement([
				"1 year",
				"2 years",
				"3 years",
				"4 years",
				"Duration of study",
				"1 semester",
				"2 semesters",
			]),
			renewable: Math.random() > 0.25, // 75% are renewable
		});
	}

	await prismaClient.scholarshipPost.createMany({
		data: scholarshipPosts,
	});

	console.log("✅ 100 Scholarship posts seeded successfully");
}

async function seedJobPosts() {
	console.log("💼 Seeding job posts (research labs)...");

	const jobPosts = [];
	// Create job/research lab posts for posts 401-500 (20% of total posts)
	for (let i = 401; i <= 500; i++) {
		const researchArea = getRandomElement(researchAreas);
		const labType = getRandomElement(labTypes);
		const universityIndex = (i - 401) % universities.length;
		const university = universities[universityIndex];
		const field = getRandomElement(fields);
		const isResearchLab = Math.random() > 0.2; // 80% are research labs, 20% are regular jobs

		const minSalary = Math.floor(Math.random() * 40000) + 30000; // $30k-$70k
		const maxSalary = minSalary + Math.floor(Math.random() * 60000) + 20000; // +$20k-$80k

		if (isResearchLab) {
			jobPosts.push({
				post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
				contract_type: getRandomElement(contractTypes),
				job_type: getRandomElement(jobTypes),
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description:
					"Highly competitive salary commensurate with experience and qualifications. Comprehensive benefits package including health insurance, retirement plans, and research funds.",
				benefit:
					"Health insurance (medical, dental, vision), retirement plan with employer contribution, research funding allocation, conference travel support, professional development stipend, laboratory access 24/7, flexible work arrangements, visa sponsorship for international candidates",
				main_responsibility: `Lead and conduct cutting-edge research in ${researchArea}. Design and execute research experiments, collaborate with interdisciplinary teams across departments, mentor junior researchers and graduate students, publish research findings in top-tier journals, present at international conferences, and contribute to grant applications. Develop new methodologies and contribute to the lab's research agenda.`,
				qualification_requirement: `${getRandomElement(["PhD", "Master's", "Bachelor's"])} degree in ${field}, ${getRandomElement(fields)}, or closely related field. Strong analytical, research, and problem-solving skills required. Demonstrated ability to work independently and as part of a team.`,
				experience_requirement: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 5) + 3} years of relevant research experience in ${researchArea} or related areas`,
				assessment_criteria:
					"Research experience and publication record, technical skills and methodology expertise, potential for independent research and innovation, collaborative abilities, communication skills (written and oral), alignment with lab's research objectives",
				other_requirement:
					"Strong written and verbal communication skills in English, ability to work independently and collaborate effectively, proficiency in relevant software and research tools, commitment to ethical research practices, willingness to contribute to lab culture and team success",
				attendance: getRandomElement(attendanceTypes),
				// Research lab specific fields
				lab_type: labType,
				lab_director: `${getRandomElement(["Dr.", "Prof."])} ${getRandomElement(["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily", "William", "Emma"])} ${getRandomElement(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"])}`,
				lab_facilities: `State-of-the-art ${labType.toLowerCase()} equipped with cutting-edge technology for ${researchArea.toLowerCase()} research. Facilities include clean rooms (Class 100-10000), high-performance computing cluster with GPU acceleration, advanced imaging and spectroscopy equipment, specialized instrumentation for data collection and analysis, collaborative workspaces, and dedicated meeting rooms. Safety-certified environment with 24/7 security access.`,
				lab_capacity: Math.floor(Math.random() * 25) + 10, // 10-35 people
				lab_website: `https://${researchArea.toLowerCase().replace(/\s+/g, "-")}-lab.${university
					.toLowerCase()
					.replace(/\s+/g, "")
					.replace(/[^a-z0-9-]/g, "")}.edu`,
				lab_contact_email: `${researchArea.toLowerCase().replace(/\s+/g, "")}-lab@${university
					.toLowerCase()
					.replace(/\s+/g, "")
					.replace(/[^a-z0-9]/g, "")}.edu`,
				research_areas: `${researchArea}, ${getRandomElement(researchAreas)}, ${getRandomElement(researchAreas)}`,
				research_focus: `Our lab maintains a primary focus on ${researchArea} with significant applications in ${getRandomElement(["healthcare and medicine", "advanced technology", "environmental sustainability", "industrial innovation", "educational technology", "biotechnology"])}. We investigate novel approaches, develop innovative solutions, and push the boundaries of current knowledge. Our interdisciplinary team collaborates with industry partners and international research institutions to address real-world challenges.`,
				research_experience: `Minimum ${Math.floor(Math.random() * 3) + 2} years of hands-on research experience in ${researchArea}, ${getRandomElement(researchAreas)}, or closely related fields with demonstrated research outcomes`,
				research_proposal:
					Math.random() > 0.4
						? "Detailed research proposal (2-3 pages) required as part of application outlining proposed research direction and methodology"
						: "Brief research statement (1 page) describing research interests and how they align with the lab's focus",
				academic_background: `Strong academic background in ${field}, ${getRandomElement(fields)}, or related disciplines. Preference for candidates with interdisciplinary experience and coursework in advanced research methods.`,
				technical_skills: `Advanced proficiency in ${getRandomElement(["Python", "R", "MATLAB", "C++", "Java", "Julia", "Scala"])}, expertise in ${getRandomElement(["machine learning/deep learning", "statistical data analysis", "computational modeling", "experimental design and methodology", "signal processing", "image analysis"])}, experience with relevant research tools and frameworks. Familiarity with version control (Git), scientific computing, and data visualization.`,
				recommendations:
					Math.random() > 0.4
						? "Three letters of recommendation required from academic or professional references who can speak to research capabilities"
						: "Two letters of recommendation required, at least one from a research supervisor or principal investigator",
				application_documents:
					"CV/Resume, cover letter, research statement, transcripts, letters of recommendation, publication list (if applicable), writing sample or research paper",
			});
		} else {
			// Regular job (non-research lab)
			jobPosts.push({
				post_id: `post-opportunity-${i.toString().padStart(4, "0")}`,
				contract_type: getRandomElement(contractTypes),
				job_type: getRandomElement(jobTypes),
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description: "Competitive salary with benefits package",
				benefit:
					"Health insurance, professional development, flexible schedule",
				main_responsibility: `${getRandomElement(["Teaching", "Research support", "Administrative", "Technical support"])} responsibilities in ${field}`,
				qualification_requirement: `${getRandomElement(["Bachelor's", "Master's"])} degree in ${field} or related field`,
				experience_requirement: `${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 3) + 2} years of relevant experience`,
				assessment_criteria:
					"Relevant experience, skills, and qualifications for the position",
				other_requirement: "Good communication skills, team player",
				attendance: getRandomElement(attendanceTypes),
				// No research lab fields for regular jobs
				lab_type: null,
				lab_director: null,
				lab_facilities: null,
				lab_capacity: null,
				lab_website: null,
				lab_contact_email: null,
				research_areas: null,
				research_focus: null,
				research_experience: null,
				research_proposal: null,
				academic_background: null,
				technical_skills: null,
				recommendations: null,
				application_documents: "CV/Resume, cover letter, references",
			});
		}
	}

	await prismaClient.jobPost.createMany({
		data: jobPosts,
	});

	const researchLabCount = jobPosts.filter((p) => p.lab_type !== null).length;
	const regularJobCount = jobPosts.filter((p) => p.lab_type === null).length;

	console.log(
		`✅ 100 Job posts seeded successfully (${researchLabCount} research labs, ${regularJobCount} regular jobs)`
	);
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

	// Create wishlists for the 100 student users (user-0001 to user-0100)
	for (let i = 1; i <= 100; i++) {
		const numWishlistItems = Math.floor(Math.random() * 10) + 1; // 1-10 items per user

		for (let j = 0; j < numWishlistItems; j++) {
			let applicantId, postId, combination;
			do {
				applicantId = `user-${String(i).padStart(4, "0")}`; // Use current student user ID
				postId = `post-opportunity-${String(Math.floor(Math.random() * 500) + 1).padStart(4, "0")}`; // Now we have 500 posts
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
	// Create 50 sample applications from student users
	for (let i = 1; i <= 50; i++) {
		applications.push({
			application_id: `application-${i.toString().padStart(4, "0")}`,
			post_id: `post-opportunity-${String(Math.floor(Math.random() * 500) + 1).padStart(4, "0")}`, // Now we have 500 posts
			applicant_id: `user-${String(Math.floor(Math.random() * 100) + 1).padStart(4, "0")}`, // 100 student users
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
	// Create 100 notifications for random users (from all 170 users)
	for (let i = 1; i <= 100; i++) {
		notifications.push({
			notification_id: `notification-${i.toString().padStart(4, "0")}`,
			user_id: `user-${String(Math.floor(Math.random() * 170) + 1).padStart(4, "0")}`, // 170 total users
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
					// Chọn ngẫu nhiên scholarship post từ 301-400 (100 scholarship posts)
					const scholarshipIndex =
						Math.floor(Math.random() * 100) + 301;
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

async function seedSubscriptions() {
	console.log("💳 Seeding subscriptions...");

	const subscriptions = [];
	const plans = ["free", "standard", "premium"];

	// Seed subscriptions for 70 students (70% subscription rate)
	for (let i = 1; i <= 70; i++) {
		const userId = `user-${String(i).padStart(4, "0")}`;

		// Distribution: 40% Free, 40% Standard, 20% Premium
		let plan;
		const rand = Math.random();
		if (rand < 0.4) {
			plan = plans[0]; // free
		} else if (rand < 0.8) {
			plan = plans[1]; // standard
		} else {
			plan = plans[2]; // premium
		}

		// Most subscriptions are active (80%), some inactive (10%), cancelled (5%), expired (5%)
		let status;
		const statusRand = Math.random();
		if (statusRand < 0.8) {
			status = "active";
		} else if (statusRand < 0.9) {
			status = "inactive";
		} else if (statusRand < 0.95) {
			status = "cancelled";
		} else {
			status = "expired";
		}

		const periodStart = new Date(
			Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
		);
		const periodEnd = new Date(
			periodStart.getTime() + 30 * 24 * 60 * 60 * 1000
		); // 30 days later

		subscriptions.push({
			id: `app-sub-${String(i).padStart(4, "0")}`,
			referenceId: userId,
			plan: plan,
			status: status,
			periodStart: periodStart,
			periodEnd: periodEnd,
			cancelAtPeriodEnd: status === "cancelled",
			seats: 1,
		});
	}

	// Seed subscriptions for all 50 institutions
	// Distribution: 20% Free, 30% Standard, 50% Premium
	for (let i = 101; i <= 150; i++) {
		const userId = `user-${String(i).padStart(4, "0")}`;

		let plan;
		const rand = Math.random();
		if (rand < 0.2) {
			plan = plans[0]; // free
		} else if (rand < 0.5) {
			plan = plans[1]; // standard
		} else {
			plan = plans[2]; // premium
		}

		// Most subscriptions are active (90%), some inactive (7%), cancelled (2%), expired (1%)
		let status;
		const statusRand = Math.random();
		if (statusRand < 0.9) {
			status = "active";
		} else if (statusRand < 0.97) {
			status = "inactive";
		} else if (statusRand < 0.99) {
			status = "cancelled";
		} else {
			status = "expired";
		}

		const periodStart = new Date(
			Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
		);
		const periodEnd = new Date(
			periodStart.getTime() + 30 * 24 * 60 * 60 * 1000
		); // 30 days later

		subscriptions.push({
			id: `inst-sub-${String(i - 100).padStart(4, "0")}`,
			referenceId: userId,
			plan: plan,
			status: status,
			periodStart: periodStart,
			periodEnd: periodEnd,
			cancelAtPeriodEnd: status === "cancelled",
			seats: plan === "premium" ? 5 : 1, // Premium institutions get more seats
		});
	}

	await prismaClient.subscription.createMany({
		data: subscriptions,
	});

	const activeSubs = subscriptions.filter(
		(s) => s.status === "active"
	).length;
	console.log(
		`✅ ${subscriptions.length} subscriptions seeded successfully (${activeSubs} active)`
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
		await seedSubscriptions();

		console.log("🎉 Database seeding completed successfully!");
		console.log("📊 Summary:");
		console.log("   - 3 Roles (student, institution, admin)");
		console.log("   - 3 Plans");
		console.log("   - 40 Disciplines");
		console.log("   - 100+ Subdisciplines");
		console.log("   - 8 Document Types");
		console.log(
			"   - 170 Users (100 students + 50 institutions + 20 admins)"
		);
		console.log("   - 100 Applicant Profiles");
		console.log("   - 50 Institution Profiles");
		console.log("   - 500 Opportunity Posts");
		console.log("   - 300 Program Posts");
		console.log("   - 100 Scholarship Posts");
		console.log("   - 100 Job Posts");
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
		console.log("   - 120 Subscriptions (70 students + 50 institutions)");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		process.exit(1);
	} finally {
		await prismaClient.$disconnect();
	}
}

main();
