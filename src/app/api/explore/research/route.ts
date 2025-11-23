import { SimilarityService } from "@/services/similarity/similarity-service";
import { ExploreApiResponse, PaginationMeta } from "@/types/api/explore-api";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Define ResearchLab type locally since it's not exported
interface ResearchLab {
	id: string;
	title: string;
	description: string;
	professor: string;
	institution: string;
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

// Helper function to calculate match percentage based on similarity
async function calculateMatchPercentages(
	researchLabs: ResearchLab[],
	userId?: string
): Promise<void> {
	if (!userId) {
		// No authenticated user, show 0%
		researchLabs.forEach((lab) => {
			lab.match = "0%";
		});
		return;
	}

	try {
		// Get applicant embedding
		const applicant = await prismaClient.applicant.findFirst({
			where: { user_id: userId },
			select: { applicant_id: true, embedding: true },
		});

		if (!applicant?.embedding) {
			// No applicant embedding, show 0%
			researchLabs.forEach((lab) => {
				lab.match = "0%";
			});
			return;
		}

		// PLAN-BASED AUTHORIZATION: Check if user can see matching scores
		const { canSeeMatchingScore } = await import(
			"@/services/authorization"
		);
		const matchingPermission = await canSeeMatchingScore(
			applicant.applicant_id
		);

		if (!matchingPermission.authorized) {
			// User cannot see matching scores, show placeholder
			researchLabs.forEach((lab) => {
				lab.match = "—"; // Premium feature indicator
			});
			return;
		}

		// Get embeddings for all job posts (research positions)
		const postIds = researchLabs.map((lab) => lab.id);
		const jobPosts = await prismaClient.jobPost.findMany({
			where: { post_id: { in: postIds } },
			select: { post_id: true, embedding: true },
		});

		// Calculate similarity scores
		const applicantEmbedding = applicant.embedding as number[];
		const matchScores = SimilarityService.calculateMatchScores(
			applicantEmbedding,
			jobPosts.map((p) => ({
				id: p.post_id,
				embedding: p.embedding as number[] | null,
			}))
		);

		// Update research lab objects with calculated match scores
		researchLabs.forEach((lab) => {
			lab.match = matchScores[lab.id] || "0%";
		});
	} catch (error) {
		console.error("Error calculating match scores:", error);
		// Fallback to 0% on error
		researchLabs.forEach((lab) => {
			lab.match = "0%";
		});
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const researchField =
			searchParams.get("researchField")?.split(",") || [];
		const country = searchParams.get("country")?.split(",") || [];
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];
		const jobType = searchParams.get("jobType")?.split(",") || [];
		const contractType = searchParams.get("contractType")?.split(",") || [];
		// Note: salary filters not implemented for research positions
		// const minSalary = searchParams.get("minSalary")
		// 	? parseInt(searchParams.get("minSalary")!)
		// 	: undefined;
		// const maxSalary = searchParams.get("maxSalary")
		// 	? parseInt(searchParams.get("maxSalary")!)
		// 	: undefined;
		const sortBy = searchParams.get("sortBy") || "most-popular";

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		); // Max 50 per page
		const skip = (page - 1) * limit;

		// Build base where clause for filtering - only posts with JobPost records (research positions)
		const baseWhereClause: any = {
			status: {
				in: ["PUBLISHED"], // Only show published posts, explicitly exclude DELETED
			},
			post_id: {
				in: await prismaClient.jobPost
					.findMany({ select: { post_id: true } })
					.then((jobs: any) => jobs.map((j: any) => j.post_id)),
			},
		};

