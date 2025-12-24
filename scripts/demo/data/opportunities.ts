/**
 * Opportunity Data Generators for Demo Seed Database
 * Generates programs, scholarships, and jobs with banners
 */

import {
	attendanceTypes,
	contractTypes,
	countries,
	degreeLevels,
	gpaRequirements,
	jobSalaries,
	jobTypes,
	programDurations,
	researchAreas,
	scholarshipAmounts,
	universities,
} from "../config/sample-data";
import {
	generateScholarshipDescription,
	generateUniqueId,
	getRandomDate,
	getRandomElement,
} from "./helpers";

export interface OpportunityPostData {
	post_id: string;
	title: string;
	start_date: Date;
	end_date: Date;
	create_at: Date;
	location: string;
	other_info: string;
	institution_id: string;
	status:
		| "DRAFT"
		| "PUBLISHED"
		| "CLOSED"
		| "SUBMITTED"
		| "UPDATED"
		| "REJECTED";
	degree_level: string;
	rejection_reason?: string;
}

export interface ProgramPostData {
	post_id: string;
	duration: string;
	attendance: string;
	course_include: string;
	gpa: number;
	gre: number | null;
	gmat: number | null;
	tuition_fee: number;
	fee_description: string;
	scholarship_info: string;
	language_requirement: string;
}

export interface ScholarshipPostData {
	post_id: string;
	description: string;
	type: string;
	number: number;
	grant?: string;
	scholarship_coverage?: string;
	essay_required?: boolean;
	eligibility?: string;
	award_amount?: number;
	award_duration?: string;
	renewable?: boolean;
}

export interface JobPostData {
	post_id: string;
	contract_type: string;
	attendance: string;
	job_type: string;
	min_salary?: number;
	max_salary?: number;
	salary_description?: string;
	benefit?: string;
	main_responsibility?: string;
	qualification_requirement?: string;
	experience_requirement?: string;
	assessment_criteria?: string;
	other_requirement?: string;
	academic_background?: string;
	application_documents?: string;
	lab_capacity?: number;
	lab_contact_email?: string;
	lab_director?: string;
	lab_facilities?: string;
	lab_type?: string;
	lab_website?: string;
	recommendations?: string;
	research_areas?: string;
	research_experience?: string;
	research_focus?: string;
	research_proposal?: string;
	technical_skills?: string;
	professor_name?: string;
}

/**
 * Generate opportunity posts
 */
export function generateOpportunityPosts(
	count: number,
	institutionIds: string[]
): OpportunityPostData[] {
	const posts: OpportunityPostData[] = [];

	// Status distribution for variety: 70% PUBLISHED, 10% SUBMITTED, 10% UPDATED, 5% REJECTED, 5% DRAFT
	const getRandomStatus = (
		index: number
	): { status: OpportunityPostData["status"]; rejection_reason?: string } => {
		const rand = index % 20;
		if (rand < 14) return { status: "PUBLISHED" };
		if (rand < 16) return { status: "SUBMITTED" };
		if (rand < 18) return { status: "UPDATED" };
		if (rand < 19)
			return {
				status: "REJECTED",
				rejection_reason:
					"The post does not meet our quality guidelines. Please review and resubmit with more detailed information.",
			};
		return { status: "DRAFT" };
	};

	for (let i = 1; i <= count; i++) {
		const field = getRandomElement(researchAreas);
		const institutionId = getRandomElement(institutionIds);
		const university = getRandomElement(universities);
		const country = getRandomElement(countries);
		const now = new Date();

		// Create random start_date
		const daysFromNow = Math.floor(Math.random() * 120) - 30;
		const startDate = new Date(
			now.getTime() + daysFromNow * 24 * 60 * 60 * 1000
		);

		// Create end_date
		const daysUntilDeadline = Math.floor(Math.random() * 150) + 30;
		const endDate = new Date(
			startDate.getTime() + daysUntilDeadline * 24 * 60 * 60 * 1000
		);

		const degreeLevel = getRandomElement(degreeLevels);
		const { status, rejection_reason } = getRandomStatus(i);

		posts.push({
			post_id: generateUniqueId("post-opportunity", i, 4),
			title: `${university} ${field} Program`,
			start_date: startDate,
			end_date: endDate,
			create_at: startDate,
			location: `${university}, ${country}`,
			other_info: `This is a comprehensive ${field} program at ${university}. The program is designed to provide students with cutting-edge knowledge and practical skills in ${field}.`,
			institution_id: institutionId,
			status,
			degree_level: degreeLevel,
			...(rejection_reason && { rejection_reason }),
		});
	}

	return posts;
}

