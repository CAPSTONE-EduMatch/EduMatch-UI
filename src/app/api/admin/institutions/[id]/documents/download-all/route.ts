import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../../../prisma/index";

// Download all documents for an institution as a ZIP file
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Authenticate user and check admin permissions
		const { user: currentUser } = await requireAuth();

		const institutionId = params.id;

		if (!institutionId) {
			return Response.json(
				{
					success: false,
					error: "Institution ID is required",
				},
				{ status: 400 }
			);
		}

		// Find all documents for the institution
		const documents = await prismaClient.institutionDocument.findMany({
			where: {
				institution_id: institutionId,
			},
			include: {
				institution: {
					select: {
						name: true,
					},
				},
				documentType: {
					select: {
						name: true,
					},
				},
			},
		});

		if (documents.length === 0) {
			return Response.json(
				{
					success: false,
					error: "No documents found for this institution",
				},
				{ status: 404 }
			);
		}

		// In a real implementation, you would:
		// 1. Create a ZIP file containing all documents
		// 2. Use a library like JSZip to create the archive
		// 3. Stream the ZIP file to the client

		// For now, we'll return the list of documents
		// The client can handle downloading them individually
		const documentList = documents.map((doc: any) => ({
			id: doc.document_id,
			name: doc.name,
			url: doc.url,
			size: doc.size,
			uploadedAt: doc.upload_at.toISOString(),
			type: doc.documentType.name,
		}));

		return Response.json({
			success: true,
			data: {
				institutionName: documents[0]?.institution.name || "Unknown",
				documents: documentList,
				totalSize: documents.reduce(
					(sum: number, doc: any) => sum + doc.size,
					0
				),
				totalCount: documents.length,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error downloading all documents:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to download documents",
			},
			{ status: 500 }
		);
	}
}
