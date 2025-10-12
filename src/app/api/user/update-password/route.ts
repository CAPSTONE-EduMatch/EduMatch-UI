import { hashPassword, verifyPassword } from "better-auth/crypto"; // official helper
import { prismaClient } from "../../../../../prisma";

export async function PUT(request: Request) {
	try {
		const { userId, newPassword } = await request.json();
		if (!userId || !newPassword) {
			return new Response(
				JSON.stringify({
					error: "User ID and new password are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
		// First find the account to get its ID
		const account = await prismaClient.account.findFirst({
			where: {
				providerId: "credential",
				userId,
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
				console.log(
					"New password is the same as the old password for user:",
					userId
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
		await prismaClient.session.deleteMany({ where: { userId } });

		if (process.env.NODE_ENV === "production") {
			// Revoke all existing refresh tokens for that user
			console.log("Update password success for user:", userId);
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
