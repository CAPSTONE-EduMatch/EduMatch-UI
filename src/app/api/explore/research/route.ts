import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define ResearchLab type locally since it's not exported
interface ResearchLab {
	id: string;
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

// Helper function to calculate days left from a date string
function calculateDaysLeft(dateString: string): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

// Helper function to calculate match percentage (placeholder logic)
function calculateMatchPercentage(): string {
	return `${Math.floor(Math.random() * 30) + 70}%`;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const researchField =
			searchParams.get("researchField")?.split(",") || [];
		const country = searchParams.get("country")?.split(",") || [];
		const jobType = searchParams.get("jobType")?.split(",") || [];
		const contractType = searchParams.get("contractType")?.split(",") || [];
		const minSalary = searchParams.get("minSalary")
			? parseInt(searchParams.get("minSalary")!)
			: undefined;
		const maxSalary = searchParams.get("maxSalary")
			? parseInt(searchParams.get("maxSalary")!)
			: undefined;
		const sortBy = searchParams.get("sortBy") || "most-popular";

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		); // Max 50 per page
		const skip = (page - 1) * limit;

		// Build where clause for filtering - only posts with JobPost records (research positions)
		const whereClause: any = {
			status: "PUBLISHED", // Only show published posts
			post_id: {
				in: await prismaClient.jobPost
					.findMany({ select: { post_id: true } })
					.then((jobs: any) => jobs.map((j: any) => j.post_id)),
			},
		};

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				{ other_info: { contains: search, mode: "insensitive" } },
			];
		}

		// Get total count for pagination
		const totalCount = await prismaClient.opportunityPost.count({
			where: whereClause,
		});

		// Query posts with JobPost data (for research positions)
		const posts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			orderBy:
				sortBy === "newest"
					? { create_at: "desc" }
					: sortBy === "oldest"
						? { create_at: "asc" }
						: { create_at: "desc" }, // default to newest
			skip,
			take: limit,
		});

		// Get JobPost data for each post (research positions)
		const postIds = posts.map((post: any) => post.post_id);
		const postJobs = await prismaClient.jobPost.findMany({
			where: {
				post_id: { in: postIds },
			},
		});

		// Get application counts for each post (for popularity sorting)
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["post_id"],
			where: {
				post_id: { in: postIds },
			},
			_count: {
				application_id: true,
			},
		});

		// Get institution data
		const institutions = await prismaClient.institution.findMany();

		// Get disciplines and subdisciplines from database (for future use)
		// const disciplines = await prismaClient.discipline.findMany({
		// 	where: { status: true },
		// 	include: {
		// 		Sub_Discipline: {
		// 			where: { status: true },
		// 		},
		// 	},
		// });

		// Create a map for quick lookups
		const postJobMap = new Map(postJobs.map((pj: any) => [pj.post_id, pj]));

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac: any) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Transform data to ResearchLab format
		let labs: ResearchLab[] = posts
			.map((post: any) => {
				const postJob = postJobMap.get(post.post_id);
				if (!postJob) return null;

				// Find a matching institution (simplified logic)
				const institution = institutions[0] || {
					name: "Research Institution",
					country: "Unknown",
				};

				const applicationCount =
					applicationCountMap.get(post.post_id) || 0;

				// Use end_date as deadline, fallback to start_date + 90 days if not available
				const deadlineDate = post.end_date
					? post.end_date
					: new Date(
							post.start_date.getTime() + 90 * 24 * 60 * 60 * 1000
						);

				const lab: ResearchLab = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.other_info || "No description available",
					professor: "Prof. Researcher", // Default value since not in JobPost
					field: (postJob as any)?.job_type || "Research",
					country: institution.country || "Unknown",
					position: (postJob as any)?.job_type || "Research Position",
					date: deadlineDate.toISOString().split("T")[0], // Use deadline date instead of create_at
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()), // This will be recalculated on frontend
					match: calculateMatchPercentage(),
					applicationCount: applicationCount || 0, // Add application count for popularity sorting
				};

				return lab;
			})
			.filter((lab: any): lab is ResearchLab => lab !== null);

		// Apply client-side filters
		if (researchField.length > 0) {
			labs = labs.filter((lab) =>
				researchField.some((field) =>
					lab.field.toLowerCase().includes(field.toLowerCase())
				)
			);
		}

		// Apply degree level filtering based on OpportunityPost.degree_level
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];

		if (degreeLevel.length > 0) {
			labs = labs.filter((lab) => {
				// Find the original post to get the degree_level
				const originalPost = posts.find(
					(p: any) => p.post_id === lab.id
				);
				const postDegreeLevel = originalPost?.degree_level || "";

				return degreeLevel.some((level) =>
					postDegreeLevel.toLowerCase().includes(level.toLowerCase())
				);
			});
		}

		if (country.length > 0) {
			labs = labs.filter((lab) => country.includes(lab.country));
		}

		if (jobType.length > 0) {
			labs = labs.filter((lab) => jobType.includes(lab.position));
		}

		if (contractType.length > 0) {
			labs = labs.filter((lab) =>
				contractType.some((type) =>
					lab.description.toLowerCase().includes(type.toLowerCase())
				)
			);
		}

		// Sort research labs
		switch (sortBy) {
			case "most-popular":
				labs.sort(
					(a, b) =>
						(b.applicationCount || 0) - (a.applicationCount || 0)
				);
				break;
			case "match-score":
				labs.sort((a, b) => parseFloat(b.match) - parseFloat(a.match));
				break;
			case "deadline":
				labs.sort((a, b) => a.daysLeft - b.daysLeft);
				break;
			case "alphabetical":
				labs.sort((a, b) => a.title.localeCompare(b.title));
				break;
			// newest and oldest are handled by DB orderBy above
		}

		const meta: PaginationMeta = {
			total: totalCount,
			page,
			limit,
			totalPages: Math.ceil(totalCount / limit),
		};

		// Extract available filter options from all research labs (before pagination)
		const availableCountries = Array.from(
			new Set(labs.map((lab) => lab.country).filter(Boolean))
		).sort();

		const availableResearchFields = Array.from(
			new Set(labs.map((lab) => lab.field).filter(Boolean))
		).sort();

		const availableJobTypes = Array.from(
			new Set(labs.map((lab) => lab.position).filter(Boolean))
		).sort();

		// Get available degree levels from OpportunityPost.degree_level field
		const availableDegreeLevels = Array.from(
			new Set(posts.map((post: any) => post.degree_level).filter(Boolean))
		).sort();

		const availableContractTypes = Array.from(
			new Set(
				labs
					.map((lab) => {
						const desc = lab.description.toLowerCase();
						if (
							desc.includes("full-time") ||
							desc.includes("fulltime")
						)
							return "Full-time";
						if (
							desc.includes("part-time") ||
							desc.includes("parttime")
						)
							return "Part-time";
						if (desc.includes("contract")) return "Contract";
						return "Full-time"; // default
					})
					.filter(Boolean)
			)
		).sort();

		const response: ExploreApiResponse<ResearchLab> = {
			data: labs,
			meta,
			availableFilters: {
				countries: availableCountries,
				researchFields: availableResearchFields,
				jobTypes: availableJobTypes,
				degreeLevels: availableDegreeLevels,
				contractTypes: availableContractTypes,
				attendanceTypes: ["On-site", "Remote", "Hybrid"], // Default values for research
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
