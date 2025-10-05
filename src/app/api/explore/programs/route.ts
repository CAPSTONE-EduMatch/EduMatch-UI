import { ExploreApiResponse, PaginationMeta } from "@/types/explore-api";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// Legacy Program interface for backward compatibility
interface Program {
	id: number;
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
		const skip = (page - 1) * limit;

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

		// Get total count for pagination
		const totalCount = await prismaClient.post.count({
			where: whereClause,
		});

		// Query posts with PostProgram data
		const posts = await prismaClient.post.findMany({
			where: whereClause,
			orderBy:
				sortBy === "newest"
					? { createdAt: "desc" }
					: sortBy === "oldest"
						? { createdAt: "asc" }
						: { createdAt: "desc" }, // default to newest
			skip,
			take: limit,
		});

		// Get PostProgram data for each post
		const postIds = posts.map((post) => post.id);
		const postPrograms = await prismaClient.postProgram.findMany({
			where: {
				PostId: { in: postIds },
			},
		});

		// Get application counts for each post (for popularity sorting)
		const applicationCounts = await prismaClient.application.groupBy({
			by: ["postId"],
			where: {
				postId: { in: postIds },
			},
			_count: {
				id: true,
			},
		});

		// Get institution data
		const institutions = await prismaClient.institutionProfile.findMany();

		// Create a map for quick lookups
		const postProgramMap = new Map(
			postPrograms.map((pp) => [pp.PostId, pp])
		);

		// Create application count map
		const applicationCountMap = new Map(
			applicationCounts.map((ac) => [ac.postId, ac._count.id])
		);

		// Transform data to Program format
		let programs: Program[] = posts
			.map((post) => {
				const postProgram = postProgramMap.get(post.id);
				if (!postProgram) return null;

				// Find a matching institution (simplified logic)
				const institution = institutions[0] || {
					name: "University",
					logo: "/logos/default.png",
					country: "Unknown",
				};

				const applicationCount = applicationCountMap.get(post.id) || 0;

				const program: Program = {
					id: parseInt(post.id.substring(0, 8), 16), // Convert string ID to number
					title: post.title,
					description: post.content || "No description available",
					university: institution.name,
					logo: institution.logo || "/logos/default.png",
					field: postProgram.degreeLevel || "General Studies",
					country: institution.country || "Unknown",
					date: post.createdAt.toISOString().split("T")[0],
					daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
					price: postProgram.tuition_fee
						? `${postProgram.tuition_fee} USD`
						: "Contact for pricing",
					match: calculateMatchPercentage(),
					funding:
						postProgram.scholarship_info || "Contact for details",
					attendance: "On-campus", // Default value
					applicationCount, // Add application count for popularity sorting
				};

				return program;
			})
			.filter((program): program is Program => program !== null);

		// Apply client-side filters (since we couldn't do them in the DB query)
		if (discipline.length > 0) {
			programs = programs.filter((program) =>
				discipline.some((d) =>
					program.field.toLowerCase().includes(d.toLowerCase())
				)
			);
		}

		if (country.length > 0) {
			programs = programs.filter((program) =>
				country.includes(program.country)
			);
		}

		if (attendance.length > 0) {
			programs = programs.filter((program) =>
				attendance.includes(program.attendance)
			);
		}

		if (degreeLevel.length > 0) {
			programs = programs.filter((program) =>
				degreeLevel.some((level) =>
					program.field.toLowerCase().includes(level.toLowerCase())
				)
			);
		}

		// Sort programs
		switch (sortBy) {
			case "most-popular":
				programs.sort(
					(a, b) =>
						(b.applicationCount || 0) - (a.applicationCount || 0)
				);
				break;
			case "match-score":
				programs.sort(
					(a, b) => parseFloat(b.match) - parseFloat(a.match)
				);
				break;
			case "deadline":
				programs.sort((a, b) => a.daysLeft - b.daysLeft);
				break;
			case "price-low":
				programs.sort((a, b) => {
					const priceA =
						parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
					const priceB =
						parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
					return priceA - priceB;
				});
				break;
			case "price-high":
				programs.sort((a, b) => {
					const priceA =
						parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
					const priceB =
						parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
					return priceB - priceA;
				});
				break;
			// newest and oldest are handled by DB orderBy above
		}

		const totalPages = Math.ceil(totalCount / limit);

		const meta: PaginationMeta = {
			total: totalCount,
			page,
			limit,
			totalPages,
		};

		const response: ExploreApiResponse<Program> = {
			data: programs,
			meta,
		};

		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
