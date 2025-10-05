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
		const institutions = await prismaClient.institutionProfile.findMany();

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

				const lab: ResearchLab = {
					id: parseInt(post.id.substring(0, 8), 16), // Convert string ID to number
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

		const response: ExploreApiResponse<ResearchLab> = {
			data: labs,
			meta,
		};

		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
