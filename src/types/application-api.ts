// Application API Types

export interface ApplicationRequest {
	postId: string;
	documents?: ApplicationDocument[];
	coverLetter?: string;
	additionalInfo?: string;
}

export interface ApplicationDocument {
	documentTypeId: string;
	name: string;
	url: string;
	size: number;
}

export interface ApplicationResponse {
	success: boolean;
	application?: Application;
	error?: string;
}

export interface Application {
	applicationId: string;
	applicantId: string;
	postId: string;
	status: ApplicationStatus;
	applyAt: string;
	coverLetter?: string;
	additionalInfo?: string;
	documents: ApplicationDocument[];
	post: {
		id: string;
		title: string;
		institution: {
			name: string;
			logo?: string | null;
		};
	};
}

export interface ApplicationListResponse {
	success: boolean;
	applications?: Application[];
	total?: number;
	page?: number;
	limit?: number;
	error?: string;
}

export interface ApplicationStatsResponse {
	success: boolean;
	stats?: {
		total: number;
		pending: number;
		reviewed: number;
		accepted: number;
		rejected: number;
	};
	error?: string;
}

export type ApplicationStatus =
	| "PENDING"
	| "REVIEWED"
	| "ACCEPTED"
	| "REJECTED";

export interface ApplicationUpdateRequest {
	status?: ApplicationStatus;
	notes?: string;
}

export interface ApplicationUpdateResponse {
	success: boolean;
	application?: Application;
	error?: string;
}
