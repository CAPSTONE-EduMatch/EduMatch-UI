import { SimilarityService } from "@/services/similarity/similarity-service";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";

// Helper function to calculate days left from a date string
function calculateDaysLeft(dateString: Date): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

// Helper function to calculate real match percentage based on similarity
async function calculateMatchPercentage(
	postId: string,
	userId?: string
): Promise<string> {
	if (!userId) {
		// No authenticated user, return 0%
		return "0%";
	}

	try {
		// Get applicant embedding
		const applicant = await prismaClient.applicant.findFirst({
			where: { user_id: userId },
			select: { embedding: true },
		});

		if (!applicant?.embedding) {
			// No applicant embedding, return 0%
			return "0%";
		}

		// Get scholarship post embedding
		const scholarshipPost = await prismaClient.scholarshipPost.findUnique({
			where: { post_id: postId },
			select: { embedding: true },
		});

		if (!scholarshipPost?.embedding) {
			// No post embedding, return 0%
			return "0%";
		}

		// Calculate similarity
		const similarity = SimilarityService.calculateCosineSimilarity(
			applicant.embedding as number[],
			scholarshipPost.embedding as number[]
		);

		return SimilarityService.similarityToMatchPercentage(similarity);
	} catch (error) {
		// Log error for debugging but don't throw
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error calculating match percentage:", error);
		}
		return "0%";
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
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ message: "Scholarship ID is required" },
				{ status: 400 }
			);
		}

		// Get user from session (if authenticated)
		let userId: string | undefined;
		try {
			const { user } = await requireAuth();
			userId = user.id;
		} catch (error) {
			// User not authenticated, will use default scores
		}

		// Query the opportunity post with scholarship data
		// Note: Not filtering by status to allow institutions to view their own scholarships regardless of status
		const post = await prismaClient.opportunityPost.findUnique({
			where: {
				post_id: id,
			},
			include: {
				institution: {
					select: {
						institution_id: true,
						user_id: true,
						name: true,
						abbreviation: true,
						logo: true,
						country: true,
						website: true,
						about: true,
						type: true,
						verification_status: true,
						deleted_at: true,
					},
				},
				scholarshipPost: true,
				applications: {
					select: {
						application_id: true,
					},
				},
				postDocs: {
					include: {
						documentType: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: true,
					},
				},
			},
		});

		if (!post || !post.scholarshipPost) {
			return NextResponse.json(
				{ message: "Scholarship not found" },
				{ status: 404 }
			);
		}

		// Format scholarship data
		const scholarshipData = post.scholarshipPost;
		const daysLeft = post.end_date ? calculateDaysLeft(post.end_date) : 0;
		const match = await calculateMatchPercentage(id, userId);

		const scholarship = {
			id: post.post_id,
			title: post.title,
			description: post?.description || "No description available",
			provider: post.institution?.name || "",
			university: post.institution?.name || "",
			essayRequired: scholarshipData?.essay_required ? "Yes" : "No",
			country: post.institution?.country || "",
			date: post.end_date
				? new Date(post.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",
			daysLeft,
			amount: scholarshipData?.grant
				? `$${formatCurrency(scholarshipData.grant)}`
				: "N/A",
			awardAmount: scholarshipData?.award_amount
				? `$${formatCurrency(scholarshipData.award_amount)}`
				: "",
			match,
			type: scholarshipData?.type || "",
			applicationCount: post.applications.length,
			number: scholarshipData?.number || 0,
			scholarshipCoverage: scholarshipData?.scholarship_coverage || "",
			eligibility: scholarshipData?.eligibility || "",
			awardDuration: scholarshipData?.award_duration || "",
			renewable: scholarshipData?.renewable ? "Yes" : "No",
			location: post.location || "",
			startDate: post.start_date
				? new Date(post.start_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",
			applicationDeadline: post.end_date
				? new Date(post.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",
			// tuitionFee: "N/A", // Not in schema, set default
			// duration: "N/A", // Not in schema, set default
			institution: {
				id: post.institution?.institution_id,
				userId: post.institution?.user_id,
				name: post.institution?.name,
				abbreviation: post.institution?.abbreviation,
				logo: post.institution?.logo,
				country: post.institution?.country,
				website: post.institution?.website,
				about: post.institution?.about,
				type: post.institution?.type,
				status: post.institution?.verification_status,
				deletedAt: post.institution?.deleted_at?.toISOString() || null,
			},
			requiredDocuments: post.postDocs.map((doc) => ({
				id: doc.document_id,
				name: doc.name || "",
				description: doc.description || "",
			})),
			subdisciplines: post.subdisciplines.map((sd) => ({
				id: sd.subdiscipline?.subdiscipline_id,
				name: sd.subdiscipline?.name || "",
			})),
			status: post.status || "DRAFT",
		};

		return NextResponse.json(
			{
				success: true,
				data: scholarship,
			},
			{ status: 200 }
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching scholarship detail:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
