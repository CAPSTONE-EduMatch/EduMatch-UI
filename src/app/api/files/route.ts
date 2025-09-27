import { generatePresignedGetUrl } from "@/lib/s3-service";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma";

// GET /api/files - List user's files
export async function GET(request: NextRequest) {
	try {
		// For testing, use a mock user ID
		const userId = "test-user-123";

		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const folderId = searchParams.get("folderId");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "50");

		const where: any = {
			userId: userId,
		};

		if (category) {
			where.category = category;
		}

		if (folderId) {
			where.folderId = folderId;
		}

		const files = await prismaClient.file.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		});

		// Generate presigned URLs for private files
		const filesWithUrls = await Promise.all(
			files.map(async (file) => {
				let viewUrl = file.url;
				if (!file.isPublic) {
					try {
						viewUrl = await generatePresignedGetUrl(file.key, 3600); // 1 hour
					} catch (error) {
						console.error("Error generating presigned URL:", error);
					}
				}

				return {
					id: file.id,
					name: file.name,
					originalName: file.originalName,
					type: file.category,
					size: file.size,
					mimeType: file.mimeType,
					extension: file.extension,
					url: viewUrl,
					isPublic: file.isPublic,
					folderId: file.folderId,
					createdAt: file.createdAt,
					updatedAt: file.updatedAt,
				};
			})
		);

		const total = await prismaClient.file.count({ where });

		return NextResponse.json({
			files: filesWithUrls,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching files:", error);
		return NextResponse.json(
			{ error: "Failed to fetch files" },
			{ status: 500 }
		);
	}
}

// DELETE /api/files - Delete a file
// export async function DELETE(request: NextRequest) {
// 	try {
// 		const session = await auth();
// 		if (!session?.user?.id) {
// 			return NextResponse.json(
// 				{ error: "Unauthorized" },
// 				{ status: 401 }
// 			);
// 		}

// 		const { searchParams } = new URL(request.url);
// 		const fileId = searchParams.get("id");

// 		if (!fileId) {
// 			return NextResponse.json(
// 				{ error: "File ID is required" },
// 				{ status: 400 }
// 			);
// 		}

// 		// Find the file and verify ownership
// 		const file = await prisma.file.findFirst({
// 			where: {
// 				id: fileId,
// 				userId: session.user.id,
// 			},
// 		});

// 		if (!file) {
// 			return NextResponse.json(
// 				{ error: "File not found" },
// 				{ status: 404 }
// 			);
// 		}

// 		// Delete from S3 (you might want to add this to the S3 service)
// 		// await deleteFileFromS3(file.key)

// 		// Delete from database
// 		await prisma.file.delete({
// 			where: { id: fileId },
// 		});

// 		return NextResponse.json({ success: true });
// 	} catch (error) {
// 		console.error("Error deleting file:", error);
// 		return NextResponse.json(
// 			{ error: "Failed to delete file" },
// 			{ status: 500 }
// 		);
// 	}
// }
