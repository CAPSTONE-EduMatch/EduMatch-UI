// /* eslint-disable no-console */
// import { PrismaClient } from "../generated/prisma";

// const prisma = new PrismaClient();

// async function main() {
// 	console.log("🌱 Starting database seeding...");

// 	// Clean up existing data first
// 	await prisma.application.deleteMany({});
// 	await prisma.postJob.deleteMany({});
// 	await prisma.postScholarship.deleteMany({});
// 	await prisma.postProgram.deleteMany({});
// 	await prisma.post.deleteMany({});

// 	console.log("✅ Cleaned existing posts");

// 	// Create test posts for programs
// 	await prisma.post.createMany({
// 		data: [
// 			{
// 				id: "program_mit_cs",
// 				title: "MIT Computer Science Master Program",
// 				content:
// 					"Advanced graduate program in computer science focusing on AI and machine learning.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-01-15"),
// 			},
// 			{
// 				id: "program_stanford_ai",
// 				title: "Stanford AI PhD Program",
// 				content:
// 					"Doctoral research program in artificial intelligence and deep learning.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-02-01"),
// 			},
// 			{
// 				id: "program_oxford_cs",
// 				title: "Oxford Computer Science Bachelor",
// 				content:
// 					"Undergraduate program in computer science and mathematics.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-03-10"),
// 			},
// 			{
// 				id: "program_mit_ds",
// 				title: "MIT Data Science Master",
// 				content:
// 					"Interdisciplinary program combining statistics, ML, and domain expertise.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-01-20"),
// 			},
// 		],
// 	});

// 	console.log("✅ Created program posts");

// 	// Create PostProgram details
// 	await prisma.postProgram.createMany({
// 		data: [
// 			{
// 				PostId: "program_mit_cs",
// 				duration: "2 years",
// 				degreeLevel: "Master",
// 				CourseInclude:
// 					"Advanced Algorithms, Machine Learning, Software Engineering",
// 				professor_name: "Dr. John Smith",
// 				gpa: 3.7,
// 				gre: 320,
// 				tuition_fee: 55000,
// 				fee_description: "Annual tuition",
// 				scholarship_info: "Merit scholarships available",
// 			},
// 			{
// 				PostId: "program_stanford_ai",
// 				duration: "5 years",
// 				degreeLevel: "PhD",
// 				CourseInclude: "Deep Learning, NLP, Computer Vision, Robotics",
// 				professor_name: "Dr. Jane Doe",
// 				gpa: 3.8,
// 				gre: 330,
// 				tuition_fee: 0,
// 				fee_description: "Fully funded",
// 				scholarship_info: "Full funding with stipend",
// 			},
// 			{
// 				PostId: "program_oxford_cs",
// 				duration: "3 years",
// 				degreeLevel: "Bachelor",
// 				CourseInclude: "Programming, Algorithms, Mathematics, Theory",
// 				professor_name: "Prof. Robert Brown",
// 				gpa: 3.5,
// 				tuition_fee: 45000,
// 				fee_description: "Annual international fee",
// 				scholarship_info: "Need-based aid available",
// 			},
// 			{
// 				PostId: "program_mit_ds",
// 				duration: "2 years",
// 				degreeLevel: "Master",
// 				CourseInclude:
// 					"Statistics, Machine Learning, Data Mining, Visualization",
// 				professor_name: "Dr. Data Science",
// 				gpa: 3.6,
// 				gre: 315,
// 				tuition_fee: 54000,
// 				fee_description: "Per year tuition",
// 				scholarship_info: "Industry partnership scholarships available",
// 			},
// 		],
// 	});

// 	console.log("✅ Created program details");

// 	// Create scholarship posts
// 	await prisma.post.createMany({
// 		data: [
// 			{
// 				id: "scholarship_merit",
// 				title: "MIT Merit Excellence Scholarship",
// 				content:
// 					"Full tuition scholarship for exceptional students with outstanding academic achievements.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-01-10"),
// 			},
// 			{
// 				id: "scholarship_need",
// 				title: "Stanford Need-Based Grant",
// 				content:
// 					"Financial aid for students demonstrating financial need. No essays required.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-02-05"),
// 			},
// 			{
// 				id: "scholarship_international",
// 				title: "Oxford International Excellence Award",
// 				content:
// 					"Prestigious scholarship for international students pursuing undergraduate degrees.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-03-01"),
// 			},
// 		],
// 	});

