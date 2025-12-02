import { requireAuth } from "@/utils/auth/auth-utils";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";
import { checkMessagingRelationshipInAppSync } from "@/utils/files/checkMessagingRelationship";

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

		// SECURITY CHECK: Ownership validation
		const keyParts = s3Key.split("/");
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			const fileOwnerId = keyParts[1];

			// eslint-disable-next-line no-console
			console.log(
				`[Protected Image] Access check: User ${user.id} (${user.role}) accessing file ${s3Key} owned by ${fileOwnerId}`
			);

			// Allow access if:
			// 1. User owns the file, OR
			// 2. Users are messaging each other (for any files in user folder), OR
			// 3. User is admin/institution (can access applicant files) - only if no messaging relationship
			if (fileOwnerId !== user.id) {
				const isAuthorizedRole =
					user.role === "admin" ||
					user.role === "institution" ||
					user.role === "moderator";

				// Always check for messaging relationship first (regardless of role)
				// Check AppSync for thread relationship
				let hasMessagingRelationship = false;
				try {
					hasMessagingRelationship =
						await checkMessagingRelationshipInAppSync(
							user.id,
							fileOwnerId
						);
					// eslint-disable-next-line no-console
					console.log(
						`[Protected Image] AppSync Thread check: ${hasMessagingRelationship ? "Found" : "Not found"}`
					);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(
						"[Protected Image] Error checking AppSync threads:",
						error
					);
					// Fail closed for messaging check errors
					hasMessagingRelationship = false;
				}

				// If no messaging relationship, check role-based permissions
				if (!hasMessagingRelationship) {
					// For authorized roles, allow access to applicant files
					// But we need to check if the file owner is an applicant
					if (isAuthorizedRole) {
						// Check if file owner is an applicant
						const fileOwner = await prismaClient.user.findUnique({
							where: { id: fileOwnerId },
							select: {
								role: true,
								applicant: {
									select: {
										applicant_id: true,
									},
								},
							},
						});

						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] File owner check: ${fileOwner?.role || "unknown"} - Has applicant: ${!!fileOwner?.applicant}`
						);

						// Only allow if file owner is an applicant (not another institution)
						if (
							fileOwner?.role === "applicant" ||
							fileOwner?.applicant
						) {
							// Allow access - institution/admin can access applicant files
							// eslint-disable-next-line no-console
							console.log(
								`[Protected Image] ✅ Allowed: Authorized role accessing applicant file`
							);
						} else {
							// eslint-disable-next-line no-console
							console.warn(
								`[Protected Image] 🚫 Denied: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId} (${fileOwner?.role}). No messaging relationship and not an applicant file.`
							);
							return NextResponse.json(
								{
									error: "You don't have permission to access this file",
								},
								{ status: 403 }
							);
						}
					} else {
						// No messaging relationship and not an authorized role - deny access
						// eslint-disable-next-line no-console
						console.warn(
							`[Protected Image] 🚫 Denied: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId}. Has messaging relationship: ${hasMessagingRelationship}`
						);
						return NextResponse.json(
							{
								error: "You don't have permission to access this file",
							},
							{ status: 403 }
						);
					}
				} else {
					// eslint-disable-next-line no-console
					console.log(
						`[Protected Image] ✅ Allowed: Messaging relationship exists in AppSync`
					);
				}

				// If hasMessagingRelationship is true, allow access (continue to generate URL)
			} else {
				// eslint-disable-next-line no-console
				console.log(`[Protected Image] ✅ Allowed: User owns the file`);
			}
		} else {
			// eslint-disable-next-line no-console
			console.log(
				`[Protected Image] ⚠️ File not in users/ folder, allowing access: ${s3Key}`
			);
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
