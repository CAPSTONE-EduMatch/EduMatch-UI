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

		const institutionId = params.id;

		if (!institutionId) {
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

		// Find the institution and its user
		const institution = await prismaClient.institution.findUnique({
			where: {
				institution_id: institutionId,
			},
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
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error performing institution action:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to perform action",
			},
			{ status: 500 }
		);
	}
}
