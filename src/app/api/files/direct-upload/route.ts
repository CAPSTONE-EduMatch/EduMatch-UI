import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { getFileCategory, getFileExtension } from "@/lib/file-utils";

const prisma = new PrismaClient();

const s3Client = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "edumatch-uploads";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "Only image files are allowed" },
				{ status: 400 }
			);
		}

		// Validate file size (5MB limit)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 5MB limit" },
				{ status: 400 }
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const fileExtension = file.name.split(".").pop();
		const fileName = `profile-photos/${timestamp}-${randomString}.${fileExtension}`;

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

		// Save minimal data to database
		const userId = "test-user-123"; // For testing

		// Ensure test user exists
		await prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: {
				id: userId,
				email: `test-${userId}@example.com`,
				name: "Test User",
			},
		});

		// Save file record with minimal data
		const savedFile = await prisma.file.create({
			data: {
				name: file.name,
				originalName: file.name,
				key: fileName,
				bucket: BUCKET_NAME,
				url: fileUrl,
				userId: userId,
				category: "profile-photo", // or pass as parameter
			},
		});

		return NextResponse.json({
			success: true,
			url: fileUrl,
			fileName: fileName,
			fileSize: file.size,
			fileType: file.type,
			fileId: savedFile.id, // Return the database ID
		});
	} catch (error) {
		console.error("Direct upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
