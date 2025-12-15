import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";
import { SimilarityService } from "@/services/similarity/similarity-service";

// GET /api/applications/institution/suggested - Get suggested applicants for a post
// Returns applicants with match score >= 80% who haven't applied to the post
export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const { user } = await requireAuth();

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get("postId");
		const minMatchScore = parseInt(
			searchParams.get("minMatchScore") || "80"
		);

		if (!postId) {
			return NextResponse.json(
				{ error: "postId is required" },
				{ status: 400 }
			);
		}

		// Get post embedding from the appropriate table
		const [programPost, scholarshipPost, jobPost] = await Promise.all([
			prismaClient.programPost.findUnique({
				where: { post_id: postId },
				select: {
					embedding: true,
					post: { select: { degree_level: true } },
				},
			}),
			prismaClient.scholarshipPost.findUnique({
				where: { post_id: postId },
				select: { embedding: true },
			}),
			prismaClient.jobPost.findUnique({
				where: { post_id: postId },
				select: { embedding: true },
			}),
		]);

		const postEmbedding =
			(programPost?.embedding as number[] | null) ||
			(scholarshipPost?.embedding as number[] | null) ||
			(jobPost?.embedding as number[] | null);

		if (!postEmbedding) {
			// No post embedding available, cannot calculate similarity
			return NextResponse.json({
				success: true,
				data: [],
			});
		}

		// Get all applicants who have embeddings (for match score calculation)
		const allApplicantsRaw = await prismaClient.applicant.findMany({
			where: {
				status: true, // Only active applicants
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				subdiscipline: {
					select: {
						name: true,
					},
				},
			},
		});

		// Filter in JavaScript: only include applicants with embeddings and not deleted
		const allApplicants = allApplicantsRaw.filter(
			(applicant) =>
				applicant.embedding !== null && applicant.deleted_at === null
		);

		// Get list of applicant IDs who have already applied to this post
		const existingApplications = await prismaClient.application.findMany({
			where: {
				post_id: postId,
			},
			select: {
				applicant_id: true,
			},
		});

		const appliedApplicantIds = new Set(
			existingApplications.map((app) => app.applicant_id)
		);

		// Calculate match scores and filter applicants
		const suggestedApplicants = [];

		for (const applicant of allApplicants) {
			// Skip applicants who have already applied
			if (appliedApplicantIds.has(applicant.applicant_id)) {
				continue;
			}

			// Calculate match score
			const similarity = SimilarityService.calculateCosineSimilarity(
				applicant.embedding as number[],
				postEmbedding
			);
			const matchPercentage =
				SimilarityService.similarityToMatchPercentage(similarity);
			const matchScore = parseInt(matchPercentage.replace("%", ""));

			// Only include applicants with match score >= minMatchScore
			if (matchScore >= minMatchScore) {
				suggestedApplicants.push({
					applicantId: applicant.applicant_id,
					userId: applicant.user.id,
					name:
						applicant.user.name ||
						`${applicant.first_name || ""} ${applicant.last_name || ""}`.trim() ||
						"Unknown",
					email: applicant.user.email,
					degreeLevel: applicant.level || "N/A",
					subDiscipline: applicant.subdiscipline?.name || "N/A",
					gpa: applicant.gpa ? Number(applicant.gpa) : null,
					matchingScore: matchScore,
				});
			}
		}

		// Sort by match score (descending)
		suggestedApplicants.sort((a, b) => b.matchingScore - a.matchingScore);

		// Limit to top 20 suggestions
		const limitedSuggestions = suggestedApplicants.slice(0, 20);

		return NextResponse.json({
			success: true,
			data: limitedSuggestions,
		});
	} catch (error) {
		console.error("Error fetching suggested applicants:", error);
		return NextResponse.json(
			{ error: "Failed to fetch suggested applicants" },
			{ status: 500 }
		);
	}
}