// 	console.log("✅ Created scholarship posts");

// 	// Create PostScholarship details
// 	await prisma.postScholarship.createMany({
// 		data: [
// 			{
// 				PostId: "scholarship_merit",
// 				detail: "Full tuition coverage plus $25,000 annual stipend",
// 				type: "Merit-based",
// 				number: 10,
// 				grant: "$80,000 per year",
// 				scholarship_coverage: "Full tuition + Living expenses",
// 				essay_required: true,
// 				eligibility: "GPA 3.8+, GRE 325+, Outstanding research experience",
// 			},
// 			{
// 				PostId: "scholarship_need",
// 				detail: "Sliding scale based on family income",
// 				type: "Need-based",
// 				number: 50,
// 				grant: "$15,000-$45,000",
// 				scholarship_coverage: "Partial to full tuition",
// 				essay_required: false,
// 				eligibility: "Family income below $75,000, US citizens or permanent residents",
// 			},
// 			{
// 				PostId: "scholarship_international",
// 				detail: "Comprehensive support for international students",
// 				type: "International",
// 				number: 25,
// 				grant: "$35,000 per year",
// 				scholarship_coverage: "Partial tuition + Living allowance",
// 				essay_required: true,
// 				eligibility: "International students, Academic excellence, Leadership experience",
// 			},
// 		],
// 	});

// 	console.log("✅ Created scholarship details");

// 	// Create research job posts
// 	await prisma.post.createMany({
// 		data: [
// 			{
// 				id: "research_postdoc_ai",
// 				title: "Postdoctoral Researcher in Artificial Intelligence",
// 				content:
// 					"Full-time postdoctoral position in AI research lab focusing on machine learning and neural networks.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-01-25"),
// 			},
// 			{
// 				id: "research_ra_ml",
// 				title: "Research Assistant - Machine Learning Lab",
// 				content:
// 					"Part-time research assistant position for graduate students in ML projects.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-02-10"),
// 			},
// 			{
// 				id: "research_phd_quantum",
// 				title: "PhD Research Position in Quantum Computing",
// 				content:
// 					"Fully funded PhD research position in quantum computing lab.",
// 				published: true,
// 				authorId: "system",
// 				createdAt: new Date("2024-03-15"),
// 			},
// 		],
// 	});

// 	console.log("✅ Created research posts");

// 	// Create PostJob details
// 	await prisma.postJob.createMany({
// 		data: [
// 			{
// 				PostId: "research_postdoc_ai",
// 				contract_type: "Full-time",
// 				job_type: "Postdoctoral Researcher",
// 				min_salary: 55000,
// 				max_salary: 65000,
// 				salary_description: "Annual salary with full benefits",
// 				benefit: "Health insurance, dental, vision, retirement plan, conference funding",
// 				main_responsibility: "Conduct independent AI research, publish papers, mentor students",
// 				qualification_requirement: "PhD in Computer Science, AI, or related field",
// 				experience_requirement: "2+ years research experience in machine learning",
// 				assessment_criteria: "Research publications, technical skills, collaboration ability",
// 				other_requirement: "Strong programming skills in Python/PyTorch",
// 			},
// 			{
// 				PostId: "research_ra_ml",
// 				contract_type: "Part-time",
// 				job_type: "Research Assistant",
// 				min_salary: 20000,
// 				max_salary: 25000,
// 				salary_description: "Annual stipend for part-time work",
// 				benefit: "Research experience, publication opportunities, mentorship",
// 				main_responsibility: "Assist in ML experiments, data analysis, paper writing",
// 				qualification_requirement: "Currently enrolled in graduate program",
// 				experience_requirement: "Basic ML knowledge, programming experience",
// 				assessment_criteria: "Academic performance, technical aptitude, availability",
// 				other_requirement: "Commitment to 20 hours per week",
// 			},
// 			{
// 				PostId: "research_phd_quantum",
// 				contract_type: "Full-time",
// 				job_type: "PhD Student",
// 				min_salary: 35000,
// 				max_salary: 40000,
// 				salary_description: "Annual stipend plus full tuition waiver",
// 				benefit: "Full tuition waiver, health insurance, conference funding",
// 				main_responsibility: "Conduct quantum computing research, coursework, teaching duties",
// 				qualification_requirement: "Masters in Physics, Computer Science, or Mathematics",
// 				experience_requirement: "Background in quantum mechanics or theoretical CS",
// 				assessment_criteria: "Research potential, academic record, technical background",
// 				other_requirement: "Strong mathematical foundation, programming skills",
// 			},
// 		],
// 	});

