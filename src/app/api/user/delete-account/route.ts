import { NotificationType, SQSService } from "@/config/sqs-config";
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

		// Invalidate all sessions for the user
		await prismaClient.session.deleteMany({ where: { userId } });

		// Send account deletion notification email
		try {
			await SQSService.sendEmailMessage({
				id: `account-deleted-${userId}-${Date.now()}`,
				type: NotificationType.ACCOUNT_DELETED,
				userId: userId,
				userEmail: updatedUser.email,
				timestamp: new Date().toISOString(),
				metadata: {
					firstName: updatedUser.name?.split(" ")[0] || "",
					lastName:
						updatedUser.name?.split(" ").slice(1).join(" ") || "",
					deletionTime: new Date().toISOString(),
				},
			});
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
