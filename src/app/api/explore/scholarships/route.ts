import { SimilarityService } from "@/services/similarity/similarity-service";
import { ExploreApiResponse, PaginationMeta } from "@/types/api/explore-api";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define Scholarship type locally since it's not exported from explore-api
interface Scholarship {
	id: string;
	title: string;
	description: string;
	provider: string;
	university: string;
	logo?: string;
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

// Helper function to calculate match percentage based on similarity
async function calculateMatchPercentages(
	scholarships: Scholarship[],
	userId?: string
): Promise<void> {
	if (!userId) {
		// No authenticated user, show restricted indicator
		scholarships.forEach((scholarship) => {
			scholarship.match = "—";
		});
		return;
	}

	try {
		// Get applicant record
		const applicant = await prismaClient.applicant.findFirst({
			where: { user_id: userId },
			select: { applicant_id: true, embedding: true },
		});

		if (!applicant) {
			// No applicant found, show restricted indicator
			scholarships.forEach((scholarship) => {
				scholarship.match = "—";
			});
			return;
		}

		// PLAN-BASED AUTHORIZATION: Check if user can see matching scores FIRST
		const { canSeeMatchingScore } =
			await import("@/services/authorization");
		const matchingPermission = await canSeeMatchingScore(
			applicant.applicant_id
		);

		if (!matchingPermission.authorized) {
			// User cannot see matching scores, show restricted indicator
			scholarships.forEach((scholarship) => {
				scholarship.match = "—"; // Premium feature indicator
			});
			return;
		}

		// User is authorized (Premium) - now check if they have an embedding
		if (!applicant.embedding) {
			// Premium user but no embedding yet, show 0%
			scholarships.forEach((scholarship) => {
				scholarship.match = "0%";
			});
			return;
		}

		// Get embeddings for all scholarship posts
		const postIds = scholarships.map((s) => s.id);
		const scholarshipPosts = await prismaClient.scholarshipPost.findMany({
			where: { post_id: { in: postIds } },
			select: { post_id: true, embedding: true },
		});

		// Calculate similarity scores
		const applicantEmbedding = applicant.embedding as number[];
		const matchScores = SimilarityService.calculateMatchScores(
			applicantEmbedding,
			scholarshipPosts.map((p) => ({
				id: p.post_id,
				embedding: p.embedding as number[] | null,
			}))
		);

		// Update scholarship objects with calculated match scores
		scholarships.forEach((scholarship) => {
			scholarship.match = matchScores[scholarship.id] || "0%";
		});
	} catch (error) {
		console.error("Error calculating match scores:", error);
		// Fallback to 0% on error
		scholarships.forEach((scholarship) => {
			scholarship.match = "0%";
		});
	}
}

// Helper function to format currency with commas
function formatCurrency(amount: any): string {
	if (!amount) return "0";
	const num =
		typeof amount === "string"
			? parseFloat(amount)
			: typeof amount === "number"
				? amount
				: parseFloat(amount.toString()); // Handle Prisma Decimal
	if (isNaN(num)) return "0";
	return num.toLocaleString("en-US");
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
			status: {
				in: ["PUBLISHED"], // Only show published posts, explicitly exclude DELETED
			},
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
				// { other_info: { contains: search, mode: "insensitive" } },
			];
		}

		// First, get ALL posts and their related data to apply filters properly
		const allPosts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			include: {
				institution: {
					select: {
						institution_id: true,
						name: true,
						country: true,
						type: true,
						logo: true,
					},
				},
			},
		});

		// Get ScholarshipPost data for all posts
		const allPostIds = allPosts.map((post) => post.post_id);
		const allPostScholarships = await prismaClient.scholarshipPost.findMany(
			{
				where: {
					post_id: { in: allPostIds },
				},
			}
		);

		// Get application counts for all posts (for popularity sorting)
		const allApplicationCounts = await prismaClient.application.groupBy({
			by: ["post_id"],
			where: {
				post_id: { in: allPostIds },
			},
			_count: {
				application_id: true,
			},
		});

		// Get institution data
		// const institutions = await prismaClient.institution.findMany();

		// Get disciplines and subdisciplines from database
		const disciplines = await prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				subdisciplines: {
					where: { status: true },
				},
			},
		});

		// Create maps for quick lookups
		const allPostScholarshipMap = new Map(
			allPostScholarships.map((ps) => [ps.post_id, ps])
		);

		const allApplicationCountMap = new Map(
			allApplicationCounts.map((ac) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Transform ALL data to Scholarship format first
		let allScholarships: Scholarship[] = allPosts
			.map((post) => {
				const postScholarship = allPostScholarshipMap.get(post.post_id);
				if (!postScholarship) return null;

				const applicationCount =
					allApplicationCountMap.get(post.post_id) || 0;

				// Use end_date as deadline, fallback to start_date + 90 days if not available
				const deadlineDate = post.end_date
					? post.end_date
					: new Date(
							post.start_date.getTime() + 90 * 24 * 60 * 60 * 1000
						);

				const scholarship: Scholarship = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.description || "No description available",
					provider:
						post.institution?.type || "Provided by institution",
					university: post.institution?.name || "University",
					logo: post.institution?.logo || undefined,
					essayRequired: postScholarship.essay_required
						? "Yes"
						: "No",
					country:
						post.institution?.country || post.location || "Unknown",
					date: deadlineDate.toISOString().split("T")[0], // Use deadline date instead of create_at
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()), // This will be recalculated on frontend
					amount: postScholarship.grant || "0",
					match: "0%", // Will be calculated later based on similarity
					applicationCount, // Add application count for popularity sorting
				};

				return scholarship;
			})
			.filter(
				(scholarship): scholarship is Scholarship =>
					scholarship !== null
			);

		// Apply filters BEFORE pagination
		let filteredScholarships = allScholarships;

		if (discipline.length > 0) {
			filteredScholarships = filteredScholarships.filter((scholarship) =>
				discipline.some((d) => {
					// Check against discipline names from database
					const matchesDiscipline = disciplines.some(
						(dbDisc) =>
							dbDisc.name
								.toLowerCase()
								.includes(d.toLowerCase()) ||
							d.toLowerCase().includes(dbDisc.name.toLowerCase())
					);

					// Check against subdiscipline names from database
					const matchesSubdiscipline = disciplines.some((dbDisc) =>
						dbDisc.subdisciplines.some(
							(sub) =>
								sub.name
									.toLowerCase()
									.includes(d.toLowerCase()) ||
								d.toLowerCase().includes(sub.name.toLowerCase())
						)
					);

					// Also check description for backward compatibility
					const matchesDescription = scholarship.description
						.toLowerCase()
						.includes(d.toLowerCase());

					return (
						matchesDiscipline ||
						matchesSubdiscipline ||
						matchesDescription
					);
				})
			);
		}

		if (country.length > 0) {
			filteredScholarships = filteredScholarships.filter((scholarship) =>
				country.includes(scholarship.country)
			);
		}

		if (degreeLevel.length > 0) {
			filteredScholarships = filteredScholarships.filter(
				(scholarship) => {
					// Find the original post to get the degree_level
					const originalPost = allPosts.find(
						(p) => p.post_id === scholarship.id
					);
					const postDegreeLevel = originalPost?.degree_level || "";

					return degreeLevel.some((level) =>
						postDegreeLevel
							.toLowerCase()
							.includes(level.toLowerCase())
					);
				}
			);
		}

		if (essayRequired) {
			filteredScholarships = filteredScholarships.filter(
				(scholarship) => scholarship.essayRequired === essayRequired
			);
		}

		// Sort scholarships AFTER filtering
		switch (sortBy) {
			case "most-popular":
				filteredScholarships.sort(
					(a, b) =>
						(b.applicationCount || 0) - (a.applicationCount || 0)
				);
				break;
			case "match-score":
				filteredScholarships.sort(
					(a, b) => parseFloat(b.match) - parseFloat(a.match)
				);
				break;
			case "deadline":
				filteredScholarships.sort((a, b) => a.daysLeft - b.daysLeft);
				break;
			case "amount-high":
				filteredScholarships.sort((a, b) => {
					const amountA =
						parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
					const amountB =
						parseFloat(b.amount.replace(/[^0-9.]/g, "")) || 0;
					return amountB - amountA;
				});
				break;
			case "amount-low":
				filteredScholarships.sort((a, b) => {
					const amountA =
						parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
					const amountB =
						parseFloat(b.amount.replace(/[^0-9.]/g, "")) || 0;
					return amountA - amountB;
				});
				break;
			// newest and oldest are handled by DB orderBy above
		}

		// Calculate match scores based on similarity (for all filtered results)
		let userId: string | undefined;
		try {
			const { user } = await requireAuth();
			userId = user.id;
		} catch (error) {
			// User not authenticated, will use default scores
		}
		await calculateMatchPercentages(filteredScholarships, userId);

		// Re-sort by match-score if that's the selected sort option
		// (now that we have real match scores)
		if (sortBy === "match-score") {
			filteredScholarships.sort(
				(a, b) => parseFloat(b.match) - parseFloat(a.match)
			);
		}

		// Calculate total count AFTER filtering
		const totalFilteredCount = filteredScholarships.length;

		// Apply pagination AFTER filtering and sorting
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedScholarships = filteredScholarships.slice(
			startIndex,
			endIndex
		);

		const meta: PaginationMeta = {
			total: totalFilteredCount,
			page,
			limit,
			totalPages: Math.ceil(totalFilteredCount / limit),
		};

		// Extract available filter options from all scholarships (before pagination)
		const availableCountries = Array.from(
			new Set(
				allScholarships
					.map((scholarship) => scholarship.country)
					.filter(Boolean)
			)
		).sort();

		const availableDisciplines = disciplines.map((d) => d.name).sort();

		// Get available degree levels from OpportunityPost.degree_level field
		const availableDegreeLevels = Array.from(
			new Set(allPosts.map((post) => post.degree_level).filter(Boolean))
		).sort();

		const availableEssayRequired = Array.from(
			new Set(
				allScholarships
					.map((scholarship) => scholarship.essayRequired)
					.filter(Boolean)
			)
		).sort();

		const response: ExploreApiResponse<Scholarship> = {
			data: paginatedScholarships,
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
