import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define Scholarship type locally since it's not exported from explore-api
interface Scholarship {
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
		const discipline = searchParams.get("discipline")?.split(",") || [];
		const country = searchParams.get("country")?.split(",") || [];
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];
		const essayRequired = searchParams.get("essayRequired");
		const sortBy = searchParams.get("sortBy") || "most-popular";

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		); // Max 50 per page
		const skip = (page - 1) * limit;

		// Build where clause for filtering - only posts with PostScholarship records
		const whereClause: any = {
			published: true, // Only show published posts
			id: {
				in: await prismaClient.postScholarship
					.findMany({ select: { PostId: true } })
					.then((scholarships) => scholarships.map((s) => s.PostId)),
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

		// Query posts with PostScholarship data
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

		// Get PostScholarship data for each post
		const postIds = posts.map((post) => post.id);
		const postScholarships = await prismaClient.postScholarship.findMany({
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

		// Create a map for quick lookups
		const postScholarshipMap = new Map(
			postScholarships.map((ps) => [ps.PostId, ps])
		);

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [ac.postId, ac._count.id])
		);

		// Transform data to Scholarship format
		let scholarships: Scholarship[] = posts
			.map((post) => {
				const postScholarship = postScholarshipMap.get(post.id);
				if (!postScholarship) return null;

				// Find a matching institution (simplified logic)
				const institution = institutions[0] || {
					name: "University",
					country: "Unknown",
				};

				const applicationCount = applicationCountMap.get(post.id) || 0;

				const scholarship: Scholarship = {
					id: parseInt(post.id.substring(0, 8), 16), // Convert string ID to number
					title: post.title,
					description: post.content || "No description available",
					provider: postScholarship.type || "Provided by institution",
					university: institution.name,
					essayRequired: postScholarship.essay_required
						? "Yes"
						: "No",
					country: institution.country || "Unknown",
					date: post.createdAt.toISOString().split("T")[0],
					daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
					amount: postScholarship.grant || "Contact for details",
					match: calculateMatchPercentage(),
					applicationCount, // Add application count for popularity sorting
				};

				return scholarship;
			})
			.filter(
				(scholarship): scholarship is Scholarship =>
					scholarship !== null
			);

		// Apply client-side filters
		if (discipline.length > 0) {
			scholarships = scholarships.filter((scholarship) =>
				discipline.some((d) =>
					scholarship.description
						.toLowerCase()
						.includes(d.toLowerCase())
				)
			);
		}

		if (country.length > 0) {
			scholarships = scholarships.filter((scholarship) =>
				country.includes(scholarship.country)
			);
		}

		if (degreeLevel.length > 0) {
			scholarships = scholarships.filter((scholarship) =>
				degreeLevel.some((level) =>
					scholarship.description
						.toLowerCase()
						.includes(level.toLowerCase())
				)
			);
		}

		if (essayRequired) {
			scholarships = scholarships.filter(
				(scholarship) => scholarship.essayRequired === essayRequired
			);
		}

		// Sort scholarships
		switch (sortBy) {
			case "most-popular":
				scholarships.sort(
					(a, b) =>
						(b.applicationCount || 0) - (a.applicationCount || 0)
				);
				break;
			case "match-score":
				scholarships.sort(
					(a, b) => parseFloat(b.match) - parseFloat(a.match)
				);
				break;
			case "deadline":
				scholarships.sort((a, b) => a.daysLeft - b.daysLeft);
				break;
			case "amount-high":
				scholarships.sort((a, b) => {
					const amountA =
						parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
					const amountB =
						parseFloat(b.amount.replace(/[^0-9.]/g, "")) || 0;
					return amountB - amountA;
				});
				break;
			case "amount-low":
				scholarships.sort((a, b) => {
					const amountA =
						parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
					const amountB =
						parseFloat(b.amount.replace(/[^0-9.]/g, "")) || 0;
					return amountA - amountB;
				});
				break;
			// newest and oldest are handled by DB orderBy above
		}

		const meta: PaginationMeta = {
			total: totalCount,
			page,
			limit,
			totalPages: Math.ceil(totalCount / limit),
		};

		const response: ExploreApiResponse<Scholarship> = {
			data: scholarships,
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
