/* eslint-disable no-console */
/**
 * Seed Programs Only Script
 *
 * Creates 10 program posts for a specific institution
 * Institution ID: 4c5a8db4-110f-44e5-926f-096a63d775b8
 */

import dotenv from "dotenv";
import { prismaClient } from "../../prisma/index";
import {
	// generateUniqueId,
	getRandomDate,
	getRandomElement,
	getRandomSubdisciplineIds,
} from "./data/helpers";

dotenv.config();

const INSTITUTION_ID = "37daf1ab-f4da-4e1a-bb7f-029254a11493";
const NUM_PROGRAMS = 10;

// Program templates
const programTemplates = [
	{
		title: "Master of Computer Science",
		description:
			"Advanced program in computer science covering AI, machine learning, software engineering, and data science. Prepare for leadership roles in technology.",
		duration: "2 years",
		degree: "Master's Degree",
		studyMode: "Full-time",
		tuitionFee: 25000,
		courseInclude: `<p>The Master of Computer Science requires completion of 96 units, of which:</p><p>A minimum of 48 units must come from completion of 4000-level courses from COMP Computer Science.</p><p>A minimum of 24 units of courses tagged as Advanced Research Methods</p><p>The 96 units must include:</p><ul><li><strong>COMP4001</strong> Advanced Algorithms and Data Structures (6 units)</li><li><strong>COMP4010</strong> Machine Learning Fundamentals (6 units)</li><li><strong>COMP4020</strong> Artificial Intelligence Systems (6 units)</li><li><strong>COMP4030</strong> Software Engineering Principles (6 units)</li><li><strong>COMP4040</strong> Cloud Computing and Big Data (6 units)</li><li><strong>COMP4999</strong> Research Thesis (24 units)</li></ul><p>Students must also complete 36 units from elective courses in areas such as cybersecurity, distributed systems, natural language processing, or computer vision.</p>`,
		feeDescription: `<p>Tuition fee: $25,000 USD per year (Full program: $50,000 for 2 years)</p><p>Additional fees include:</p><ul><li>Student service fee: $500 per year</li><li>Technology and laboratory access fee: $800 per year</li><li>Health insurance (international students): $1,200 per year</li><li>Thesis submission and examination fee: $300 (one-time)</li></ul><p>Payment plans available: Semester-based installments or annual payment with 5% discount.</p><p>Note: Fees are subject to annual review and may increase by up to 3% per year.</p>`,
		scholarshipInfo: `<p>Merit-based scholarships available for outstanding applicants:</p><ul><li><strong>Presidential Excellence Scholarship</strong>: Full tuition waiver (100%) for students with exceptional academic records (GPA 3.8+)</li><li><strong>Dean's Achievement Award</strong>: 50% tuition reduction for high-achieving students (GPA 3.5-3.79)</li><li><strong>Research Assistantship</strong>: Up to $15,000 per year plus tuition waiver for students working on faculty research projects (20 hours/week)</li><li><strong>Teaching Assistantship</strong>: $12,000 per year plus 50% tuition reduction for qualified students</li></ul><p>Application deadline for scholarship consideration: March 15th annually. No separate application required - all admitted students automatically considered.</p>`,
	},
	{
		title: "PhD in Artificial Intelligence",
		description:
			"Research-focused doctoral program in AI, deep learning, natural language processing, and computer vision. Work with leading researchers.",
		duration: "4 years",
		degree: "Doctorate",
		studyMode: "Full-time",
		tuitionFee: 30000,
		courseInclude: `<p>The PhD in Artificial Intelligence requires completion of 192 units over 4 years, including:</p><p>Minimum of 48 units of coursework in years 1-2:</p><ul><li><strong>AI6001</strong> Advanced Machine Learning Theory (8 units)</li><li><strong>AI6010</strong> Deep Learning Architectures (8 units)</li><li><strong>AI6020</strong> Natural Language Processing (8 units)</li><li><strong>AI6030</strong> Computer Vision and Image Recognition (8 units)</li><li><strong>AI6040</strong> Reinforcement Learning (8 units)</li><li><strong>AI6050</strong> Research Methodology and Ethics (8 units)</li></ul><p>Minimum of 144 units of supervised research:</p><ul><li>Comprehensive examination (end of year 2)</li><li>Dissertation research and writing (years 2-4)</li><li>Publication requirement: Minimum 3 peer-reviewed papers in top-tier conferences/journals</li><li>Dissertation defense and viva voce examination</li></ul>`,
		feeDescription: `<p>Tuition fee: $30,000 USD per year (Full program: $120,000 for 4 years)</p><p>PhD students typically receive full funding packages including:</p><ul><li>Full tuition waiver for years 1-4</li><li>Living stipend: $28,000 per year (tax-free)</li><li>Research and conference travel budget: $5,000 per year</li><li>Health insurance coverage: Fully covered</li><li>Computing resources and GPU cluster access: Included</li></ul><p>Out-of-pocket expenses (if self-funded):</p><ul><li>Student activity fee: $400 per year</li><li>Dissertation printing and binding: $200 (one-time)</li></ul><p>International students may incur additional visa and relocation costs.</p>`,
		scholarshipInfo: `<p>Full doctoral fellowships available for all admitted students:</p><ul><li><strong>Presidential PhD Fellowship</strong>: Full tuition + $32,000 annual stipend + $6,000 research budget (Top 10% of applicants)</li><li><strong>Standard PhD Fellowship</strong>: Full tuition + $28,000 annual stipend + $5,000 research budget (All admitted students)</li><li><strong>Industry Partnership Scholarship</strong>: Full funding + industry internship opportunities with companies like Google, Microsoft, Amazon</li><li><strong>International Student Excellence Award</strong>: Additional $5,000 per year for international students from underrepresented regions</li></ul><p>All fellowships guaranteed for 4 years with satisfactory academic progress. Additional support available for 5th year if needed for dissertation completion.</p>`,
	},
	{
		title: "Bachelor of Business Administration",
		description:
			"Comprehensive undergraduate program in business management, finance, marketing, and entrepreneurship. Build strong business fundamentals.",
		duration: "4 years",
		degree: "Bachelor's Degree",
		studyMode: "Full-time",
		tuitionFee: 18000,
		courseInclude: `<p>The Bachelor of Business Administration requires completion of 144 units over 4 years:</p><p>Core Business Foundation (48 units):</p><ul><li><strong>BUS1001</strong> Introduction to Business (6 units)</li><li><strong>BUS1010</strong> Principles of Management (6 units)</li><li><strong>BUS1020</strong> Financial Accounting (6 units)</li><li><strong>BUS1030</strong> Marketing Fundamentals (6 units)</li><li><strong>BUS1040</strong> Business Statistics (6 units)</li><li><strong>BUS1050</strong> Microeconomics for Business (6 units)</li><li><strong>BUS1060</strong> Macroeconomics (6 units)</li><li><strong>BUS1070</strong> Business Law and Ethics (6 units)</li></ul><p>Major Specialization (36 units) - Choose one:</p><ul><li>Finance, Marketing, Human Resources, Operations Management, International Business, or Entrepreneurship</li></ul><p>General Education (30 units), Electives (24 units), Capstone Project (6 units)</p>`,
		feeDescription: `<p>Tuition fee: $18,000 USD per year (Full program: $72,000 for 4 years)</p><p>Additional mandatory fees:</p><ul><li>Student services and facilities fee: $1,200 per year</li><li>Business school technology fee: $600 per year</li><li>Library and online resources access: $300 per year</li><li>Health and wellness fee: $400 per year</li></ul><p>Optional costs:</p><ul><li>Study abroad semester: $8,000-$15,000 (one semester)</li><li>Professional certification prep courses: $500-$1,500 each</li><li>Business case competitions: $200-$800 per event</li></ul><p>Payment options: Semester installments, annual payment (3% discount), or monthly payment plan (small processing fee applies).</p>`,
		scholarshipInfo: `<p>Business School scholarships available:</p><ul><li><strong>Future Business Leader Scholarship</strong>: $10,000 per year (renewable for 4 years) for students with GPA 3.7+ and demonstrated leadership</li><li><strong>Entrepreneurship Innovation Award</strong>: $15,000 one-time award for students with viable business plans</li><li><strong>Diversity in Business Scholarship</strong>: $8,000 per year for underrepresented students in business fields</li><li><strong>International Student Business Award</strong>: $6,000 per year for international students with strong academic backgrounds</li><li><strong>Dean's Partial Scholarship</strong>: $3,000-$5,000 per year based on academic merit</li></ul><p>Work-study opportunities: Campus jobs and paid internships available through Career Services. Application opens December 1st each year.</p>`,
	},
	{
		title: "Master of Data Science",
		description:
			"Intensive program combining statistics, machine learning, and big data technologies. Become a data science expert.",
		duration: "18 months",
		degree: "Master's Degree",
		studyMode: "Full-time",
		tuitionFee: 28000,
		courseInclude: `<p>The Master of Data Science requires completion of 72 units over 18 months:</p><p>Core Courses (48 units):</p><ul><li><strong>DS5001</strong> Foundations of Data Science (6 units)</li><li><strong>DS5010</strong> Statistical Learning and Inference (6 units)</li><li><strong>DS5020</strong> Machine Learning at Scale (6 units)</li><li><strong>DS5030</strong> Big Data Technologies (Hadoop, Spark) (6 units)</li><li><strong>DS5040</strong> Data Visualization and Communication (6 units)</li><li><strong>DS5050</strong> Database Systems and SQL (6 units)</li><li><strong>DS5060</strong> Python for Data Science (6 units)</li><li><strong>DS5070</strong> Ethics in Data Science and AI (6 units)</li></ul><p>Specialization Electives (18 units) - Choose 3:</p><ul><li>Deep Learning, Natural Language Processing, Time Series Analysis, Recommender Systems, Causal Inference, or Business Analytics</li></ul><p>Capstone Project (6 units): Industry or research project with real-world datasets</p>`,
		feeDescription: `<p>Tuition fee: $28,000 USD per year (Full program: $42,000 for 18 months)</p><p>Fees breakdown per semester:</p><ul><li>Semester 1 & 2: $14,000 each</li><li>Semester 3 (6 months): $14,000</li></ul><p>Additional costs:</p><ul><li>Computing resources and cloud credits (AWS/Azure/GCP): $1,000 included in tuition</li><li>Software licenses (Tableau, MATLAB, etc.): Provided at no extra cost</li><li>Career development workshops and networking events: $300 per year</li><li>Health insurance (international students): $900 for 18 months</li></ul><p>Payment plans: Pay per semester or full program discount of 4% if paid upfront. Employer sponsorship programs available.</p>`,
		scholarshipInfo: `<p>Data Science program scholarships:</p><ul><li><strong>Tech Industry Partnership Scholarship</strong>: $20,000 total ($13,333 per year equivalent) sponsored by tech companies, includes internship placement</li><li><strong>Women in Data Science Award</strong>: $12,000 for female students pursuing data science careers</li><li><strong>Academic Excellence Scholarship</strong>: $8,000-$15,000 based on undergraduate GPA and GRE scores</li><li><strong>Career Transition Grant</strong>: $6,000 for professionals transitioning into data science from other fields</li><li><strong>Graduate Assistantship</strong>: Tuition reduction + $18,000 stipend for 20 hours/week research or teaching support</li></ul><p>Many students also receive employer tuition reimbursement. Early application deadline for maximum scholarship consideration: January 31st.</p>`,
	},
	{
		title: "Master of Engineering",
		description:
			"Advanced engineering program with specializations in mechanical, electrical, civil, and software engineering.",
		duration: "2 years",
		degree: "Master's Degree",
		studyMode: "Full-time",
		tuitionFee: 26000,
		courseInclude: `<p>The Master of Engineering requires completion of 96 units:</p><p>Engineering Core (24 units):</p><ul><li><strong>ENG5001</strong> Advanced Engineering Mathematics (6 units)</li><li><strong>ENG5010</strong> Engineering Project Management (6 units)</li><li><strong>ENG5020</strong> Research Methods in Engineering (6 units)</li><li><strong>ENG5030</strong> Sustainable Engineering Design (6 units)</li></ul><p>Specialization Track (48 units) - Choose one:</p><p><strong>Mechanical Engineering:</strong> Thermodynamics, Fluid Mechanics, Materials Science, Manufacturing Systems</p><p><strong>Electrical Engineering:</strong> Power Systems, Control Theory, Signal Processing, Embedded Systems</p><p><strong>Civil Engineering:</strong> Structural Analysis, Geotechnical Engineering, Transportation Systems, Construction Management</p><p><strong>Software Engineering:</strong> Software Architecture, Distributed Systems, DevOps, Software Quality Assurance</p><p>Electives (18 units) and Master's Thesis/Project (6 units)</p>`,
		feeDescription: `<p>Tuition fee: $26,000 USD per year (Full program: $52,000 for 2 years)</p><p>Engineering program fees include:</p><ul><li>Laboratory and workshop access: Included in tuition</li><li>Engineering software licenses (AutoCAD, MATLAB, SolidWorks, etc.): Included</li><li>Safety equipment and protective gear: $200 one-time fee</li><li>Student engineering society membership: $100 per year</li><li>Thesis printing and binding: $150 (final year)</li></ul><p>Optional costs:</p><ul><li>Professional Engineer (PE) exam preparation course: $800</li><li>Industry site visits and field trips: $300-$600 per year</li><li>Engineering design competition entry fees: $150-$400</li></ul><p>International student health insurance: $1,200 per year. Payment plans available quarterly or annually.</p>`,
		scholarshipInfo: `<p>Engineering scholarships and financial support:</p><ul><li><strong>Engineering Excellence Fellowship</strong>: Full tuition + $10,000 stipend per year for top 5% of applicants</li><li><strong>Industry-Sponsored Research Scholarship</strong>: 50-100% tuition coverage + paid research work with industry partners (Siemens, Boeing, etc.)</li><li><strong>Sustainable Engineering Innovation Award</strong>: $12,000 per year for students focused on renewable energy or environmental engineering</li><li><strong>International Engineering Talent Scholarship</strong>: $8,000-$15,000 for international students with strong technical backgrounds</li><li><strong>Teaching Assistantship in Engineering</strong>: 30% tuition reduction + $10,000 per year for 15 hours/week of teaching support</li></ul><p>Professional development grants up to $2,000 available for conference attendance and certification exams.</p>`,
	},
	{
		title: "Bachelor of Psychology",
		description:
			"Study human behavior, cognitive processes, and mental health. Prepare for careers in counseling, research, or clinical practice.",
		duration: "4 years",
		degree: "Bachelor's Degree",
		studyMode: "Full-time",
		tuitionFee: 16000,
		courseInclude: `<p>The Bachelor of Psychology requires completion of 144 units:</p><p>Psychology Core (60 units):</p><ul><li><strong>PSY1001</strong> Introduction to Psychology (6 units)</li><li><strong>PSY1010</strong> Research Methods in Psychology (6 units)</li><li><strong>PSY1020</strong> Statistics for Behavioral Sciences (6 units)</li><li><strong>PSY2001</strong> Cognitive Psychology (6 units)</li><li><strong>PSY2010</strong> Developmental Psychology (6 units)</li><li><strong>PSY2020</strong> Social Psychology (6 units)</li><li><strong>PSY2030</strong> Abnormal Psychology (6 units)</li><li><strong>PSY3001</strong> Biological Psychology (6 units)</li><li><strong>PSY3010</strong> Personality Psychology (6 units)</li><li><strong>PSY4001</strong> Clinical Psychology (6 units)</li></ul><p>Practical Experience (18 units): Internships in clinical settings, counseling centers, or research labs</p><p>General Education (36 units), Electives (24 units), Honors Thesis (6 units - optional)</p>`,
		feeDescription: `<p>Tuition fee: $16,000 USD per year (Full program: $64,000 for 4 years)</p><p>Psychology program fees:</p><ul><li>Student services fee: $800 per year</li><li>Research participation and lab access: $200 per year</li><li>Statistical software (SPSS, R Studio): Provided free through university license</li><li>Clinical training and supervision fee (years 3-4): $400 per year</li><li>Health and counseling services: $350 per year</li></ul><p>Internship-related costs:</p><ul><li>Professional liability insurance: $150 per year (required for clinical placements)</li><li>Background check and clearances: $80 (one-time)</li><li>Transportation to internship sites: Variable</li></ul><p>Flexible payment: Semester payments or annual payment with 4% discount. Financial aid available for eligible students.</p>`,
		scholarshipInfo: `<p>Psychology department scholarships:</p><ul><li><strong>Mental Health Advocacy Scholarship</strong>: $8,000 per year for students committed to mental health awareness and community service</li><li><strong>Research Excellence Award</strong>: $6,000 per year for students participating in faculty research projects</li><li><strong>Clinical Psychology Track Scholarship</strong>: $10,000 per year for students pursuing clinical or counseling careers (requires 3.5+ GPA)</li><li><strong>First-Generation College Student Award</strong>: $5,000 per year for first-generation students in psychology</li><li><strong>Diversity in Psychology Scholarship</strong>: $7,000 per year to promote diversity in the field</li></ul><p>Additional funding: Paid research assistant positions ($12-15/hour), peer tutoring opportunities, and graduate school preparation grants ($500-$1,000). Apply by February 1st for priority consideration.</p>`,
	},
	{
		title: "Master of Public Health",
		description:
			"Comprehensive program in epidemiology, health policy, biostatistics, and community health. Make a difference in public health.",
		duration: "2 years",
		degree: "Master's Degree",
		studyMode: "Full-time",
		tuitionFee: 24000,
		courseInclude: `<p>The Master of Public Health (MPH) requires completion of 96 units:</p><p>Core Competencies (42 units):</p><ul><li><strong>MPH6001</strong> Epidemiology (6 units)</li><li><strong>MPH6010</strong> Biostatistics (6 units)</li><li><strong>MPH6020</strong> Environmental Health Sciences (6 units)</li><li><strong>MPH6030</strong> Health Policy and Management (6 units)</li><li><strong>MPH6040</strong> Social and Behavioral Sciences (6 units)</li><li><strong>MPH6050</strong> Global Health (6 units)</li><li><strong>MPH6060</strong> Public Health Ethics and Leadership (6 units)</li></ul><p>Concentration Area (24 units) - Choose one:</p><ul><li>Epidemiology, Health Policy, Community Health, Environmental Health, or Biostatistics</li></ul><p>Practicum/Field Experience (18 units): 200+ hours at health departments, NGOs, or WHO</p><p>Capstone Project (12 units): Applied public health project addressing real community health needs</p>`,
		feeDescription: `<p>Tuition fee: $24,000 USD per year (Full program: $48,000 for 2 years)</p><p>Public Health program costs:</p><ul><li>Field practicum placement coordination: $500 (one-time)</li><li>Professional development and networking events: $400 per year</li><li>Statistical software (SAS, Stata, R): Included in tuition</li><li>Online journal and database access: Included</li><li>Student Public Health Association membership: $75 per year</li></ul><p>Field experience expenses:</p><ul><li>Travel to practicum site: Variable (some sites offer housing stipends)</li><li>Immunizations and health clearances: $200-$400 (required for field work)</li><li>Professional liability insurance: $100 per year</li></ul><p>International student health insurance: $1,200 per year. Employer sponsorship and government health worker scholarships accepted.</p>`,
		scholarshipInfo: `<p>Public Health scholarships and fellowships:</p><ul><li><strong>Global Health Leadership Fellowship</strong>: Full tuition + $15,000 living stipend + international field placement funding</li><li><strong>CDC Public Health Fellowship</strong>: Full tuition + paid practicum at CDC or state health departments</li><li><strong>Health Equity Scholarship</strong>: $18,000 per year for students focused on reducing health disparities</li><li><strong>Rural Health Service Award</strong>: $12,000 per year + guaranteed placement in rural/underserved communities</li><li><strong>Epidemiology Track Scholarship</strong>: $10,000 per year for students specializing in infectious disease epidemiology</li><li><strong>Working Professionals Grant</strong>: 30% tuition reduction for current healthcare workers</li></ul><p>Loan repayment programs available for graduates working in public service. Priority deadline: December 15th for fall admission and scholarship consideration.</p>`,
	},
	{
		title: "PhD in Biotechnology",
		description:
			"Research program in genetic engineering, molecular biology, and biomedical applications. Advance the frontiers of biotechnology.",
		duration: "5 years",
		degree: "Doctorate",
		studyMode: "Full-time",
		tuitionFee: 32000,
		courseInclude: `<p>The PhD in Biotechnology requires completion of 240 units over 5 years:</p><p>Advanced Coursework (60 units - Years 1-2):</p><ul><li><strong>BIO7001</strong> Advanced Molecular Biology (10 units)</li><li><strong>BIO7010</strong> Genetic Engineering and CRISPR Technologies (10 units)</li><li><strong>BIO7020</strong> Protein Engineering and Bioinformatics (10 units)</li><li><strong>BIO7030</strong> Stem Cell Biology and Regenerative Medicine (10 units)</li><li><strong>BIO7040</strong> Bioprocessing and Biomanufacturing (10 units)</li><li><strong>BIO7050</strong> Bioethics and Regulatory Affairs (10 units)</li></ul><p>Research Requirements (180 units - Years 2-5):</p><ul><li>Qualifying examination (end of Year 2)</li><li>Original research dissertation in areas such as gene therapy, synthetic biology, cancer biology, or agricultural biotechnology</li><li>Minimum 4 first-author publications in high-impact journals (IF > 5)</li><li>Dissertation defense and oral examination</li></ul>`,
		feeDescription: `<p>Tuition fee: $32,000 USD per year (Full program: $160,000 for 5 years)</p><p>PhD students receive comprehensive funding packages:</p><ul><li>Full tuition waiver for all 5 years</li><li>Research stipend: $32,000 per year (tax-free)</li><li>Research supplies and reagents budget: $10,000 per year</li><li>Conference travel support: $3,000 per year (up to 2 conferences)</li><li>Health and dental insurance: Fully covered</li><li>Laboratory equipment and shared facilities: Full access at no cost</li></ul><p>Self-funded students (rare) should budget for:</p><ul><li>Research materials if exceeding allocated budget</li><li>Additional conference travel beyond funded amount</li><li>Dissertation publication fees: $500-$2,000</li></ul><p>Most students incur minimal out-of-pocket costs due to full funding.</p>`,
		scholarshipInfo: `<p>Biotechnology PhD funding opportunities:</p><ul><li><strong>NIH Biotechnology Training Grant</strong>: Full tuition + $35,000 stipend + $12,000 research budget + health insurance (for US citizens/permanent residents)</li><li><strong>NSF Graduate Research Fellowship</strong>: Full tuition + $37,000 stipend for 3 years + professional development allowance</li><li><strong>University Presidential Fellowship</strong>: Full tuition + $34,000 stipend + $8,000 research fund + guaranteed summer funding</li><li><strong>International Student PhD Fellowship</strong>: Full tuition + $30,000 stipend for exceptional international applicants</li><li><strong>Industry Partnership Scholarship</strong>: Full funding + 6-month paid internship at biotech companies (Genentech, Amgen, Moderna)</li></ul><p>100% of admitted PhD students receive funding offers. Additional grants available through faculty research grants and foundation awards. Students can apply for dissertation writing fellowships in final year.</p>`,
	},
	{
		title: "Master of Finance",
		description:
			"Specialized program in corporate finance, investment banking, risk management, and financial modeling.",
		duration: "18 months",
		degree: "Master's Degree",
		studyMode: "Full-time",
		tuitionFee: 27000,
		courseInclude: `<p>The Master of Finance requires completion of 72 units over 18 months:</p><p>Core Finance Courses (42 units):</p><ul><li><strong>FIN6001</strong> Corporate Financial Management (6 units)</li><li><strong>FIN6010</strong> Investment Analysis and Portfolio Management (6 units)</li><li><strong>FIN6020</strong> Derivatives and Risk Management (6 units)</li><li><strong>FIN6030</strong> Financial Modeling and Valuation (6 units)</li><li><strong>FIN6040</strong> Fixed Income Securities (6 units)</li><li><strong>FIN6050</strong> Mergers and Acquisitions (6 units)</li><li><strong>FIN6060</strong> Financial Econometrics (6 units)</li></ul><p>Specialization Electives (18 units) - Choose 3:</p><ul><li>Fintech and Blockchain, Private Equity, Quantitative Finance, International Finance, Real Estate Finance, or Sustainable Finance</li></ul><p>Applied Finance Project (12 units): Real-world financial analysis project with industry sponsor</p>`,
		feeDescription: `<p>Tuition fee: $27,000 USD per year (Full program: $40,500 for 18 months)</p><p>Program fee structure:</p><ul><li>Semester 1: $13,500</li><li>Semester 2: $13,500</li><li>Semester 3 (6 months): $13,500</li></ul><p>Additional costs:</p><ul><li>Bloomberg Terminal access and financial databases: $800 (included in tuition)</li><li>CFA Level 1 exam prep course: $600 (optional, discounted for students)</li><li>Financial modeling software (Excel, Python, R): Provided free</li><li>Industry networking events and career fairs: $300 per year</li><li>Professional attire for recruiting: Variable (students budget $500-$1,500)</li></ul><p>Living expenses in financial hub cities: Budget $15,000-$25,000 for 18 months depending on location. Employer sponsorship common for working professionals.</p>`,
		scholarshipInfo: `<p>Finance program scholarships and awards:</p><ul><li><strong>Wall Street Excellence Scholarship</strong>: $25,000 total for students with finance internship experience at top firms</li><li><strong>CFA Institute Scholarship</strong>: $15,000 + free CFA exam registration for students committed to earning CFA charter</li><li><strong>Women in Finance Award</strong>: $12,000 to support female students entering finance careers</li><li><strong>Quantitative Finance Fellowship</strong>: $18,000 for students with strong math/programming backgrounds pursuing quant roles</li><li><strong>Emerging Markets Finance Scholarship</strong>: $10,000 for international students from developing economies</li><li><strong>Graduate Assistantship</strong>: 40% tuition reduction + $14,000 stipend for research or teaching support</li></ul><p>Career services placement rate: 95% employment within 6 months, average starting salary $85,000-$120,000. Early decision applicants receive priority scholarship consideration (deadline: November 15th).</p>`,
	},
	{
		title: "Bachelor of Environmental Science",
		description:
			"Study climate change, conservation, sustainability, and environmental policy. Contribute to protecting our planet.",
		duration: "4 years",
		degree: "Bachelor's Degree",
		studyMode: "Full-time",
		tuitionFee: 17000,
		courseInclude: `<p>The Bachelor of Environmental Science requires completion of 144 units:</p><p>Environmental Science Core (54 units):</p><ul><li><strong>ENV1001</strong> Introduction to Environmental Science (6 units)</li><li><strong>ENV1010</strong> Ecology and Biodiversity (6 units)</li><li><strong>ENV1020</strong> Environmental Chemistry (6 units)</li><li><strong>ENV2001</strong> Climate Change Science (6 units)</li><li><strong>ENV2010</strong> Environmental Policy and Law (6 units)</li><li><strong>ENV2020</strong> Conservation Biology (6 units)</li><li><strong>ENV3001</strong> Sustainable Resource Management (6 units)</li><li><strong>ENV3010</strong> Environmental Impact Assessment (6 units)</li><li><strong>ENV4001</strong> Senior Research Project (6 units)</li></ul><p>Science Foundation (24 units): Biology, Chemistry, Physics, Mathematics/Statistics</p><p>Field Studies (12 units): Required field courses in local ecosystems, marine environments, or wilderness areas</p><p>General Education (30 units), Electives (24 units)</p>`,
		feeDescription: `<p>Tuition fee: $17,000 USD per year (Full program: $68,000 for 4 years)</p><p>Environmental Science program fees:</p><ul><li>Laboratory and fieldwork fee: $600 per year</li><li>Field trip and research site access: $400 per year (covers transportation and permits)</li><li>Safety and field equipment: $150 (one-time purchase: boots, rain gear, field guides)</li><li>Environmental data software and GIS licenses: Included in tuition</li><li>Student sustainability initiatives fund: $100 per year</li></ul><p>Optional study opportunities:</p><ul><li>International field study programs (Costa Rica, Galapagos, Australia): $4,000-$8,000 for 3-6 weeks</li><li>Summer research internships: Many are paid positions ($3,000-$6,000)</li><li>Professional certifications (GIS, Environmental Monitoring): $300-$800</li></ul><p>International student insurance: $1,000 per year. Payment plans available monthly or per semester.</p>`,
		scholarshipInfo: `<p>Environmental Science scholarships:</p><ul><li><strong>Conservation Leadership Scholarship</strong>: $10,000 per year for students demonstrating commitment to environmental protection</li><li><strong>Climate Action Award</strong>: $8,000 per year for students focused on climate change mitigation and adaptation</li><li><strong>Field Research Grant</strong>: $5,000 for independent student research projects (summers or senior year)</li><li><strong>Sustainability Innovation Scholarship</strong>: $7,000 per year for students developing sustainable solutions</li><li><strong>National Parks Service Scholarship</strong>: $6,000 per year + guaranteed summer internship at national parks</li><li><strong>Environmental Justice Award</strong>: $9,000 per year for students addressing environmental inequality</li></ul><p>Additional opportunities: Paid positions as research assistants ($13-16/hour), teaching assistants, and sustainability office interns. Many graduates qualify for loan forgiveness programs when working for environmental nonprofits or government agencies.</p>`,
	},
];

