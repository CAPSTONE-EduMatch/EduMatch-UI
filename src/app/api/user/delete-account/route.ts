import { NotificationType } from "@/config/sqs-config";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

export async function DELETE() {
	try {
		// Get the authenticated user
		const { user } = await requireAuth();

		const userId = user.id;

		// Update user status to false (mark as deleted)
		const updatedUser = await prismaClient.user.update({
			where: { id: userId },
			data: { status: false },
			select: {
				id: true,
				email: true,
				name: true,
			},
		});

		// Check if user is an institution and close all their posts
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: userId },
			select: { institution_id: true },
		});

		if (institution) {
			// Close all posts belonging to this institution
			await prismaClient.opportunityPost.updateMany({
				where: {
					institution_id: institution.institution_id,
					status: {
						not: "CLOSED", // Only update posts that aren't already closed
					},
				},
				data: {
					status: "CLOSED",
					update_at: new Date(),
				},
			});
		}

		// Invalidate all sessions for the user
		await prismaClient.session.deleteMany({ where: { userId } });

		// Send account deletion notification email via API
		try {
			const baseUrl =
				process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
				process.env.NEXT_PUBLIC_APP_URL ||
				"http://localhost:3000";

			const response = await fetch(`${baseUrl}/api/notifications/queue`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: `account-deleted-${userId}-${Date.now()}`,
					type: NotificationType.ACCOUNT_DELETED,
					userId: userId,
					userEmail: updatedUser.email,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: updatedUser.name?.split(" ")[0] || "",
						lastName:
							updatedUser.name?.split(" ").slice(1).join(" ") ||
							"",
						deletionTime: new Date().toISOString(),
					},
				}),
			});

			if (!response.ok) {
				throw new Error(
					"Failed to queue account deletion notification"
				);
			}
		} catch (emailError) {
			// Email sending failure shouldn't block the account deletion
			// eslint-disable-next-line no-console
			console.error("Failed to send account deletion email:", emailError);
		}

		return NextResponse.json({
			success: true,
			message: "Account deleted successfully",
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Failed to delete account:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to delete account. Please try again.",
			},
			{ status: 500 }
		);
	}
}
