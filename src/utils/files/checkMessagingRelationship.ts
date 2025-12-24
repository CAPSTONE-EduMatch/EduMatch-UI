import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";

// Configure Amplify for server-side use
if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
	Amplify.configure({
		API: {
			GraphQL: {
				endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
				region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
				defaultAuthMode: "apiKey",
				apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
			},
		},
	});
}

const GET_THREADS = `
	query GetThreads($userId: ID) {
		getThreads(userId: $userId) {
			id
			user1Id
			user2Id
		}
	}
`;

/**
 * Check if two users have a messaging relationship (thread) in AppSync
 * @param userId - The current user's ID
 * @param otherUserId - The other user's ID (file owner)
 * @returns true if a thread exists between the two users
 */
export async function checkMessagingRelationshipInAppSync(
	userId: string,
	otherUserId: string
): Promise<boolean> {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		// If AppSync is not configured, return false
		return false;
	}

	try {
		const client = generateClient();

		// Query threads for the current user
		const result = await client.graphql({
			query: GET_THREADS,
			variables: {
				userId: userId,
			},
		});

		const threads = (result as any).data?.getThreads || [];

		// Check if any thread exists between these two users
		const hasRelationship = threads.some(
			(thread: any) =>
				(thread.user1Id === userId && thread.user2Id === otherUserId) ||
				(thread.user1Id === otherUserId && thread.user2Id === userId)
		);

		// eslint-disable-next-line no-console
		console.log(
			`[checkMessagingRelationship] Checked ${threads.length} threads for user ${userId}, relationship with ${otherUserId}: ${hasRelationship}`
		);

		return hasRelationship;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(
			"[checkMessagingRelationship] Error checking AppSync threads:",
			error
		);
		// Return false on error (fail closed)
		return false;
	}
}
