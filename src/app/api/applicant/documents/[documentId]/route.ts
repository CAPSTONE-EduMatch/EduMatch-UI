import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../../prisma";

interface RouteParams {
	params: {
		documentId: string;
	};
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
		const { documentId } = params;

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

		// Check if document belongs to the applicant
		const document = await prismaClient.applicantDocument.findFirst({
			where: {
				document_id: documentId,
				applicant_id: applicant.applicant_id,
				status: true, // Only active documents
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
