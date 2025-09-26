import { NextRequest, NextResponse } from "next/server";
import { generatePresignedPost, generateFileKey } from "@/lib/s3-service";
import { getFileCategory, getFileExtension } from "@/lib/file-utils";

export async function POST(request: NextRequest) {
	try {
		// For testing, use a mock user ID
		const userId = "test-user-123";

		const { fileName, fileType, fileSize, category } = await request.json();

		if (!fileName || !fileType) {
			return NextResponse.json(
				{ error: "File name and type are required" },
				{ status: 400 }
			);
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (fileSize > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 10MB limit" },
				{ status: 400 }
			);
		}

		// Generate unique key for the file
		const key = generateFileKey(
			userId,
			fileType,
			fileName,
			category || "uploads"
		);

		// Generate presigned POST for upload
		const { url, fields } = await generatePresignedPost(
			key,
			fileType,
			maxSize,
			300 // 5 minutes
		);

		return NextResponse.json({
			uploadUrl: url,
			fields,
			key,
			fileInfo: {
				name: fileName,
				type: getFileCategory(getFileExtension(fileName)),
				size: fileSize,
				mimeType: fileType,
				extension: getFileExtension(fileName),
			},
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to generate upload URL" },
			{ status: 500 }
		);
	}
}
