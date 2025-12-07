import { NotificationType } from "@/config/sqs-config";
import { EmailService } from "@/services/email/email-service";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface SupportFilters {
	search?: string;
	status?: "all" | "pending" | "replied";
	sortBy?: "newest" | "oldest";
	page?: number;
	limit?: number;
}

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// Get list of support requests with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		const session = await requireAuth();

		// Check if user is admin
		if (session.user?.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized - Admin access required" },
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: SupportFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as "all" | "pending" | "replied") ||
				"all",
			sortBy:
				(searchParams.get("sortBy") as "newest" | "oldest") || "newest",
			page: parseInt(searchParams.get("page") || "1"),
			limit: parseInt(searchParams.get("limit") || "10"),
		};

		// Build where clause for filtering
		const whereClause: any = {};

		// Search functionality
		if (filters.search) {
			const searchTerm = filters.search.toLowerCase();
			whereClause.OR = [
				{
					content: {
						contains: searchTerm,
					},
				},
				{
					applicant: {
						OR: [
							{
								first_name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{
								last_name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{
								user: {
									email: {
										contains: searchTerm,
										mode: "insensitive",
									},
								},
							},
							{ phone_number: { contains: searchTerm } },
						],
					},
				},
				{
					institution: {
						OR: [
							{
								name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{
								rep_email: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{ hotline: { contains: searchTerm } },
						],
					},
				},
			];
		}

		// Status filtering
		if (filters.status !== "all") {
			if (filters.status === "pending") {
				whereClause.status = true;
			} else if (filters.status === "replied") {
				whereClause.status = false;
			}
		}

		// Calculate offset for pagination
		const offset = (filters.page! - 1) * filters.limit!;

		// Build order by clause
		const orderBy =
			filters.sortBy === "newest"
				? { create_at: "desc" as const }
				: { create_at: "asc" as const };

		// Get total count for pagination
		const totalCount = await prismaClient.supportRequirement.count({
			where: whereClause,
		});

		// Get overall stats (regardless of current filters/pagination)
		const totalStats = await prismaClient.supportRequirement.count();
		const pendingStats = await prismaClient.supportRequirement.count({
			where: { status: true },
		});
		const repliedStats = await prismaClient.supportRequirement.count({
			where: { status: false },
		});

		// Fetch support requests with proper pagination
		const supportRequests = await prismaClient.supportRequirement.findMany({
			where: whereClause,
			orderBy,
			skip: offset,
			take: filters.limit,
			include: {
				applicant: {
					include: {
						user: {
							select: {
								email: true,
								name: true,
							},
						},
					},
				},
				institution: {
					include: {
						user: {
							select: {
								email: true,
								name: true,
							},
						},
					},
				},
				manager: {
					select: {
						name: true,
						email: true,
					},
				},
			},
		});

		// Transform data for frontend
		const transformedRequests = supportRequests.map((req) => {
			let parsedContent;
			try {
				parsedContent = JSON.parse(req.content);
			} catch {
				parsedContent = { question: req.content };
			}

			// Determine name and email from applicant or institution
			let name = "Unknown User";
			let email = "unknown@example.com";
			let contact = "";

			if (req.applicant) {
				name = `${req.applicant.first_name || ""} ${
					req.applicant.last_name || ""
				}`.trim();
				email =
					req.applicant.user?.email ||
					parsedContent.senderEmail ||
					"";
				contact = req.applicant.phone_number || "";
			} else if (req.institution) {
				name = req.institution.name;
				email =
					req.institution.rep_email ||
					req.institution.user?.email ||
					parsedContent.senderEmail ||
					"";
				contact = req.institution.hotline || "";
			} else if (parsedContent.senderEmail) {
				email = parsedContent.senderEmail;
				name = parsedContent.senderEmail.split("@")[0]; // Fallback name from email
			}

			return {
				id: req.support_id,
				name: name || "Unknown User",
				email: email,
				contact: contact,
				sendDate: req.create_at.toLocaleDateString(),
				status: req.status ? "Pending" : "Replied",
				subject: parsedContent.problemType || "Support Request",
				message: parsedContent.question || req.content,
				reply: parsedContent.reply || null,
				managerId: req.manager_id,
				createdAt: req.create_at.toISOString(),
				updatedAt: req.update_at?.toISOString(),
			};
		});

		const totalPages = Math.ceil(totalCount / filters.limit!);

		return NextResponse.json({
			success: true,
			data: transformedRequests,
			pagination: {
				currentPage: filters.page,
				totalPages,
				totalCount,
				limit: filters.limit,
			},
			stats: {
				total: totalStats,
				pending: pendingStats,
				replied: repliedStats,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch support requests",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

// Update support request status (reply functionality)
export async function PATCH(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		const session = await requireAuth();

		// Check if user is admin
		if (session.user?.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized - Admin access required" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { supportId, reply, action } = body;

		if (!supportId || !action) {
			return NextResponse.json(
				{ error: "Support ID and action are required" },
				{ status: 400 }
			);
		}

		if (action === "reply" && !reply) {
			return NextResponse.json(
				{ error: "Reply message is required" },
				{ status: 400 }
			);
		}

		// Find the support request
		const supportRequest = await prismaClient.supportRequirement.findUnique(
			{
				where: { support_id: supportId },
				include: {
					applicant: {
						include: {
							user: true,
						},
					},
					institution: {
						include: {
							user: true,
						},
					},
				},
			}
		);

		if (!supportRequest) {
			return NextResponse.json(
				{ error: "Support request not found" },
				{ status: 404 }
			);
		}

		if (action === "reply") {
			// Parse existing content
			let existingContent;
			try {
				existingContent = JSON.parse(supportRequest.content);
			} catch {
				existingContent = { question: supportRequest.content };
			}

			// Add reply to content
			const updatedContent = {
				...existingContent,
				reply: reply,
				repliedBy: session.user.id,
				repliedAt: new Date().toISOString(),
			};

			// Update support request
			await prismaClient.supportRequirement.update({
				where: { support_id: supportId },
				data: {
					content: JSON.stringify(updatedContent),
					status: false, // Mark as replied
					update_at: new Date(),
				},
			});

			// Send notification to the user
			const userEmail =
				supportRequest.applicant?.user?.email ||
				supportRequest.institution?.user?.email ||
				existingContent.senderEmail;

			if (userEmail) {
				// Get user information
				const firstName =
					supportRequest.applicant?.first_name ||
					supportRequest.institution?.name?.split(" ")[0] ||
					"User";
				const lastName = supportRequest.applicant?.last_name || "";

				// Get the target user ID
				const targetUserId =
					supportRequest.applicant?.user_id ||
					supportRequest.institution?.user_id;

				if (targetUserId) {
					// Send notification using the new notification system
					await EmailService.sendNotificationEmail({
						id: `support-reply-${supportId}-${Date.now()}`,
						type: NotificationType.SUPPORT_REPLY,
						userId: targetUserId,
						userEmail: userEmail,
						timestamp: new Date().toISOString(),
						metadata: {
							supportId: supportId,
							firstName: firstName,
							lastName: lastName,
							originalSubject:
								existingContent.problemType ||
								"Support Request",
							originalMessage: existingContent.question || "",
							replyMessage: reply,
							repliedBy: session.user.id,
							repliedAt: new Date().toISOString(),
						},
					});
				} else {
					// Fallback to direct email if no user ID found
					const userName = supportRequest.applicant
						? `${supportRequest.applicant.first_name || ""} ${
								supportRequest.applicant.last_name || ""
							}`.trim()
						: supportRequest.institution?.name ||
							userEmail.split("@")[0];

					await EmailService.sendCompanyEmail(
						userEmail,
						`Support Reply - ${
							existingContent.problemType || "Support Request"
						}`,
						{
							title: "Support Reply",
							preheader:
								"We have replied to your support request",
							bodyHtml: `
								<p>Hello ${escapeHtml(userName)},</p>
								
								<p>Thank you for contacting EduMatch support. We have reviewed your request and here is our response:</p>
								
								<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
									<p><strong>Your Original Request:</strong></p>
									<p><strong>Problem Type:</strong> ${escapeHtml(
										existingContent.problemType ||
											"Support Request"
									)}</p>
									<p><strong>Your Message:</strong></p>
									<div style="background:white;padding:12px;border-radius:4px;margin:8px 0;">
										${escapeHtml(existingContent.question || "")}
									</div>
								</div>
								
								<div style="background:#e6f7ff;padding:16px;border-radius:8px;margin:16px 0;">
									<p><strong>Our Response:</strong></p>
									<div style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(
										reply
									)}</div>
								</div>
								
								<p>If you have any additional questions or need further assistance, please don't hesitate to contact us again.</p>
								
								<p><strong>Reference ID:</strong> ${escapeHtml(supportId)}</p>
							`,
							primaryCta: {
								label: "Contact Support",
								url: `${
									process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
									"https://dev.d1jaxpbx3axxsh.amplifyapp.com"
								}/support`,
							},
							helpCenterUrl: `${
								process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
								"https://edumatch.app"
							}/support`,
						}
					);
				}
			}

			return NextResponse.json({
				success: true,
				message: "Reply sent successfully",
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update support request" },
			{ status: 500 }
		);
	}
}
