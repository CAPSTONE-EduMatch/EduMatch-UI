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

		// Get user's institution
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
				verification_status: "APPROVED",
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

		// Get user's institution documents
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: userId,
				verification_status: "APPROVED",
			},
			include: {
				documents: {
					where: {
						status: true,
					},
					include: {
						documentType: true,
					},
				},
			},
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution profile not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			documents: institution.documents,
		});
	} catch (error) {
		console.error("Error fetching documents:", error);
		return NextResponse.json(
			{ error: "Failed to fetch documents" },
			{ status: 500 }
		);
	}
}