// 	console.log("✅ Created job details");

// 	// Create applications to test popularity sorting
// 	const applicationData = [];

// 	// MIT CS MS - 8 applications (most popular)
// 	for (let i = 0; i < 8; i++) {
// 		applicationData.push({
// 			id: `app_mit_cs_${i + 1}`,
// 			postId: "program_mit_cs",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 1).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	// Stanford AI PhD - 5 applications
// 	for (let i = 0; i < 5; i++) {
// 		applicationData.push({
// 			id: `app_stanford_ai_${i + 1}`,
// 			postId: "program_stanford_ai",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 5).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	// Oxford CS BS - 3 applications
// 	for (let i = 0; i < 3; i++) {
// 		applicationData.push({
// 			id: `app_oxford_cs_${i + 1}`,
// 			postId: "program_oxford_cs",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 10).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	// MIT DS - 2 applications
// 	for (let i = 0; i < 2; i++) {
// 		applicationData.push({
// 			id: `app_mit_ds_${i + 1}`,
// 			postId: "program_mit_ds",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 13).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	// Scholarships applications
// 	for (let i = 0; i < 6; i++) {
// 		applicationData.push({
// 			id: `app_merit_${i + 1}`,
// 			postId: "scholarship_merit",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 15).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	for (let i = 0; i < 4; i++) {
// 		applicationData.push({
// 			id: `app_need_${i + 1}`,
// 			postId: "scholarship_need",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 21).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	for (let i = 0; i < 2; i++) {
// 		applicationData.push({
// 			id: `app_international_${i + 1}`,
// 			postId: "scholarship_international",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 25).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	// Research positions applications
// 	for (let i = 0; i < 4; i++) {
// 		applicationData.push({
// 			id: `app_postdoc_${i + 1}`,
// 			postId: "research_postdoc_ai",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 27).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	for (let i = 0; i < 3; i++) {
// 		applicationData.push({
// 			id: `app_ra_${i + 1}`,
// 			postId: "research_ra_ml",
// 			applicantId: "test_user",
// 			submittedAt: new Date(`2024-04-${String(i + 31).padStart(2, "0")}`),
// 			status: "submitted",
// 		});
// 	}

// 	applicationData.push({
// 		id: "app_phd_1",
// 		postId: "research_phd_quantum",
// 		applicantId: "test_user",
// 		submittedAt: new Date("2024-05-01"),
// 		status: "submitted",
// 	});

// 	await prisma.application.createMany({
// 		data: applicationData,
// 	});

// 	console.log("✅ Created test applications");

// 	console.log("🎉 Database seeding completed successfully!");
// 	console.log(`
// 📊 Created data summary:
// - 4 Program posts (MIT CS MS: 8 apps, Stanford AI PhD: 5 apps, Oxford CS BS: 3 apps, MIT DS MS: 2 apps)
// - 3 Scholarship posts (Merit: 6 apps, Need: 4 apps, International: 2 apps)
// - 3 Research posts (Postdoc: 4 apps, RA: 3 apps, PhD: 1 app)
// - ${applicationData.length} Applications total for popularity testing

