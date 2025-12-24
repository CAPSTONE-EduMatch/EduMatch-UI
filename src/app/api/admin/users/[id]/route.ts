import { AdminUserService } from "@/services/admin/admin-user-service";
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

/**
 * Extract S3 key from URL
 */
function extractS3Key(url: string): string | null {
	if (!url) return null;

	// Handle s3:// protocol
	if (url.startsWith("s3://")) {
		const parts = url.replace("s3://", "").split("/");
		parts.shift(); // Remove bucket name
		return parts.join("/");
	}

	// Handle https://bucket.s3.region.amazonaws.com/key format
	if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
		try {
			const urlObj = new URL(url);
			return urlObj.pathname.substring(1); // Remove leading slash
		} catch {
			return null;
		}
	}

	return null;
}

/**
 * Generate signed URL for S3 image
 */
async function getSignedImageUrl(
	imageUrl: string | null | undefined
): Promise<string> {
	if (!imageUrl) return "";

	// If it's a public URL (not S3), return as is
	if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
		if (
			!imageUrl.includes("s3.amazonaws.com") &&
			!imageUrl.includes("s3://")
		) {
			return imageUrl; // Public URL (e.g., Google)
		}
	}

	// If it's a local path (e.g., /profile.svg), return as is
	if (imageUrl.startsWith("/")) {
		return imageUrl;
	}

	// Extract S3 key
	const s3Key = extractS3Key(imageUrl);
	if (!s3Key) return imageUrl; // Can't parse, return original

	try {
		// Generate signed URL
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		const signedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600, // 1 hour
		});

		return signedUrl;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error signing S3 URL:", error);
		return imageUrl; // Return original on error
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;

		// Fetch user data from database
		const dbUser = await AdminUserService.getUserDetails(userId);

		if (!dbUser) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		// Transform database data to frontend format
		const userData = AdminUserService.transformUserData(dbUser);

		// Sign the profile image URL if it's an S3 URL
		if (userData && userData.profileImage) {
			userData.profileImage = await getSignedImageUrl(
				userData.profileImage
			);
		}

		return NextResponse.json({
			success: true,
			data: userData,
		});
	} catch (error) {
		// Log error in development environment
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching user details:", error);
			// eslint-disable-next-line no-console
			console.error(
				"Error details:",
				error instanceof Error ? error.message : String(error)
			);
			// eslint-disable-next-line no-console
			if (error instanceof Error && error.stack) {
				// eslint-disable-next-line no-console
				console.error("Error stack:", error.stack);
			}
		}
		return NextResponse.json(
			{
				error: "Internal server error",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
