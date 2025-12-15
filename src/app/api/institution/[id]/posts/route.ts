import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";
import { SimilarityService } from "@/services/similarity/similarity-service";
import { requireAuth } from "@/utils/auth/auth-utils";

interface PostWithDetails {
	id: string;
	title: string;
	description: string;
	university: string;
	logo: string;
	field: string;
	country: string;
	date: string;
	daysLeft: number;
	price: string;
	type: "Program" | "Scholarship" | "Research Lab";
	match: string;
	funding?: string;
	attendance?: string;
	applicationCount?: number;
}

// Helper function to calculate days left from a date string
function calculateDaysLeft(dateString: Date): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

// Helper function to calculate match score between posts and authenticated user's applicant profile
async function calculateMatchScoresForPosts(
	posts: any[],
	applicantEmbedding: number[] | null,
	applicantId?: string
): Promise<Map<string, string>> {
	const matchScores = new Map<string, string>();

	if (!applicantEmbedding || !applicantId) {
		// No applicant embedding or ID, show restricted indicator
		posts.forEach((post) => {
			matchScores.set(post.post_id, "—");
		});
		return matchScores;
	}

	// PLAN-BASED AUTHORIZATION: Check if user can see matching scores FIRST
	// Only Premium plan users can see matching scores
	try {
		const { canSeeMatchingScore } =
			await import("@/services/authorization");
		const matchingPermission = await canSeeMatchingScore(applicantId);

		if (!matchingPermission.authorized) {
			// User cannot see matching scores, show restricted indicator
			posts.forEach((post) => {
				matchScores.set(post.post_id, "—"); // Use em dash to indicate premium feature
			});
			return matchScores;
		}
	} catch (error) {
		// Error checking permission, show restricted indicator
		posts.forEach((post) => {
			matchScores.set(post.post_id, "—");
		});
		return matchScores;
	}

	try {
		for (const post of posts) {
			// Get post embedding from the appropriate table
			const [programPost, scholarshipPost, jobPost] = await Promise.all([
				prismaClient.programPost.findUnique({
					where: { post_id: post.post_id },
					select: { embedding: true },
				}),
				prismaClient.scholarshipPost.findUnique({
					where: { post_id: post.post_id },
					select: { embedding: true },
				}),
				prismaClient.jobPost.findUnique({
					where: { post_id: post.post_id },
					select: { embedding: true },
				}),
			]);

			const postEmbedding =
				(programPost?.embedding as number[] | null) ||
				(scholarshipPost?.embedding as number[] | null) ||
				(jobPost?.embedding as number[] | null);

			if (!postEmbedding) {
				matchScores.set(post.post_id, "0%");
				continue;
			}

			// Calculate similarity
			const similarity = SimilarityService.calculateCosineSimilarity(
				applicantEmbedding,
				postEmbedding
			);
			const matchPercentage =
				SimilarityService.similarityToMatchPercentage(similarity);
			matchScores.set(post.post_id, matchPercentage);
		}
	} catch (error) {
		// Fallback to 0% when calculation fails
		posts.forEach((post) => {
			matchScores.set(post.post_id, "0%");
		});
	}

	return matchScores;
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
		const institutionId = searchParams.get("institutionId");

		if (!institutionId) {
			return NextResponse.json(
				{ message: "Institution ID is required" },
				{ status: 400 }
			);
		}

		// Try to get authenticated user (optional for this endpoint)
		let applicantEmbedding: number[] | null = null;
		let applicantId: string | undefined = undefined;
		try {
			const { user } = await requireAuth();
			if (user?.id) {
				const applicant = await prismaClient.applicant.findUnique({
					where: { user_id: user.id },
					select: { applicant_id: true, embedding: true },
				});
				applicantEmbedding = applicant?.embedding as number[] | null;
				applicantId = applicant?.applicant_id;
			}
		} catch (authError) {
			// No authenticated user - continue without match scores
		}

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "20"))
		);
		const skip = (page - 1) * limit;

		// Parse filter parameters
		const type = searchParams.get("type") || "all"; // all, Program, Scholarship, Job

		// Build where clause
		const whereClause: any = {
			status: "PUBLISHED",
			institution_id: institutionId,
		};

		// Filter by post type
		if (type && type !== "all") {
			if (type === "Program") {
				whereClause.programPost = { isNot: null };
			} else if (type === "Scholarship") {
				whereClause.scholarshipPost = { isNot: null };
			} else if (type === "Job") {
				whereClause.jobPost = { isNot: null };
			}
		}

		// Get total count for pagination
		const totalCount = await prismaClient.opportunityPost.count({
			where: whereClause,
		});

		// Query posts with their specific post type data
		const posts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			orderBy: { create_at: "desc" },
			skip,
			take: limit,
			include: {
				institution: {
					select: {
						institution_id: true,
						name: true,
						abbreviation: true,
						logo: true,
						country: true,
					},
				},
				programPost: true,
				scholarshipPost: true,
				jobPost: true,
				applications: {
					select: {
						applicant_id: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: true,
					},
				},
			},
		});

		// Calculate match scores for all posts
		const matchScores = await calculateMatchScoresForPosts(
			posts,
			applicantEmbedding,
			applicantId
		);

		// Transform posts to the expected format
		const transformedPosts: PostWithDetails[] = posts.map((post) => {
			let postType: "Program" | "Scholarship" | "Research Lab" =
				"Program";
			let price = "0";
			let funding = "";
			let attendance = "";

			// Determine post type and extract specific data
			if (post.programPost) {
				postType = "Program";
				price = formatCurrency(post.programPost.tuition_fee);
				attendance = post.programPost.attendance || "";
			} else if (post.scholarshipPost) {
				postType = "Scholarship";
				price = post.scholarshipPost.grant || "Not specified";
				funding = post.scholarshipPost.award_amount
					? `$${formatCurrency(post.scholarshipPost.award_amount)}`
					: "Not specified";
			} else if (post.jobPost) {
				postType = "Research Lab";
				const minSalary = post.jobPost.min_salary;
				const maxSalary = post.jobPost.max_salary;
				if (minSalary || maxSalary) {
					if (minSalary && maxSalary) {
						price = `${formatCurrency(minSalary)} - ${formatCurrency(maxSalary)}`;
					} else if (minSalary) {
						price = `From ${formatCurrency(minSalary)}`;
					} else {
						price = `Up to ${formatCurrency(maxSalary)}`;
					}
				}
			}

			return {
				id: post.post_id,
				title: post.title,
				description: post.description || "",
				university: post.institution?.name || "",
				logo: post.institution?.logo || "",
				field:
					post.subdisciplines?.[0]?.subdiscipline?.name || "General",
				country: post.institution?.country || "",
				date: post.end_date?.toISOString() || new Date().toISOString(),
				daysLeft: post.end_date ? calculateDaysLeft(post.end_date) : 0,
				price: price,
				type: postType,
				match: matchScores.get(post.post_id) || "0%",
				funding: funding,
				attendance: attendance,
				applicationCount: post.applications?.length || 0,
				amount: postType === "Scholarship" ? price : undefined,
				provider: post.institution?.name || "",
				essayRequired:
					postType === "Scholarship"
						? post.scholarshipPost?.essay_required
							? "Yes"
							: "No"
						: "",
			};
		});

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		return NextResponse.json({
			success: true,
			data: transformedPosts,
			pagination: {
				currentPage: page,
				totalPages,
				totalItems: totalCount,
				itemsPerPage: limit,
				hasNextPage,
				hasPrevPage,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
