import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getFileCategory, getFileExtension } from "@/lib/file-utils";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
	try {
		// For testing, use a mock user ID
		const userId = "test-user-123";

		const { key, fileName, fileSize, fileType, folderId, category } =
			await request.json();

		if (!key || !fileName || !fileSize || !fileType) {
			return NextResponse.json(
				{ error: "Missing required file information" },
				{ status: 400 }
			);
		}

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

		// Create file record in database
		const bucketName =
			process.env.AWS_S3_BUCKET_NAME || "edumatch-files-12";
		const region = process.env.AWS_REGION || "us-east-1";
		const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

		console.log("Creating file with URL:", fileUrl);
		console.log("File data:", {
			name: fileName,
			originalName: fileName,
			key,
			bucket: bucketName,
			size: fileSize,
			mimeType: fileType,
			extension: getFileExtension(fileName),
			category: category || getFileCategory(getFileExtension(fileName)),
			url: fileUrl,
			userId: userId,
			folderId: folderId || null,
		});

		const file = await prisma.file.create({
			data: {
				name: fileName,
				originalName: fileName,
				key,
				bucket: bucketName,
				size: fileSize,
				mimeType: fileType,
				extension: getFileExtension(fileName),
				category:
					category || getFileCategory(getFileExtension(fileName)),
				url: fileUrl,
				userId: userId,
				folderId: folderId || null,
			},
		});

		return NextResponse.json({
			success: true,
			file: {
				id: file.id,
				name: file.name,
				originalName: file.originalName,
				type: file.category,
				size: file.size,
				url: file.url,
				category: file.category,
				createdAt: file.createdAt,
			},
		});
	} catch (error) {
		console.error("File confirmation error:", error);
		console.error("Error details:", {
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Check if it's a Prisma validation error
		if (
			error instanceof Error &&
			error.message.includes("Unique constraint")
		) {
			return NextResponse.json(
				{
					error: "File with this key already exists",
					details: error.message,
				},
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to confirm file upload",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
