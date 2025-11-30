import { requireAuth } from "@/utils/auth/auth-utils";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

/**
 * Extract S3 key from various URL formats
 */
function extractS3Key(url: string): string | null {
	try {
		// Handle s3:// protocol
		if (url.startsWith("s3://")) {
			const parts = url.replace("s3://", "").split("/");
			parts.shift(); // Remove bucket name
			return parts.join("/");
		}

		// Handle https://bucket.s3.region.amazonaws.com/key format
		if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
			const urlObj = new URL(url);
			// Remove query parameters (pre-signed URL params) for ownership check
			return urlObj.pathname.substring(1); // Remove leading slash
		}

		// Handle direct key (assume it's already a key)
		if (!url.startsWith("http")) {
			return url;
		}

		// Handle https://bucket.s3.amazonaws.com/key format (without region)
		if (url.includes(".s3.amazonaws.com/")) {
			const urlObj = new URL(url);
			return urlObj.pathname.substring(1);
		}

		return null;
	} catch (error) {
		return null;
	}
}

/**
 * GET /api/files/protected-image
 * Generate a pre-signed URL for protected image access
 *
 * Query parameters:
 * - url: The S3 URL or key of the image
 * - expiresIn: Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
 */
export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const imageUrl = searchParams.get("url");
		const expiresInParam = searchParams.get("expiresIn");

		if (!imageUrl) {
			return NextResponse.json(
				{ error: "Image URL is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL
		const s3Key = extractS3Key(imageUrl);

		if (!s3Key) {
			return NextResponse.json(
				{ error: "Invalid image URL format" },
				{ status: 400 }
			);
		}

		// SECURITY CHECK: Basic ownership validation
		// Check if file is in user's folder (users/{userId}/...)
		const keyParts = s3Key.split("/");
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			const fileOwnerId = keyParts[1];

			// Allow access if:
			// 1. User owns the file, OR
			// 2. User is admin/institution (can access applicant files), OR
			// 3. Users are messaging each other (for any files in user folder)
			if (fileOwnerId !== user.id) {
				const isAuthorizedRole =
					user.role === "admin" ||
					user.role === "institution" ||
					user.role === "moderator";

				let hasMessagingRelationship = false;
				if (!isAuthorizedRole) {
					// Check if users have a messaging relationship (Box exists)
					// Allow access to any file if users are messaging each other
					try {
						const box = await prismaClient.box.findFirst({
							where: {
								OR: [
									{
										user_one_id: user.id,
										user_two_id: fileOwnerId,
									},
									{
										user_one_id: fileOwnerId,
										user_two_id: user.id,
									},
								],
							},
							select: {
								box_id: true,
							},
						});

						hasMessagingRelationship = !!box;
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"Error checking messaging relationship:",
							error
						);
						// Fail closed for messaging check errors
						hasMessagingRelationship = false;
					}
				}

				if (!isAuthorizedRole && !hasMessagingRelationship) {
					// eslint-disable-next-line no-console
					console.warn(
						`Unauthorized file access: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId}. Has messaging relationship: ${hasMessagingRelationship}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}
			}
		}

		// Parse expiration time (default: 1 hour, max: 7 days)
		let expiresIn = 3600; // 1 hour default
		if (expiresInParam) {
			const parsed = parseInt(expiresInParam, 10);
			if (!isNaN(parsed) && parsed > 0) {
				// Clamp between 1 second and 7 days (604800 seconds)
				expiresIn = Math.min(Math.max(parsed, 1), 604800);
			}
		}

		// Create GetObject command
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		// Generate pre-signed URL
		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn,
		});

		return NextResponse.json({
			url: presignedUrl,
			expiresIn,
			expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Protected Image URL Error:", error);

		return NextResponse.json(
			{
				error: "Failed to generate protected image URL",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
