/**
 * User Data Generators for Demo Seed Database
 *
 * Functions to generate realistic user data for students, institutions, and admins
 */

import { getInstitutionLogo, getUserAvatar } from "../config/image-urls";
import {
	countries,
	firstNames,
	lastNames,
	universities,
} from "../config/sample-data";
import {
	generateGPA,
	generatePhoneNumber,
	generateUniqueId,
	getCountryCode,
	getRandomDate,
	getRandomElement,
} from "./helpers";

export interface UserData {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string;
	role: string;
	banned: boolean;
	banReason: string | null;
	banExpires: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ApplicantData {
	applicant_id: string;
	user_id: string;
	first_name: string;
	last_name: string;
	birthday: Date;
	gender: boolean;
	nationality: string;
	phone_number: string;
	country_code: string;
	graduated: boolean;
	level: string;
	university: string;
	gpa: number;
	subdiscipline_id: string;
	country_of_study: string;
	has_foreign_language: boolean;
	favorite_countries: string[];
}

/**
 * Generate student users
 */
export function generateStudents(count: number): UserData[] {
	const students: UserData[] = [];

	for (let i = 1; i <= count; i++) {
		const userId = generateUniqueId("user", i, 4);
		const firstName = getRandomElement(firstNames);
		const lastName = getRandomElement(lastNames);

		students.push({
			id: userId,
			name: `${firstName} ${lastName}`,
			email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.edu`,
			emailVerified: Math.random() > 0.05, // 95% verified
			image: getUserAvatar(userId),
			role: "student",
			banned: Math.random() > 0.98, // 2% banned
			banReason:
				Math.random() > 0.98
					? "Violation of community guidelines"
					: null,
			banExpires:
				Math.random() > 0.98
					? getRandomDate(new Date(), new Date("2026-12-31"))
					: null,
			createdAt: getRandomDate(
				new Date("2023-01-01"),
				new Date("2024-11-01")
			),
			updatedAt: new Date(),
		});
	}

	return students;
}

/**
 * Generate institution users
 */
export function generateInstitutionUsers(
	count: number,
	startIndex: number
): UserData[] {
	const institutions: UserData[] = [];

	for (let i = 0; i < count; i++) {
		const userId = generateUniqueId("user", startIndex + i, 4);
		const university = universities[i % universities.length];

		institutions.push({
			id: userId,
			name: university,
			email: `admissions${i + 1}@${university
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "")
				.substring(0, 15)}.edu`,
			emailVerified: Math.random() > 0.02, // 98% verified
			image: getInstitutionLogo(university),
			role: "institution",
			banned: false,
			banReason: null,
			banExpires: null,
			createdAt: getRandomDate(
				new Date("2022-01-01"),
				new Date("2024-06-01")
			),
			updatedAt: new Date(),
		});
	}

	return institutions;
}

/**
 * Generate admin users
 */
export function generateAdmins(count: number, startIndex: number): UserData[] {
	const admins: UserData[] = [];

	const adminTitles = [
		"Platform Admin",
		"Senior Admin",
		"Content Manager",
		"Support Manager",
		"System Admin",
	];

	for (let i = 0; i < count; i++) {
		const userId = generateUniqueId("user", startIndex + i, 4);
		const firstName = getRandomElement(firstNames);
		const lastName = getRandomElement(lastNames);
		const title = getRandomElement(adminTitles);

		admins.push({
			id: userId,
			name: `${firstName} ${lastName}`,
			email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.admin@edumatch.com`,
			emailVerified: true,
			image: getUserAvatar(`admin${i}`),
			role: "admin",
			banned: false,
			banReason: null,
			banExpires: null,
			createdAt: getRandomDate(
				new Date("2022-01-01"),
				new Date("2023-01-01")
			),
			updatedAt: new Date(),
		});
	}

	return admins;
}

/**
 * Generate applicant profiles for students
 */
export function generateApplicantProfiles(
	students: UserData[],
	subdisciplineCount: number
): ApplicantData[] {
	const applicants: ApplicantData[] = [];

	const degreeLevels = ["Bachelor's", "Master's", "PhD", "Postdoctoral"];

	for (const student of students) {
		if (student.role !== "student") continue;

		const nameParts = student.name.split(" ");
		const firstName = nameParts[0];
		const lastName = nameParts.slice(1).join(" ") || nameParts[0];

		const nationality = getRandomElement(countries);
		const countryOfStudy =
			Math.random() > 0.3 ? getRandomElement(countries) : nationality;

		// 1-3 favorite countries
		const favoriteCountries: string[] = [];
		const favoriteCount = Math.floor(Math.random() * 3) + 1;
		while (favoriteCountries.length < favoriteCount) {
			const country = getRandomElement(countries);
			if (!favoriteCountries.includes(country)) {
				favoriteCountries.push(country);
			}
		}

		applicants.push({
			applicant_id: student.id,
			user_id: student.id,
			first_name: firstName,
			last_name: lastName,
			birthday: getRandomDate(
				new Date("1995-01-01"),
				new Date("2005-12-31")
			),
			gender: Math.random() > 0.5,
			nationality,
			phone_number: generatePhoneNumber(getCountryCode(nationality)),
			country_code: getCountryCode(nationality),
			graduated: Math.random() > 0.25, // 75% graduated
			level: getRandomElement(degreeLevels),
			university: getRandomElement(universities),
			gpa: generateGPA(2.8, 4.0),
			subdiscipline_id: (
				Math.floor(Math.random() * subdisciplineCount) + 1
			).toString(),
			country_of_study: countryOfStudy,
			has_foreign_language: Math.random() > 0.3, // 70% have foreign language
			favorite_countries: favoriteCountries,
		});
	}

	return applicants;
}
