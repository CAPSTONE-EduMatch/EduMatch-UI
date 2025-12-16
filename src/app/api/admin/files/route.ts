import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
 * GET /api/admin/files
 * Admin-only file access endpoint
 *
 * Query parameters:
 * - url: The S3 URL or key of the file
 * - expiresIn: Expiration time in seconds (default: 3600, max: 86400 = 24 hours)
 *
 * This endpoint allows admins to access any file in the system.
 * It's simpler than the protected-image route and only checks:
 * 1. Authentication
 * 2. Admin role
 * 3. Generates presigned URL with timeout
 */
export async function GET(request: NextRequest) {
	try {
		// Step 1: Authenticate and verify session - requireAuth checks session validity
		const { user, session } = await requireAuth();

		// Step 2: Verify session exists and is valid
		if (!session || !user || !user.id) {
			return NextResponse.json(
				{ error: "Authentication required - No valid session found" },
				{ status: 401 }
			);
		}

		// Step 3: Verify admin role from database (role is fetched by requireAuth from DB)
		// Check both role field and email as fallback
		const isAdmin =
			user.role === "admin" || user.email === process.env.ADMIN_EMAIL;

		if (!isAdmin) {
			// eslint-disable-next-line no-console
			console.warn(
				`[Admin Files] 🚫 Access denied: User ${user.id} (${user.email}) with role "${user.role}" attempted to access admin files`
			);
			return NextResponse.json(
				{ error: "Forbidden - Admin access required" },
				{ status: 403 }
			);
		}

		// eslint-disable-next-line no-console
		console.log(
			`[Admin Files] ✅ Authenticated admin: User ${user.id} (${user.email}) with role "${user.role}"`
		);

		// Get URL from query parameters
		const searchParams = request.nextUrl.searchParams;
		const imageUrl = searchParams.get("url");
		const expiresInParam = searchParams.get("expiresIn");

		if (!imageUrl) {
			return NextResponse.json(
				{ error: "URL parameter is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL
		const s3Key = extractS3Key(imageUrl);

		if (!s3Key) {
			return NextResponse.json(
				{ error: "Invalid file URL format" },
				{ status: 400 }
			);
		}

		// Parse expiration time (default: 1 hour, max: 24 hours for admin)
		let expiresIn = 3600; // 1 hour default
		if (expiresInParam) {
			const parsed = parseInt(expiresInParam, 10);
			if (!isNaN(parsed) && parsed > 0) {
				// Clamp between 1 second and 24 hours (86400 seconds)
				expiresIn = Math.min(Math.max(parsed, 1), 86400);
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

		// eslint-disable-next-line no-console
		console.log(
			`[Admin Files] ✅ Admin ${user.id} accessing file ${s3Key} (expires in ${expiresIn}s)`
		);

		return NextResponse.json({
			url: presignedUrl,
			expiresIn,
			expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[Admin Files] Error:", error);

		if (
			error instanceof Error &&
			error.message === "Authentication required"
		) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to generate file access URL" },
			{ status: 500 }
		);
	}
}
