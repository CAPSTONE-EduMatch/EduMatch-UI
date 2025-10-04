import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/app/lib/auth";

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
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const category = (formData.get("category") as string) || "uploads";

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 10MB limit" },
				{ status: 400 }
			);
		}

		// Generate unique filename with user-based structure
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const fileExtension = file.name.split(".").pop();
		const fileName = `users/${session.user.id}/uploads/${timestamp}_${randomString}.${fileExtension}`;

		// Convert file to buffer
		const buffer = Buffer.from(await file.arrayBuffer());

		// Upload to S3
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: fileName,
			Body: buffer,
			ContentType: file.type,
		});

		await s3Client.send(command);

		// Generate the public URL
		const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

		// Return file metadata (NO database save)
		return NextResponse.json({
			success: true,
			url: fileUrl,
			fileName: fileName,
			originalName: file.name,
			fileSize: file.size,
			fileType: file.type,
			category: category,
			// Add unique ID for form state management
			id: `${timestamp}-${randomString}`,
		});
	} catch (error) {
		// S3 upload error occurred
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