// 🔧 Test scenarios covered:
// - Different degree levels: Bachelor, Master, PhD
// - Different scholarship types: Merit, Need-based, International
// - Different job types: Postdoctoral, Research Assistant, PhD Student
// - Different contract types: Full-time, Part-time
// - Essay required vs not required
// - Popularity sorting by application count
// - Date-based sorting (newest, oldest)
// - All filtering capabilities
// 	`);
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
//         profile_id: 'inst_stanford',
//         logo: '/logos/stanford.png',
//         name: 'Stanford University',
//         abbreviation: 'Stanford',
//         hotline: '6507231000',
//         type: 'University',
//         website: 'https://www.stanford.edu',
//         country: 'USA',
//         address: '450 Serra Mall, Stanford, CA 94305',
//         rep_name: 'Jane Stanford',
//         rep_appellation: new Date(),
//         rep_position: 'Admissions Officer',
//         rep_email: 'admissions@stanford.edu',
//         rep_phone: '6507231000',
//         about: 'Premier research university in Silicon Valley',
//         subdiscipline: 1,
//         cover_image: '/covers/stanford.jpg'
//       }
//     }),
//     prisma.institutionProfile.upsert({
//       where: { profile_id: 'inst_oxford' },
//       update: {},
//       create: {
//         profile_id: 'inst_oxford',
//         logo: '/logos/oxford.png',
//         name: 'University of Oxford',
//         abbreviation: 'Oxford',
//         hotline: '441865270000',
//         type: 'University',
//         website: 'https://www.ox.ac.uk',
//         country: 'UK',
//         address: 'Wellington Square, Oxford OX1 2JD, UK',
//         rep_name: 'Robert Oxford',
//         rep_appellation: new Date(),
//         rep_position: 'International Admissions',
//         rep_email: 'admissions@ox.ac.uk',
//         rep_phone: '441865270000',
//         about: 'One of the oldest and most prestigious universities in the world',
//         subdiscipline: 1,
//         cover_image: '/covers/oxford.jpg'
//       }
//     }),
//   ]);

//   console.log('✅ Created test institutions');

//   // Create test posts for programs
//   const programPosts = await Promise.all([
//     // MIT Computer Science Master's
//     prisma.post.upsert({
//       where: { id: 'post_mit_cs_ms' },
//       update: {},
//       create: {
//         id: 'post_mit_cs_ms',
//         title: 'Master of Science in Computer Science',
//         content: 'Advanced graduate program in computer science with focus on AI, machine learning, and software engineering. Designed for students who want to pursue cutting-edge research in computer science.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-01-15'),
//       }
//     }),
//     // Stanford AI PhD
//     prisma.post.upsert({
//       where: { id: 'post_stanford_ai_phd' },
//       update: {},
//       create: {
//         id: 'post_stanford_ai_phd',
//         title: 'PhD in Artificial Intelligence',
//         content: 'Doctoral program in AI research focusing on deep learning, natural language processing, and robotics. Join world-class faculty in advancing the field of artificial intelligence.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-02-01'),
//       }
//     }),
//     // Oxford Computer Science Bachelor's
//     prisma.post.upsert({
//       where: { id: 'post_oxford_cs_bs' },
//       update: {},
//       create: {
//         id: 'post_oxford_cs_bs',
//         title: 'Bachelor of Science in Computer Science',
//         content: 'Undergraduate program covering fundamentals of computer science including algorithms, programming, mathematics, and theoretical computer science.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-03-10'),
//       }
//     }),
//     // MIT Data Science Master's
//     prisma.post.upsert({
//       where: { id: 'post_mit_ds_ms' },
//       update: {},
//       create: {
//         id: 'post_mit_ds_ms',
//         title: 'Master of Science in Data Science',
//         content: 'Interdisciplinary program combining statistics, machine learning, and domain expertise to extract insights from big data.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-01-20'),
//       }
//     }),
//   ]);

//   console.log('✅ Created program posts');

