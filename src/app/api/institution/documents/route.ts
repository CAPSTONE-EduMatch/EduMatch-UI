import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

export async function POST(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = user.id;
		const { documents } = await request.json();

		// Get user's institution (regardless of verification status)
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
			},
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution profile not found" },
				{ status: 404 }
			);
		}

		// Get or create document type for verification documents
		let docType = await prismaClient.documentType.findFirst({
			where: { name: "Institution Verification" },
		});

		if (!docType) {
			docType = await prismaClient.documentType.create({
				data: {
					document_type_id: `doctype_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					name: "Institution Verification",
					description: "Document type for Institution Verification",
				},
			});
		}

		// Save documents to database
		const savedDocuments = [];
		for (const doc of documents) {
			const savedDoc = await prismaClient.institutionDocument.create({
				data: {
					document_id:
						doc.id ||
						`doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					institution_id: institution.institution_id,
					document_type_id: docType.document_type_id,
					name:
						doc.name || doc.originalName || "Verification Document",
					url: doc.url || "",
					size: doc.size || doc.fileSize || 0,
					upload_at: new Date(),
					status: true,
				},
			});
			savedDocuments.push(savedDoc);
		}

		return NextResponse.json({
			success: true,
			message: "Documents uploaded successfully",
			documents: savedDocuments,
		});
	} catch (error) {
		console.error("Error uploading documents:", error);
		return NextResponse.json(
			{ error: "Failed to upload documents" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = user.id;

		// Get user's institution (regardless of verification status)
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
			},
			select: {
				institution_id: true,
			},
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution profile not found" },
				{ status: 404 }
			);
		}

		// Get document type for "Institution Verification"
		const docType = await prismaClient.documentType.findFirst({
			where: { name: "Institution Verification" },
		});

		// Fetch only verification documents
		const verificationDocuments =
			await prismaClient.institutionDocument.findMany({
				where: {
					institution_id: institution.institution_id,
					status: true,
					...(docType && {
						document_type_id: docType.document_type_id,
					}),
				},
				include: {
					documentType: true,
				},
				orderBy: {
					upload_at: "desc",
				},
			});

		return NextResponse.json({
			documents: verificationDocuments,
		});
	} catch (error) {
		console.error("Error fetching documents:", error);
		return NextResponse.json(
			{ error: "Failed to fetch documents" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = user.id;
		const { searchParams } = new URL(request.url);
		const documentId = searchParams.get("documentId");

		if (!documentId) {
			return NextResponse.json(
				{ error: "Document ID is required" },
				{ status: 400 }
			);
		}

		// Get user's institution
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
			},
			select: {
				institution_id: true,
			},
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution profile not found" },
				{ status: 404 }
			);
		}

		// Find the document and verify it belongs to this institution
		const document = await prismaClient.institutionDocument.findFirst({
			where: {
				document_id: documentId,
				institution_id: institution.institution_id,
				status: true, // Only delete active documents
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 }
			);
		}

		// Soft delete the document
		await prismaClient.institutionDocument.update({
			where: {
				document_id: documentId,
			},
			data: {
				status: false,
				deleted_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Document deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting document:", error);
		return NextResponse.json(
			{ error: "Failed to delete document" },
			{ status: 500 }
		);
	}
}
