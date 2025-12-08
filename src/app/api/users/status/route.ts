import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

// Types
interface UserStatusResponse {
	id: string;
	name: string;
	email?: string; // Only included for users with existing threads
	image: string | null;
	status: "online" | "offline";
	lastSeen: Date | null;
}

interface StatusUpdateRequest {
	isOnline?: boolean;
}

// Configuration
const ONLINE_STATUS_THRESHOLD_MS =
	parseInt(process.env.ONLINE_STATUS_THRESHOLD_MINUTES || "5") * 60 * 1000;
const MAX_USERS_LIMIT = 1000; // Maximum users to return
const CACHE_MAX_AGE = 30; // Cache for 30 seconds (matches polling interval)

// Simple in-memory rate limiting (for production, use Redis or a proper rate limiter)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

function checkRateLimit(userId: string): boolean {
	const now = Date.now();
	const userLimit = rateLimitMap.get(userId);

	if (!userLimit || now > userLimit.resetTime) {
		rateLimitMap.set(userId, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW,
		});
		return true;
	}

	if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	userLimit.count++;
	return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
	const now = Date.now();
	const keysToDelete: string[] = [];
	rateLimitMap.forEach((limit, userId) => {
		if (now > limit.resetTime) {
			keysToDelete.push(userId);
		}
	});
	keysToDelete.forEach((userId) => rateLimitMap.delete(userId));
}, RATE_LIMIT_WINDOW * 2);

// Update user online status
export async function POST(_request: NextRequest) {
	try {
		// Parse body (isOnline parameter accepted but not used - status determined by updatedAt)
		await _request.json();

		// Authenticate user
		const { user: currentUser } = await requireAuth();

		// Basic rate limiting
		if (!checkRateLimit(currentUser.id)) {
			return NextResponse.json(
				{ error: "Too many requests. Please try again later." },
				{ status: 429 }
			);
		}

		// Update user's last seen timestamp
		// Note: isOnline parameter is accepted but not used since we determine status from updatedAt
		await prismaClient.user.update({
			where: { id: currentUser.id },
			data: {
				updatedAt: new Date(),
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Status updated",
			},
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Update status error:", error);
		return NextResponse.json(
			{ error: "Failed to update status" },
			{ status: 500 }
		);
	}
}

// Get user online status
export async function GET(_request: NextRequest) {
	try {
		// Authenticate user
		const { user: currentUser } = await requireAuth();

		// Basic rate limiting
		if (!checkRateLimit(currentUser.id)) {
			return NextResponse.json(
				{ error: "Too many requests. Please try again later." },
				{
					status: 429,
					headers: {
						"Retry-After": "60",
					},
				}
			);
		}

		// Get users that the current user has threads with from AppSync (for privacy)
		// This limits results and ensures we only show status for users with existing relationships
		const relatedUserIds = new Set<string>();

		// Query AppSync threads to get all users the current user has conversations with
		if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
			try {
				const { generateClient } = await import("aws-amplify/api");
				const { Amplify } = await import("aws-amplify");

				// Configure Amplify for server-side use
				Amplify.configure({
					API: {
						GraphQL: {
							endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
							region:
								process.env.NEXT_PUBLIC_AWS_REGION ||
								"ap-northeast-1",
							defaultAuthMode: "apiKey",
							apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
						},
					},
				});

				const GET_THREADS = `
					query GetThreads($userId: ID) {
						getThreads(userId: $userId) {
							id
							user1Id
							user2Id
						}
					}
				`;

				const client = generateClient();
				const result = await client.graphql({
					query: GET_THREADS,
					variables: {
						userId: currentUser.id,
					},
				});

				const threads = (result as any).data?.getThreads || [];

				// Extract unique user IDs from AppSync threads
				threads.forEach((thread: any) => {
					if (thread.user1Id === currentUser.id && thread.user2Id) {
						relatedUserIds.add(thread.user2Id);
					} else if (
						thread.user2Id === currentUser.id &&
						thread.user1Id
					) {
						relatedUserIds.add(thread.user1Id);
					}
				});
			} catch (error) {
				console.error("Error fetching AppSync threads:", error);
				// Continue with empty set if AppSync fails
			}
		}

		// If no threads exist, return empty array (privacy: don't expose all users)
		if (relatedUserIds.size === 0) {
			return NextResponse.json(
				{
					success: true,
					users: [],
				},
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
					},
				}
			);
		}

		// Convert Set to Array and limit results
		const userIdsArray = Array.from(relatedUserIds).slice(
			0,
			MAX_USERS_LIMIT
		);

		// Get users with their last seen status, including applicant data
		// We'll fetch institution data separately only for institution users to avoid unnecessary queries
		const users = await prismaClient.user.findMany({
			where: {
				id: { in: userIdsArray },
			},
			select: {
				id: true,
				name: true,
				email: true, // Include email for users with existing threads
				image: true,
				updatedAt: true, // Use updatedAt as last seen indicator
				role_id: true, // Include role_id to identify institution users
				applicant: {
					select: {
						first_name: true,
						last_name: true,
					},
				},
				institution: {
					select: {
						name: true,
						logo: true,
					},
				},
			},
			orderBy: {
				email: "asc", // Order by email since name might be null
			},
		});

		// Create institutions map from already fetched data
		const institutionsMap = new Map<
			string,
			{ name: string; logo: string | null }
		>();
		users.forEach((user) => {
			if (user.institution) {
				institutionsMap.set(user.id, {
					name: user.institution.name,
					logo: user.institution.logo,
				});
			}
		});

		// Determine online status (online if last seen within threshold)
		const now = new Date();
		const thresholdTime = new Date(
			now.getTime() - ONLINE_STATUS_THRESHOLD_MS
		);

		const usersWithStatus: UserStatusResponse[] = users.map((user) => {
			// Determine the correct name based on user type
			let displayName = "Unknown User";
			if (user.applicant?.first_name || user.applicant?.last_name) {
				// For applicants: use first_name + last_name
				displayName =
					`${user.applicant.first_name || ""} ${user.applicant.last_name || ""}`.trim();
			} else if (institutionsMap.has(user.id)) {
				// For institutions: use institution name from our map
				const institutionData = institutionsMap.get(user.id);
				displayName =
					institutionData?.name || user.name || "Unknown User";
			} else if (user.name) {
				// Fallback to User.name
				displayName = user.name;
			}

			// For institutions, use logo instead of user image (Google profile image)
			// If institution has no logo, return null so fallback icon is shown (not Google image)
			const institutionData = institutionsMap.get(user.id);
			const imageToUse =
				user.role_id === "2" && institutionData
					? institutionData.logo || null // For institutions, only use logo, never Google image
					: user.image; // For applicants, use user image (Google profile image)

			return {
				id: user.id,
				name: displayName,
				email: user.email || undefined, // Only include email for users with threads
				image: imageToUse,
				status:
					user.updatedAt && user.updatedAt > thresholdTime
						? "online"
						: "offline",
				lastSeen: user.updatedAt,
			};
		});

		return NextResponse.json(
			{
				success: true,
				users: usersWithStatus,
			},
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
				},
			}
		);
	} catch (error) {
		console.error("Get user status error:", error);
		return NextResponse.json(
			{ error: "Failed to get user status" },
			{ status: 500 }
		);
	}
}
