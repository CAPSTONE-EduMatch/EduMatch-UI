import { prismaClient } from "@/../prisma";

export interface ProfileData {
	role?: "applicant" | "institution";
	firstName?: string;
	lastName?: string;
	gender?: string;
	birthday?: string;
	nationality?: string;
	phoneNumber?: string;
	countryCode?: string;
	interests?: string[];
	favoriteCountries?: string[];
	profilePhoto?: string;

	// Academic Information
	graduationStatus?: "not-yet" | "graduated";
	degree?: string;
	fieldOfStudy?: string;
	university?: string;
	graduationYear?: string;
	gpa?: string;
	countryOfStudy?: string;
	scoreType?: "gpa" | "score";
	scoreValue?: string;

	// Foreign Language
	hasForeignLanguage?: "yes" | "no";
	languages?: Array<{
		language: string;
		certificate?: string;
		score?: string;
	}>;

	// Files
	cvFile?: string;
	certificateFile?: string;

	// Institution fields
	institutionName?: string;
	institutionAbbreviation?: string;
	institutionHotline?: string;
	institutionHotlineCode?: string;
	institutionType?: string;
	institutionWebsite?: string;
	institutionEmail?: string;
	institutionCountry?: string;
	institutionAddress?: string;
	representativeName?: string;
	representativeAppellation?: string;
	representativePosition?: string;
	representativeEmail?: string;
	representativePhone?: string;
	representativePhoneCode?: string;
	aboutInstitution?: string;
	institutionDisciplines?: string[];
	institutionCoverImage?: string;
}

export class ProfileService {
	/**
	 * Checks if the user has a profile
	 * @param userId User ID to check
	 * @returns True if user has a profile
	 */
	static async hasProfile(userId: string): Promise<boolean> {
		try {
			const profile = await prismaClient.profile.findUnique({
				where: { userId },
				select: {
					id: true,
					firstName: true,
					lastName: true,
					role: true,
				},
			});

			return (
				profile !== null &&
				profile.firstName.trim() !== "" &&
				profile.lastName.trim() !== "" &&
				profile.role.trim() !== ""
			);
		} catch {
			return false;
		}
	}

	/**
	 * Get user profile data
	 */
	static async getProfile(userId: string): Promise<ProfileData | null> {
		try {
			const profile = await prismaClient.profile.findUnique({
				where: { userId },
				include: {
					languages: true,
					researchPapers: {
						include: {
							files: {
								include: {
									file: true,
								},
							},
						},
					},
					uploadedFiles: {
						include: {
							file: true,
						},
					},
				},
			});

			return profile as unknown as ProfileData;
		} catch {
			return null;
		}
	}

