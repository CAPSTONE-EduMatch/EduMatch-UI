export interface InstitutionDetails {
	id: string;
	name: string;
	abbreviation: string | null;
	type: string;
	country: string;
	address: string;
	website: string | null;
	email: string | null;
	hotline: string;
	hotlineCode: string | null;
	logo: string | null;
	coverImage: string | null;
	about: string;

	// Representative information
	repName: string;
	repAppellation: string | null;
	repPosition: string;
	repEmail: string;
	repPhone: string;
	repPhoneCode: string | null;

	// User account information
	userId: string;
	userEmail: string;
	userName: string | null;
	userImage: string | null;

	// Status information
	status:
		| "Active"
		| "Inactive"
		| "Suspended"
		| "Pending"
		| "Rejected"
		| "Require Update"
		| "Updated";
	banned: boolean;
	banReason?: string;
	banExpires?: string;
	createdAt: string;
	lastActive?: string;

	// Verification information
	verification_status?:
		| "PENDING"
		| "APPROVED"
		| "REJECTED"
		| "REQUIRE_UPDATE"
		| "UPDATED";
	submitted_at?: string | null;
	verified_at?: string | null;
	verified_by?: string | null;
	rejection_reason?: string | null;

	// Documents
	documents: {
		accreditationCertificates: InstitutionDocument[];
		operatingLicenses: InstitutionDocument[];
		taxDocuments: InstitutionDocument[];
		representativeDocuments: InstitutionDocument[];
		otherDocuments: InstitutionDocument[];
		verificationDocuments: InstitutionDocument[];
	};

	// Academic information
	subdisciplines: Array<{
		subdisciplineId: string;
		name: string;
		discipline: {
			disciplineId: string;
			name: string;
		};
	}>;

	// Statistics
	stats?: {
		totalApplications: number;
		acceptedApplications: number;
		rejectedApplications: number;
		pendingApplications: number;
		totalStudents: number;
		activeScholarships: number;
	};
}

export interface InstitutionDocument {
	documentId: string;
	name: string;
	url: string;
	size: number;
	uploadDate: string;
	documentType: string;
}

export interface InstitutionActionRequest {
	action:
		| "contact"
		| "ban"
		| "unban"
		| "revoke-sessions"
		| "suspend"
		| "activate";
	banReason?: string;
	banDuration?: number; // in days, omit for permanent ban
	contactMessage?: string;
}

export interface InstitutionListItem {
	id: string;
	name: string;
	abbreviation: string | null;
	type: string;
	country: string;
	repName: string;
	repEmail: string;
	status: "Active" | "Inactive" | "Suspended";
	banned: boolean;
	createdAt: string;
	lastActive?: string;
	totalApplications: number;
	logo: string | null;
}

export interface InstitutionFilters {
	search?: string;
	country?: string;
	type?: string;
	status?: "Active" | "Inactive" | "Suspended" | "All";
	banned?: boolean;
	sortBy?: "name" | "createdAt" | "lastActive" | "totalApplications";
	sortOrder?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}
