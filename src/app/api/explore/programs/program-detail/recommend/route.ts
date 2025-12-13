import { SimilarityService } from "@/services/similarity/similarity-service";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../../prisma";

// Helper function to calculate days left from a date string
function calculateDaysLeft(dateString: string): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
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

// Helper function to calculate match percentages for recommended programs
async function calculateMatchPercentages(
	programs: any[],
	userId?: string
): Promise<void> {
	if (!userId) {
		// No authenticated user, show 0%
		programs.forEach((program) => {
			program.match = "0%";
		});
		return;
	}

	try {
		// Get applicant embedding
		const applicant = await prismaClient.applicant.findFirst({
			where: { user_id: userId },
			select: { embedding: true },
		});

		if (!applicant?.embedding) {
			// No applicant embedding, show 0%
			programs.forEach((program) => {
				program.match = "0%";
			});
			return;
		}

		// Get embeddings for all program posts
		const postIds = programs.map((p) => p.id);
		const programPosts = await prismaClient.programPost.findMany({
			where: { post_id: { in: postIds } },
			select: { post_id: true, embedding: true },
		});

		// Calculate similarity scores
		const applicantEmbedding = applicant.embedding as number[];
		const matchScores = SimilarityService.calculateMatchScores(
			applicantEmbedding,
			programPosts.map((p) => ({
				id: p.post_id,
				embedding: p.embedding as number[] | null,
			}))
		);

		// Update program objects with calculated match scores
		programs.forEach((program) => {
			program.match = matchScores[program.id] || "0%";
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error calculating match scores:", error);
		}
		// Fallback to 0% on error
		programs.forEach((program) => {
			program.match = "0%";
		});
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const programId = searchParams.get("programId");

		if (!programId) {
			return NextResponse.json(
				{ error: "Program ID is required" },
				{ status: 400 }
			);
		}

		// Get user from session (if authenticated)
		let userId: string | undefined;
		let canViewRecommendations = false;
		try {
			const { user } = await requireAuth();
			userId = user.id;

			// PLAN-BASED AUTHORIZATION: Check if user can see recommendations
			const applicant = await prismaClient.applicant.findFirst({
				where: { user_id: user.id },
				select: { applicant_id: true },
			});

			if (applicant) {
				const { canSeeRecommendations } = await import(
					"@/services/authorization/authorization-service"
				);
				const recommendationPermission = await canSeeRecommendations(
					applicant.applicant_id
				);
				canViewRecommendations = recommendationPermission.authorized;
			}
		} catch (error) {
			// User not authenticated, will use default scores
		}

		// If user cannot see recommendations (Free plan or not authenticated), return restricted response
		if (!canViewRecommendations) {
			return NextResponse.json({
				success: true,
				data: [],
				restricted: true,
				message:
					"Upgrade to Standard or Premium to see personalized recommendations.",
			});
		}
		console.log(
			"Can view recommendations:  ifnoa   jneafi",
			canViewRecommendations
		);
		// Get the current program details to find its discipline and degree level
		const currentProgram = await prismaClient.opportunityPost.findUnique({
			where: { post_id: programId },
			include: {
				programPost: true,
				subdisciplines: {
					include: {
						subdiscipline: {
							include: {
								discipline: true,
							},
						},
					},
				},
			},
		});

		if (!currentProgram) {
			return NextResponse.json(
				{ error: "Program not found" },
				{ status: 404 }
			);
		}

		// Extract discipline IDs and degree level from current program
		const disciplineIds = currentProgram.subdisciplines.map(
			(ps) => ps.subdiscipline.discipline.discipline_id
		);
		const degreeLevel = currentProgram.degree_level;

		// Find recommended programs that share BOTH discipline AND degree level
		// Exclude the current program and only get published posts
		const recommendedPosts = await prismaClient.opportunityPost.findMany({
			where: {
				AND: [
					{ post_id: { not: programId } }, // Exclude current program
					{ status: "PUBLISHED" }, // Only published programs
					{ programPost: { isNot: null } }, // Only program posts
					// Same discipline (required)
					{
						subdisciplines: {
							some: {
								subdiscipline: {
									discipline: {
										discipline_id: {
											in: disciplineIds,
										},
									},
								},
							},
						},
					},
					// Same degree level (required)
					{
						degree_level: degreeLevel,
					},
				],
			},
			include: {
				programPost: true,
				institution: {
					select: {
						institution_id: true,
						name: true,
						country: true,
						logo: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: {
							include: {
								discipline: true,
							},
						},
					},
				},
				applications: {
					select: {
						application_id: true,
					},
				},
			},
			orderBy: { create_at: "desc" },
			take: 12, // Get a few more than needed for better filtering
		});

		// Transform to program format
		let programs = recommendedPosts
			.map((post) => {
				const postProgram = post.programPost;
				const institution = post.institution;

				if (!postProgram || !institution) {
					return null;
				}

				const applicationCount = post.applications.length;

				// Get field name from post subdisciplines
				let fieldName = "General Studies";
				const postSubdisciplines = post.subdisciplines;

				if (postSubdisciplines.length > 0) {
					const firstSub = postSubdisciplines[0];
					fieldName = `${firstSub.subdiscipline.discipline.name} - ${firstSub.subdiscipline.name}`;
				} else {
					fieldName = post.degree_level || "General Studies";
				}

				// Use end_date as deadline, fallback to start_date + 90 days
				const deadlineDate = post.end_date
					? post.end_date
					: new Date(
							post.start_date.getTime() + 90 * 24 * 60 * 60 * 1000
						);

				return {
					id: post.post_id,
					title: post.title,
					description: post.description || "No description available",
					university: institution.name,
					logo: institution.logo || null,
					field: fieldName,
					country: institution.country || "Unknown",
					date: deadlineDate.toISOString().split("T")[0],
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()),
					price: postProgram.tuition_fee
						? `$${formatCurrency(postProgram.tuition_fee)}`
						: "Contact for pricing",
					match: "0%", // Will be calculated later
					funding:
						postProgram.scholarship_info || "Contact for details",
					attendance: postProgram.attendance || "On-campus",
					applicationCount: applicationCount,
				};
			})
			.filter(
				(program): program is NonNullable<typeof program> =>
					program !== null
			);

		// Calculate match scores
		await calculateMatchPercentages(programs, userId);

		// Sort by match score (descending) then by application count (popularity)
		programs.sort((a, b) => {
			const matchA = parseFloat(a.match.replace("%", ""));
			const matchB = parseFloat(b.match.replace("%", ""));

			// Primary sort: match score
			if (matchA !== matchB) {
				return matchB - matchA;
			}

			// Secondary sort: popularity (application count)
			return b.applicationCount - a.applicationCount;
		});

		// Take only the top 9 programs
		const topPrograms = programs.slice(0, 9);

		return NextResponse.json({
			success: true,
			data: topPrograms,
			meta: {
				total: topPrograms.length,
				currentProgramDisciplines: disciplineIds,
				currentProgramDegreeLevel: degreeLevel,
			},
		});
	} catch (error) {
		console.error("Error fetching recommended programs:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch recommended programs",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
