import { useState, useEffect, useCallback } from "react";

export interface ResearchLabDetail {
	id: string;
	title: string;
	description: string;
	organization: string;
	university: string;
	country: string;
	date: string;
	daysLeft: number;
	salary: string;
	match: string;
	otherInfo: string;
	applicationCount: number;
	jobType: string;
	contractType: string;
	attendance: string;
	location: string;
	startDate: string;
	applicationDeadline: string;

	// Job Description Details
	researchFields: string[];
	researchFocus: string;
	researchExperience: string;
	researchProposal: string;
	technicalSkills: string;
	academicBackground: string;

	// Offer Information
	benefit: string;
	salaryDescription: string;

	// Job Requirements
	mainResponsibility: string;
	qualificationRequirement: string;
	experienceRequirement: string;
	assessmentCriteria: string;
	otherRequirement: string;

	// Lab Information
	labType: string;
	labCapacity: number;
	labFacilities: string;
	recommendations: string;
	applicationDocuments: string;

	institution: {
		id: string;
		userId?: string;
		name: string;
		abbreviation: string;
		logo: string;
		country: string;
		website: string;
		about: string;
		status: boolean;
		deletedAt?: string | null;
	};
	requiredDocuments: Array<{
		id: string;
		name: string;
		description: string;
	}>;
	subdisciplines: Array<{
		id: string;
		name: string;
	}>;
	status?: string;
}

interface UseResearchLabDetailReturn {
	researchLab: ResearchLabDetail | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export const useResearchLabDetail = (
	id: string
): UseResearchLabDetailReturn => {
	const [researchLab, setResearchLab] = useState<ResearchLabDetail | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchResearchLabDetail = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`/api/explore/research/research-detail?id=${id}`
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.message || "Failed to fetch research lab detail"
				);
			}

			if (data.success) {
				setResearchLab(data.data);
			} else {
				throw new Error("Failed to fetch research lab detail");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			// eslint-disable-next-line no-console
			console.error("Error fetching research lab detail:", err);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchResearchLabDetail();
	}, [fetchResearchLabDetail]);

	return {
		researchLab,
		loading,
		error,
		refetch: fetchResearchLabDetail,
	};
};
