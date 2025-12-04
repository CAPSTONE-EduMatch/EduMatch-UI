import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../../prisma/index";

// Handle institution actions (ban, unban, contact, revoke-sessions)
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Authenticate user and check admin permissions
		const { user: currentUser } = await requireAuth();

		const id = params.id;

		if (!id) {
			return Response.json(
				{
					success: false,
					error: "Institution ID is required",
				},
				{ status: 400 }
			);
		}

		// Parse request body
		const body = await request.json();
		const { action, banReason, banDuration } = body;

		if (!action) {
			return Response.json(
				{
					success: false,
					error: "Action is required",
				},
				{ status: 400 }
			);
		}

		// Determine if the ID is an institution_id or user_id
		// institution_id format: "institution_${userId}"
		// If it doesn't start with "institution_", treat it as user_id
		let whereClause: any;
		if (id.startsWith("institution_")) {
			whereClause = { institution_id: id };
		} else {
			// It's a user_id, find by user_id
			whereClause = { user_id: id };
		}

		// Find the institution and its user
		const institution = await prismaClient.institution.findFirst({
			where: whereClause,
			include: {
				user: {
					select: {
						id: true,
						banned: true,
						banReason: true,
						banExpires: true,
					},
				},
			},
		});

		if (!institution) {
			return Response.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		let result: any = {};

		switch (action) {
			case "ban":
				if (institution.user.banned) {
					return Response.json(
						{
							success: false,
							error: "Institution is already banned",
						},
						{ status: 400 }
					);
				}

				if (!banReason || banReason.trim() === "") {
					return Response.json(
						{
							success: false,
							error: "Ban reason is required",
						},
						{ status: 400 }
					);
				}

				// Calculate ban expiration date
				let banExpires: Date | null = null;
				if (banDuration && banDuration > 0) {
					banExpires = new Date();
					banExpires.setDate(banExpires.getDate() + banDuration);
				}

				// Ban the user
				result = await prismaClient.user.update({
					where: {
						id: institution.user.id,
					},
					data: {
						banned: true,
						banReason: banReason.trim(),
						banExpires,
					},
				});

				break;

			case "unban":
				if (!institution.user.banned) {
					return Response.json(
						{
							success: false,
							error: "Institution is not banned",
						},
						{ status: 400 }
					);
				}

				// Unban the user
				result = await prismaClient.user.update({
					where: {
						id: institution.user.id,
					},
					data: {
						banned: false,
						banReason: null,
						banExpires: null,
					},
				});

				break;

			case "contact":
				// TODO: Implement contact functionality
				// This could involve sending an email or creating a support ticket
				// For now, we'll just return success
				result = {
					success: true,
					message: "Contact request sent to institution",
				};
				break;

			case "revoke-sessions":
				// Delete all sessions for the institution user
				const deletedSessions = await prismaClient.session.deleteMany({
					where: {
						userId: institution.user.id,
					},
				});

				result = {
					success: true,
					message: `Revoked ${deletedSessions.count} sessions`,
					sessionsRevoked: deletedSessions.count,
				};
				break;

			case "approve":
				// Approve the institution
				result = await prismaClient.institution.update({
					where: {
						institution_id: institution.institution_id,
					},
					data: {
						verification_status: "APPROVED",
						verified_at: new Date(),
						verified_by: currentUser.id,
					},
				});

				// Create notification for the institution
				await prismaClient.notification.create({
					data: {
						notification_id: `institution-approved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						user_id: institution.user.id,
						title: "Institution Profile Approved",
						body: "Your institution profile has been approved. You now have full access to the dashboard.",
						type: "INSTITUTION_APPROVED",
						send_at: new Date(),
						create_at: new Date(),
					},
				});

				break;

			case "deny":
				// Deny the institution
				const { rejectionReason } = body;
				result = await prismaClient.institution.update({
					where: {
						institution_id: institution.institution_id,
					},
					data: {
						verification_status: "REJECTED",
						rejection_reason: rejectionReason || null,
						verified_at: new Date(),
						verified_by: currentUser.id,
					},
				});

				// Create notification for the institution
				await prismaClient.notification.create({
					data: {
						notification_id: `institution-rejected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						user_id: institution.user.id,
						title: "Institution Profile Rejected",
						body: rejectionReason
							? `Your institution profile has been rejected. Reason: ${rejectionReason}`
							: "Your institution profile has been rejected. Please review your submission and try again.",
						type: "INSTITUTION_REJECTED",
						send_at: new Date(),
						create_at: new Date(),
					},
				});

				break;

			case "require-info":
				// Require additional information from the institution
				const { note } = body;

				if (
					!note ||
					typeof note !== "string" ||
					note.trim().length === 0
				) {
					return Response.json(
						{
							success: false,
							error: "Note is required. Please provide details about what additional information is needed.",
						},
						{ status: 400 }
					);
				}

				try {
					// Get admin user details for the notification
					const adminUser = await prismaClient.user.findUnique({
						where: { id: currentUser.id },
						select: { name: true, email: true },
					});

					const adminName =
						adminUser?.name || adminUser?.email || "Administrator";

					// Use a transaction to ensure all operations succeed or fail together
					await prismaClient.$transaction(async (tx) => {
						// Update institution verification status to REQUIRE_UPDATE
						await tx.institution.update({
							where: {
								institution_id: institution.institution_id,
							},
							data: {
								verification_status: "REQUIRE_UPDATE" as any, // Type assertion until Prisma client is regenerated
								submitted_at: new Date(),
							},
						});

						// Create institution info request record
						const infoRequestId = `info-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
						await tx.institutionInfoRequest.create({
							data: {
								info_request_id: infoRequestId,
								institution_id: institution.institution_id,
								requested_by_user_id: currentUser.id,
								request_message: note.trim(),
								requested_fields: [], // Can be extended to specify which fields need updating
								status: "PENDING",
								created_at: new Date(),
							},
						});

						// Create a notification for the institution
						await tx.notification.create({
							data: {
								notification_id: `additional-info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
								user_id: institution.user.id,
								title: "Additional Information Required",
								body: `${adminName} requires additional information from your institution:\n\n${note.trim()}\n\nPlease review your profile and provide the requested information.`,
								type: "ADMIN_ADDITIONAL_INFO",
								send_at: new Date(),
								create_at: new Date(),
							},
						});

						result = {
							success: true,
							message:
								"Additional information request sent successfully",
							infoRequestId: infoRequestId,
						};
					});
				} catch (requireInfoError: any) {
					// eslint-disable-next-line no-console
					console.error(
						"Error in require-info action:",
						requireInfoError
					);
					// eslint-disable-next-line no-console
					console.error("Error stack:", requireInfoError?.stack);
					// eslint-disable-next-line no-console
					console.error("Error code:", requireInfoError?.code);
					// eslint-disable-next-line no-console
					console.error("Error meta:", requireInfoError?.meta);
					return Response.json(
						{
							success: false,
							error: `Failed to create information request: ${requireInfoError?.message || "Unknown error"}`,
							...(process.env.NODE_ENV === "development" && {
								details: requireInfoError?.message,
								code: requireInfoError?.code,
								meta: requireInfoError?.meta,
							}),
						},
						{ status: 500 }
					);
				}
				break;

			default:
				return Response.json(
					{
						success: false,
						error: `Unknown action: ${action}`,
					},
					{ status: 400 }
				);
		}

		return Response.json({
			success: true,
			data: result,
		});
	} catch (error: any) {
		// eslint-disable-next-line no-console
		console.error("Error performing institution action:", error);
		// eslint-disable-next-line no-console
		console.error("Error details:", {
			message: error?.message,
			code: error?.code,
			meta: error?.meta,
			stack: error?.stack,
		});
		return Response.json(
			{
				success: false,
				error: error?.message || "Failed to perform action",
				...(process.env.NODE_ENV === "development" && {
					details: error?.message,
					code: error?.code,
				}),
			},
			{ status: 500 }
		);
	}
}
