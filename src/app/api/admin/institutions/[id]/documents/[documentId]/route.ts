import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../../../prisma/index";

// Download a specific document
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string; documentId: string } }
) {
	try {
		// Authenticate user and check admin permissions
		const { user: currentUser } = await requireAuth();

		// Verify admin role
		if (
			currentUser.role !== "admin" &&
			currentUser.email !== process.env.ADMIN_EMAIL
		) {
			return Response.json(
				{
					success: false,
					error: "Forbidden - Admin access required",
				},
				{ status: 403 }
			);
		}

		const institutionId = params.id;
		const documentId = params.documentId;

		if (!institutionId || !documentId) {
			return Response.json(
				{
					success: false,
					error: "Institution ID and Document ID are required",
				},
				{ status: 400 }
			);
		}

		// Find the document
		const document = await prismaClient.institutionDocument.findFirst({
			where: {
				document_id: documentId,
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

		if (!document) {
			return Response.json(
				{
					success: false,
					error: "Document not found",
				},
				{ status: 404 }
			);
		}

		// In a real implementation, you would:
		// 1. Validate the file URL/path
		// 2. Fetch the actual file from your storage service (S3, etc.)
		// 3. Return the file as a stream

		// For now, we'll redirect to the document URL
		// This assumes the URL is a direct link to the file
		if (document.url.startsWith("http")) {
			return Response.redirect(document.url);
		}

		// Or return the document info for client-side handling
		return Response.json({
			success: true,
			data: {
				id: document.document_id,
				name: document.name,
				url: document.url,
				size: document.size,
				uploadedAt: document.upload_at.toISOString(),
				institutionName: document.institution.name,
				documentType: document.documentType.name,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error downloading document:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to download document",
			},
			{ status: 500 }
		);
	}
}
