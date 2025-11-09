import { ExploreApiResponse, PaginationMeta } from "@/types/api/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Program interface with single string ID
interface Program {
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
	match: string;
	funding: string;
	attendance: string;
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
		const attendance = searchParams.get("attendance")?.split(",") || [];
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];
		const duration = searchParams.get("duration")?.split(",") || [];
		const minFee = searchParams.get("minFee")
			? parseInt(searchParams.get("minFee")!)
			: undefined;
		const maxFee = searchParams.get("maxFee")
			? parseInt(searchParams.get("maxFee")!)
			: undefined;
		const sortBy = searchParams.get("sortBy") || "most-popular";

		// Parse pagination parameters
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		); // Max 50 per page

		// Build where clause for filtering
		const whereClause: any = {
			status: "PUBLISHED", // Only show published posts
			programPost: {
				isNot: null, // Only get posts that have associated program data
			},
		};

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				// { other_info: { contains: search, mode: "insensitive" } },
			];
		}

		// Query ALL posts first (without pagination) to apply filtering
		const allPosts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			include: {
				programPost: true,
				institution: true, // Include institution data directly
			},
			orderBy:
				sortBy === "newest"
					? { create_at: "desc" }
					: sortBy === "oldest"
						? { create_at: "asc" }
						: { create_at: "desc" }, // default to newest
		});
		// Debug: Check how many posts were found
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Debug info:", {
				totalPosts: allPosts.length,
				postsWithProgram: allPosts.filter((p) => p.programPost).length,
				postsWithInstitution: allPosts.filter((p) => p.institution)
					.length,
				whereClause: JSON.stringify(whereClause),
			});
		}

		// Get application counts for each post (for popularity sorting)
		const allPostIds = allPosts.map((post) => post.post_id);
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["post_id"],
			where: {
				post_id: { in: allPostIds },
			},
			_count: {
				application_id: true,
			},
		});

		// Get subdisciplines for all posts
		const allPostSubdisciplines =
			await prismaClient.postSubdiscipline.findMany({
				where: {
					post_id: { in: allPostIds },
				},
				include: {
					subdiscipline: {
						include: {
							discipline: true,
						},
					},
				},
			});

		// Create a map of post_id to subdisciplines
		const postSubdisciplineMap = new Map();
		allPostSubdisciplines.forEach((ps) => {
			if (!postSubdisciplineMap.has(ps.post_id)) {
				postSubdisciplineMap.set(ps.post_id, []);
			}
			postSubdisciplineMap.get(ps.post_id).push({
				name: ps.subdiscipline.name,
				disciplineName: ps.subdiscipline.discipline.name,
			});
		});

		// Get disciplines and subdisciplines from database
		const disciplines = await prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				subdisciplines: {
					where: { status: true },
				},
			},
		});

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Create subdiscipline map for discipline lookup
		const subdisciplineMap = new Map();
		const disciplineMap = new Map();
		disciplines.forEach((discipline) => {
			disciplineMap.set(discipline.discipline_id, discipline.name);
			discipline.subdisciplines.forEach((sub) => {
				subdisciplineMap.set(sub.subdiscipline_id, {
					name: sub.name,
					disciplineName: discipline.name,
				});
			});
		});

		// Transform ALL data to Program format first
		let allPrograms: Program[] = allPosts
			.map((post) => {
				// Post already includes programPost and institution from the query
				const postProgram = post.programPost;
				const institution = post.institution;

				if (!postProgram || !institution) {
					return null;
				}

				const applicationCount =
					applicationCountMap.get(post.post_id) || 0;

				// Get field name from post subdisciplines or fallback to degree level
				let fieldName = "General Studies";

				// Try to get field name from post subdisciplines first
				const postSubdisciplines =
					postSubdisciplineMap.get(post.post_id) || [];

				if (postSubdisciplines.length > 0) {
					const firstSub = postSubdisciplines[0];
					fieldName = `${firstSub.disciplineName} - ${firstSub.name}`;
				} else {
					// Fallback to using degree level as field name
					fieldName = post.degree_level || "General Studies";
				}

				// Use end_date as deadline, fallback to start_date + 90 days if not available
				const deadlineDate = post.end_date
					? post.end_date
					: new Date(
							post.start_date.getTime() + 90 * 24 * 60 * 60 * 1000
						);

				const program: Program = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.description || "No description available",
					university: institution.name,
					logo: institution.logo || "/logos/default.png",
					field: fieldName, // Use the mapped discipline/subdiscipline name
					country: institution.country || "Unknown",
					date: deadlineDate.toISOString().split("T")[0], // Use deadline date instead of create_at
					daysLeft: calculateDaysLeft(deadlineDate.toISOString()), // This will be recalculated on frontend
					price: postProgram.tuition_fee
						? `$${formatCurrency(postProgram.tuition_fee)}`
						: "Contact for pricing",
					match: calculateMatchPercentage(),
					funding:
						postProgram.scholarship_info || "Contact for details",
					attendance: postProgram.attendance || "On-campus",
					applicationCount: applicationCount, // Add application count for popularity sorting
				};

				return program;
			})
			.filter((program): program is Program => program !== null);

		// Apply ALL client-side filters
		if (discipline.length > 0) {
			allPrograms = allPrograms.filter((program) =>
				discipline.some((d) =>
					program.field.toLowerCase().includes(d.toLowerCase())
				)
			);
		}

		if (country.length > 0) {
			allPrograms = allPrograms.filter((program) =>
				country.includes(program.country)
			);
		}

		if (attendance.length > 0) {
			allPrograms = allPrograms.filter((program) =>
				attendance.includes(program.attendance)
			);
		}

		if (degreeLevel.length > 0) {
			allPrograms = allPrograms.filter((program) => {
				// Find the original post to get the degree_level
				const originalPost = allPosts.find(
					(p) => p.post_id === program.id
				);
				const postDegreeLevel = originalPost?.degree_level || "";

				return degreeLevel.some((level) =>
					postDegreeLevel.toLowerCase().includes(level.toLowerCase())
				);
			});
		}

		// Apply duration filtering
		if (duration.length > 0) {
			allPrograms = allPrograms.filter((program) => {
				// Find the original post to get the duration from programPost
				const originalPost = allPosts.find(
					(p) => p.post_id === program.id
				);
				const programDuration =
					originalPost?.programPost?.duration || "";

				return duration.some((dur) =>
					programDuration.toLowerCase().includes(dur.toLowerCase())
				);
			});
		}

		// Apply fee range filtering
		if (minFee !== undefined || maxFee !== undefined) {
			allPrograms = allPrograms.filter((program) => {
				const priceStr = program.price.replace(/[^0-9.]/g, "");
				const price = parseFloat(priceStr) || 0;

				if (minFee !== undefined && price < minFee) {
					return false;
				}
				if (maxFee !== undefined && price > maxFee) {
					return false;
				}
				return true;
			});
		}

		// Sort programs
		switch (sortBy) {
			case "most-popular":
				allPrograms.sort(
					(a, b) =>
						(b.applicationCount || 0) - (a.applicationCount || 0)
				);
				break;
			case "match-score":
				allPrograms.sort(
					(a, b) => parseFloat(b.match) - parseFloat(a.match)
				);
				break;
			case "deadline":
				allPrograms.sort((a, b) => a.daysLeft - b.daysLeft);
				break;
			case "price-low":
				allPrograms.sort((a, b) => {
					const priceA =
						parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
					const priceB =
						parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
					return priceA - priceB;
				});
				break;
			case "price-high":
				allPrograms.sort((a, b) => {
					const priceA =
						parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
					const priceB =
						parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
					return priceB - priceA;
				});
				break;
			// newest and oldest are handled by DB orderBy above
		}

		// Get total count AFTER filtering
		const totalCount = allPrograms.length;

		// Apply pagination AFTER filtering and sorting
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const programs = allPrograms.slice(startIndex, endIndex);

		const totalPages = Math.ceil(totalCount / limit);

		const meta: PaginationMeta = {
			total: totalCount,
			page,
			limit,
			totalPages,
		};

		// Extract available filter options from all programs (before pagination)
		const availableCountries = Array.from(
			new Set(
				allPrograms.map((program) => program.country).filter(Boolean)
			)
		).sort();

		// Use ALL disciplines from database, not just from current programs
		const availableDisciplines = disciplines.map((d) => d.name).sort();

		// Get available degree levels from OpportunityPost.degree_level field
		const availableDegreeLevels = Array.from(
			new Set(allPosts.map((post) => post.degree_level).filter(Boolean))
		).sort();

		const availableAttendanceTypes = Array.from(
			new Set(
				allPrograms.map((program) => program.attendance).filter(Boolean)
			)
		).sort();

		const response: ExploreApiResponse<Program> = {
			data: programs,
			meta,
			availableFilters: {
				countries: availableCountries,
				disciplines: availableDisciplines,
				degreeLevels: availableDegreeLevels,
				attendanceTypes: availableAttendanceTypes,
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
		// Log error for debugging (will appear in server logs)
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching programs:", error);
		}
		return NextResponse.json(
			{
				error: "Internal server error",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
