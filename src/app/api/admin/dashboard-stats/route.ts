import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface DashboardStats {
	totalUsers: {
		total: number;
		applicants: number;
		institutions: number;
		systemManagers: number;
	};
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
		rejected: number;
		closed: number;
		submitted: number;
		progressing: number;
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
			systemManagerCount,
			activeApplicants,
			activeInstitutions,
			pendingInstitutions,
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

			// System Manager count (role_id: "3" = system manager)
			prismaClient.user.count({
				where: {
					role_id: "3",
				},
			}),

			// Active applicants
			prismaClient.user.count({
				where: {
					role_id: "1",
					status: true,
				},
			}),

			// Active institutions (APPROVED verification status and active user status)
			prismaClient.institution.count({
				where: {
					verification_status: "APPROVED",
					user: {
						status: true,
					},
				},
			}),

			// Pending institutions (verification_status = PENDING)
			prismaClient.institution.count({
				where: {
					verification_status: "PENDING",
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
		const [
			totalPosts,
			publishedPosts,
			rejectedPosts,
			closedPosts,
			submittedPosts,
			progressingPosts,
		] = await Promise.all([
			prismaClient.opportunityPost.count(),
			prismaClient.opportunityPost.count({
				where: { status: "PUBLISHED" },
			}),
			prismaClient.opportunityPost.count({
				where: { status: "REJECTED" },
			}),
			prismaClient.opportunityPost.count({
				where: { status: "CLOSED" },
			}),
			prismaClient.opportunityPost.count({
				where: { status: "SUBMITTED" },
			}),
			prismaClient.opportunityPost.count({
				where: { status: "PROGRESSING" },
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
			totalUsers: {
				total: totalUsers,
				applicants: applicantCount,
				institutions: institutionCount,
				systemManagers: systemManagerCount,
			},
			applicants: {
				total: applicantCount,
				activated: activeApplicants,
				deactivated: applicantCount - activeApplicants,
			},
			institutions: {
				total: institutionCount,
				activated: activeInstitutions,
				deactivated:
					institutionCount - activeInstitutions - pendingInstitutions,
				pending: pendingInstitutions,
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
				rejected: rejectedPosts,
				closed: closedPosts,
				submitted: submittedPosts,
				progressing: progressingPosts,
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
			date.setHours(0, 0, 0, 0);

			const nextDate = new Date(date);
			nextDate.setDate(date.getDate() + 1);

			// Get actual data for this specific date from database
			const [dayApplications, dayUsers] = await Promise.all([
				// Count applications created on this date
				prismaClient.application.count({
					where: {
						apply_at: {
							gte: date,
							lt: nextDate,
						},
					},
				}),
				// Count users created on this date
				prismaClient.user.count({
					where: {
						createdAt: {
							gte: date,
							lt: nextDate,
						},
					},
				}),
			]);

			chartData.push({
				date: date.toISOString(),
				applications: dayApplications,
				users: dayUsers,
				revenue: 0, // Not implemented yet
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