/**
 * Generate program posts
 */
export function generateProgramPosts(
	opportunityPosts: OpportunityPostData[],
	institutionIds: string[],
	count: number
): ProgramPostData[] {
	const programs: ProgramPostData[] = [];

	for (let i = 0; i < count; i++) {
		const postId = opportunityPosts[i].post_id;
		const field = getRandomElement(researchAreas);
		const level = getRandomElement(degreeLevels);
		const university = getRandomElement(universities);
		const country = getRandomElement(countries);
		const institutionId = getRandomElement(institutionIds);

		const programStartDate = getRandomDate(
			new Date("2025-01-01"),
			new Date("2025-09-01")
		);
		const applicationDeadline = new Date(programStartDate);
		applicationDeadline.setMonth(applicationDeadline.getMonth() - 3); // 3 months before start

		const requirements = [
			`Minimum GPA: ${getRandomElement(gpaRequirements)}`,
			`${level} degree in ${field} or related field`,
			"English language proficiency (IELTS 6.5+ or TOEFL 90+)",
			"Letters of recommendation (2-3)",
			"Statement of purpose",
			"CV/Resume",
			"Academic transcripts",
		];

		const languageRequirements = [
			"IELTS 6.5 or TOEFL 90",
			"IELTS 7.0 or TOEFL 100",
			"IELTS 6.0 or TOEFL 80",
		];

		programs.push({
			post_id: postId,
			duration: getRandomElement(programDurations),
			attendance: getRandomElement(attendanceTypes),
			course_include: `Core courses in ${field}, advanced electives, capstone project, research methodology, and thesis/dissertation work.`,
			gpa: getRandomElement(gpaRequirements),
			gre:
				Math.random() > 0.3
					? Math.floor(Math.random() * 50) + 290
					: null,
			gmat:
				Math.random() > 0.6
					? Math.floor(Math.random() * 200) + 500
					: null,
			tuition_fee: Math.floor(Math.random() * 60000) + 10000,
			fee_description:
				"Tuition fees include all academic costs, library access, and student services.",
			scholarship_info:
				"Various scholarship opportunities available for qualified students.",
			language_requirement: getRandomElement(languageRequirements),
		});
	}

	return programs;
}

/**
 * Generate scholarship posts
 */
export function generateScholarshipPosts(
	opportunityPosts: OpportunityPostData[],
	institutionIds: string[],
	startIndex: number,
	count: number
): ScholarshipPostData[] {
	const scholarships: ScholarshipPostData[] = [];

	const scholarshipTypes = [
		"Excellence Scholarship",
		"Merit Scholarship",
		"Research Grant",
		"Need-Based Scholarship",
		"International Student Scholarship",
		"Graduate Fellowship",
		"Doctoral Award",
		"Innovation Fund",
		"Diversity Scholarship",
		"Leadership Award",
	];

	for (let i = 0; i < count; i++) {
		const postIndex = startIndex + i;
		const postId = opportunityPosts[postIndex].post_id;
		const scholarshipType = getRandomElement(scholarshipTypes);
		const university = getRandomElement(universities);
		const amount = getRandomElement(scholarshipAmounts);
		const institutionId = getRandomElement(institutionIds);

		const awardDate = getRandomDate(
			new Date("2025-06-01"),
			new Date("2025-12-01")
		);
		const applicationDeadline = new Date(awardDate);
		applicationDeadline.setMonth(applicationDeadline.getMonth() - 2); // 2 months before award

		const eligibilityCriteria = [
			"Demonstrated academic excellence (GPA 3.5+)",
			"Enrollment in eligible program",
			"Full-time student status",
			"Submission of complete application package",
			"Meeting language proficiency requirements",
		];

		const benefits = [
			`Financial award of $${amount.toLocaleString()}`,
			"Access to exclusive networking events",
			"Mentorship opportunities",
			"Professional development workshops",
			"Certificate of achievement",
		];

		const scholarshipName = `${university} ${scholarshipType}`;

		scholarships.push({
			post_id: postId,
			description: generateScholarshipDescription(
				scholarshipName,
				amount
			),
			type: getRandomElement(["FULL", "PARTIAL", "TUITION", "RESEARCH"]),
			number: Math.floor(Math.random() * 20) + 1,
			grant: `$${amount.toLocaleString()} grant`,
			scholarship_coverage: getRandomElement([
				"Full tuition",
				"Partial tuition",
				"Living expenses",
				"Research costs",
				"Full tuition and living expenses",
			]),
			essay_required: Math.random() > 0.3,
			eligibility: eligibilityCriteria.join("\n"),
			award_amount: amount,
			award_duration: getRandomElement([
				"1 year",
				"2 years",
				"3 years",
				"Until graduation",
			]),
			renewable: Math.random() > 0.5,
		});
	}

	return scholarships;
}