	/**
	 * Create or update user profile
	 */
	static async upsertProfile(
		userId: string,
		profileData: ProfileData
	): Promise<ProfileData | null> {
		try {
			const profile = await prismaClient.profile.upsert({
				where: { userId },
				update: {
					role: profileData.role || "",
					firstName: profileData.firstName || "",
					lastName: profileData.lastName || "",
					gender: profileData.gender || "",
					birthday: profileData.birthday || "",
					nationality: profileData.nationality || "",
					phoneNumber: profileData.phoneNumber || "",
					countryCode: profileData.countryCode || "",
					interests: profileData.interests || [],
					favoriteCountries: profileData.favoriteCountries || [],
					profilePhoto: profileData.profilePhoto || null,
					graduationStatus: profileData.graduationStatus || null,
					degree: profileData.degree || null,
					fieldOfStudy: profileData.fieldOfStudy || null,
					university: profileData.university || null,
					graduationYear: profileData.graduationYear || null,
					gpa: profileData.gpa || null,
					countryOfStudy: profileData.countryOfStudy || null,
					scoreType: profileData.scoreType || null,
					scoreValue: profileData.scoreValue || null,
					hasForeignLanguage: profileData.hasForeignLanguage || null,
					// Institution fields
					institutionName: profileData.institutionName || null,
					institutionAbbreviation:
						profileData.institutionAbbreviation || null,
					institutionHotline: profileData.institutionHotline || null,
					institutionHotlineCode:
						profileData.institutionHotlineCode || null,
					institutionType: profileData.institutionType || null,
					institutionWebsite: profileData.institutionWebsite || null,
					institutionEmail: profileData.institutionEmail || null,
					institutionCountry: profileData.institutionCountry || null,
					institutionAddress: profileData.institutionAddress || null,
					representativeName: profileData.representativeName || null,
					representativeAppellation:
						profileData.representativeAppellation || null,
					representativePosition:
						profileData.representativePosition || null,
					representativeEmail:
						profileData.representativeEmail || null,
					representativePhone:
						profileData.representativePhone || null,
					representativePhoneCode:
						profileData.representativePhoneCode || null,
					aboutInstitution: profileData.aboutInstitution || null,
					institutionDisciplines:
						profileData.institutionDisciplines || [],
					institutionCoverImage:
						profileData.institutionCoverImage || null,
					updatedAt: new Date(),
				},
				create: {
					id: Math.random().toString(36).substring(7),
					userId,
					role: profileData.role || "",
					firstName: profileData.firstName || "",
					lastName: profileData.lastName || "",
					gender: profileData.gender || "",
					birthday: profileData.birthday || "",
					nationality: profileData.nationality || "",
					phoneNumber: profileData.phoneNumber || "",
					countryCode: profileData.countryCode || "",
					interests: profileData.interests || [],
					favoriteCountries: profileData.favoriteCountries || [],
					profilePhoto: profileData.profilePhoto || null,
					graduationStatus: profileData.graduationStatus || null,
					degree: profileData.degree || null,
					fieldOfStudy: profileData.fieldOfStudy || null,
					university: profileData.university || null,
					graduationYear: profileData.graduationYear || null,
					gpa: profileData.gpa || null,
					countryOfStudy: profileData.countryOfStudy || null,
					scoreType: profileData.scoreType || null,
					scoreValue: profileData.scoreValue || null,
					hasForeignLanguage: profileData.hasForeignLanguage || null,
					// Institution fields
					institutionName: profileData.institutionName || null,
					institutionAbbreviation:
						profileData.institutionAbbreviation || null,
					institutionHotline: profileData.institutionHotline || null,
					institutionHotlineCode:
						profileData.institutionHotlineCode || null,
					institutionType: profileData.institutionType || null,
					institutionWebsite: profileData.institutionWebsite || null,
					institutionEmail: profileData.institutionEmail || null,
					institutionCountry: profileData.institutionCountry || null,
					institutionAddress: profileData.institutionAddress || null,
					representativeName: profileData.representativeName || null,
					representativeAppellation:
						profileData.representativeAppellation || null,
					representativePosition:
						profileData.representativePosition || null,
					representativeEmail:
						profileData.representativeEmail || null,
					representativePhone:
						profileData.representativePhone || null,
					representativePhoneCode:
						profileData.representativePhoneCode || null,
					aboutInstitution: profileData.aboutInstitution || null,
					institutionDisciplines:
						profileData.institutionDisciplines || [],
					institutionCoverImage:
						profileData.institutionCoverImage || null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			return profile as unknown as ProfileData;
		} catch {
			return null;
		}
	}

	/**
	 * Check if profile meets minimum completion requirements
	 */
	static isProfileComplete(profile: ProfileData): boolean {
		const requiredFields = ["role", "firstName", "lastName"];

		return requiredFields.every(
			(field) =>
				profile[field as keyof ProfileData] &&
				String(profile[field as keyof ProfileData]).trim() !== ""
		);
	}

	/**
	 * Get profile completion percentage
	 */
	static getProfileCompletionPercentage(profile: ProfileData): number {
		const allFields = [
			"role",
			"firstName",
			"lastName",
			"gender",
			"birthday",
			"nationality",
			"phoneNumber",
			"profilePhoto",
			"graduationStatus",
			"degree",
			"fieldOfStudy",
			"university",
			"cvFile",
		];

		const completedFields = allFields.filter((field) => {
			const value = profile[field as keyof ProfileData];
			return value && String(value).trim() !== "";
		});

		return Math.round((completedFields.length / allFields.length) * 100);
	}

	/**
	 * Delete user profile
	 */
	static async deleteProfile(userId: string): Promise<boolean> {
		try {
			await prismaClient.profile.delete({
				where: { userId },
			});

			return true;
		} catch {
			return false;
		}
	}
}
