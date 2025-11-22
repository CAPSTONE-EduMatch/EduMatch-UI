import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { SimilarityService } from "@/services/similarity/similarity-service";

// Helper function to calculate match scores between applicants and posts
async function calculateApplicationMatchScores(
	applications: any[]
): Promise<Map<string, string>> {
	const matchScores = new Map<string, string>();

	try {
		// Group applications by post_id to optimize database queries
		const postApplications = new Map<string, string[]>();
		applications.forEach((app) => {
			const postId = app.post.post_id;
			if (!postApplications.has(postId)) {
				postApplications.set(postId, []);
			}
			postApplications.get(postId)!.push(app.applicant.applicant_id);
		});

		// For each post, get the post embedding and calculate similarity with all applicants
		for (const [postId, applicantIds] of Array.from(
			postApplications.entries()
		)) {
			// Get post embedding from the appropriate table
			const [programPost, scholarshipPost, jobPost] = await Promise.all([
				prismaClient.programPost.findUnique({
					where: { post_id: postId },
					select: { embedding: true },
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
				applicantIds.forEach((applicantId: string) => {
					matchScores.set(`${applicantId}-${postId}`, "0%");
				});
				continue;
			}

			// Get applicant embeddings
			const applicants = await prismaClient.applicant.findMany({
				where: { applicant_id: { in: applicantIds } },
				select: { applicant_id: true, embedding: true },
			});

			// Calculate similarities
			applicants.forEach((applicant) => {
				if (!applicant.embedding) {
					matchScores.set(
						`${applicant.applicant_id}-${postId}`,
						"0%"
					);
					return;
				}

				const similarity = SimilarityService.calculateCosineSimilarity(
					applicant.embedding as number[],
					postEmbedding
				);
				const matchPercentage =
					SimilarityService.similarityToMatchPercentage(similarity);
				matchScores.set(
					`${applicant.applicant_id}-${postId}`,
					matchPercentage
				);
			});
		}
	} catch (error) {
		console.error("Error calculating match scores:", error);
		// Fallback to 0% when calculation fails
		applications.forEach((app: any) => {
			matchScores.set(
				`${app.applicant.applicant_id}-${app.post.post_id}`,
				"0%"
			);
		});
	}

	return matchScores;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get user from session
		const { user } = await requireAuth();
		if (!user?.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "all";
		const sortBy = searchParams.get("sortBy") || "newest";
		const postId = searchParams.get("postId") || "";
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		);
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const whereClause: any = {
			post: {
				institution_id: institution.institution_id,
			},
		};

		// Add postId filter if provided (to filter applications for a specific post)
		if (postId && postId.trim()) {
			whereClause.post.post_id = postId;
		}

		// Add status filter - handle multiple statuses from comma-separated string
		if (status !== "all" && status.trim()) {
			const statusArray = status
				.split(",")
				.map((s) => s.trim().toUpperCase());
			if (statusArray.length === 1) {
				whereClause.status = statusArray[0];
			} else {
				whereClause.status = {
					in: statusArray,
				};
			}
		}

		// Query ALL applications first (without pagination) to apply filtering
		// This is necessary because search filter depends on transformed data
		const allApplications = await prismaClient.application.findMany({
			where: whereClause,
			include: {
				ApplicationProfileSnapshot: true, // Include the profile snapshot
				applicant: {
					include: {
						user: {
							select: {
								id: true, // Include user ID for thread matching
								name: true,
								email: true,
								image: true,
							},
						},
						subdiscipline: {
							select: {
								name: true,
							},
						},
					},
				},
				post: {
					select: {
						post_id: true,
						title: true,
						start_date: true,
						end_date: true,
						degree_level: true,
						scholarshipPost: {
							select: {
								type: true,
							},
						},
						jobPost: {
							select: {
								job_type: true,
							},
						},
					},
				},
			},
			orderBy:
				sortBy === "newest"
					? { apply_at: "desc" }
					: sortBy === "oldest"
						? { apply_at: "asc" }
						: { apply_at: "desc" },
		});

		// Helper function to format dates to dd/mm/yyyy
		const formatDate = (date: Date | null) => {
			if (!date) return "";
			const day = date.getDate().toString().padStart(2, "0");
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			const year = date.getFullYear();
			return `${day}/${month}/${year}`;
		};

		// Fetch all unique subdiscipline IDs from snapshots (academic info)
		const snapshotSubdisciplineIds = allApplications
			.map((app: any) => app.ApplicationProfileSnapshot?.subdiscipline_id)
			.filter((id: string | null | undefined) => id) as string[];

		// Batch fetch subdiscipline names for all snapshot subdiscipline IDs
		const snapshotSubdisciplinesMap = new Map<string, string>();
		if (snapshotSubdisciplineIds.length > 0) {
			const uniqueIds = Array.from(new Set(snapshotSubdisciplineIds));
			const subdisciplines = await prismaClient.subdiscipline.findMany({
				where: {
					subdiscipline_id: {
						in: uniqueIds,
					},
				},
				select: {
					subdiscipline_id: true,
					name: true,
				},
			});
			subdisciplines.forEach((sub) => {
				snapshotSubdisciplinesMap.set(sub.subdiscipline_id, sub.name);
			});
		}

		// Calculate match scores for all applications
		const matchScores =
			await calculateApplicationMatchScores(allApplications);

		// Transform data to match the expected format using snapshot data
		const transformedApplications = allApplications.map((app: any) => {
			// Use snapshot data if available, otherwise fallback to live data
			const snapshot = app.ApplicationProfileSnapshot;
			const matchScoreKey = `${app.applicant.applicant_id}-${app.post.post_id}`;
			const matchingScore = matchScores.get(matchScoreKey) || "0%";

			const transformed = {
				id: app.application_id,
				postId: app.post.post_id,
				// Use snapshot data for consistent profile information
				name:
					snapshot?.user_name || app.applicant.user.name || "Unknown",
				email: snapshot?.user_email || app.applicant.user.email,
				image: snapshot?.user_image || app.applicant.user.image,
				appliedDate: formatDate(app.apply_at),
				degreeLevel:
					app.post.degree_level ||
					app.post.scholarshipPost?.type ||
					app.post.jobPost?.job_type ||
					"Unknown",
				// Get subdiscipline from academic info (not interests)
				// Priority: 1. Applicant's current subdiscipline, 2. Snapshot's subdiscipline_id (academic), 3. Unknown
				subDiscipline:
					app.applicant.subdiscipline?.name ||
					(snapshot?.subdiscipline_id
						? snapshotSubdisciplinesMap.get(
								snapshot.subdiscipline_id
							) || "Unknown"
						: "Unknown"),
				status: app.status.toLowerCase(),
				matchingScore: parseInt(matchingScore.replace("%", "")), // Convert percentage string to number
				postTitle: app.post.title,
				applicantId: app.applicant.applicant_id,
				userId: app.applicant.user.id, // Include user ID for thread matching
				// Additional snapshot data for detailed view
				snapshotData: snapshot
					? {
							firstName: snapshot.first_name,
							lastName: snapshot.last_name,
							nationality: snapshot.nationality,
							phoneNumber: snapshot.phone_number,
							countryCode: snapshot.country_code,
							graduated: snapshot.graduated,
							gpa: snapshot.gpa,
							university: snapshot.university,
							countryOfStudy: snapshot.country_of_study,
							hasForeignLanguage: snapshot.has_foreign_language,
							languages: snapshot.languages,
							favoriteCountries: snapshot.favorite_countries,
							subdisciplineIds: snapshot.subdiscipline_ids,
						}
					: null,
			};
			return transformed;
		});

		// Apply search filter (client-side because it depends on transformed data)
		let filteredApplications = transformedApplications;
		if (search) {
			filteredApplications = transformedApplications.filter(
				(app) =>
					app.name.toLowerCase().includes(search.toLowerCase()) ||
					app.subDiscipline
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					app.degreeLevel
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					app.postTitle
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					app.postId.toLowerCase().includes(search.toLowerCase())
			);
		}

		// Get total count AFTER filtering
		const totalFilteredCount = filteredApplications.length;

		// Apply pagination AFTER filtering
		const startIndex = skip;
		const endIndex = startIndex + limit;
		const paginatedApplications = filteredApplications.slice(
			startIndex,
			endIndex
		);

		// Calculate statistics based on all transformed applications (before search filter)
		const stats = {
			total: allApplications.length,
			approved: transformedApplications.filter(
				(app) => app.status === "accepted"
			).length,
			rejected: transformedApplications.filter(
				(app) => app.status === "rejected"
			).length,
			pending: transformedApplications.filter(
				(app) => app.status === "submitted"
			).length,
		};

		// Calculate total pages based on filtered count
		const totalPages = Math.ceil(totalFilteredCount / limit);

		return NextResponse.json({
			success: true,
			data: paginatedApplications,
			meta: {
				total: totalFilteredCount,
				page,
				limit,
				totalPages,
			},
			stats,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching applications:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch applications",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