/**
 * Generate job posts
 */
export function generateJobPosts(
	opportunityPosts: OpportunityPostData[],
	institutionIds: string[],
	startIndex: number,
	count: number
): JobPostData[] {
	const jobs: JobPostData[] = [];

	const positions = [
		"Research Assistant",
		"Postdoctoral Fellow",
		"Teaching Assistant",
		"Lab Manager",
		"Data Analyst",
		"Research Scientist",
		"Lecturer",
		"Assistant Professor",
		"Project Coordinator",
		"Research Associate",
		"Graduate Research Assistant",
	];

	for (let i = 0; i < count; i++) {
		const postIndex = startIndex + i;
		const postId = opportunityPosts[postIndex].post_id;
		const position = getRandomElement(positions);
		const department = getRandomElement(researchAreas);
		const university = getRandomElement(universities);
		const country = getRandomElement(countries);
		const institutionId = getRandomElement(institutionIds);

		const salaryMin = getRandomElement(jobSalaries);
		const salaryMax = salaryMin + Math.floor(Math.random() * 30000) + 10000;

		const responsibilities = [
			"Conduct independent research in the field",
			"Collaborate with faculty and research team",
			"Publish research findings in peer-reviewed journals",
			"Mentor and supervise junior researchers",
			"Assist with grant writing and funding applications",
		];

		const qualifications = [
			`${getRandomElement(["Master's", "PhD", "Bachelor's"])} degree in ${department} or related field`,
			"Strong research background",
			"Excellent written and verbal communication skills",
			"Ability to work independently and in teams",
		];

		jobs.push({
			post_id: postId,
			contract_type: getRandomElement(contractTypes),
			attendance: getRandomElement(attendanceTypes),
			job_type: getRandomElement(jobTypes),
			min_salary: salaryMin,
			max_salary: salaryMax,
			salary_description: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} per year`,
			benefit:
				"Health insurance, retirement plan, professional development opportunities",
			main_responsibility: responsibilities.join("\n"),
			qualification_requirement: qualifications.join("\n"),
			experience_requirement: `${Math.floor(Math.random() * 5) + 1} years of relevant experience`,
			assessment_criteria:
				"Academic achievements, research experience, publications, interview performance",
			other_requirement:
				"Strong organizational and time management skills",
			academic_background: `${department} or related field`,
			application_documents:
				"CV, cover letter, research statement, three letters of recommendation",
			lab_type: Math.random() > 0.5 ? "Research" : "Teaching",
			lab_director: `Dr. ${getRandomElement(["John Smith", "Jane Doe", "Michael Brown", "Emily Davis"])}`,
			research_areas: department,
			research_focus: `Advanced research in ${department}`,
			professor_name: `Dr. ${getRandomElement(["John Smith", "Jane Doe", "Michael Brown", "Emily Davis"])}`,
		});
	}

	return jobs;
}
