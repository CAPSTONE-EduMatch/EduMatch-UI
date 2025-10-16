/**
 * Profile API Response Types
 * Used for profile view/display (not for forms)
 */

// Common file structure from API
export interface ProfileFileData {
	id: string;
	name: string;
	originalName: string;
	fileName: string;
	size: number;
	fileSize: number;
	url: string;
	fileType: string;
	category: string;
}

// Language certificate
export interface ProfileLanguageData {
	id: string;
	language: string;
	certificate: string;
	score: string;
}

// Research paper
export interface ProfileResearchPaperData {
	id: string;
	title: string;
	discipline: string;
	files: Array<{
		id: string;
		file: {
			id: string;
			name: string;
			url: string;
			size: number;
		};
	}>;
}

// Uploaded file
export interface ProfileUploadedFileData {
	id: string;
	file: {
		id: string;
		name: string;
		url: string;
		size: number;
	};
	category: string;
}

// User info
export interface ProfileUserData {
	id: string;
	name: string;
	email: string;
	image?: string;
}

// Base profile fields (common for all roles)
export interface BaseProfileResponseData {
	id: string;
	role: "applicant" | "institution";
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	interests: string[];
	favoriteCountries: string[];
	profilePhoto?: string;
	user: ProfileUserData;
	createdAt: string;
	updatedAt: string;
}

// Applicant profile response from API
export interface ApplicantProfileResponseData extends BaseProfileResponseData {
	role: "applicant";
	graduationStatus?: string;
	degree?: string;
	fieldOfStudy?: string;
	university?: string;
	graduationYear?: string;
	gpa?: string;
	countryOfStudy?: string;
	scoreType?: string;
	scoreValue?: string;
	hasForeignLanguage?: string;
	languages: ProfileLanguageData[];
	researchPapers: ProfileResearchPaperData[];
	uploadedFiles: ProfileUploadedFileData[];
	cvFiles?: ProfileFileData[];
	languageCertFiles?: ProfileFileData[];
	degreeFiles?: ProfileFileData[];
	transcriptFiles?: ProfileFileData[];
}

// Institution profile response from API
export interface InstitutionProfileResponseData
	extends BaseProfileResponseData {
	role: "institution";
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
	verificationDocuments?: ProfileFileData[];
	languages?: ProfileLanguageData[];
	researchPapers?: ProfileResearchPaperData[];
	uploadedFiles?: ProfileUploadedFileData[];
}

// Union type for any profile response
export type ProfileResponseData =
	| ApplicantProfileResponseData
	| InstitutionProfileResponseData;

// Type guard functions
export function isApplicantProfile(
	profile: ProfileResponseData
): profile is ApplicantProfileResponseData {
	return profile.role === "applicant";
}

export function isInstitutionProfile(
	profile: ProfileResponseData
): profile is InstitutionProfileResponseData {
	return profile.role === "institution";
}
