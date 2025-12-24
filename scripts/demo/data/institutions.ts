/**
 * Institution Data Generators for Demo Seed Database
 */

import { getInstitutionCover, getInstitutionLogo } from "../config/image-urls";
import { countries, firstNames, lastNames } from "../config/sample-data";
import {
	generatePhoneNumber,
	getCountryCode,
	getRandomElement,
	getUniversityDomain,
} from "./helpers";

export interface InstitutionData {
	institution_id: string;
	user_id: string;
	logo: string;
	name: string;
	abbreviation: string;
	hotline: string;
	hotline_code: string;
	type: string;
	website: string;
	country: string;
	address: string;
	rep_name: string;
	rep_appellation: string;
	rep_position: string;
	rep_email: string;
	rep_phone: string;
	rep_phone_code: string;
	email: string;
	about: string;
	cover_image: string;
}

/**
 * Generate institution profiles
 */
export function generateInstitutionProfiles(
	institutionUsers: any[]
): InstitutionData[] {
	const institutionProfiles: InstitutionData[] = [];

	const institutionTypes = [
		"University",
		"College",
		"Research Institute",
		"Technical School",
		"Institute of Technology",
		"Graduate School",
		"Business School",
	];

	const titles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
	const positions = [
		"Dean of Admissions",
		"Director of Graduate Studies",
		"Admissions Director",
		"International Office Director",
		"Head of Department",
		"Registrar",
		"Vice President of Enrollment",
		"Chancellor",
		"Provost",
	];

	for (let i = 0; i < institutionUsers.length; i++) {
		const user = institutionUsers[i];
		if (user.role !== "institution") continue;

		const universityName = user.name;
		const country = getRandomElement(countries);
		const title = getRandomElement(titles);
		const repFirst = getRandomElement(firstNames);
		const repLast = getRandomElement(lastNames);
		const position = getRandomElement(positions);

		const abbreviation = universityName
			.split(" ")
			.filter((word: string) => word.length > 2)
			.map((word: string) => word[0])
			.join("")
			.substring(0, 6)
			.toUpperCase();

		const domain = getUniversityDomain(universityName);

		institutionProfiles.push({
			institution_id: user.id,
			user_id: user.id,
			logo: getInstitutionLogo(universityName, i),
			name: universityName,
			abbreviation,
			hotline: generatePhoneNumber(getCountryCode(country)),
			hotline_code: getCountryCode(country),
			type: getRandomElement(institutionTypes),
			website: `https://www.${domain}`,
			country,
			address: `${Math.floor(Math.random() * 9999) + 1} University Boulevard, ${universityName} Campus, ${country}`,
			rep_name: `${title} ${repFirst} ${repLast}`,
			rep_appellation: title,
			rep_position: position,
			rep_email: `${repFirst.toLowerCase()}.${repLast.toLowerCase()}@${domain}`,
			rep_phone: generatePhoneNumber(getCountryCode(country)),
			rep_phone_code: getCountryCode(country),
			email: `info@${domain}`,
			about: `${universityName} is a leading educational institution specializing in research and academic excellence. We are committed to providing world-class education and fostering innovation across multiple disciplines. Our institution has been serving students globally for decades, offering comprehensive programs and cutting-edge research opportunities.`,
			cover_image: getInstitutionCover(i),
		});
	}

	return institutionProfiles;
}
