import { hashPassword, verifyPassword } from "better-auth/crypto"; // official helper
import { prismaClient } from "../../../../../prisma";
import { requireAuth } from "@/utils/auth/auth-utils";

export async function PUT(request: Request) {
	try {
		// SECURITY: Get authenticated user from session
		const { user } = await requireAuth();
		const authenticatedUserId = user.id;

		const { userId, newPassword } = await request.json();
		if (!newPassword) {
			return new Response(
				JSON.stringify({
					error: "New password is required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// SECURITY: Use authenticated user's ID, ignore userId from request body
		// This prevents users from changing other users' passwords
		const userIdToUpdate = authenticatedUserId;

		// Log warning if userId was provided in request body (potential security issue)
		if (userId && userId !== authenticatedUserId) {
			// eslint-disable-next-line no-console
			console.warn(
				"⚠️ SECURITY: Attempted to change password for different user. Using authenticated user ID.",
				{
					authenticatedUserId: authenticatedUserId,
					providedUserId: userId,
				}
			);
		}
		// First find the account to get its ID
		const account = await prismaClient.account.findFirst({
			where: {
				providerId: "credential",
				userId: userIdToUpdate,
			},
		});

		if (!account) {
			return new Response(
				JSON.stringify({
					error: "Account not found",
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		if (
			await verifyPassword({
				hash: account?.password || "",
				password: newPassword,
			})
		) {
			if (process.env.NODE_ENV === "production") {
				// eslint-disable-next-line no-console
				console.log(
					"New password is the same as the old password for user:",
					userIdToUpdate
				);
			}

			return new Response(null, {
				status: 204,
				headers: { "Content-Type": "application/json" },
			});
		}

		const hashedPassword = await hashPassword(newPassword);

		await prismaClient.account.update({
			where: {
				id: account.id,
			},
			data: { password: hashedPassword },
		});

		// 3) Invalidate existing sessions for that user
		await prismaClient.session.deleteMany({
			where: { userId: userIdToUpdate },
		});

		if (process.env.NODE_ENV === "production") {
			// Revoke all existing refresh tokens for that user
			// eslint-disable-next-line no-console
			console.log("Update password success for user:", userIdToUpdate);
		}

		return new Response(null, {
			status: 204,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ error: "Internal server error" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
