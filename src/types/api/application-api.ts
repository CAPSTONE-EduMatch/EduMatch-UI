// Application API Types

export interface ApplicationRequest {
	postId: string;
	documents?: ApplicationDocument[];
	selectedProfileDocumentIds?: string[]; // IDs of selected profile documents to include in profilesnapshot
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
		startDate: string;
		endDate?: string;
		location?: string;
		otherInfo?: string;
		institution: {
			name: string;
			logo?: string | null;
			country?: string;
			status: boolean;
			deletedAt: string | null;
		};
		program?: {
			post_id: string;
			duration: string;
			degree_level: string;
			attendance: string;
			course_include?: string;
			gpa?: number;
			gre?: number;
			gmat?: number;
			tuition_fee?: number;
			fee_description?: string;
			scholarship_info?: string;
		};
		scholarship?: {
			post_id: string;
			description: string;
			type: string;
			number: number;
			grant?: string;
			scholarship_coverage?: string;
			essay_required?: boolean;
			eligibility?: string;
		};
		job?: {
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
	| "SUBMITTED"
	| "REQUIRE_UPDATE"
	| "ACCEPTED"
	| "REJECTED"
	| "UPDATED";

export interface ApplicationUpdateRequest {
	status?: ApplicationStatus;
	notes?: string;
}

export interface ApplicationUpdateResponse {
	success: boolean;
	application?: Application;
	error?: string;
}
