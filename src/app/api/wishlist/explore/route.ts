import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { WishlistErrorResponse } from "@/types/wishlist-api";
import {
	Program,
	Scholarship,
	ResearchLab,
	fetchExploreData,
	transformToProgram,
	transformToScholarship,
	transformToResearchLab,
	applyFilters,
	applySorting,
	extractAvailableFilters,
} from "@/lib/explore-utils";

// GET /api/wishlist/explore - Get explore data with wishlist status
export async function GET(request: NextRequest) {
	try {
		const userId = request.headers.get("x-user-id");

		if (!userId) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "User ID is required",
				code: "MISSING_USER_ID",
			};
			return NextResponse.json(errorResponse, { status: 401 });
		}

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const discipline = searchParams.get("discipline")?.split(",") || [];
		const country = searchParams.get("country")?.split(",") || [];
		const attendance = searchParams.get("attendance")?.split(",") || [];
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];
		const sortBy = searchParams.get("sortBy") || "most-popular";
		const type = searchParams.get("type") || "all"; // all, programs, scholarships, research

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		);

		// Build where clause for filtering
		const whereClause: any = {
			published: true, // Only show published posts
		};

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				{ content: { contains: search, mode: "insensitive" } },
			];
		}

		// Query ALL posts first (without pagination) to apply filtering
		const allPosts = await prismaClient.post.findMany({
			where: whereClause,
			orderBy:
				sortBy === "newest"
					? { createdAt: "desc" }
					: sortBy === "oldest"
						? { createdAt: "asc" }
						: { createdAt: "desc" }, // default to newest
		});

		// Get all post IDs for wishlist check
		const allPostIds = allPosts.map((post) => post.id);

		// Get user's wishlist items
		const userWishlist = await prismaClient.wishlist.findMany({
			where: {
				userId: userId,
				postId: { in: allPostIds },
				status: 1, // Only active wishlist items
			},
		});

		// Create wishlist map for quick lookup
		const wishlistMap = new Map(
			userWishlist.map((item) => [item.postId, true])
		);

		// Fetch all explore data using shared utility
		const {
			postProgramMap,
			postScholarshipMap,
			postJobMap,
			applicationCountMap,
			subdisciplineMap,
			disciplineMap,
			institutions,
			disciplines,
		} = await fetchExploreData(allPostIds);

		// Transform data based on type
		let allItems: (Program | Scholarship | ResearchLab)[] = [];

		if (type === "all" || type === "programs") {
			// Transform programs
			const programs: Program[] = allPosts
				.map((post) => {
					const postProgram = postProgramMap.get(post.id);
					if (!postProgram) return null;

					// Find the appropriate institution for this program
					const institution = institutions.find(
						(inst) => inst.name && inst.country
					) || {
						name: "University",
						logo: "/logos/default.png",
						country: "Unknown",
					};

					const applicationCount =
						applicationCountMap.get(post.id) || 0;
					const isInWishlist = wishlistMap.has(post.id);

					return transformToProgram(
						post,
						postProgram,
						applicationCount,
						institution,
						subdisciplineMap,
						disciplineMap,
						isInWishlist
					);
				})
				.filter((program): program is Program => program !== null);

			allItems = [...allItems, ...programs];
		}

		if (type === "all" || type === "scholarships") {
			// Transform scholarships
			const scholarships: Scholarship[] = allPosts
				.map((post) => {
					const postScholarship = postScholarshipMap.get(post.id);
					if (!postScholarship) return null;

					// Find the appropriate institution for this scholarship
					const institution = institutions.find(
						(inst) => inst.name && inst.country
					) || {
						name: "University",
						logo: "/logos/default.png",
						country: "Unknown",
					};

					const applicationCount =
						applicationCountMap.get(post.id) || 0;
					const isInWishlist = wishlistMap.has(post.id);

					return transformToScholarship(
						post,
						postScholarship,
						applicationCount,
						institution,
						isInWishlist
					);
				})
				.filter(
					(scholarship): scholarship is Scholarship =>
						scholarship !== null
				);

			allItems = [...allItems, ...scholarships];
		}

		if (type === "all" || type === "research") {
			// Transform research labs
			const researchLabs: ResearchLab[] = allPosts
				.map((post) => {
					const postJob = postJobMap.get(post.id);
					if (!postJob) return null;

					// Find the appropriate institution for this research lab
					const institution = institutions.find(
						(inst) => inst.name && inst.country
					) || {
						name: "University",
						logo: "/logos/default.png",
						country: "Unknown",
					};

					const applicationCount =
						applicationCountMap.get(post.id) || 0;
					const isInWishlist = wishlistMap.has(post.id);

					return transformToResearchLab(
						post,
						postJob,
						applicationCount,
						institution,
						isInWishlist
					);
				})
				.filter(
					(researchLab): researchLab is ResearchLab =>
						researchLab !== null
				);

			allItems = [...allItems, ...researchLabs];
		}

		// Apply client-side filters using shared utility
		allItems = applyFilters(allItems, {
			discipline: discipline.length > 0 ? discipline : undefined,
			country: country.length > 0 ? country : undefined,
			attendance: attendance.length > 0 ? attendance : undefined,
			degreeLevel: degreeLevel.length > 0 ? degreeLevel : undefined,
		});

		// Sort items using shared utility
		allItems = applySorting(allItems, sortBy);

		// Get total count AFTER filtering
		const totalCount = allItems.length;

		// Apply pagination AFTER filtering and sorting
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const items = allItems.slice(startIndex, endIndex);

		const totalPages = Math.ceil(totalCount / limit);

		const meta = {
			total: totalCount,
			page,
			limit,
			totalPages,
		};

		// Extract available filter options using shared utility
		const availableFilters = extractAvailableFilters(allItems, disciplines);

		const response = {
			success: true,
			data: items,
			meta,
			availableFilters,
		};

		return NextResponse.json(response);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching wishlist explore data:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
