// Wishlist API Types
export interface WishlistItem {
	id: string;
	postId: string;
	userId: string;
	createdAt: string;
	status: WishlistStatus;
	post: {
		id: string;
		title: string;
		content: string | null;
		published: boolean;
		createdAt: string;
		updatedAt: string;
		authorId: string;
		// Program specific data
		program?: {
			PostId: string;
			duration: string;
			degreeLevel: string;
			CourseInclude: string | null;
			professor_name: string | null;
			gpa: any | null;
			gre: number | null;
			gmat: number | null;
			tuition_fee: any | null;
			fee_description: string | null;
			scholarship_info: string | null;
		};
		// Scholarship specific data
		scholarship?: {
			PostId: string;
			detail: string;
			type: string;
			number: number | null;
			grant: string | null;
			scholarship_coverage: string | null;
			essay_required: boolean | null;
			eligibility: string | null;
		};
		// Job specific data
		job?: {
			PostId: string;
			contract_type: string;
			job_type: string;
			min_salary: number;
			max_salary: number;
			salary_description: string | null;
			benefit: string | null;
			main_responsibility: string | null;
			qualification_requirement: string | null;
			experience_requirement: string | null;
			assessment_criteria: string | null;
			other_requirement: string | null;
		};
		// Institution data
		institution?: {
			profile_id: string;
			logo: string;
			name: string;
			abbreviation: string;
			hotline: string;
			type: string;
			website: string;
			country: string;
			address: string;
			rep_name: string;
			rep_appellation: string;
			rep_position: string;
			rep_email: string;
			rep_phone: string;
			about: string;
			subdiscipline: number;
			cover_image: string;
		};
	};
}

export type WishlistStatus = 0 | 1; // 0 = inactive, 1 = active

export interface WishlistResponse {
	success: boolean;
	data: WishlistItem[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface WishlistItemResponse {
	success: boolean;
	data: WishlistItem;
}

export interface WishlistCreateRequest {
	postId: string;
	status?: WishlistStatus;
}

export interface WishlistUpdateRequest {
	status: WishlistStatus;
}

export interface WishlistQueryParams {
	page?: number;
	limit?: number;
	status?: WishlistStatus;
	search?: string;
	sortBy?: "newest" | "oldest" | "title-asc" | "title-desc";
	postType?: "program" | "scholarship" | "job";
	country?: string;
	discipline?: string;
}

export interface WishlistStats {
	total: number;
	active: number;
	inactive: number;
	byType: {
		programs: number;
		scholarships: number;
		jobs: number;
	};
	byCountry: Record<string, number>;
	byDiscipline: Record<string, number>;
}

export interface WishlistStatsResponse {
	success: boolean;
	data: WishlistStats;
}

// Error response interface
export interface WishlistErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: any;
}
