import { prismaClient } from "../../../prisma/index";
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

const GET_MESSAGES = `
	query GetMessages($threadId: ID!) {
		getMessages(threadId: $threadId) {
			id
			threadId
			fileUrl
			senderId
		}
	}
`;

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
 * Check if a file URL exists in a message thread between two users
 * This validates that the file was actually sent in a message, not just that users have a relationship
 * @param userId - The current user's ID
 * @param fileOwnerId - The file owner's ID (from S3 key)
 * @param fileUrl - The file URL to validate
 * @returns true if the file exists in a message thread between the two users
 */
export async function validateMessageFileAccess(
	userId: string,
	fileOwnerId: string,
	fileUrl: string
): Promise<boolean> {
	try {
		// First, check if users have a messaging relationship in PostgreSQL (Box)
		const box = await prismaClient.box.findFirst({
			where: {
				OR: [
					{ user_one_id: userId, user_two_id: fileOwnerId },
					{ user_one_id: fileOwnerId, user_two_id: userId },
				],
			},
			select: {
				box_id: true,
			},
		});

		// If no Box exists in PostgreSQL, check AppSync
		if (!box && process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
			try {
				const client = generateClient();

				// Get threads for the current user
				const threadsResult = await client.graphql({
					query: GET_THREADS,
					variables: { userId },
				});

				const threads = (threadsResult as any).data?.getThreads || [];

				// Find thread between the two users
				const thread = threads.find(
					(t: any) =>
						(t.user1Id === userId && t.user2Id === fileOwnerId) ||
						(t.user1Id === fileOwnerId && t.user2Id === userId)
				);

				if (!thread) {
					// eslint-disable-next-line no-console
					console.log(
						`[validateMessageFileAccess] No thread found between ${userId} and ${fileOwnerId}`
					);
					return false;
				}

				// Check if fileUrl exists in messages for this thread
				const messagesResult = await client.graphql({
					query: GET_MESSAGES,
					variables: { threadId: thread.id },
				});

				const messages =
					(messagesResult as any).data?.getMessages || [];

				// Check if any message contains this fileUrl
				const fileExists = messages.some(
					(msg: any) => msg.fileUrl === fileUrl
				);

				if (fileExists) {
					// eslint-disable-next-line no-console
					console.log(
						`[validateMessageFileAccess] ✅ File found in AppSync thread ${thread.id}`
					);
					return true;
				}

				// eslint-disable-next-line no-console
				console.log(
					`[validateMessageFileAccess] ❌ File not found in AppSync messages`
				);
				return false;
			} catch (appSyncError) {
				// eslint-disable-next-line no-console
				console.error(
					"[validateMessageFileAccess] AppSync error:",
					appSyncError
				);
				// Fail closed - deny access if we can't verify
				return false;
			}
		}

		// If Box exists in PostgreSQL, check AppSync for the file
		// (PostgreSQL messages don't store fileUrl in new schema)
		if (box && process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
			try {
				const client = generateClient();

				// Check if fileUrl exists in messages for this thread
				const messagesResult = await client.graphql({
					query: GET_MESSAGES,
					variables: { threadId: box.box_id },
				});

				const messages =
					(messagesResult as any).data?.getMessages || [];

				// Check if any message contains this fileUrl
				const fileExists = messages.some(
					(msg: any) => msg.fileUrl === fileUrl
				);

				if (fileExists) {
					// eslint-disable-next-line no-console
					console.log(
						`[validateMessageFileAccess] ✅ File found in PostgreSQL Box ${box.box_id} via AppSync`
					);
					return true;
				}

				// eslint-disable-next-line no-console
				console.log(
					`[validateMessageFileAccess] ❌ File not found in messages for Box ${box.box_id}`
				);
				return false;
			} catch (appSyncError) {
				// eslint-disable-next-line no-console
				console.error(
					"[validateMessageFileAccess] AppSync error:",
					appSyncError
				);
				// Fail closed - deny access if we can't verify
				return false;
			}
		}

		// If no AppSync and no Box, deny access
		if (!box) {
			// eslint-disable-next-line no-console
			console.log(
				`[validateMessageFileAccess] ❌ No Box or AppSync thread found`
			);
			return false;
		}

		// If we have a Box but no AppSync, we can't verify fileUrl
		// (PostgreSQL messages don't store fileUrl)
		// eslint-disable-next-line no-console
		console.log(
			`[validateMessageFileAccess] ⚠️ Box exists but AppSync not configured, cannot verify fileUrl`
		);
		return false;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[validateMessageFileAccess] Error:", error);
		// Fail closed - deny access on error
		return false;
	}
}