		// Add search filter
		if (search) {
			baseWhereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				// { other_info: { contains: search, mode: "insensitive" } },
			];
		}

		// Build additional filter conditions
		const filterConditions: any[] = [];

		// Apply country filter
		if (country.length > 0) {
			filterConditions.push({
				OR: [
					{
						institution: {
							country: { in: country },
						},
					},
					{
						location: { in: country },
					},
				],
			});
		}

		// Apply degree level filter
		if (degreeLevel.length > 0) {
			filterConditions.push({
				degree_level: {
					in: degreeLevel,
				},
			});
		}

		// Apply subdiscipline (research field) filter
		if (researchField.length > 0) {
			filterConditions.push({
				subdisciplines: {
					some: {
						subdiscipline: {
							name: {
								in: researchField,
							},
						},
					},
				},
			});
		}

		// Apply job type filter
		if (jobType.length > 0) {
			filterConditions.push({
				jobPost: {
					job_type: {
						in: jobType,
					},
				},
			});
		}

		// Combine base where clause with filter conditions
		const whereClause = {
			...baseWhereClause,
			...(filterConditions.length > 0 && { AND: filterConditions }),
		};

		// Query posts with JobPost data (for research positions)
		const posts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			include: {
				institution: {
					select: {
						institution_id: true,
						name: true,
						country: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: {
							select: {
								subdiscipline_id: true,
								name: true,
							},
						},
					},
				},
				jobPost: {
					select: {
						job_type: true,
						post_id: true,
					},
				},
			},
			orderBy:
				sortBy === "newest"
					? { create_at: "desc" }
					: sortBy === "oldest"
						? { create_at: "asc" }
						: { create_at: "desc" }, // default to newest
		});

		// Get application counts for each post (for popularity sorting)
		const postIds = posts.map((post: any) => post.post_id);
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["post_id"],
			where: {
				post_id: { in: postIds },
			},
			_count: {
				application_id: true,
			},
		});

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac: any) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Transform data to ResearchLab format
		let labs: ResearchLab[] = posts
			.map((post: any) => {
				const postJob = post.jobPost; // Use included jobPost data
				if (!postJob) return null;

				const applicationCount =
					applicationCountMap.get(post.post_id) || 0;

				// Use end_date as deadline, fallback to start_date + 90 days if not available
				const deadlineDate = post.end_date
					? post.end_date
					: new Date(
							post.start_date.getTime() + 90 * 24 * 60 * 60 * 1000
						);

				// Get subdiscipline names for the field property
				const subdisciplineNames =
					post.subdisciplines
						?.map((sd: any) => sd.subdiscipline?.name)
						.filter((name: string) => name) || [];

				const lab: ResearchLab = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.description || "No description available",
					professor: "Prof. Researcher", // Default value since not in JobPost
					institution:
						post.institution?.name || "Research Institution",
					field:
						subdisciplineNames.length > 0
							? subdisciplineNames.join(", ")
							: "Research", // Use subdiscipline names instead of old field
					country:
						post.institution?.country || post.location || "Unknown",
					position: (postJob as any)?.job_type || "Research Position",
					date: deadlineDate.toISOString().split("T")[0], // Use deadline date instead of create_at
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()), // This will be recalculated on frontend
					match: "0%", // Will be calculated later based on similarity
					applicationCount: applicationCount || 0, // Add application count for popularity sorting
				};

				return lab;
			})
			.filter((lab: any): lab is ResearchLab => lab !== null);

		// Apply additional client-side filters that couldn't be done in DB query
		if (contractType.length > 0) {
			labs = labs.filter((lab) =>
				contractType.some((type) =>
					lab.description.toLowerCase().includes(type.toLowerCase())
				)
			);
		}

		// Calculate match scores based on similarity (for all filtered results)
		let userId: string | undefined;
		try {
			const { user } = await requireAuth();
			userId = user.id;
		} catch (error) {
			// User not authenticated, will use default scores
		}
		await calculateMatchPercentages(labs, userId);

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

		// Get total count of filtered results (before pagination)
		const totalFilteredCount = await prismaClient.opportunityPost.count({
			where: whereClause,
		});

		// Apply pagination to the sorted results
		const paginatedLabs = labs.slice(skip, skip + limit);

		const meta: PaginationMeta = {
			total: totalFilteredCount,
			page,
			limit,
			totalPages: Math.ceil(totalFilteredCount / limit),
		};

		// Extract available filter options from all research labs (before pagination)
		// Note: labs here contains all filtered results before pagination
		const availableCountries = Array.from(
			new Set(labs.map((lab) => lab.country).filter(Boolean))
		).sort();

		const availableResearchFields = Array.from(
			new Set(labs.map((lab) => lab.field).filter(Boolean))
		).sort();

		// Extract unique disciplines from subdiscipline field data for discipline filter
		const availableDisciplines = Array.from(
			new Set(
				labs
					.flatMap((lab) => {
						if (!lab.field || typeof lab.field !== "string")
							return [];
						return lab.field
							.split(",")
							.map((subdiscipline) => {
								// Extract discipline name from "Discipline - Specialization" format
								const disciplineName = subdiscipline
									.trim()
									.split(" - ")[0];
								return disciplineName.trim();
							})
							.filter((name) => name && name.length > 0);
					})
					.filter(Boolean)
			)
		).sort();

		const availableJobTypes = Array.from(
			new Set(labs.map((lab) => lab.position).filter(Boolean))
		).sort();

		// Get available degree levels from OpportunityPost.degree_level field
		const availableDegreeLevels = Array.from(
			new Set(posts.map((post: any) => post.degree_level).filter(Boolean))
		).sort();

		const availableContractTypes = Array.from(
			new Set(
				labs
					.map((lab) => {
						const desc = lab.description.toLowerCase();
						if (
							desc.includes("full-time") ||
							desc.includes("fulltime")
						)
							return "Full-time";
						if (
							desc.includes("part-time") ||
							desc.includes("parttime")
						)
							return "Part-time";
						if (desc.includes("contract")) return "Contract";
						return "Full-time"; // default
					})
					.filter(Boolean)
			)
		).sort();

		const response: ExploreApiResponse<ResearchLab> = {
			data: paginatedLabs, // Use paginated labs instead of all labs
			meta,
			availableFilters: {
				countries: availableCountries,
				disciplines: availableDisciplines, // Add available disciplines for filter
				researchFields: availableResearchFields,
				jobTypes: availableJobTypes,
				degreeLevels: availableDegreeLevels,
				contractTypes: availableContractTypes,
				attendanceTypes: ["On-site", "Remote", "Hybrid"], // Default values for research
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
