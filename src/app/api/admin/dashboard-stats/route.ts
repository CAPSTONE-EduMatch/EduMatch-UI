import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface DashboardStats {
	totalUsers: number;
	applicants: {
		total: number;
		activated: number;
		deactivated: number;
	};
	institutions: {
		total: number;
		activated: number;
		deactivated: number;
		pending: number;
	};
	applications: {
		total: number;
		new: number;
		underReview: number;
		accepted: number;
		rejected: number;
	};
	posts: {
		total: number;
		published: number;
		draft: number;
		closed: number;
	};
	revenue: {
		total: number;
		monthly: number;
		transactions: number;
		subscriptions: number;
	};
}

interface ChartDataPoint {
	date: string;
	applications: number;
	users: number;
	revenue: number;
}

// Get dashboard statistics
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y

		// Calculate date range based on period
		const now = new Date();
		const startDate = new Date();

		switch (period) {
			case "7d":
				startDate.setDate(now.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(now.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(now.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			default:
				startDate.setDate(now.getDate() - 30);
		}

		// Get user statistics
		const [
			totalUsers,
			applicantCount,
			institutionCount,
			activeApplicants,
			activeInstitutions,
		] = await Promise.all([
			// Total users count
			prismaClient.user.count(),

			// Applicant count (role_id: "1" = student)
			prismaClient.user.count({
				where: {
					role_id: "1",
				},
			}),

			// Institution count (role_id: "2" = institution)
			prismaClient.user.count({
				where: {
					role_id: "2",
				},
			}),

			// Active applicants
			prismaClient.user.count({
				where: {
					role_id: "1",
					status: true,
				},
			}),

			// Active institutions
			prismaClient.user.count({
				where: {
					role_id: "2",
					status: true,
				},
			}),
		]);

		// Get application statistics
		const [
			totalApplications,
			newApplications,
			underReviewApplications,
			acceptedApplications,
			rejectedApplications,
		] = await Promise.all([
			prismaClient.application.count(),
			prismaClient.application.count({
				where: { status: "SUBMITTED" },
			}),
			prismaClient.application.count({
				where: { status: "PROGRESSING" },
			}),
			prismaClient.application.count({ where: { status: "ACCEPTED" } }),
			prismaClient.application.count({ where: { status: "REJECTED" } }),
		]);

		// Get posts statistics
		const [totalPosts, publishedPosts, draftPosts, closedPosts] =
			await Promise.all([
				prismaClient.opportunityPost.count(),
				prismaClient.opportunityPost.count({
					where: { status: "PUBLISHED" },
				}),
				prismaClient.opportunityPost.count({
					where: { status: "DRAFT" },
				}),
				prismaClient.opportunityPost.count({
					where: { status: "CLOSED" },
				}),
			]);

		// Get revenue statistics (mock data for now since we don't have payment tables)
		const revenueStats = {
			total: 15000,
			monthly: 2500,
			transactions: 150,
			subscriptions: 45,
		};

		// Build dashboard stats object
		const stats: DashboardStats = {
			totalUsers,
			applicants: {
				total: applicantCount,
				activated: activeApplicants,
				deactivated: applicantCount - activeApplicants,
			},
			institutions: {
				total: institutionCount,
				activated: activeInstitutions,
				deactivated: institutionCount - activeInstitutions,
				pending: 0, // TODO: Add pending status logic when available
			},
			applications: {
				total: totalApplications,
				new: newApplications,
				underReview: underReviewApplications,
				accepted: acceptedApplications,
				rejected: rejectedApplications,
			},
			posts: {
				total: totalPosts,
				published: publishedPosts,
				draft: draftPosts,
				closed: closedPosts,
			},
			revenue: revenueStats,
		};

		// Generate chart data for the selected period
		const chartData: ChartDataPoint[] = [];
		const days =
			period === "7d"
				? 7
				: period === "30d"
					? 30
					: period === "90d"
						? 90
						: 365;

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);

			// Get data for this specific date (simplified for demo)
			const dayApplications = Math.floor(Math.random() * 20) + 5;
			const dayUsers = Math.floor(Math.random() * 10) + 2;
			const dayRevenue = Math.floor(Math.random() * 500) + 100;

			chartData.push({
				date: date.toISOString(),
				applications: dayApplications,
				users: dayUsers,
				revenue: dayRevenue,
			});
		}

		return NextResponse.json({
			success: true,
			data: {
				stats,
				chartData,
				period,
			},
		});
	} catch (error) {
		// Log error for debugging (disabled for production)
		// if (error instanceof Error) {
		//   console.error("Dashboard stats error:", error.message);
		// }
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch dashboard statistics",
			},
			{ status: 500 }
		);
	}
}
