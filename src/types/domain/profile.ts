import { FileItem } from "@/utils/file/file-utils";

export interface ProfileFormData {
	role: "applicant" | "institution" | "";
	// Student fields
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	email: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	interests: string[];
	favoriteCountries: string[];
	profilePhoto: string;
	// Institution fields
	institutionName: string;
	institutionAbbreviation: string;
	institutionHotline: string;
	institutionHotlineCode: string;
	institutionType: string;
	institutionWebsite: string;
	institutionEmail: string;
	institutionCountry: string;
	institutionAddress: string;
	campuses: Array<{
		name: string;
		country: string;
		address: string;
	}>;
	representativeName: string;
	representativeAppellation: string;
	representativePosition: string;
	representativeEmail: string;
	representativePhone: string;
	representativePhoneCode: string;
	aboutInstitution: string;
	// Institution Details fields
	institutionDisciplines: string[];
	institutionCoverImage: string;
	institutionVerificationDocuments: FileItem[];
	// Academic fields
	graduationStatus: "not-yet" | "graduated" | "";
	degree: string;
	fieldOfStudy: string;
	university: string;
	graduationYear: string;
	gpa: string;
	countryOfStudy: string;
	scoreType: "gpa" | "score" | "";
	scoreValue: string;
	// Foreign Language fields
	hasForeignLanguage: "yes" | "no" | "";
	languages: Array<{
		language: string;
		certificate: string;
		score: string;
	}>;
	researchPapers: Array<{
		title: string;
		discipline: string;
		files: Array<{
			id: string;
			name: string;
			originalName: string;
			size: number;
			type: string;
			category: string;
			url: string;
			createdAt: Date;
		}>;
	}>;
	// File upload fields
	cvFile: string;
	certificateFile: string;
	uploadedFiles: Array<{
		id: string;
		name: string;
		originalName: string;
		size: number;
		type: string;
		category: string;
		url: string;
		createdAt: Date;
	}>;
	cvFiles: Array<{
		id: string;
		name: string;
		originalName: string;
		size: number;
		type: string;
		category: string;
		url: string;
		createdAt: Date;
	}>;
	languageCertFiles: Array<{
		id: string;
		name: string;
		originalName: string;
		size: number;
		type: string;
		category: string;
		url: string;
		createdAt: Date;
	}>;
	degreeFiles: Array<{
		id: string;
		name: string;
		originalName: string;
		size: number;
		type: string;
		category: string;
		url: string;
		createdAt: Date;
	}>;
	transcriptFiles: Array<{
		id: string;
		name: string;
		originalName: string;
		size: number;
		type: string;
		category: string;
		url: string;
		createdAt: Date;
	}>;
}