//   // Create PostProgram entries
//   await Promise.all([
//     prisma.postProgram.upsert({
//       where: { PostId: 'post_mit_cs_ms' },
//       update: {},
//       create: {
//         PostId: 'post_mit_cs_ms',
//         duration: '2 years',
//         degreeLevel: 'Master',
//         CourseInclude: 'Advanced Algorithms, Machine Learning, Software Engineering, Computer Vision',
//         professor_name: 'Dr. John MIT',
//         gpa: 3.7,
//         gre: 320,
//         gmat: null,
//         tuition_fee: 55000,
//         fee_description: 'Per year tuition for full-time students',
//         scholarship_info: 'Merit-based scholarships available up to 50% tuition coverage'
//       }
//     }),
//     prisma.postProgram.upsert({
//       where: { PostId: 'post_stanford_ai_phd' },
//       update: {},
//       create: {
//         PostId: 'post_stanford_ai_phd',
//         duration: '5 years',
//         degreeLevel: 'PhD',
//         CourseInclude: 'Deep Learning, Natural Language Processing, Computer Vision, Robotics',
//         professor_name: 'Dr. Jane Stanford',
//         gpa: 3.8,
//         gre: 330,
//         gmat: null,
//         tuition_fee: 58000,
//         fee_description: 'Full funding provided for all PhD students',
//         scholarship_info: 'Full tuition waiver plus $40,000 annual stipend'
//       }
//     }),
//     prisma.postProgram.upsert({
//       where: { PostId: 'post_oxford_cs_bs' },
//       update: {},
//       create: {
//         PostId: 'post_oxford_cs_bs',
//         duration: '3 years',
//         degreeLevel: 'Bachelor',
//         CourseInclude: 'Programming, Algorithms, Mathematics, Theoretical CS, Software Engineering',
//         professor_name: 'Prof. Robert Oxford',
//         gpa: 3.5,
//         gre: null,
//         gmat: null,
//         tuition_fee: 45000,
//         fee_description: 'Per year for international students',
//         scholarship_info: 'Need-based financial aid available'
//       }
//     }),
//     prisma.postProgram.upsert({
//       where: { PostId: 'post_mit_ds_ms' },
//       update: {},
//       create: {
//         PostId: 'post_mit_ds_ms',
//         duration: '2 years',
//         degreeLevel: 'Master',
//         CourseInclude: 'Statistics, Machine Learning, Data Mining, Big Data Analytics, Visualization',
//         professor_name: 'Dr. Data Science',
//         gpa: 3.6,
//         gre: 315,
//         gmat: null,
//         tuition_fee: 54000,
//         fee_description: 'Per year tuition',
//         scholarship_info: 'Industry partnership scholarships available'
//       }
//     }),
//   ]);

//   console.log('✅ Created program details');

//   // Create scholarship posts
//   const scholarshipPosts = await Promise.all([
//     // Merit Scholarship
//     prisma.post.upsert({
//       where: { id: 'post_merit_scholarship' },
//       update: {},
//       create: {
//         id: 'post_merit_scholarship',
//         title: 'MIT Merit Excellence Scholarship',
//         content: 'Full tuition scholarship for exceptional students with outstanding academic achievements. Covers full tuition and includes annual stipend for living expenses.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-01-10'),
//       }
//     }),
//     // Need-based Scholarship
//     prisma.post.upsert({
//       where: { id: 'post_need_scholarship' },
//       update: {},
//       create: {
//         id: 'post_need_scholarship',
//         title: 'Stanford Need-Based Grant',
//         content: 'Financial aid for students demonstrating financial need. No essays required, based on FAFSA submission and family income assessment.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-02-05'),
//       }
//     }),
//     // International Scholarship
//     prisma.post.upsert({
//       where: { id: 'post_international_scholarship' },
//       update: {},
//       create: {
//         id: 'post_international_scholarship',
//         title: 'Oxford International Excellence Award',
//         content: 'Prestigious scholarship for international students pursuing undergraduate degrees. Requires essay submission and demonstrates academic excellence.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-03-01'),
//       }
//     }),
//   ]);

//   console.log('✅ Created scholarship posts');

//   // Create PostScholarship entries
//   await Promise.all([
//     prisma.postScholarship.upsert({
//       where: { PostId: 'post_merit_scholarship' },
//       update: {},
//       create: {
//         PostId: 'post_merit_scholarship',
//         detail: 'Full tuition coverage plus $25,000 annual stipend',
//         type: 'Merit-based',
//         number: 10,
//         grant: '$80,000 per year',
//         scholarship_coverage: 'Full tuition + Living expenses',
//         essay_required: true,
//         eligibility: 'GPA 3.8+, GRE 325+, Outstanding research experience'
//       }
//     }),
//     prisma.postScholarship.upsert({
//       where: { PostId: 'post_need_scholarship' },
//       update: {},
//       create: {
//         PostId: 'post_need_scholarship',
//         detail: 'Sliding scale based on family income',
//         type: 'Need-based',
//         number: 50,
//         grant: '$15,000-$45,000',
//         scholarship_coverage: 'Partial to full tuition',
//         essay_required: false,
//         eligibility: 'Family income below $75,000, US citizens or permanent residents'
//       }
//     }),
//     prisma.postScholarship.upsert({
//       where: { PostId: 'post_international_scholarship' },
//       update: {},
//       create: {
//         PostId: 'post_international_scholarship',
//         detail: 'Comprehensive support for international students',
//         type: 'International',
//         number: 25,
//         grant: '$35,000 per year',
//         scholarship_coverage: 'Partial tuition + Living allowance',
//         essay_required: true,
//         eligibility: 'International students, Academic excellence, Leadership experience'
//       }
//     }),
//   ]);

