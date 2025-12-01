/**
 * Image URL Generators for Demo Seed Database
 *
 * This file contains functions to generate image URLs.
 * For customizable arrays, see image-config.ts
 */

import {
	getByIndex,
	getRandomFromArray,
	INSTITUTION_COVER_URLS,
	INSTITUTION_LOGO_URLS,
	JOB_BANNER_URLS,
	PROGRAM_BANNER_URLS,
	SCHOLARSHIP_BANNER_URLS,
	USER_AVATAR_URLS,
} from "./image-config";

/**
 * Generate a user avatar URL using DiceBear Avatars API
 * Creates consistent, professional illustrated avatars
 * @param userId Unique identifier for the user
 * @param style Avatar style (default: avataaars)
 */
export function getUserAvatar(
	userId: string,
	style: string = "avataaars"
): string {
	return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}`;
}

/**
 * Generate a profile photo URL using UI Avatars
 * Creates text-based avatars with user's name
 * @param firstName User's first name
 * @param lastName User's last name
 */
export function getProfilePhoto(firstName: string, lastName: string): string {
	const name = `${firstName}+${lastName}`;
	const colors = [
		"3B82F6",
		"8B5CF6",
		"EC4899",
		"F59E0B",
		"10B981",
		"EF4444",
		"6366F1",
	];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];
	return `https://ui-avatars.com/api/?name=${name}&size=200&background=${randomColor}&color=fff`;
}

/**
 * Generate an institution logo URL from the curated array
 * @param institutionName Name of the institution (used for index)
 * @param index Optional index for deterministic selection
 */
export function getInstitutionLogo(
	institutionName: string,
	index?: number
): string {
	if (index !== undefined) {
		return getByIndex(INSTITUTION_LOGO_URLS, index);
	}
	return getRandomFromArray(INSTITUTION_LOGO_URLS);
}

/**
 * Generate an institution cover image URL from the curated array
 * @param index Optional index for deterministic selection
 */
export function getInstitutionCover(index?: number): string {
	if (index !== undefined) {
		return getByIndex(INSTITUTION_COVER_URLS, index);
	}
	return getRandomFromArray(INSTITUTION_COVER_URLS);
}

/**
 * Generate an opportunity post banner (legacy function - use specific getters below)
 * @param category Image category (university, education, etc.)
 * @param seed Optional seed for consistent results
 * @deprecated Use getProgramBanner, getScholarshipBanner, or getJobBanner instead
 */
export function getOpportunityBanner(category: string, seed?: string): string {
	if (seed) {
		// Use Picsum for deterministic images
		return `https://picsum.photos/seed/${seed}/800/400`;
	}
	return `https://source.unsplash.com/800x400/?${category}`;
}

/**
 * Generate a program-specific banner image from the curated array
 * @param programId Unique program identifier (used for deterministic selection)
 * @param index Optional index for direct selection
 */
export function getProgramBanner(programId?: string, index?: number): string {
	if (index !== undefined) {
		return getByIndex(PROGRAM_BANNER_URLS, index);
	}
	if (programId) {
		// Use programId to generate a consistent index
		const hash = programId.split("").reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
		return getByIndex(PROGRAM_BANNER_URLS, Math.abs(hash));
	}
	return getRandomFromArray(PROGRAM_BANNER_URLS);
}

/**
 * Generate a scholarship-specific banner image from the curated array
 * @param scholarshipId Unique scholarship identifier (used for deterministic selection)
 * @param index Optional index for direct selection
 */
export function getScholarshipBanner(
	scholarshipId?: string,
	index?: number
): string {
	if (index !== undefined) {
		return getByIndex(SCHOLARSHIP_BANNER_URLS, index);
	}
	if (scholarshipId) {
		// Use scholarshipId to generate a consistent index
		const hash = scholarshipId.split("").reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
		return getByIndex(SCHOLARSHIP_BANNER_URLS, Math.abs(hash));
	}
	return getRandomFromArray(SCHOLARSHIP_BANNER_URLS);
}

/**
 * Generate a job post banner image from the curated array
 * @param jobId Unique job identifier (used for deterministic selection)
 * @param index Optional index for direct selection
 */
export function getJobBanner(jobId?: string, index?: number): string {
	if (index !== undefined) {
		return getByIndex(JOB_BANNER_URLS, index);
	}
	if (jobId) {
		// Use jobId to generate a consistent index
		const hash = jobId.split("").reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
		return getByIndex(JOB_BANNER_URLS, Math.abs(hash));
	}
	return getRandomFromArray(JOB_BANNER_URLS);
}

/**
 * Get a random user avatar from the curated array
 * @param index Optional index for deterministic selection
 */
export function getRandomUserAvatar(index?: number): string {
	if (index !== undefined) {
		return getByIndex(USER_AVATAR_URLS, index);
	}
	return getRandomFromArray(USER_AVATAR_URLS);
}

/**
 * Generate a random professional avatar style
 */
export function getRandomAvatarStyle(): string {
	const styles = [
		"avataaars",
		"bottts",
		"personas",
		"lorelei",
		"notionists",
		"adventurer",
	];
	return styles[Math.floor(Math.random() * styles.length)];
}

// Re-export arrays for direct access
export {
	INSTITUTION_COVER_URLS,
	INSTITUTION_LOGO_URLS,
	JOB_BANNER_URLS,
	PROGRAM_BANNER_URLS,
	SCHOLARSHIP_BANNER_URLS,
	USER_AVATAR_URLS,
} from "./image-config";
