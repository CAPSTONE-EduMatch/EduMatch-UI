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

// Helper function to calculate match percentage (placeholder logic)
function calculateMatchPercentage(): string {
	return `${Math.floor(Math.random() * 30) + 70}%`;
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
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		);
		const skip = (page - 1) * limit;

		// First, get all program posts from this institution
		const programPosts = await prismaClient.opportunityPost.findMany({
			where: {
				status: "PUBLISHED",
				institution_id: institutionId,
				post_id: {
					in: await prismaClient.programPost
						.findMany({ select: { post_id: true } })
						.then((programs) => programs.map((p) => p.post_id)),
				},
			},
			select: { post_id: true },
		});

		const programPostIds = programPosts.map((p) => p.post_id);

		// Get scholarship post IDs that are linked to these programs
		const scholarshipPostIds =
			await prismaClient.programScholarship.findMany({
				where: {
					program_post_id: {
						in: programPostIds,
					},
				},
				select: { scholarship_post_id: true },
			});

		const scholarshipIds = scholarshipPostIds.map(
			(ps) => ps.scholarship_post_id
		);

		// Build where clause - only published scholarships linked to programs from this institution
		const whereClause: any = {
			status: "PUBLISHED",
			post_id: {
				in: scholarshipIds,
			},
		};

		// Get total count for pagination
		const totalCount = await prismaClient.opportunityPost.count({
			where: whereClause,
		});

		// Query posts with ScholarshipPost data
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
				scholarshipPost: true,
				applications: {
					select: {
						application_id: true,
					},
				},
			},
		});

		// Format scholarships data
		const scholarships = posts.map((post) => {
			const scholarshipData = post.scholarshipPost;
			const daysLeft = post.end_date
				? calculateDaysLeft(post.end_date)
				: 0;
			const match = calculateMatchPercentage();

			return {
				id: post.post_id,
				title: post.title,
				description:
					scholarshipData?.description || post.other_info || "",
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
				amount: scholarshipData?.grant || "N/A",
				match,
				applicationCount: post.applications.length,
				type: scholarshipData?.type || "",
				number: scholarshipData?.number || 0,
				scholarshipCoverage:
					scholarshipData?.scholarship_coverage || "",
				eligibility: scholarshipData?.eligibility || "",
			};
		});

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json(
			{
				success: true,
				data: scholarships,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages,
					hasMore: page < totalPages,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching scholarships by institution:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
