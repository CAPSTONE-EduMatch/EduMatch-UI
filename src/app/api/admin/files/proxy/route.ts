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
 * GET /api/admin/files/proxy
 * Admin-only file proxy endpoint
 *
 * Query parameters:
 * - url: The S3 URL or key of the file
 * - disposition: "inline" (preview) or "attachment" (download) - default: "inline"
 *
 * This endpoint:
 * 1. Checks authentication and admin role on EVERY request
 * 2. Streams file from S3 directly to user
 * 3. Does NOT generate shareable presigned URLs
 * 4. Requires valid session for each access
 */
export async function GET(request: NextRequest) {
	try {
		// Step 1: Authenticate and verify session
		const { user, session } = await requireAuth();

		// Step 2: Verify session exists and is valid
		if (!session || !user || !user.id) {
			return NextResponse.json(
				{ error: "Authentication required - No valid session found" },
				{ status: 401 }
			);
		}

		// Step 3: Verify admin role from database
		const isAdmin =
			user.role === "admin" || user.email === process.env.ADMIN_EMAIL;

		if (!isAdmin) {
			// eslint-disable-next-line no-console
			console.warn(
				`[Admin Files Proxy] 🚫 Access denied: User ${user.id} (${user.email}) with role "${user.role}" attempted to access admin files`
			);
			return NextResponse.json(
				{ error: "Forbidden - Admin access required" },
				{ status: 403 }
			);
		}

		// Get URL from query parameters
		const searchParams = request.nextUrl.searchParams;
		const fileUrl = searchParams.get("url");
		const disposition = searchParams.get("disposition") || "inline";

		if (!fileUrl) {
			return NextResponse.json(
				{ error: "URL parameter is required" },
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

		// eslint-disable-next-line no-console
		console.log(
			`[Admin Files Proxy] ✅ Admin ${user.id} accessing file ${s3Key} (disposition: ${disposition})`
		);

		// Create GetObject command
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		// Get file from S3
		const response = await s3Client.send(command);

		if (!response.Body) {
			return NextResponse.json(
				{ error: "File not found or empty" },
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

		// Determine content type
		const contentType = response.ContentType || "application/octet-stream";

		// Get filename from S3 key or use default
		const filename = s3Key.split("/").pop() || "file";

		// Return file with appropriate headers
		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
				"Content-Length": buffer.length.toString(),
				"Cache-Control": "no-store, no-cache, must-revalidate, private",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[Admin Files Proxy] Error:", error);

		if (
			error instanceof Error &&
			error.message === "Authentication required"
		) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Handle S3 errors
		if (error instanceof Error && error.name === "NoSuchKey") {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to access file" },
			{ status: 500 }
		);
	}
}
