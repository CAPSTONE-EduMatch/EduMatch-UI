import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";

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
		const institutionId = searchParams.get("institutionId");

		if (!institutionId) {
			return NextResponse.json(
				{ message: "Institution ID is required" },
				{ status: 400 }
			);
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
				price = formatCurrency(post.scholarshipPost.award_amount);
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
				match: calculateMatchPercentage(),
				funding: funding,
				attendance: attendance,
				applicationCount: post.applications?.length || 0,
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
