import { AdminUserService } from "@/services/admin/admin-user-service";
import { getDocumentService } from "@/services/document/document-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string; documentId: string } }
) {
	try {
		const userId = params.id;
		const documentId = params.documentId;

		// Get user's documents from database
		const documents = await AdminUserService.getApplicantDocuments(userId);

		// Find the specific document
		const document = documents.find(
			(doc) => doc.document_id === documentId || doc.name === documentId
		);

		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 }
			);
		}

		// Get document service instance
		const documentService = getDocumentService();

		try {
			// Stream the document from S3
			const { stream, contentType, filename } =
				await documentService.streamDocument(document.url);

			// Convert ReadableStream to Response
			return new NextResponse(stream, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Content-Disposition": `attachment; filename="${filename}"`,
					"Cache-Control": "private, no-cache",
				},
			});
		} catch (s3Error) {
			// If S3 fails, try to generate a presigned URL as fallback
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.warn(
					"S3 streaming failed, attempting presigned URL:",
					s3Error
				);
			}

			try {
				const presignedUrl =
					await documentService.getPresignedDownloadUrl(document.url);

				// Redirect to presigned URL
				return NextResponse.redirect(presignedUrl);
			} catch (presignedError) {
				if (process.env.NODE_ENV === "development") {
					// eslint-disable-next-line no-console
					console.error(
						"Presigned URL generation failed:",
						presignedError
					);
				}

				return NextResponse.json(
					{ error: "Document temporarily unavailable" },
					{ status: 503 }
				);
			}
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error downloading document:", error);
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
