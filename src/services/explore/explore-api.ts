// Utility functions for Explore API calls

import {
	ExploreApiResponse,
	ExploreFilters,
	Program,
	ResearchLab,
	Scholarship,
} from "@/types/api/explore-api";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

export class ExploreApiService {
	static async getPrograms(
		filters: ExploreFilters = {}
	): Promise<ExploreApiResponse<Program>> {
		const searchParams = new URLSearchParams();

		// Add filters to search params
		if (filters.search) searchParams.set("search", filters.search);
		if (filters.discipline?.length)
			searchParams.set("discipline", filters.discipline.join(","));
		if (filters.country?.length)
			searchParams.set("country", filters.country.join(","));
		if (filters.attendance?.length)
			searchParams.set("attendance", filters.attendance.join(","));
		if (filters.degreeLevel?.length)
			searchParams.set("degreeLevel", filters.degreeLevel.join(","));
		if (filters.duration?.length)
			searchParams.set("duration", filters.duration.join(","));
		if (filters.minFee !== undefined)
			searchParams.set("minFee", filters.minFee.toString());
		if (filters.maxFee !== undefined)
			searchParams.set("maxFee", filters.maxFee.toString());
		if (filters.sortBy) searchParams.set("sortBy", filters.sortBy);
		if (filters.page) searchParams.set("page", filters.page.toString());
		if (filters.limit) searchParams.set("limit", filters.limit.toString());

		const response = await fetch(
			`${BASE_URL}/api/explore/programs?${searchParams.toString()}`
		);

		if (!response.ok) {
			throw new Error("Failed to fetch programs");
		}

		return response.json();
	}

	static async getScholarships(
		filters: ExploreFilters = {}
	): Promise<ExploreApiResponse<Scholarship>> {
		const searchParams = new URLSearchParams();

		// Add filters to search params
		if (filters.search) searchParams.set("search", filters.search);
		if (filters.discipline?.length)
			searchParams.set("discipline", filters.discipline.join(","));
		if (filters.country?.length)
			searchParams.set("country", filters.country.join(","));
		if (filters.degreeLevel?.length)
			searchParams.set("degreeLevel", filters.degreeLevel.join(","));
		if (filters.essayRequired !== undefined)
			searchParams.set(
				"essayRequired",
				filters.essayRequired ? "Yes" : "No"
			);
		if (filters.sortBy) searchParams.set("sortBy", filters.sortBy);
		if (filters.page) searchParams.set("page", filters.page.toString());
		if (filters.limit) searchParams.set("limit", filters.limit.toString());

		const response = await fetch(
			`${BASE_URL}/api/explore/scholarships?${searchParams.toString()}`
		);

		if (!response.ok) {
			throw new Error("Failed to fetch scholarships");
		}

		return response.json();
	}

	static async getResearchLabs(
		filters: ExploreFilters = {}
	): Promise<ExploreApiResponse<ResearchLab>> {
		const searchParams = new URLSearchParams();

		// Add filters to search params
		if (filters.search) searchParams.set("search", filters.search);

		// Handle research field filtering - prioritize discipline over researchField
		const researchFields = [];
		if (filters.discipline?.length) {
			researchFields.push(...filters.discipline);
		}
		if (filters.researchField?.length) {
			researchFields.push(...filters.researchField);
		}
		if (researchFields.length > 0) {
			searchParams.set("researchField", researchFields.join(","));
		}

		if (filters.country?.length)
			searchParams.set("country", filters.country.join(","));
		if (filters.minSalary !== undefined)
			searchParams.set("minSalary", filters.minSalary.toString());
		if (filters.maxSalary !== undefined)
			searchParams.set("maxSalary", filters.maxSalary.toString());
		if (filters.contractType?.length)
			searchParams.set("contractType", filters.contractType.join(","));
		if (filters.jobType?.length)
			searchParams.set("jobType", filters.jobType.join(","));
		if (filters.sortBy) searchParams.set("sortBy", filters.sortBy);
		if (filters.page) searchParams.set("page", filters.page.toString());
		if (filters.limit) searchParams.set("limit", filters.limit.toString());

		const response = await fetch(
			`${BASE_URL}/api/explore/research?${searchParams.toString()}`
		);

		if (!response.ok) {
			throw new Error("Failed to fetch research labs");
		}

		return response.json();
	}
}
