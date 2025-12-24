import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

export async function POST(request: NextRequest) {
	try {
		// Check authentication using optimized auth utilities
		const { user } = await requireAuth();

		const { fileName, fileType, fileSize } = await request.json();

		if (!fileName || !fileType) {
			return NextResponse.json(
				{ error: "File name and type are required" },
				{ status: 400 }
			);
		}

		// Validate file size (10MB max)
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
		if (fileSize && fileSize > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "File size exceeds 10MB limit" },
				{ status: 413 }
			);
		}

		// Generate unique file name to prevent conflicts
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const fileExtension = fileName.split(".").pop();
		const uniqueFileName = `uploads/${user.id}/${timestamp}-${randomString}.${fileExtension}`;

		// Create the S3 command
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: uniqueFileName,
			ContentType: fileType,
			Metadata: {
				userId: user.id,
				originalName: fileName,
				uploadedAt: new Date().toISOString(),
			},
			// Make object private - prevents direct public access
			// Direct S3 URLs will return 403 Forbidden without pre-signed URL
			ACL: "private",
		});

		// Generate pre-signed URL (expires in 1 hour)
		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600, // 1 hour
		});

		return NextResponse.json({
			presignedUrl,
			fileName: uniqueFileName,
			originalFileName: fileName,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		return NextResponse.json(
			{ error: "Failed to generate upload URL" },
			{ status: 500 }
		);
	}
}
