import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/utils/auth/auth-utils";
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
 * Proxy file access with session validation
 *
 * This endpoint requires the user to be logged in and have an active session.
 * Files are streamed through the API, so they won't work in incognito without login.
 *
 * Query parameters:
 * - url: The S3 URL or key of the file
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

		// SECURITY CHECK: Ownership validation
		const keyParts = s3Key.split("/");
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			const fileOwnerId = keyParts[1];

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

						// Only allow if file owner is an applicant (not another institution)
						if (
							fileOwner?.role === "applicant" ||
							fileOwner?.applicant
						) {
							// Allow access - institution/admin can access applicant files
						} else {
							// eslint-disable-next-line no-console
							console.warn(
								`🚫 Unauthorized file access: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId} (${fileOwner?.role}). No messaging relationship and not an applicant file.`
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
							`🚫 Unauthorized file access: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId}. Has messaging relationship: ${hasMessagingRelationship}`
						);
						return NextResponse.json(
							{
								error: "You don't have permission to access this file",
							},
							{ status: 403 }
						);
					}
				}
				// If hasMessagingRelationship is true, allow access (continue to fetch file)
			}
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
