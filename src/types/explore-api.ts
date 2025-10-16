// Types for Explore API responses using Prisma types
import type {
	Institution,
	OpportunityPost,
	JobPost,
	ProgramPost,
	ScholarshipPost,
} from "@prisma/client";

// Enhanced types that include computed fields and relations
export interface EnhancedProgram extends OpportunityPost {
	programPost?: ProgramPost;
	institution?: Institution;
	// Computed fields
	daysLeft: number;
	match: string;
	applicationCount: number;
}

export interface EnhancedScholarship extends OpportunityPost {
	scholarshipPost?: ScholarshipPost;
	institution?: Institution;
	// Computed fields
	daysLeft: number;
	match: string;
	applicationCount: number;
}

export interface EnhancedResearchPosition extends OpportunityPost {
	jobPost?: JobPost;
	institution?: Institution;
	// Computed fields
	daysLeft: number;
	match: string;
	applicationCount: number;
}

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ExploreApiResponse<T> {
	data: T[];
	meta: PaginationMeta;
	availableFilters?: {
		disciplines?: string[];
		subdisciplines?: Record<string, string[]>;
		countries?: string[];
		researchFields?: string[];
		degreeLevels?: string[];
		attendanceTypes?: string[];
		essayRequired?: string[];
		positions?: string[];
		[key: string]: any;
	};
}

// Legacy interfaces for backward compatibility
export interface Program {
	id: number;
	postId: string; // Original post ID for API calls
	title: string;
	description: string;
	university: string;
	logo: string;
	field: string;
	country: string;
	date: string;
	daysLeft: number;
	price: string;
	match: string;
	funding: string;
	attendance: string;
	applicationCount?: number;
}

export interface Scholarship {
	id: number;
	postId: string; // Original post ID for API calls
	title: string;
	description: string;
	provider: string;
	university: string;
	essayRequired: string;
	country: string;
	date: string;
	daysLeft: number;
	amount: string;
	match: string;
	applicationCount?: number;
}

export interface ResearchLab {
	id: number;
	postId: string; // Original post ID for API calls
	title: string;
	description: string;
	professor: string;
	field: string;
	country: string;
	position: string;
	date: string;
	daysLeft: number;
	match: string;
	applicationCount?: number;
}

export interface ExploreFilters {
	search?: string;
	discipline?: string[];
	country?: string[];
	minFee?: number;
	maxFee?: number;
	duration?: string[];
	degreeLevel?: string[];
	attendance?: string[];
	essayRequired?: boolean;
	researchField?: string[];
	minSalary?: number;
	maxSalary?: number;
	contractType?: string[];
	jobType?: string[];
	sortBy?: "most-popular" | "newest" | "deadline" | "match-score";
	page?: number;
	limit?: number;
}
