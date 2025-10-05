// Types for Explore API responses using Prisma types
import type {
	InstitutionProfile,
	Post,
	PostJob,
	PostProgram,
	PostScholarship,
} from "../../generated/prisma";

// Enhanced types that include computed fields and relations
export interface EnhancedProgram extends Post {
	postProgram?: PostProgram;
	institution?: InstitutionProfile;
	// Computed fields
	daysLeft: number;
	match: string;
	applicationCount: number;
}

export interface EnhancedScholarship extends Post {
	postScholarship?: PostScholarship;
	institution?: InstitutionProfile;
	// Computed fields
	daysLeft: number;
	match: string;
	applicationCount: number;
}

export interface EnhancedResearchPosition extends Post {
	postJob?: PostJob;
	institution?: InstitutionProfile;
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
}

// Legacy interfaces for backward compatibility
export interface Program {
	id: number;
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
