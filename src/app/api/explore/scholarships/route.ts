import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define Scholarship type locally since it's not exported from explore-api
interface Scholarship {
	id: string;
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

		// Build where clause for filtering - only posts with ScholarshipPost records
		const whereClause: any = {
			status: "PUBLISHED", // Only show published posts
			post_id: {
				in: await prismaClient.scholarshipPost
					.findMany({ select: { post_id: true } })
					.then((scholarships) => scholarships.map((s) => s.post_id)),
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

		// Query posts with ScholarshipPost data
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

		// Get ScholarshipPost data for each post
		const postIds = posts.map((post) => post.post_id);
		const postScholarships = await prismaClient.scholarshipPost.findMany({
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

		// Get disciplines and subdisciplines from database
		const disciplines = await prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				subdisciplines: {
					where: { status: true },
				},
			},
		});

		// Create a map for quick lookups
		const postScholarshipMap = new Map(
			postScholarships.map((ps) => [ps.post_id, ps])
		);

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Transform data to Scholarship format
		let scholarships: Scholarship[] = posts
			.map((post) => {
				const postScholarship = postScholarshipMap.get(post.post_id);
				if (!postScholarship) return null;

				// Find a matching institution (simplified logic)
				const institution = institutions[0] || {
					name: "University",
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

				const scholarship: Scholarship = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.other_info || "No description available",
					provider: postScholarship.type || "Provided by institution",
					university: institution.name,
					essayRequired: postScholarship.essay_required
						? "Yes"
						: "No",
					country: institution.country || "Unknown",
					date: deadlineDate.toISOString().split("T")[0], // Use deadline date instead of create_at
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()), // This will be recalculated on frontend
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
				discipline.some((d) => {
					// Check against discipline names from database
					const matchesDiscipline = disciplines.some(
						(dbDisc) =>
							dbDisc.name
								.toLowerCase()
								.includes(d.toLowerCase()) ||
							d.toLowerCase().includes(dbDisc.name.toLowerCase())
					);

					// Also check description for backward compatibility
					const matchesDescription = scholarship.description
						.toLowerCase()
						.includes(d.toLowerCase());

					return matchesDiscipline || matchesDescription;
				})
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

		// Extract available filter options from all scholarships (before pagination)
		const availableCountries = Array.from(
			new Set(
				scholarships
					.map((scholarship) => scholarship.country)
					.filter(Boolean)
			)
		).sort();

		const availableDisciplines = disciplines.map((d) => d.name).sort();

		const availableDegreeLevels = Array.from(
			new Set(
				scholarships
					.map((scholarship) => {
						const desc = scholarship.description.toLowerCase();
						if (
							desc.includes("master") ||
							desc.includes("msc") ||
							desc.includes("ma")
						)
							return "Master";
						if (desc.includes("phd") || desc.includes("doctorate"))
							return "PhD";
						if (
							desc.includes("bachelor") ||
							desc.includes("bsc") ||
							desc.includes("ba")
						)
							return "Bachelor";
						return "Other";
					})
					.filter(Boolean)
			)
		).sort();

		const availableEssayRequired = Array.from(
			new Set(
				scholarships
					.map((scholarship) => scholarship.essayRequired)
					.filter(Boolean)
			)
		).sort();

		const response: ExploreApiResponse<Scholarship> = {
			data: scholarships,
			meta,
			availableFilters: {
				countries: availableCountries,
				disciplines: availableDisciplines,
				degreeLevels: availableDegreeLevels,
				essayRequired: availableEssayRequired,
				subdisciplines: disciplines.reduce(
					(acc, discipline) => {
						acc[discipline.name] = discipline.subdisciplines.map(
							(sub) => sub.name
						);
						return acc;
					},
					{} as Record<string, string[]>
				),
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
