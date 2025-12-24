import { requireAuth } from "@/utils/auth/auth-utils";
import {
	GetObjectCommand,
	HeadObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

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
			// Remove query parameters (pre-signed URL params)
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
 * Check if user has permission to access a file
 *
 * Security checks:
 * 1. File ownership (if file is in user's folder)
 * 2. User role permissions
 * 3. File metadata validation
 */
async function checkFileAccess(
	s3Key: string,
	userId: string,
	userRole?: string
): Promise<{ allowed: boolean; reason?: string }> {
	try {
		// Extract user ID from S3 key path (format: users/{userId}/...)
		const keyParts = s3Key.split("/");
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			const fileOwnerId = keyParts[1];

			// Check 1: File ownership
			if (fileOwnerId !== userId) {
				// Check 2: Admin/Institution can access applicant files
				if (
					userRole === "admin" ||
					userRole === "institution" ||
					userRole === "moderator"
				) {
					return { allowed: true };
				}

				// Regular users can only access their own files
				return {
					allowed: false,
					reason: "You don't have permission to access this file",
				};
			}

			// Owner can always access their own files
			return { allowed: true };
		}

		// For files not in user folders, check metadata
		try {
			const headCommand = new HeadObjectCommand({
				Bucket: BUCKET_NAME,
				Key: s3Key,
			});

			const metadata = await s3Client.send(headCommand);

			// Check if file has userId in metadata
			if (metadata.Metadata?.userId) {
				if (metadata.Metadata.userId !== userId) {
					// Admin/Institution can access
					if (
						userRole === "admin" ||
						userRole === "institution" ||
						userRole === "moderator"
					) {
						return { allowed: true };
					}

					return {
						allowed: false,
						reason: "You don't have permission to access this file",
					};
				}
			}

			// If no ownership info, allow access (for backward compatibility)
			// But log it for security review
			// eslint-disable-next-line no-console
			console.warn(
				`⚠️ File access without ownership check: ${s3Key} by user ${userId}`
			);
			return { allowed: true };
		} catch (error) {
			// If we can't check metadata, deny access for security
			return {
				allowed: false,
				reason: "Unable to verify file permissions",
			};
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error checking file access:", error);
		return {
			allowed: false,
			reason: "Error checking file permissions",
		};
	}
}

/**
 * GET /api/files/protected-image-enhanced
 * Enhanced version with file ownership and permission checks
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

		// SECURITY CHECK: Verify user has permission to access this file
		const accessCheck = await checkFileAccess(s3Key, user.id, user.role);

		if (!accessCheck.allowed) {
			// Log unauthorized access attempt
			// eslint-disable-next-line no-console
			console.warn(
				`Unauthorized file access attempt: User ${user.id} tried to access ${s3Key}`
			);

			return NextResponse.json(
				{
					error: accessCheck.reason || "Access denied",
				},
				{ status: 403 }
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

		// For sensitive files, use shorter expiration
		// You can customize this based on file type or path
		const isSensitiveFile =
			s3Key.includes("/documents/") ||
			s3Key.includes("/private/") ||
			s3Key.includes("/confidential/");

		if (isSensitiveFile) {
			// Limit sensitive files to 1 hour max
			expiresIn = Math.min(expiresIn, 3600);
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

		// Log successful access (for audit trail)
		// eslint-disable-next-line no-console
		console.log(
			`✅ File access granted: User ${user.id} accessed ${s3Key} (expires in ${expiresIn}s)`
		);

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
