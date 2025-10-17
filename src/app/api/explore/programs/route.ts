import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
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

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const discipline = searchParams.get("discipline")?.split(",") || [];
		const country = searchParams.get("country")?.split(",") || [];
		const attendance = searchParams.get("attendance")?.split(",") || [];
		const degreeLevel = searchParams.get("degreeLevel")?.split(",") || [];
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
		};

		// Add search filter
		if (search) {
			whereClause.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				{ other_info: { contains: search, mode: "insensitive" } },
			];
		}

		// Query ALL posts first (without pagination) to apply filtering
		const allPosts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			orderBy:
				sortBy === "newest"
					? { create_at: "desc" }
					: sortBy === "oldest"
						? { create_at: "asc" }
						: { create_at: "desc" }, // default to newest
		});

		// Get ProgramPost data for all posts
		const allPostIds = allPosts.map((post) => post.post_id);
		const postPrograms = await prismaClient.programPost.findMany({
			where: {
				post_id: { in: allPostIds },
			},
		});

		// Get application counts for each post (for popularity sorting)
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["post_id"],
			where: {
				post_id: { in: allPostIds },
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

		// Create maps for quick lookups
		const postProgramMap = new Map(
			postPrograms.map((pp) => [pp.post_id, pp])
		);

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [
				ac.post_id,
				ac._count.application_id,
			])
		);

		// Create institution map
		const institutionMap = new Map(
			institutions.map((inst) => [inst.institution_id, inst])
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
				const postProgram = postProgramMap.get(post.post_id);
				if (!postProgram) return null;

				// Find the appropriate institution for this program
				// For now, we'll use a more intelligent matching logic
				const institution = institutions.find(
					(inst) =>
						// You can add more sophisticated matching logic here
						// For example, matching by program content or other criteria
						inst.name && inst.country
				) || {
					name: "University",
					image: "/logos/default.png",
					country: "Unknown",
				};

				const applicationCount =
					applicationCountMap.get(post.post_id) || 0;

				// Map degree level to proper discipline name
				let fieldName = postProgram.degree_level || "General Studies";

				// Try to find a matching discipline/subdiscipline
				for (const [, subInfo] of Array.from(subdisciplineMap)) {
					if (
						fieldName
							.toLowerCase()
							.includes(subInfo.name.toLowerCase())
					) {
						fieldName = `${subInfo.disciplineName} - ${subInfo.name}`;
						break;
					}
				}

				// If no subdiscipline match, try main disciplines
				if (
					fieldName === postProgram.degree_level ||
					fieldName === "General Studies"
				) {
					for (const [, discName] of Array.from(disciplineMap)) {
						if (
							fieldName
								.toLowerCase()
								.includes(discName.toLowerCase())
						) {
							fieldName = discName;
							break;
						}
					}
				}

				const program: Program = {
					id: post.post_id, // Use the original post ID directly
					title: post.title,
					description: post.other_info || "No description available",
					university: institution.name,
					logo: "/logos/default.png", // Default logo since image field doesn't exist
					field: fieldName, // Use the mapped discipline/subdiscipline name
					country: institution.country || "Unknown",
					date: post.create_at.toISOString().split("T")[0],
					daysLeft: calculateDaysLeft(post.create_at.toISOString()),
					price: postProgram.tuition_fee
						? `${postProgram.tuition_fee} USD`
						: "Contact for pricing",
					match: calculateMatchPercentage(),
					funding:
						postProgram.scholarship_info || "Contact for details",
					attendance: postProgram.attendance || "On-campus",
					applicationCount, // Add application count for popularity sorting
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
			allPrograms = allPrograms.filter((program) =>
				degreeLevel.some((level) =>
					program.field.toLowerCase().includes(level.toLowerCase())
				)
			);
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

		const availableDisciplines = Array.from(
			new Set(allPrograms.map((program) => program.field).filter(Boolean))
		).sort();

		const availableDegreeLevels = Array.from(
			new Set(
				allPrograms
					.map((program) => {
						const field = program.field.toLowerCase();
						if (
							field.includes("master") ||
							field.includes("msc") ||
							field.includes("ma")
						)
							return "Master";
						if (
							field.includes("phd") ||
							field.includes("doctorate")
						)
							return "PhD";
						if (
							field.includes("bachelor") ||
							field.includes("bsc") ||
							field.includes("ba")
						)
							return "Bachelor";
						return "Other";
					})
					.filter(Boolean)
			)
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
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
