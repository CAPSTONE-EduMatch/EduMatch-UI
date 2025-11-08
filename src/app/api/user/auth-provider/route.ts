import { prismaClient } from "../../../../../prisma";

export async function POST(request: Request) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return new Response(
				JSON.stringify({
					error: "User ID is required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// Check if user has any Google accounts
		const googleAccount = await prismaClient.account.findFirst({
			where: {
				userId,
				providerId: "google",
			},
		});

		// Check if user has credential-based account
		const credentialAccount = await prismaClient.account.findFirst({
			where: {
				userId,
				providerId: "credential",
			},
		});

		return new Response(
			JSON.stringify({
				isGoogleUser: !!googleAccount,
				hasCredentialAccount: !!credentialAccount,
				canChangePassword: !!credentialAccount && !googleAccount,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Failed to check auth provider:", error);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
