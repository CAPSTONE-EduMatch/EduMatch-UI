import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define ResearchLab type locally since it's not exported
interface ResearchLab {
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
		const sortBy = searchParams.get("sortBy") || "most-popular";

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		); // Max 50 per page
		const skip = (page - 1) * limit;

		// Build where clause for filtering - only posts with PostJob records (research positions)
		const whereClause: any = {
			published: true, // Only show published posts
			id: {
				in: await prismaClient.postJob
					.findMany({ select: { PostId: true } })
					.then((jobs) => jobs.map((j) => j.PostId)),
			},
		};

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				{ content: { contains: search, mode: "insensitive" } },
			];
		}

		// Get total count for pagination
		const totalCount = await prismaClient.post.count({
			where: whereClause,
		});

		// Query posts with PostJob data (for research positions)
		const posts = await prismaClient.post.findMany({
			where: whereClause,
			orderBy:
				sortBy === "newest"
					? { createdAt: "desc" }
					: sortBy === "oldest"
						? { createdAt: "asc" }
						: { createdAt: "desc" }, // default to newest
			skip,
			take: limit,
		});

		// Get PostJob data for each post (research positions)
		const postIds = posts.map((post) => post.id);
		const postJobs = await prismaClient.postJob.findMany({
			where: {
				PostId: { in: postIds },
			},
		});

		// Get application counts for each post (for popularity sorting)
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["postId"],
			where: {
				postId: { in: postIds },
			},
			_count: {
				id: true,
			},
		});

		// Get institution data
		const institutions = await prismaClient.institution_profile.findMany();

		// Get disciplines and subdisciplines from database
		const disciplines = await prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				Sub_Discipline: {
					where: { status: true },
				},
			},
		});

		// Create a map for quick lookups
		const postJobMap = new Map(postJobs.map((pj) => [pj.PostId, pj]));

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [ac.postId, ac._count.id])
		);

		// Transform data to ResearchLab format
		let labs: ResearchLab[] = posts
			.map((post) => {
				const postJob = postJobMap.get(post.id);
				if (!postJob) return null;

				// Find a matching institution (simplified logic)
				const institution = institutions[0] || {
					name: "Research Institution",
					country: "Unknown",
				};

				const applicationCount = applicationCountMap.get(post.id) || 0;

				// Create unique numeric ID by hashing the post ID
				const hashCode = (str: string) => {
					let hash = 0;
					for (let i = 0; i < str.length; i++) {
						const char = str.charCodeAt(i);
						hash = (hash << 5) - hash + char;
						hash = hash & hash; // Convert to 32bit integer
					}
					return Math.abs(hash);
				};

				const lab: ResearchLab = {
					id: hashCode(post.id),
					title: post.title,
					description: post.content || "No description available",
					professor: "Prof. Researcher", // Default value since not in PostJob
					field: postJob.job_type || "Research",
					country: institution.country || "Unknown",
					position: postJob.job_type || "Research Position",
					date: post.createdAt.toISOString().split("T")[0],
					daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
					match: calculateMatchPercentage(),
					applicationCount, // Add application count for popularity sorting
				};

				return lab;
			})
			.filter((lab): lab is ResearchLab => lab !== null);

		// Apply client-side filters
		if (researchField.length > 0) {
			labs = labs.filter((lab) =>
				researchField.some((field) =>
					lab.field.toLowerCase().includes(field.toLowerCase())
				)
			);
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

		const availableDegreeLevels = Array.from(
			new Set(
				labs
					.map((lab) => {
						const pos = lab.position.toLowerCase();
						if (pos.includes("phd")) return "PhD";
						if (pos.includes("postdoc")) return "Postdoc";
						if (pos.includes("master")) return "Master";
						return "Other";
					})
					.filter(Boolean)
			)
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