async function main() {
	console.log("");
	console.log("═══════════════════════════════════════════════════");
	console.log("🎓 SEED PROGRAMS ONLY - Starting...");
	console.log("═══════════════════════════════════════════════════");
	console.log("");

	try {
		const startTime = Date.now();

		// Verify institution exists
		const institution = await prismaClient.institution.findUnique({
			where: { institution_id: INSTITUTION_ID },
			include: { user: true },
		});

		if (!institution) {
			throw new Error(`Institution with ID ${INSTITUTION_ID} not found`);
		}

		// console.log(`✅ Found institution: ${institution.institution_name}`);

		// Get all subdisciplines
		const subdisciplines = await prismaClient.subdiscipline.findMany();
		if (subdisciplines.length === 0) {
			throw new Error(
				"No subdisciplines found. Please run seed-disciplines.ts first"
			);
		}

		console.log(`✅ Found ${subdisciplines.length} subdisciplines`);

		// Create opportunity posts and programs
		const now = new Date();
		const posts = [];
		const programs = [];
		const postSubdisciplines = [];

		for (let i = 0; i < NUM_PROGRAMS; i++) {
			const template = programTemplates[i];
			const postId = crypto.randomUUID();

			// Create opportunity post
			const post = {
				post_id: postId,
				institution_id: INSTITUTION_ID,
				title: template.title,
				description: template.description,
				location: institution.country || "Vietnam",
				other_info: `Address: ${institution.address}`,
				status: "DRAFT" as const,
				create_at: getRandomDate(new Date("2025-12-01"), now),
				update_at: now,
				start_date: getRandomDate(
					new Date("2026-01-01"),
					new Date("2026-08-31")
				),
				end_date: getRandomDate(
					new Date("2026-09-01"),
					new Date("2026-12-31")
				),
				degree_level: template.degree,
			};

			posts.push(post);

			// Create program post
			const program = {
				post_id: postId,
				duration: template.duration,
				attendance: template.studyMode,
				course_include: template.courseInclude,
				gpa: parseFloat((Math.random() * 1 + 2.5).toFixed(1)),
				gre:
					template.degree === "Doctorate" ||
					template.degree === "Master's Degree"
						? Math.floor(Math.random() * 40) + 300
						: null,
				gmat: template.title.includes("Business")
					? Math.floor(Math.random() * 200) + 500
					: null,
				tuition_fee: template.tuitionFee,
				fee_description: template.feeDescription,
				scholarship_info: template.scholarshipInfo,
				language_requirement: getRandomElement([
					"IELTS 6.5",
					"TOEFL 90",
					"IELTS 7.0",
					"TOEFL 100",
				]),
			};

			programs.push(program);

			// Add subdisciplines (2-4 per post)
			const numSubdisciplines = Math.floor(Math.random() * 3) + 2;
			const selectedSubdisciplines = getRandomSubdisciplineIds(
				numSubdisciplines,
				numSubdisciplines,
				subdisciplines.length
			);

			for (const subdisciplineId of selectedSubdisciplines) {
				postSubdisciplines.push({
					post_id: postId,
					subdiscipline_id: subdisciplineId,
					add_at: now,
				});
			}
		}

		// Delete existing program posts for this institution
		console.log("");
		console.log("🗑️  Deleting existing program posts...");

		const existingPosts = await prismaClient.opportunityPost.findMany({
			where: {
				institution_id: INSTITUTION_ID,
			},
			include: {
				programPost: true,
			},
		});

		const existingProgramPostIds = existingPosts
			.filter((p) => p.programPost)
			.map((p) => p.post_id);

		if (existingProgramPostIds.length > 0) {
			// Delete related data first (foreign key constraints)
			await prismaClient.postSubdiscipline.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});
			await prismaClient.postCertificate.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});
			await prismaClient.postDocument.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});
			await prismaClient.wishlist.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});
			await prismaClient.application.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});
			await prismaClient.programScholarship.deleteMany({
				where: { program_post_id: { in: existingProgramPostIds } },
			});

			// Delete program posts
			await prismaClient.programPost.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});

			// Delete opportunity posts
			await prismaClient.opportunityPost.deleteMany({
				where: { post_id: { in: existingProgramPostIds } },
			});

			console.log(
				`✅ Deleted ${existingProgramPostIds.length} existing program posts`
			);
		} else {
			console.log("   No existing program posts found");
		}

		console.log("");

		// Insert into database
		await prismaClient.opportunityPost.createMany({ data: posts });
		console.log(`✅ Created ${NUM_PROGRAMS} opportunity posts`);

		await prismaClient.programPost.createMany({ data: programs });
		console.log(`✅ Created ${NUM_PROGRAMS} program posts`);

		await prismaClient.postSubdiscipline.createMany({
			data: postSubdisciplines,
		});
		console.log(
			`✅ Created ${postSubdisciplines.length} post-subdiscipline relationships`
		);

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);

		console.log("");
		console.log("═══════════════════════════════════════════════════");
		console.log("🎉 PROGRAMS SEEDED SUCCESSFULLY!");
		console.log("═══════════════════════════════════════════════════");
		console.log("");
		console.log("📊 Summary:");
		console.log(`   ⏱️  Execution Time: ${duration}s`);
		console.log(`   🏛️  Institution: ${institution.name}`);
		console.log(`   🎓 Programs Created: ${NUM_PROGRAMS}`);
		console.log(`   🔗 Subdiscipline Links: ${postSubdisciplines.length}`);
		console.log("");
		console.log("Programs:");
		programs.forEach((p, i) => {
			console.log(`   ${i + 1}. ${programTemplates[i].title}`);
		});
		console.log("");
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
