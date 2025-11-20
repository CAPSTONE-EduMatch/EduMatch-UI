import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/utils/auth/auth-utils";

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

		if (!fileUrl) {
			return NextResponse.json(
				{ error: "File URL is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL
		const s3Key = extractS3Key(fileUrl);

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
			// 2. User is admin/institution (can access applicant files)
			if (fileOwnerId !== user.id) {
				const isAuthorizedRole =
					user.role === "admin" ||
					user.role === "institution" ||
					user.role === "moderator";

				if (!isAuthorizedRole) {
					// eslint-disable-next-line no-console
					console.warn(
						`🚫 Unauthorized file access: User ${user.id} tried to access ${s3Key}`
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

		// Get file from S3
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		const response = await s3Client.send(command);

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

		// Return file with proper headers
		return new NextResponse(buffer, {
			headers: {
				"Content-Type":
					response.ContentType || "application/octet-stream",
				"Content-Length":
					response.ContentLength?.toString() ||
					buffer.length.toString(),
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
