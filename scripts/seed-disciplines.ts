/* eslint-disable no-console */
import dotenv from "dotenv";
import { prismaClient } from "../prisma/index";
dotenv.config();

/**
 * Seed Disciplines and Subdisciplines Script
 *
 * This script seeds the Discipline and Subdiscipline tables with academic fields.
 *
 * Usage: npx tsx scripts/seed-disciplines.ts
 */

// Academic disciplines list
const disciplines = [
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

// Mapping of disciplines to their realistic subdisciplines
const disciplineSubdisciplines: Record<string, string[]> = {
	"Computer Science": [
		"Algorithms and Data Structures",
		"Computer Architecture",
		"Operating Systems",
		"Database Systems",
		"Computer Networks",
		"Distributed Systems",
		"Parallel Computing",
		"Human-Computer Interaction",
		"Software Engineering",
		"Programming Languages",
	],
	"Data Science": [
		"Data Mining",
		"Statistical Analysis",
		"Data Visualization",
		"Big Data Analytics",
		"Predictive Modeling",
		"Data Engineering",
		"Business Intelligence",
		"Machine Learning Applications",
	],
	"Artificial Intelligence": [
		"Natural Language Processing",
		"Computer Vision",
		"Expert Systems",
		"Knowledge Representation",
		"Automated Reasoning",
		"Cognitive Computing",
		"AI Ethics",
		"Robotic Intelligence",
	],
	"Machine Learning": [
		"Deep Learning",
		"Neural Networks",
		"Supervised Learning",
		"Unsupervised Learning",
		"Reinforcement Learning",
		"Transfer Learning",
		"Feature Engineering",
		"Model Optimization",
	],
	"Software Engineering": [
		"Software Architecture",
		"Agile Development",
		"DevOps",
		"Quality Assurance",
		"Software Testing",
		"Project Management",
		"Code Review",
		"Version Control Systems",
	],
	Cybersecurity: [
		"Network Security",
		"Information Security",
		"Cryptography",
		"Ethical Hacking",
		"Digital Forensics",
		"Security Architecture",
		"Risk Management",
		"Incident Response",
	],
	"Information Systems": [
		"Business Information Systems",
		"Database Management",
		"System Analysis",
		"Enterprise Systems",
		"IT Project Management",
		"Information Architecture",
		"Cloud Computing",
		"IT Governance",
	],
	"Business Administration": [
		"Strategic Management",
		"Organizational Behavior",
		"Operations Management",
		"Business Strategy",
		"Leadership",
		"Change Management",
		"Business Ethics",
		"Corporate Governance",
	],
	Economics: [
		"Microeconomics",
		"Macroeconomics",
		"Econometrics",
		"Behavioral Economics",
		"Development Economics",
		"International Economics",
		"Labor Economics",
		"Public Economics",
	],
	Finance: [
		"Corporate Finance",
		"Investment Analysis",
		"Financial Markets",
		"Risk Management",
		"Portfolio Management",
		"Banking",
		"Financial Planning",
		"Derivatives",
	],
	Marketing: [
		"Digital Marketing",
		"Brand Management",
		"Consumer Behavior",
		"Market Research",
		"Advertising",
		"Social Media Marketing",
		"Marketing Analytics",
		"Product Management",
	],
	"International Business": [
		"Global Strategy",
		"Cross-Cultural Management",
		"International Trade",
		"Global Supply Chain",
		"Foreign Market Entry",
		"International Finance",
		"Global Marketing",
		"International Law",
	],
	Management: [
		"Strategic Management",
		"Operations Management",
		"Human Resource Management",
		"Project Management",
		"Supply Chain Management",
		"Quality Management",
		"Change Management",
		"Performance Management",
	],
	Accounting: [
		"Financial Accounting",
		"Managerial Accounting",
		"Auditing",
		"Tax Accounting",
		"Cost Accounting",
		"Forensic Accounting",
		"International Accounting",
		"Accounting Information Systems",
	],
	Biology: [
		"Cell Biology",
		"Genetics",
		"Ecology",
		"Evolutionary Biology",
		"Marine Biology",
		"Botany",
		"Zoology",
		"Microbiology",
		"Biotechnology",
		"Conservation Biology",
	],
	Chemistry: [
		"Surface Chemistry",
		"Synthetic Chemistry",
		"Systems Chemistry",
		"Theoretical Chemistry",
		"Thermochemistry",
		"Organic Chemistry",
		"Inorganic Chemistry",
		"Physical Chemistry",
		"Analytical Chemistry",
		"Environmental Chemistry",
	],
	Physics: [
		"Theoretical Physics",
		"Quantum Physics",
		"Condensed Matter Physics",
		"Particle Physics",
		"Astrophysics",
		"Optics",
		"Thermodynamics",
		"Electromagnetism",
		"Statistical Physics",
		"Nuclear Physics",
	],
	Mathematics: [
		"Algebra",
		"Calculus",
		"Geometry",
		"Topology",
		"Number Theory",
		"Mathematical Analysis",
		"Differential Equations",
		"Mathematical Logic",
		"Applied Mathematics",
		"Mathematical Modeling",
	],
	Statistics: [
		"Probability Theory",
		"Statistical Inference",
		"Biostatistics",
		"Econometrics",
		"Bayesian Statistics",
		"Time Series Analysis",
		"Multivariate Analysis",
		"Experimental Design",
	],
	"Environmental Science": [
		"Climate Change",
		"Environmental Policy",
		"Conservation Biology",
		"Pollution Control",
		"Sustainable Development",
		"Ecosystem Management",
		"Environmental Chemistry",
		"Renewable Energy",
	],
	Biotechnology: [
		"Genetic Engineering",
		"Biopharmaceuticals",
		"Agricultural Biotechnology",
		"Industrial Biotechnology",
		"Bioinformatics",
		"Biomedical Engineering",
		"Bioremediation",
		"Biomaterials",
	],
	Genetics: [
		"Molecular Genetics",
		"Population Genetics",
		"Medical Genetics",
		"Genomics",
		"Epigenetics",
		"Genetic Counseling",
		"Evolutionary Genetics",
		"Genetic Engineering",
	],
	Biochemistry: [
		"Protein Biochemistry",
		"Enzyme Kinetics",
		"Metabolic Pathways",
		"Structural Biology",
		"Molecular Biology",
		"Bioorganic Chemistry",
		"Biophysical Chemistry",
		"Clinical Biochemistry",
	],
	"Molecular Biology": [
		"Gene Expression",
		"DNA Replication",
		"Protein Synthesis",
		"Cell Signaling",
		"Molecular Genetics",
		"Genomics",
		"Proteomics",
		"Transcriptomics",
	],
	Psychology: [
		"Clinical Psychology",
		"Cognitive Psychology",
		"Social Psychology",
		"Developmental Psychology",
		"Behavioral Psychology",
		"Neuropsychology",
		"Industrial Psychology",
		"Experimental Psychology",
	],
	Sociology: [
		"Social Theory",
		"Social Research Methods",
		"Social Stratification",
		"Urban Sociology",
		"Criminology",
		"Medical Sociology",
		"Gender Studies",
		"Cultural Sociology",
	],
	"Political Science": [
		"Comparative Politics",
		"International Relations",
		"Political Theory",
		"Public Administration",
		"Political Economy",
		"Public Policy",
		"Electoral Systems",
		"Political Behavior",
	],
	"International Relations": [
		"Diplomacy",
		"International Security",
		"Global Governance",
		"Foreign Policy",
		"International Law",
		"Conflict Resolution",
		"Regional Studies",
		"International Organizations",
	],
	"Public Policy": [
		"Policy Analysis",
		"Public Administration",
		"Social Policy",
		"Economic Policy",
		"Environmental Policy",
		"Health Policy",
		"Education Policy",
		"Urban Policy",
	],
	Anthropology: [
		"Cultural Anthropology",
		"Physical Anthropology",
		"Archaeology",
		"Linguistic Anthropology",
		"Medical Anthropology",
		"Applied Anthropology",
		"Ethnography",
		"Forensic Anthropology",
	],
	Engineering: [
		"Engineering Design",
		"Engineering Mathematics",
		"Engineering Ethics",
		"Project Management",
		"Quality Control",
		"Systems Engineering",
		"Engineering Economics",
		"Safety Engineering",
	],
	"Mechanical Engineering": [
		"Thermodynamics",
		"Fluid Mechanics",
		"Materials Science",
		"Machine Design",
		"Manufacturing",
		"Robotics",
		"Automotive Engineering",
		"Aerospace Engineering",
	],
	"Electrical Engineering": [
		"Circuit Analysis",
		"Electronics",
		"Power Systems",
		"Control Systems",
		"Signal Processing",
		"Telecommunications",
		"Embedded Systems",
		"Renewable Energy Systems",
	],
	"Civil Engineering": [
		"Structural Engineering",
		"Geotechnical Engineering",
		"Transportation Engineering",
		"Water Resources",
		"Environmental Engineering",
		"Construction Management",
		"Urban Planning",
		"Coastal Engineering",
	],
	"Chemical Engineering": [
		"Process Design",
		"Reaction Engineering",
		"Separation Processes",
		"Thermodynamics",
		"Process Control",
		"Materials Processing",
		"Biochemical Engineering",
		"Petroleum Engineering",
	],
	"Biomedical Engineering": [
		"Biomechanics",
		"Biomaterials",
		"Medical Imaging",
		"Tissue Engineering",
		"Biomedical Instrumentation",
		"Rehabilitation Engineering",
		"Neural Engineering",
		"Biomedical Signal Processing",
	],
	"Materials Science": [
		"Nanomaterials",
		"Polymers",
		"Metallurgy",
		"Ceramics",
		"Composite Materials",
		"Materials Characterization",
		"Materials Processing",
		"Electronic Materials",
	],
	Medicine: [
		"Internal Medicine",
		"Surgery",
		"Pediatrics",
		"Cardiology",
		"Oncology",
		"Neurology",
		"Psychiatry",
		"Emergency Medicine",
		"Radiology",
		"Pathology",
	],
	"Public Health": [
		"Epidemiology",
		"Health Policy",
		"Environmental Health",
		"Health Promotion",
		"Biostatistics",
		"Global Health",
		"Health Administration",
		"Occupational Health",
	],
	Nursing: [
		"Medical-Surgical Nursing",
		"Pediatric Nursing",
		"Mental Health Nursing",
		"Community Health Nursing",
		"Critical Care Nursing",
		"Nursing Administration",
		"Nurse Education",
		"Geriatric Nursing",
	],
	Pharmacy: [
		"Clinical Pharmacy",
		"Pharmaceutical Chemistry",
		"Pharmacology",
		"Pharmaceutics",
		"Pharmacy Practice",
		"Medicinal Chemistry",
		"Pharmacokinetics",
		"Pharmaceutical Analysis",
	],
	Dentistry: [
		"Oral Surgery",
		"Orthodontics",
		"Periodontics",
		"Endodontics",
		"Prosthodontics",
		"Pediatric Dentistry",
		"Oral Pathology",
		"Public Health Dentistry",
	],
	Law: [
		"Constitutional Law",
		"Criminal Law",
		"Civil Law",
		"International Law",
		"Corporate Law",
		"Environmental Law",
		"Intellectual Property Law",
		"Human Rights Law",
	],
	Education: [
		"Curriculum Development",
		"Educational Technology",
		"Special Education",
		"Educational Leadership",
		"Adult Education",
		"Early Childhood Education",
		"Higher Education",
		"Educational Assessment",
	],
	"Educational Psychology": [
		"Learning Theories",
		"Cognitive Development",
		"Motivation in Education",
		"Assessment and Evaluation",
		"Classroom Management",
		"Special Needs Education",
		"Educational Research",
		"Student Development",
	],
	Architecture: [
		"Architectural Design",
		"Urban Design",
		"Historic Preservation",
		"Sustainable Architecture",
		"Interior Architecture",
		"Landscape Architecture",
		"Building Technology",
		"Architectural Theory",
	],
	"Urban Planning": [
		"Land Use Planning",
		"Transportation Planning",
		"Environmental Planning",
		"Urban Design",
		"Housing Planning",
		"Regional Planning",
		"Community Development",
		"Sustainable Urban Development",
	],
	Design: [
		"Graphic Design",
		"Industrial Design",
		"User Experience Design",
		"Interior Design",
		"Fashion Design",
		"Product Design",
		"Web Design",
		"Design Thinking",
	],
	Arts: [
		"Art History",
		"Art Theory",
		"Visual Arts",
		"Digital Arts",
		"Contemporary Art",
		"Art Criticism",
		"Art Education",
		"Curatorial Studies",
	],
	"Fine Arts": [
		"Painting",
		"Sculpture",
		"Drawing",
		"Printmaking",
		"Photography",
		"Mixed Media",
		"Installation Art",
		"Conceptual Art",
	],
	"Performing Arts": [
		"Theater",
		"Dance",
		"Music Performance",
		"Opera",
		"Musical Theater",
		"Performance Studies",
		"Directing",
		"Choreography",
	],
	Literature: [
		"Literary Theory",
		"Comparative Literature",
		"Creative Writing",
		"Poetry",
		"Fiction",
		"Drama",
		"Literary Criticism",
		"World Literature",
	],
	History: [
		"Ancient History",
		"Medieval History",
		"Modern History",
		"World History",
		"Cultural History",
		"Economic History",
		"Military History",
		"Historiography",
	],
	Philosophy: [
		"Ethics",
		"Metaphysics",
		"Epistemology",
		"Logic",
		"Philosophy of Mind",
		"Philosophy of Science",
		"Political Philosophy",
		"Continental Philosophy",
	],
	Linguistics: [
		"Syntax",
		"Phonetics",
		"Phonology",
		"Semantics",
		"Pragmatics",
		"Sociolinguistics",
		"Psycholinguistics",
		"Computational Linguistics",
	],
	Geography: [
		"Physical Geography",
		"Human Geography",
		"Geographic Information Systems",
		"Cartography",
		"Urban Geography",
		"Environmental Geography",
		"Regional Geography",
		"Remote Sensing",
	],
	Geology: [
		"Mineralogy",
		"Petrology",
		"Structural Geology",
		"Sedimentology",
		"Paleontology",
		"Geophysics",
		"Hydrogeology",
		"Economic Geology",
	],
	Astronomy: [
		"Astrophysics",
		"Planetary Science",
		"Stellar Astronomy",
		"Galactic Astronomy",
		"Cosmology",
		"Observational Astronomy",
		"Radio Astronomy",
		"Exoplanet Research",
	],
	Neuroscience: [
		"Cognitive Neuroscience",
		"Behavioral Neuroscience",
		"Molecular Neuroscience",
		"Computational Neuroscience",
		"Clinical Neuroscience",
		"Neuroimaging",
		"Neuropharmacology",
		"Developmental Neuroscience",
	],
	Robotics: [
		"Robot Control",
		"Robot Perception",
		"Robot Learning",
		"Human-Robot Interaction",
		"Autonomous Systems",
		"Robotic Manipulation",
		"Swarm Robotics",
		"Medical Robotics",
	],
	"Quantum Computing": [
		"Quantum Algorithms",
		"Quantum Information Theory",
		"Quantum Error Correction",
		"Quantum Cryptography",
		"Quantum Hardware",
		"Quantum Simulation",
		"Quantum Machine Learning",
		"Quantum Communication",
	],
	"Agricultural Science": [
		"Crop Science",
		"Soil Science",
		"Animal Science",
		"Agricultural Economics",
		"Agricultural Engineering",
		"Sustainable Agriculture",
		"Agricultural Biotechnology",
		"Food Science",
	],
	Communications: [
		"Mass Communication",
		"Interpersonal Communication",
		"Organizational Communication",
		"Digital Communication",
		"Public Relations",
		"Communication Theory",
		"Media Studies",
		"Strategic Communication",
	],
	Journalism: [
		"Investigative Journalism",
		"Broadcast Journalism",
		"Digital Journalism",
		"Photojournalism",
		"Data Journalism",
		"Sports Journalism",
		"Business Journalism",
		"International Journalism",
	],
	"Media Studies": [
		"Media Theory",
		"Media Production",
		"Media Analysis",
		"New Media",
		"Media Ethics",
		"Media and Society",
		"Media Industries",
		"Media Literacy",
	],
};

/**
 * Seed disciplines into the database
 */
async function seedDisciplines() {
	console.log("📚 Seeding disciplines...");

	// Check if disciplines already exist
	const existingDisciplines = await prismaClient.discipline.findMany();
	if (existingDisciplines.length > 0) {
		console.log(
			`⚠️  Found ${existingDisciplines.length} existing disciplines. Skipping discipline seeding.`
		);
		return;
	}

	const disciplineData = disciplines.map((field, index) => ({
		discipline_id: (index + 1).toString(),
		name: field,
		status: true,
	}));

	await prismaClient.discipline.createMany({
		data: disciplineData,
		skipDuplicates: true,
	});

	console.log(`✅ ${disciplineData.length} disciplines seeded successfully`);
}

/**
 * Seed subdisciplines into the database
 * Uses realistic subdisciplines for each discipline
 */
async function seedSubdisciplines() {
	console.log("📖 Seeding subdisciplines...");

	// Check if subdisciplines already exist
	const existingSubdisciplines = await prismaClient.subdiscipline.findMany();
	if (existingSubdisciplines.length > 0) {
		console.log(
			`⚠️  Found ${existingSubdisciplines.length} existing subdisciplines. Skipping subdiscipline seeding.`
		);
		return;
	}

	// Get all disciplines to create subdisciplines for
	const allDisciplines = await prismaClient.discipline.findMany({
		orderBy: { discipline_id: "asc" },
	});

	if (allDisciplines.length === 0) {
		console.log("⚠️  No disciplines found. Please seed disciplines first.");
		return;
	}

	const subdisciplines = [];
	let subdisciplineIdCounter = 1;

	// Create subdisciplines for each discipline
	for (const discipline of allDisciplines) {
		// Get the subdisciplines for this discipline from the mapping
		const disciplineSubs = disciplineSubdisciplines[discipline.name] || [];

		if (disciplineSubs.length === 0) {
			console.log(
				`⚠️  No subdisciplines defined for "${discipline.name}". Skipping.`
			);
			continue;
		}

		// Create subdisciplines for this discipline
		for (const subName of disciplineSubs) {
			subdisciplines.push({
				subdiscipline_id: subdisciplineIdCounter.toString(),
				discipline_id: discipline.discipline_id,
				name: subName,
				status: true,
			});
			subdisciplineIdCounter++;
		}
	}

	if (subdisciplines.length === 0) {
		console.log("⚠️  No subdisciplines to seed.");
		return;
	}

	await prismaClient.subdiscipline.createMany({
		data: subdisciplines,
		skipDuplicates: true,
	});

	console.log(
		`✅ ${subdisciplines.length} subdisciplines seeded successfully`
	);
}

/**
 * Main function to run the seeding process
 */
async function main() {
	try {
		await prismaClient.$connect();
		console.log("✅ Connected to database\n");

		await seedDisciplines();
		console.log(""); // Empty line for readability

		await seedSubdisciplines();

		// Display summary
		const disciplineCount = await prismaClient.discipline.count();
		const subdisciplineCount = await prismaClient.subdiscipline.count();

		console.log("\n📊 Summary:");
		console.log(`   - ${disciplineCount} Disciplines`);
		console.log(`   - ${subdisciplineCount} Subdisciplines`);

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
