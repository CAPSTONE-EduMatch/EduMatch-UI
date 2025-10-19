import { NextRequest, NextResponse } from "next/server";
import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { auth } from "@/app/lib/auth";

const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

// Configuration for file upload limits
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "5242880"); // 5MB default

// Configure route to handle larger file uploads (up to 10MB)
export const runtime = "nodejs";
export const maxDuration = 30;

// Helper function for multipart upload (for files > 5MB)
async function uploadLargeFile(
	buffer: Buffer,
	fileName: string,
	contentType: string
) {
	const chunkSize = CHUNK_SIZE; // Use configured chunk size
	const chunks = [];

	for (let i = 0; i < buffer.length; i += chunkSize) {
		chunks.push(buffer.slice(i, i + chunkSize));
	}

	// Create multipart upload
	const createCommand = new CreateMultipartUploadCommand({
		Bucket: BUCKET_NAME,
		Key: fileName,
		ContentType: contentType,
	});

	const { UploadId } = await s3Client.send(createCommand);

	// Upload parts
	const uploadPromises = chunks.map(async (chunk, index) => {
		const uploadCommand = new UploadPartCommand({
			Bucket: BUCKET_NAME,
			Key: fileName,
			PartNumber: index + 1,
			UploadId,
			Body: chunk,
		});

		const result = await s3Client.send(uploadCommand);
		return {
			ETag: result.ETag,
			PartNumber: index + 1,
		};
	});

	const parts = await Promise.all(uploadPromises);

	// Complete multipart upload
	const completeCommand = new CompleteMultipartUploadCommand({
		Bucket: BUCKET_NAME,
		Key: fileName,
		UploadId,
		MultipartUpload: { Parts: parts },
	});

	await s3Client.send(completeCommand);
}

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

		// Check content length before processing
		const contentLength = request.headers.get("content-length");
		if (contentLength) {
			const sizeInBytes = parseInt(contentLength);
			const sizeInMB = sizeInBytes / (1024 * 1024);
			// eslint-disable-next-line no-console
			console.log(`📁 S3 Upload: Request size: ${sizeInMB.toFixed(2)}MB`);

			if (sizeInBytes > MAX_FILE_SIZE) {
				return NextResponse.json(
					{
						error: `Request size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
					},
					{ status: 413 }
				);
			}
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

		// eslint-disable-next-line no-console
		console.log(
			`📁 S3 Upload: File ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
		);

		// Validate file size using environment configuration
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
				},
				{ status: 413 }
			);
		}

		// Generate unique filename with user-based structure
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const fileExtension = file.name.split(".").pop();
		const fileName = `users/${session.user.id}/uploads/${timestamp}_${randomString}.${fileExtension}`;

		// Convert file to buffer
		const buffer = Buffer.from(await file.arrayBuffer());

		// Use multipart upload for files larger than chunk size
		if (file.size > CHUNK_SIZE) {
			// eslint-disable-next-line no-console
			console.log(`📁 S3 Upload: Using multipart upload for large file`);
			await uploadLargeFile(buffer, fileName, file.type);
		} else {
			// Use regular upload for smaller files
			const command = new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: fileName,
				Body: buffer,
				ContentType: file.type,
			});

			await s3Client.send(command);
		}

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
		// eslint-disable-next-line no-console
		console.error("❌ S3 Upload Error:", error);

		// Check if it's a 413 error from the server
		if (error instanceof Error && error.message.includes("413")) {
			return NextResponse.json(
				{
					error: "File too large. Please reduce file size and try again.",
				},
				{ status: 413 }
			);
		}

		// Check if it's a network or timeout error
		if (
			error instanceof Error &&
			(error.message.includes("timeout") ||
				error.message.includes("network"))
		) {
			return NextResponse.json(
				{
					error: "Upload timeout. Please try again with a smaller file.",
				},
				{ status: 408 }
			);
		}

		// Generic S3 upload error
		return NextResponse.json(
			{
				error: "Failed to upload file",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
