import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma";

// GET /api/dashboard/institution - Get institution dashboard statistics
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		const userId = user.id;

		// Get institution profile
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
				status: true,
			},
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Get time filter from query params
		const { searchParams } = new URL(request.url);
		const timeFilter = searchParams.get("timeFilter") || "today";

		// Calculate date range based on time filter
		const now = new Date();
		let startDate: Date;
		let endDate: Date = now;

		switch (timeFilter) {
			case "today":
				startDate = new Date(now.setHours(0, 0, 0, 0));
				break;
			case "yesterday":
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - 1);
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(startDate);
				endDate.setHours(23, 59, 59, 999);
				break;
			case "this-week":
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - now.getDay());
				startDate.setHours(0, 0, 0, 0);
				break;
			case "last-week":
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - now.getDay() - 7);
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + 6);
				endDate.setHours(23, 59, 59, 999);
				break;
			case "this-month":
				startDate = new Date(now.getFullYear(), now.getMonth(), 1);
				break;
			case "last-month":
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				endDate = new Date(
					now.getFullYear(),
					now.getMonth(),
					0,
					23,
					59,
					59,
					999
				);
				break;
			case "this-year":
				startDate = new Date(now.getFullYear(), 0, 1);
				break;
			case "last-year":
				startDate = new Date(now.getFullYear() - 1, 0, 1);
				endDate = new Date(
					now.getFullYear() - 1,
					11,
					31,
					23,
					59,
					59,
					999
				);
				break;
			default:
				startDate = new Date(now.setHours(0, 0, 0, 0));
		}

		// Get all posts for this institution (excluding DELETED)
		const allPosts = await prismaClient.opportunityPost.findMany({
			where: {
				institution_id: institution.institution_id,
				status: { not: "DELETED" },
			},
			include: {
				applications: {
					select: {
						application_id: true,
						status: true,
						apply_at: true,
					},
				},
			},
		});

		// Get all applications for this institution's posts
		const allApplications = allPosts.flatMap((post) => post.applications);

		// Filter applications by date range
		const filteredApplications = allApplications.filter((app) => {
			const applyDate = new Date(app.apply_at);
			return applyDate >= startDate && applyDate <= endDate;
		});

		// Calculate application statistics
		// All stats are filtered by time period
		const totalApplications = filteredApplications.length;
		const newApplications = filteredApplications.filter(
			(app) => app.status === "SUBMITTED"
		).length;
		const underReviewApplications = filteredApplications.filter(
			(app) => app.status === "SUBMITTED" || app.status === "PROGRESSING"
		).length;
		const acceptedApplications = filteredApplications.filter(
			(app) => app.status === "ACCEPTED"
		).length;
		const rejectedApplications = filteredApplications.filter(
			(app) => app.status === "REJECTED"
		).length;

		// Group applications by date and status for chart
		// Structure: Map<date, Map<status, count>>
		const applicationsByDateAndStatus = new Map<
			string,
			Map<string, number>
		>();
		filteredApplications.forEach((app) => {
			const date = new Date(app.apply_at).toISOString().split("T")[0];
			const status = app.status;

			if (!applicationsByDateAndStatus.has(date)) {
				applicationsByDateAndStatus.set(date, new Map());
			}
			const statusMap = applicationsByDateAndStatus.get(date)!;
			statusMap.set(status, (statusMap.get(status) || 0) + 1);
		});

		// Generate chart data - get all dates in range
		const chartData: {
			date: string;
			underReview: number;
			rejected: number;
			accepted: number;
			isoDate: string;
		}[] = [];

		// For "today" or "yesterday" filter, generate hourly data points
		if (timeFilter === "today" || timeFilter === "yesterday") {
			const targetDate = new Date(startDate);
			const startOfDay = new Date(targetDate);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(targetDate);
			endOfDay.setHours(23, 59, 59, 999);

			// Generate hourly data points for the entire day
			for (let hour = 0; hour < 24; hour++) {
				const hourDate = new Date(startOfDay);
				hourDate.setHours(hour, 0, 0, 0);
				const dateStr = hourDate.toISOString().split("T")[0];

				// Count applications by status for this hour
				const hourApps = filteredApplications.filter((app) => {
					const appDate = new Date(app.apply_at);
					return (
						appDate.getHours() === hour &&
						appDate.toISOString().split("T")[0] === dateStr
					);
				});

				const underReview = hourApps.filter(
					(app) =>
						app.status === "SUBMITTED" ||
						app.status === "PROGRESSING"
				).length;
				const rejected = hourApps.filter(
					(app) => app.status === "REJECTED"
				).length;
				const accepted = hourApps.filter(
					(app) => app.status === "ACCEPTED"
				).length;

				chartData.push({
					date: dateStr,
					underReview,
					rejected,
					accepted,
					isoDate: hourDate.toISOString(),
				});
			}
		} else if (timeFilter.includes("year")) {
			// For year filters, generate monthly data points
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const year = currentDate.getFullYear();
				const month = currentDate.getMonth();
				const monthStart = new Date(year, month, 1);
				const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

				// Count applications by status for this month
				const monthApps = filteredApplications.filter((app) => {
					const appDate = new Date(app.apply_at);
					return appDate >= monthStart && appDate <= monthEnd;
				});

				const underReview = monthApps.filter(
					(app) =>
						app.status === "SUBMITTED" ||
						app.status === "PROGRESSING"
				).length;
				const rejected = monthApps.filter(
					(app) => app.status === "REJECTED"
				).length;
				const accepted = monthApps.filter(
					(app) => app.status === "ACCEPTED"
				).length;

				// Use the first day of the month at noon for consistent display
				const isoDate = new Date(year, month, 15, 12, 0, 0, 0);

				chartData.push({
					date: `${year}-${String(month + 1).padStart(2, "0")}`,
					underReview,
					rejected,
					accepted,
					isoDate: isoDate.toISOString(),
				});

				// Move to next month
				currentDate.setMonth(currentDate.getMonth() + 1);
			}
		} else {
			// For other filters (week, month), generate daily data points
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const dateStr = currentDate.toISOString().split("T")[0];
				const isoDate = new Date(currentDate);
				isoDate.setHours(12, 0, 0, 0); // Set to noon for consistent display

				// Ensure the date is valid
				if (isNaN(isoDate.getTime())) {
					currentDate.setDate(currentDate.getDate() + 1);
					continue;
				}

				// Calculate date range for this day
				const dayStart = new Date(currentDate);
				dayStart.setHours(0, 0, 0, 0);
				const dayEnd = new Date(currentDate);
				dayEnd.setHours(23, 59, 59, 999);

				// Filter applications for this specific day directly from filteredApplications
				// This ensures accuracy and matches the stats calculation
				const dayApps = filteredApplications.filter((app) => {
					const appDate = new Date(app.apply_at);
					return appDate >= dayStart && appDate <= dayEnd;
				});

				const underReview = dayApps.filter(
					(app) =>
						app.status === "SUBMITTED" ||
						app.status === "PROGRESSING"
				).length;
				const rejected = dayApps.filter(
					(app) => app.status === "REJECTED"
				).length;
				const accepted = dayApps.filter(
					(app) => app.status === "ACCEPTED"
				).length;

				chartData.push({
					date: dateStr,
					underReview,
					rejected,
					accepted,
					isoDate: isoDate.toISOString(),
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}

		// Ensure we have at least one data point (even if no applications)
		if (chartData.length === 0) {
			// Generate at least one data point for the time period
			const defaultDate = new Date(startDate);
			defaultDate.setHours(12, 0, 0, 0);
			chartData.push({
				date: defaultDate.toISOString().split("T")[0],
				underReview: 0,
				rejected: 0,
				accepted: 0,
				isoDate: defaultDate.toISOString(),
			});
		}

		// Format chart data for SplineArea component - single series with total
		// Include status breakdown for tooltip
		const chartSeries = [
			{
				name: "Applications",
				data: chartData.map(
					(d) => d.underReview + d.rejected + d.accepted
				),
			},
		];

		// Create status breakdown data for tooltip
		const statusBreakdown = chartData.map((d) => ({
			underReview: d.underReview,
			rejected: d.rejected,
			accepted: d.accepted,
		}));

		// Verify chart data totals match stats and recalculate if needed
		// This ensures chart data matches stats exactly
		const chartTotalUnderReview = chartData.reduce(
			(sum, d) => sum + d.underReview,
			0
		);
		const chartTotalRejected = chartData.reduce(
			(sum, d) => sum + d.rejected,
			0
		);
		const chartTotalAccepted = chartData.reduce(
			(sum, d) => sum + d.accepted,
			0
		);

		// If totals don't match, recalculate from filteredApplications directly
		if (
			chartTotalUnderReview !== underReviewApplications ||
			chartTotalRejected !== rejectedApplications ||
			chartTotalAccepted !== acceptedApplications
		) {
			// Recalculate chart data directly from filteredApplications
			// This ensures accuracy and matches the stats calculation
			chartData.forEach((dayData) => {
				const dayDate = new Date(dayData.date);
				dayDate.setHours(0, 0, 0, 0);
				const dayEnd = new Date(dayDate);
				dayEnd.setHours(23, 59, 59, 999);

				const dayApps = filteredApplications.filter((app) => {
					const appDate = new Date(app.apply_at);
					return appDate >= dayDate && appDate <= dayEnd;
				});

				dayData.underReview = dayApps.filter(
					(app) =>
						app.status === "SUBMITTED" ||
						app.status === "PROGRESSING"
				).length;
				dayData.rejected = dayApps.filter(
					(app) => app.status === "REJECTED"
				).length;
				dayData.accepted = dayApps.filter(
					(app) => app.status === "ACCEPTED"
				).length;
			});

			// Update statusBreakdown with corrected values
			statusBreakdown.forEach((breakdown, index) => {
				breakdown.underReview = chartData[index].underReview;
				breakdown.rejected = chartData[index].rejected;
				breakdown.accepted = chartData[index].accepted;
			});
		}

		// Send ISO date strings - SplineArea will handle formatting for display
		// Ensure all dates are valid ISO strings
		const categories = chartData
			.map((d) => {
				const date = new Date(d.isoDate);
				return isNaN(date.getTime()) ? null : d.isoDate;
			})
			.filter((d): d is string => d !== null);

		// Calculate post statistics
		const totalPosts = allPosts.length;
		const publishedPosts = allPosts.filter(
			(post) => post.status === "PUBLISHED"
		).length;
		const draftPosts = allPosts.filter(
			(post) => post.status === "DRAFT"
		).length;
		const closedPosts = allPosts.filter(
			(post) => post.status === "CLOSED"
		).length;

		return NextResponse.json({
			success: true,
			data: {
				stats: {
					total: totalApplications,
					new: newApplications,
					underReview: underReviewApplications,
					accepted: acceptedApplications,
					rejected: rejectedApplications,
				},
				chartSeries,
				categories,
				statusBreakdown,
				posts: {
					total: totalPosts,
					published: publishedPosts,
					draft: draftPosts,
					closed: closedPosts,
				},
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching dashboard statistics:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch dashboard statistics",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
