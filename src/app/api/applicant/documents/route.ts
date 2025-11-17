import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma";

export async function GET() {
	try {
		// Get session from auth
		const session = await requireAuth();

		if (!session) {
			return NextResponse.json(
				{ success: false, error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		// Get applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (!applicant) {
			return NextResponse.json(
				{ success: false, error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Fetch documents with document type information
		const documents = await prismaClient.applicantDocument.findMany({
			where: {
				applicant_id: applicant.applicant_id,
				status: true, // Only active documents
			},
			include: {
				documentType: {
					select: {
						document_type_id: true,
						name: true,
						description: true,
					},
				},
			},
			orderBy: {
				upload_at: "desc",
			},
		});

		return NextResponse.json({
			success: true,
			documents: documents.map((doc) => ({
				document_id: doc.document_id,
				applicant_id: doc.applicant_id,
				document_type_id: doc.document_type_id,
				name: doc.name,
				url: doc.url,
				size: doc.size,
				upload_at: doc.upload_at.toISOString(),
				subdiscipline: doc.subdiscipline,
				title: doc.title,
				status: doc.status,
				documentType: doc.documentType,
			})),
		});
	} catch (error) {
		console.error("Failed to fetch applicant documents:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		// Get session from auth
		const session = await requireAuth();

		if (!session) {
			return NextResponse.json(
				{ success: false, error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		// Get applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (!applicant) {
			return NextResponse.json(
				{ success: false, error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Get document ID from URL path
		const url = new URL(request.url);
		const documentId = url.pathname.split("/").pop();

		if (!documentId) {
			return NextResponse.json(
				{ success: false, error: "Document ID is required" },
				{ status: 400 }
			);
		}

		// Check if document belongs to the applicant
		const document = await prismaClient.applicantDocument.findFirst({
			where: {
				document_id: documentId,
				applicant_id: applicant.applicant_id,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ success: false, error: "Document not found" },
				{ status: 404 }
			);
		}

		// Soft delete the document
		await prismaClient.applicantDocument.update({
			where: { document_id: documentId },
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
		console.error("Failed to delete applicant document:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
