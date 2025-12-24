/**
 * Helper Utilities for Demo Seed Database
 *
 * Common utility functions for data generation
 */

/**
 * Get a random element from an array
 */
export function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple unique random elements from an array
 */
export function getRandomElements<T>(array: T[], count: number): T[] {
	const shuffled = [...array].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

/**
 * Generate a random date between start and end
 */
export function getRandomDate(start: Date, end: Date): Date {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime())
	);
}

/**
 * Generate a unique ID with prefix and padding
 */
export function generateUniqueId(
	prefix: string,
	index: number,
	padding: number = 4
): string {
	return `${prefix}-${index.toString().padStart(padding, "0")}`;
}

/**
 * Generate a realistic email address
 */
export function generateEmail(
	firstName: string,
	lastName: string,
	domain: string = "example.com"
): string {
	const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, "");
	const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, "");
	return `${cleanFirst}.${cleanLast}@${domain}`;
}

/**
 * Generate a phone number with country code
 */
export function generatePhoneNumber(countryCode: string = "+1"): string {
	const areaCode = Math.floor(Math.random() * 900) + 100;
	const firstPart = Math.floor(Math.random() * 900) + 100;
	const secondPart = Math.floor(Math.random() * 10000);
	return `${countryCode}-${areaCode}-${firstPart}-${secondPart.toString().padStart(4, "0")}`;
}

/**
 * Generate a random GPA between min and max
 */
export function generateGPA(min: number = 2.5, max: number = 4.0): number {
	return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * Generate a random amount within range
 */
export function generateAmount(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate realistic lorem-style text
 */
export function generateLoremText(sentences: number = 3): string {
	const templates = [
		"This program offers comprehensive training in",
		"Students will gain expertise in",
		"The curriculum focuses on",
		"Participants will develop skills in",
		"The course provides in-depth knowledge of",
		"This opportunity allows students to explore",
		"The program emphasizes practical application of",
		"Learners will engage with cutting-edge research in",
		"The scholarship supports students pursuing excellence in",
		"This position involves collaborative work on",
	];

	const subjects = [
		"advanced theoretical concepts and practical applications.",
		"industry-relevant skills and contemporary methodologies.",
		"interdisciplinary approaches and innovative solutions.",
		"research methodologies and analytical frameworks.",
		"emerging technologies and sustainable practices.",
		"global perspectives and cross-cultural understanding.",
		"leadership development and professional competencies.",
		"data-driven decision making and strategic thinking.",
	];

	let text = "";
	for (let i = 0; i < sentences; i++) {
		text +=
			getRandomElement(templates) +
			" " +
			getRandomElement(subjects) +
			" ";
	}
	return text.trim();
}

/**
 * Generate a detailed program description
 */
export function generateProgramDescription(
	field: string,
	university: string
): string {
	return `This prestigious ${field} program at ${university} offers students an unparalleled opportunity to engage with world-class faculty and cutting-edge research. The curriculum is designed to provide a comprehensive understanding of both theoretical foundations and practical applications in the field. Students will have access to state-of-the-art facilities, research labs, and industry partnerships. The program emphasizes interdisciplinary collaboration, innovative thinking, and real-world problem-solving. Graduates will be well-prepared for leadership roles in academia, industry, and research institutions worldwide.`;
}

/**
 * Generate a detailed scholarship description
 */
export function generateScholarshipDescription(
	scholarshipName: string,
	amount: number
): string {
	return `The ${scholarshipName} is a highly competitive merit-based scholarship providing financial support of up to $${amount.toLocaleString()} to outstanding students demonstrating exceptional academic achievement and leadership potential. Recipients will join a prestigious community of scholars and gain access to exclusive networking opportunities, mentorship programs, and professional development workshops. The scholarship aims to support talented individuals from diverse backgrounds in pursuing their academic and career aspirations. Award recipients are expected to maintain high academic standards and contribute positively to their academic communities.`;
}

/**
 * Generate a detailed job description
 */
export function generateJobDescription(
	position: string,
	department: string,
	university: string
): string {
	return `${university} is seeking a highly motivated ${position} to join our ${department} department. This position offers an exciting opportunity to contribute to groundbreaking research, collaborate with internationally recognized scholars, and mentor the next generation of leaders in the field. The successful candidate will have access to excellent research facilities, generous funding opportunities, and a supportive academic environment. We are committed to fostering diversity, equity, and inclusion in our academic community. The role includes teaching responsibilities, research activities, and service to the university and broader academic community.`;
}

/**
 * Get country code for a country
 */
export function getCountryCode(country: string): string {
	const countryCodes: Record<string, string> = {
		"United States": "+1",
		"United Kingdom": "+44",
		Canada: "+1",
		Australia: "+61",
		Germany: "+49",
		France: "+33",
		Netherlands: "+31",
		Switzerland: "+41",
		Sweden: "+46",
		Denmark: "+45",
		Norway: "+47",
		Finland: "+358",
		Singapore: "+65",
		Japan: "+81",
		"South Korea": "+82",
		China: "+86",
		"Hong Kong": "+852",
		India: "+91",
		Brazil: "+55",
		Mexico: "+52",
		"South Africa": "+27",
	};
	return countryCodes[country] || "+1";
}

/**
 * Get university domain
 */
export function getUniversityDomain(universityName: string): string {
	return (
		universityName
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, "")
			.replace(/\s+/g, "")
			.substring(0, 20) + ".edu"
	);
}

/**
 * Get random subdiscipline IDs
 */
export function getRandomSubdisciplineIds(
	minCount: number,
	maxCount: number,
	maxId: number
): string[] {
	const count =
		Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
	const ids = new Set<string>();

	while (ids.size < count) {
		const id = (Math.floor(Math.random() * maxId) + 1).toString();
		ids.add(id);
	}

	return Array.from(ids);
}

/**
 * Shuffle an array
 */
export function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Generate a random URL
 */
export function generateUrl(baseDomain: string, path: string): string {
	return `https://${baseDomain}/${path}`;
}

/**
 * Get application status
 */
export function getRandomApplicationStatus():
	| "SUBMITTED"
	| "PROGRESSING"
	| "ACCEPTED"
	| "REJECTED" {
	const statuses: ("SUBMITTED" | "PROGRESSING" | "ACCEPTED" | "REJECTED")[] =
		["SUBMITTED", "PROGRESSING", "ACCEPTED", "REJECTED"];
	const weights = [0.35, 0.3, 0.2, 0.15]; // Probability weights

	const random = Math.random();
	let cumulative = 0;

	for (let i = 0; i < statuses.length; i++) {
		cumulative += weights[i];
		if (random <= cumulative) {
			return statuses[i];
		}
	}

	return statuses[0];
}
