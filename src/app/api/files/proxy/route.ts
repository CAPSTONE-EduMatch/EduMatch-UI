import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/utils/auth/auth-utils";
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
			// Remove query parameters
			return urlObj.pathname.substring(1);
		}

		// Handle direct key
		if (!url.startsWith("http")) {
			return url;
		}

		// Handle https://bucket.s3.amazonaws.com/key format
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
 * GET /api/files/proxy
 * Proxy file access for MESSAGING FILES ONLY
 *
 * This endpoint is specifically for files shared in messages.
 * It allows access based on messaging relationships.
 *
 * For application documents, use /api/files/document instead.
 *
 * Query parameters:
 * - url: The S3 URL or key of the file
 * - disposition: "inline" or "attachment" (default: "attachment")
 */
export async function GET(request: NextRequest) {
	try {
		// Check authentication - user MUST be logged in
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{
					error: "Authentication required. Please log in to access this file.",
				},
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const fileUrl = searchParams.get("url");
		const disposition = searchParams.get("disposition") || "attachment"; // "inline" or "attachment"

		if (!fileUrl) {
			return NextResponse.json(
				{ error: "File URL is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL
		const s3Key = extractS3Key(fileUrl);

		// eslint-disable-next-line no-console
		console.log(`[Proxy] File URL: ${fileUrl}, Extracted S3 Key: ${s3Key}`);

		if (!s3Key) {
			return NextResponse.json(
				{ error: "Invalid file URL format" },
				{ status: 400 }
			);
		}

		// SECURITY CHECK: Ownership validation for messaging files
		const keyParts = s3Key.split("/");

		// Handle different S3 key patterns:
		// 1. users/{userId}/... - user-owned files
		// 2. uploads/{userId}/... - uploaded files (alternative pattern)
		let fileOwnerId: string | null = null;
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			fileOwnerId = keyParts[1];
		} else if (keyParts.length >= 2 && keyParts[0] === "uploads") {
			// Extract user ID from uploads folder (format: uploads/{userId}/...)
			fileOwnerId = keyParts[1];
		}

		// If we can identify the file owner, perform security checks
		if (fileOwnerId) {
			// SECURITY: For applicants, ensure they can only access their own files
			if (user.role === "applicant" && fileOwnerId !== user.id) {
				// Applicant trying to access another user's file
				// Check if they have a messaging relationship
				let hasMessagingRelationship = false;
				try {
					hasMessagingRelationship =
						await checkMessagingRelationshipInAppSync(
							user.id,
							fileOwnerId
						);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(
						"[Proxy] Error checking AppSync threads:",
						error
					);
					hasMessagingRelationship = false;
				}

				if (!hasMessagingRelationship) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Proxy] 🚫 Denied: Applicant ${user.id} tried to access file owned by ${fileOwnerId} without messaging relationship`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}
				// Has messaging relationship - allow access
				// eslint-disable-next-line no-console
				console.log(
					`[Proxy] ✅ Allowed: Applicant has messaging relationship with file owner`
				);
			}

			// Allow access if:
			// 1. User owns the file, OR
			// 2. Users are messaging each other (for message files)
			if (fileOwnerId !== user.id) {
				// Check for messaging relationship
				let hasMessagingRelationship = false;
				try {
					hasMessagingRelationship =
						await checkMessagingRelationshipInAppSync(
							user.id,
							fileOwnerId
						);
					// eslint-disable-next-line no-console
					console.log(
						`[Proxy] AppSync Thread check: ${hasMessagingRelationship ? "Found" : "Not found"}`
					);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(
						"[Proxy] Error checking AppSync threads:",
						error
					);
					// Fail closed for messaging check errors
					hasMessagingRelationship = false;
				}

				if (!hasMessagingRelationship) {
					// No messaging relationship - deny access
					// eslint-disable-next-line no-console
					console.warn(
						`[Proxy] 🚫 Denied: User ${user.id} tried to access file owned by ${fileOwnerId} without messaging relationship`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}
				// Has messaging relationship - allow access
				// eslint-disable-next-line no-console
				console.log(
					`[Proxy] ✅ Allowed: Users have messaging relationship`
				);
			}
		} else {
			// File doesn't match known patterns (users/ or uploads/)
			// For messaging files, we need to know the owner
			// Deny access if we can't identify the owner
			// eslint-disable-next-line no-console
			console.warn(
				`[Proxy] 🚫 Denied: Cannot identify file owner from S3 key pattern`
			);
			return NextResponse.json(
				{
					error: "You don't have permission to access this file",
				},
				{ status: 403 }
			);
		}

		// Get file from S3
		// eslint-disable-next-line no-console
		console.log(
			`[Proxy] Attempting to fetch from S3 - Bucket: ${BUCKET_NAME}, Key: ${s3Key}, Region: ${process.env.REGION || "us-east-1"}`
		);

		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		let response;
		try {
			response = await s3Client.send(command);
		} catch (s3Error: any) {
			// eslint-disable-next-line no-console
			console.error("[Proxy] S3 Error:", {
				name: s3Error?.name,
				message: s3Error?.message,
				code: s3Error?.Code,
				$metadata: s3Error?.$metadata,
				s3Key,
				bucket: BUCKET_NAME,
			});

			// Handle specific S3 errors
			if (
				s3Error?.name === "NoSuchKey" ||
				s3Error?.Code === "NoSuchKey"
			) {
				return NextResponse.json(
					{ error: "File not found in S3" },
					{ status: 404 }
				);
			}

			if (
				s3Error?.name === "AccessDenied" ||
				s3Error?.Code === "AccessDenied"
			) {
				// eslint-disable-next-line no-console
				console.error(
					`[Proxy] 🚫 S3 Access Denied for key: ${s3Key}, bucket: ${BUCKET_NAME}`
				);
				return NextResponse.json(
					{
						error: "Access denied to file. Please check S3 permissions.",
						details:
							"The server does not have permission to access this file in S3.",
					},
					{ status: 403 }
				);
			}

			throw s3Error; // Re-throw other errors
		}

		if (!response.Body) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 }
			);
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = [];
		const reader = response.Body.transformToWebStream().getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}

		const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

		// Extract filename from S3 key for Content-Disposition header
		const fileName = s3Key.split("/").pop() || "download";
		// Use "inline" for viewing, "attachment" for downloading
		const contentDisposition = `${disposition}; filename="${encodeURIComponent(fileName)}"`;

		// Return file with proper headers
		return new NextResponse(buffer, {
			headers: {
				"Content-Type":
					response.ContentType || "application/octet-stream",
				"Content-Length":
					response.ContentLength?.toString() ||
					buffer.length.toString(),
				"Content-Disposition": contentDisposition,
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
				// Prevent caching to ensure session is checked every time
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ File Proxy Error:", error);

		return NextResponse.json(
			{
				error: "Failed to access file",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