//   console.log('✅ Created scholarship details');

//   // Create research job posts
//   const researchPosts = await Promise.all([
//     // PostDoc AI
//     prisma.post.upsert({
//       where: { id: 'post_postdoc_ai' },
//       update: {},
//       create: {
//         id: 'post_postdoc_ai',
//         title: 'Postdoctoral Researcher in Artificial Intelligence',
//         content: 'Full-time postdoctoral position in AI research lab focusing on machine learning and neural networks. Join cutting-edge research in AI safety and interpretability.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-01-25'),
//       }
//     }),
//     // Research Assistant
//     prisma.post.upsert({
//       where: { id: 'post_ra_ml' },
//       update: {},
//       create: {
//         id: 'post_ra_ml',
//         title: 'Research Assistant - Machine Learning Lab',
//         content: 'Part-time research assistant position for graduate students. Work on exciting ML projects in computer vision and natural language processing.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-02-10'),
//       }
//     }),
//     // PhD Research Position
//     prisma.post.upsert({
//       where: { id: 'post_phd_research' },
//       update: {},
//       create: {
//         id: 'post_phd_research',
//         title: 'PhD Research Position in Quantum Computing',
//         content: 'Fully funded PhD research position in quantum computing lab. Work on quantum algorithms and quantum machine learning applications.',
//         published: true,
//         authorId: 'user_1',
//         createdAt: new Date('2024-03-15'),
//       }
//     }),
//   ]);

//   console.log('✅ Created research posts');

//   // Create PostJob entries
//   await Promise.all([
//     prisma.postJob.upsert({
//       where: { PostId: 'post_postdoc_ai' },
//       update: {},
//       create: {
//         PostId: 'post_postdoc_ai',
//         contract_type: 'Full-time',
//         job_type: 'Postdoctoral Researcher',
//         min_salary: 55000,
//         max_salary: 65000,
//         salary_description: 'Annual salary with full benefits',
//         benefit: 'Health insurance, dental, vision, retirement plan, conference funding',
//         main_responsibility: 'Conduct independent AI research, publish papers, mentor students',
//         qualification_requirement: 'PhD in Computer Science, AI, or related field',
//         experience_requirement: '2+ years research experience in machine learning',
//         assessment_criteria: 'Research publications, technical skills, collaboration ability',
//         other_requirement: 'Strong programming skills in Python/PyTorch'
//       }
//     }),
//     prisma.postJob.upsert({
//       where: { PostId: 'post_ra_ml' },
//       update: {},
//       create: {
//         PostId: 'post_ra_ml',
//         contract_type: 'Part-time',
//         job_type: 'Research Assistant',
//         min_salary: 20000,
//         max_salary: 25000,
//         salary_description: 'Annual stipend for part-time work',
//         benefit: 'Research experience, publication opportunities, mentorship',
//         main_responsibility: 'Assist in ML experiments, data analysis, paper writing',
//         qualification_requirement: 'Currently enrolled in graduate program',
//         experience_requirement: 'Basic ML knowledge, programming experience',
//         assessment_criteria: 'Academic performance, technical aptitude, availability',
//         other_requirement: 'Commitment to 20 hours per week'
//       }
//     }),
//     prisma.postJob.upsert({
//       where: { PostId: 'post_phd_research' },
//       update: {},
//       create: {
//         PostId: 'post_phd_research',
//         contract_type: 'Full-time',
//         job_type: 'PhD Student',
//         min_salary: 35000,
//         max_salary: 40000,
//         salary_description: 'Annual stipend plus full tuition waiver',
//         benefit: 'Full tuition waiver, health insurance, conference funding',
//         main_responsibility: 'Conduct quantum computing research, coursework, teaching duties',
//         qualification_requirement: 'Masters in Physics, Computer Science, or Mathematics',
//         experience_requirement: 'Background in quantum mechanics or theoretical CS',
//         assessment_criteria: 'Research potential, academic record, technical background',
//         other_requirement: 'Strong mathematical foundation, programming skills'
//       }
//     }),
//   ]);

