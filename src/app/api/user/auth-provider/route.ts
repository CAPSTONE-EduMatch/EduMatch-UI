import { prismaClient } from "../../../../../prisma";
import { requireAuth } from "@/utils/auth/auth-utils";

export async function POST(request: Request) {
	try {
		// SECURITY: Get authenticated user from session
		const { user } = await requireAuth();
		const authenticatedUserId = user.id;

		const { userId } = await request.json();

		// SECURITY: Use authenticated user's ID, ignore userId from request body
		// This prevents users from querying other users' auth provider info
		const userIdToCheck = authenticatedUserId;

		// Log warning if userId was provided and differs (potential security issue)
		if (userId && userId !== authenticatedUserId) {
			// eslint-disable-next-line no-console
			console.warn(
				"⚠️ SECURITY: Attempted to check auth provider for different user. Using authenticated user ID.",
				{
					authenticatedUserId: authenticatedUserId,
					providedUserId: userId,
				}
			);
		}

		// Check if user has any Google accounts
		const googleAccount = await prismaClient.account.findFirst({
			where: {
				userId: userIdToCheck,
				providerId: "google",
			},
		});

		// Check if user has credential-based account
		const credentialAccount = await prismaClient.account.findFirst({
			where: {
				userId: userIdToCheck,
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