//   console.log('✅ Created job details');

//   // Create applications to test popularity sorting
//   const applications = await Promise.all([
//     // MIT CS MS - 8 applications (most popular)
//     ...Array.from({ length: 8 }, (_, i) =>
//       prisma.application.upsert({
//         where: { id: `app_mit_cs_${i + 1}` },
//         update: {},
//         create: {
//           id: `app_mit_cs_${i + 1}`,
//           postId: 'post_mit_cs_ms',
//           applicantId: users[i % 3].id,
//           submittedAt: new Date(`2024-04-${i + 1 < 10 ? '0' : ''}${i + 1}`),
//           status: 'submitted',
//         }
//       })
//     ),
//     // Stanford AI PhD - 5 applications
//     ...Array.from({ length: 5 }, (_, i) =>
//       prisma.application.upsert({
//         where: { id: `app_stanford_ai_${i + 1}` },
//         update: {},
//         create: {
//           id: `app_stanford_ai_${i + 1}`,
//           postId: 'post_stanford_ai_phd',
//           applicantId: users[i % 3].id,
//           submittedAt: new Date(`2024-04-${i + 5 < 10 ? '0' : ''}${i + 5}`),
//           status: 'submitted',
//         }
//       })
//     ),
//     // Oxford CS BS - 3 applications
//     ...Array.from({ length: 3 }, (_, i) =>
//       prisma.application.upsert({
//         where: { id: `app_oxford_cs_${i + 1}` },
//         update: {},
//         create: {
//           id: `app_oxford_cs_${i + 1}`,
//           postId: 'post_oxford_cs_bs',
//           applicantId: users[i % 3].id,
//           submittedAt: new Date(`2024-04-${i + 10 < 10 ? '0' : ''}${i + 10}`),
//           status: 'submitted',
//         }
//       })
//     ),
//     // Scholarships applications
//     ...Array.from({ length: 6 }, (_, i) =>
//       prisma.application.upsert({
//         where: { id: `app_merit_scholar_${i + 1}` },
//         update: {},
//         create: {
//           id: `app_merit_scholar_${i + 1}`,
//           postId: 'post_merit_scholarship',
//           applicantId: users[i % 3].id,
//           submittedAt: new Date(`2024-04-${i + 15 < 10 ? '0' : ''}${i + 15}`),
//           status: 'submitted',
//         }
//       })
//     ),
//     // Research positions applications
//     ...Array.from({ length: 4 }, (_, i) =>
//       prisma.application.upsert({
//         where: { id: `app_postdoc_ai_${i + 1}` },
//         update: {},
//         create: {
//           id: `app_postdoc_ai_${i + 1}`,
//           postId: 'post_postdoc_ai',
//           applicantId: users[i % 3].id,
//           submittedAt: new Date(`2024-04-${i + 20 < 10 ? '0' : ''}${i + 20}`),
//           status: 'submitted',
//         }
//       })
//     ),
//   ]);

//   console.log('✅ Created test applications');

//   console.log('🎉 Database seeding completed successfully!');
//   console.log(`
//   📊 Created data summary:
//   - 3 Users
//   - 3 Institutions (MIT, Stanford, Oxford)
//   - 4 Program posts + details
//   - 3 Scholarship posts + details
//   - 3 Research posts + details
//   - ${applications.length} Applications for popularity testing

//   🔧 Test scenarios covered:
//   - Different degree levels: Bachelor, Master, PhD
//   - Different countries: USA, UK
//   - Different fields: Computer Science, AI, Data Science
//   - Essay required vs not required scholarships
//   - Different job types: Postdoc, Research Assistant, PhD Student
//   - Different contract types: Full-time, Part-time
//   - Popularity sorting (application counts)
//   `);
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
