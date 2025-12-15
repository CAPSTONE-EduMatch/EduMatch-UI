import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

/**
 * Extract S3 key from various URL formats
 */
function extractS3Key(url: string): string | null {
	try {
		// Handle s3:// protocol
		if (url.startsWith("s3://")) {
			const parts = url.replace("s3://", "").split("/");
			parts.shift(); // Remove bucket name
			return parts.join("/");
		}

		// Handle https://bucket.s3.region.amazonaws.com/key format
		if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
			const urlObj = new URL(url);
			// Remove query parameters
			return urlObj.pathname.substring(1);
		}

		// Handle direct key
		if (!url.startsWith("http")) {
			return url;
		}

		// Handle https://bucket.s3.amazonaws.com/key format
		if (url.includes(".s3.amazonaws.com/")) {
			const urlObj = new URL(url);
			return urlObj.pathname.substring(1);
		}

		return null;
	} catch (error) {
		return null;
	}
}

/**
 * GET /api/files/document
 * Strict document access for application documents only
 * This route does NOT allow messaging-based access - only application ownership
 *
 * Query parameters:
 * - url: The S3 URL or key of the document
 * - disposition: "inline" or "attachment" (default: "attachment")
 */
export async function GET(request: NextRequest) {
	try {
		// Check authentication - user MUST be logged in
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{
					error: "Authentication required. Please log in to access this file.",
				},
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const fileUrl = searchParams.get("url");
		const disposition = searchParams.get("disposition") || "attachment"; // "inline" or "attachment"

		if (!fileUrl) {
			return NextResponse.json(
				{ error: "File URL is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL - this is what we'll use for comparison
		const s3Key = extractS3Key(fileUrl);

		if (!s3Key) {
			return NextResponse.json(
				{ error: "Invalid file URL format" },
				{ status: 400 }
			);
		}

		// Helper function to extract S3 key from a URL stored in database
		const getS3KeyFromUrl = (dbUrl: string): string | null => {
			return extractS3Key(dbUrl);
		};

		// Validate access based on user role
		if (user.role === "institution") {
			const institution = await prismaClient.institution.findUnique({
				where: { user_id: user.id },
				select: { institution_id: true },
			});

			if (!institution) {
				return NextResponse.json(
					{
						error: "You don't have permission to access this file",
					},
					{ status: 403 }
				);
			}

			// SECURITY: Strict validation for application documents
			// Check if this document is part of an application that belongs to this institution

			// First, check ApplicationDetail (uploaded documents)
			// Compare by S3 key since URLs might be stored in different formats
			const allApplicationDetails =
				await prismaClient.applicationDetail.findMany({
					where: {
						application: {
							post: {
								institution_id: institution.institution_id,
							},
						},
					},
					include: {
						application: {
							include: {
								post: {
									select: { institution_id: true },
								},
								applicant: {
									select: {
										applicant_id: true,
										user_id: true,
									},
								},
							},
						},
					},
				});

			// Find matching document by comparing S3 keys
			const applicationDetail = allApplicationDetails.find((detail) => {
				const detailS3Key = getS3KeyFromUrl(detail.url);
				return detailS3Key === s3Key;
			});

			if (applicationDetail) {
				// Check if it belongs to this institution's application
				if (
					applicationDetail.application.post.institution_id !==
					institution.institution_id
				) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Institution ${user.id} tried to access document from another institution's application`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}
				// Document belongs to institution's application - allow
				// eslint-disable-next-line no-console
				console.log(
					`[Document API] ✅ Allowed: Application document belongs to institution's application`
				);
			} else {
				// Not in ApplicationDetail, check if it's in ApplicantDocument and part of a snapshot
				// SECURITY: Strict validation - document must be in a snapshot for an application to THIS institution's post
				// This ensures institutions can only access documents from applicants who applied to their specific posts

				// STEP 1: Only fetch snapshots for applications to THIS institution's posts
				// This is the primary security filter - we never check snapshots from other institutions
				const institutionSnapshots =
					await prismaClient.applicationProfileSnapshot.findMany({
						where: {
							application: {
								post: {
									institution_id: institution.institution_id,
								},
							},
						},
						select: {
							snapshot_id: true,
							application_id: true,
							document_ids: true,
							application: {
								select: {
									application_id: true,
									post_id: true,
									post: {
										select: {
											post_id: true,
											institution_id: true,
										},
									},
									applicant: {
										select: {
											applicant_id: true,
											user_id: true,
										},
									},
								},
							},
						},
					});

				if (institutionSnapshots.length === 0) {
					// No snapshots for this institution - deny access immediately
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Institution ${institution.institution_id} has no application snapshots. S3 Key: ${s3Key}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// STEP 2: Extract all document IDs from snapshots for this institution
				// This gives us the set of document IDs that are valid for this institution
				const validDocumentIds = new Set<string>();
				for (const snapshot of institutionSnapshots) {
					if (!snapshot.document_ids) continue;

					let documentIds: string[] = [];
					const docIds: any = snapshot.document_ids;
					if (Array.isArray(docIds)) {
						documentIds = docIds.filter(
							(id: any) => id && typeof id === "string"
						);
					} else if (typeof docIds === "string") {
						const idsString = (docIds as string).replace(
							/[{}]/g,
							""
						);
						documentIds = idsString
							.split(",")
							.map((id: string) => id.trim())
							.filter((id: string) => id);
					}

					documentIds.forEach((id) => validDocumentIds.add(id));
				}

				if (validDocumentIds.size === 0) {
					// No documents in snapshots for this institution
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: No documents found in snapshots for institution ${institution.institution_id}. S3 Key: ${s3Key}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// STEP 3: Get applicant IDs from snapshots to limit ApplicantDocument query
				const applicantIds = new Set(
					institutionSnapshots.map(
						(snapshot) =>
							snapshot.application.applicant.applicant_id
					)
				);

				// STEP 4: Fetch ApplicantDocuments only for applicants who applied to this institution
				// AND only fetch documents that are in the valid document IDs set
				const allApplicantDocuments =
					await prismaClient.applicantDocument.findMany({
						where: {
							applicant_id: {
								in: Array.from(applicantIds),
							},
							document_id: {
								in: Array.from(validDocumentIds),
							},
						},
						select: {
							document_id: true,
							applicant_id: true,
							url: true,
						},
					});

				// STEP 5: Find matching document by comparing S3 keys
				const applicantDocument = allApplicantDocuments.find((doc) => {
					const docS3Key = getS3KeyFromUrl(doc.url);
					return docS3Key === s3Key;
				});

				if (!applicantDocument) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Document not found in ApplicantDocument for applicants who applied to institution ${institution.institution_id}. S3 Key: ${s3Key}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// STEP 6: Verify the document is in a snapshot for THIS institution's post
				// Find snapshots that contain this specific document_id
				const snapshotsWithDocument = institutionSnapshots.filter(
					(snapshot) => {
						if (!snapshot.document_ids) return false;

						let documentIds: string[] = [];
						const docIds: any = snapshot.document_ids;
						if (Array.isArray(docIds)) {
							documentIds = docIds.filter(
								(id: any) => id && typeof id === "string"
							);
						} else if (typeof docIds === "string") {
							const idsString = (docIds as string).replace(
								/[{}]/g,
								""
							);
							documentIds = idsString
								.split(",")
								.map((id: string) => id.trim())
								.filter((id: string) => id);
						}

						return documentIds.includes(
							applicantDocument.document_id
						);
					}
				);

				if (snapshotsWithDocument.length === 0) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Document ${applicantDocument.document_id} (S3 key: ${s3Key}) is not in any snapshot for institution ${institution.institution_id}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// STEP 7: FINAL VERIFICATION - Ensure at least one snapshot's application.post belongs to this institution
				// Since we already filtered by institution_id in the query, this should always pass, but we verify explicitly
				const validSnapshot = snapshotsWithDocument.find(
					(snapshot) =>
						snapshot.application.post.institution_id ===
						institution.institution_id
				);

				if (!validSnapshot) {
					// This should never happen since we filtered by institution_id, but we check anyway
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: No valid snapshot found for institution ${institution.institution_id}. Document: ${applicantDocument.document_id}, S3 Key: ${s3Key}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// Document is verified to be in a snapshot for an application to this institution's post - allow
				// eslint-disable-next-line no-console
				console.log(
					`[Document API] ✅ Allowed: Document is in institution's application snapshot (application_id: ${validSnapshot.application.application_id}, post_id: ${validSnapshot.application.post_id}, institution_id: ${institution.institution_id}, document_id: ${applicantDocument.document_id})`
				);
			}
		} else if (user.role === "applicant") {
			const applicant = await prismaClient.applicant.findUnique({
				where: { user_id: user.id },
				select: { applicant_id: true },
			});

			if (!applicant) {
				return NextResponse.json(
					{
						error: "You don't have permission to access this file",
					},
					{ status: 403 }
				);
			}

			// SECURITY: Check if this document is part of an application that belongs to this applicant

			// First, check ApplicationDetail (uploaded documents)
			// Compare by S3 key since URLs might be stored in different formats
			const allApplicationDetails =
				await prismaClient.applicationDetail.findMany({
					where: {
						application: {
							applicant_id: applicant.applicant_id,
						},
					},
					include: {
						application: {
							include: {
								post: {
									select: { institution_id: true },
								},
								applicant: {
									select: {
										applicant_id: true,
										user_id: true,
									},
								},
							},
						},
					},
				});

			// Find matching document by comparing S3 keys
			const applicationDetail = allApplicationDetails.find((detail) => {
				const detailS3Key = getS3KeyFromUrl(detail.url);
				return detailS3Key === s3Key;
			});

			if (applicationDetail) {
				// Document belongs to applicant's application - allow
				// eslint-disable-next-line no-console
				console.log(
					`[Document API] ✅ Allowed: Applicant accessing their own application document`
				);
			} else {
				// Not in ApplicationDetail, check if it's in ApplicantDocument and part of a snapshot
				// for an application that belongs to this applicant
				// Fetch all applicant documents for this applicant and compare by S3 key
				const allApplicantDocuments =
					await prismaClient.applicantDocument.findMany({
						where: {
							applicant_id: applicant.applicant_id,
						},
						select: {
							document_id: true,
							applicant_id: true,
							url: true,
						},
					});

				// Find matching document by comparing S3 keys
				const applicantDocument = allApplicantDocuments.find((doc) => {
					const docS3Key = getS3KeyFromUrl(doc.url);
					return docS3Key === s3Key;
				});

				if (!applicantDocument) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Applicant ${user.id} tried to access document that doesn't belong to them`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// Check if this document is in a snapshot for an application that belongs to this applicant
				// Fetch all snapshots for this applicant and check in JavaScript
				// This is more reliable than using Prisma's `has` operator with JSON arrays
				const applicantSnapshots =
					await prismaClient.applicationProfileSnapshot.findMany({
						where: {
							application: {
								applicant_id: applicant.applicant_id,
							},
						},
						select: {
							snapshot_id: true,
							document_ids: true,
							application: {
								select: {
									application_id: true,
									post: {
										select: { institution_id: true },
									},
									applicant: {
										select: {
											applicant_id: true,
											user_id: true,
										},
									},
								},
							},
						},
					});

				// Check if the document_id is in any of the snapshots' document_ids
				let snapshotWithDocument = null;
				for (const snapshot of applicantSnapshots) {
					if (!snapshot.document_ids) continue;

					// Handle both array and string formats
					let documentIds: string[] = [];
					const docIds: any = snapshot.document_ids;
					if (Array.isArray(docIds)) {
						documentIds = docIds.filter(
							(id: any) => id && typeof id === "string"
						);
					} else if (typeof docIds === "string") {
						// Parse comma-separated string (remove curly braces if present)
						const idsString = (docIds as string).replace(
							/[{}]/g,
							""
						);
						documentIds = idsString
							.split(",")
							.map((id: string) => id.trim())
							.filter((id: string) => id);
					}

					if (documentIds.includes(applicantDocument.document_id)) {
						snapshotWithDocument = snapshot;
						break;
					}
				}

				if (!snapshotWithDocument) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Document API] 🚫 Denied: Document ${fileUrl} (document_id: ${applicantDocument.document_id}) is not part of any application snapshot for applicant ${applicant.applicant_id}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}

				// Document is in applicant's application snapshot - allow
				// eslint-disable-next-line no-console
				console.log(
					`[Document API] ✅ Allowed: Document is in applicant's application snapshot (application_id: ${snapshotWithDocument.application.application_id})`
				);
			}
		} else {
			// SECURITY: Only applicants and institutions can access documents through this route
			// Admins, moderators, and other roles are NOT allowed to access documents via links
			// This ensures documents can only be accessed by:
			// 1. The applicant (owner) who uploaded the document
			// 2. The institution that received the application containing the document
			// eslint-disable-next-line no-console
			console.warn(
				`[Document API] 🚫 Denied: User ${user.id} with role ${user.role} tried to access document. Only applicants and institutions can access documents through this route.`
			);
			return NextResponse.json(
				{
					error: "You don't have permission to access this file. Only the document owner (applicant) and the institution that received their application can access documents.",
				},
				{ status: 403 }
			);
		}

		// Get file from S3
		// eslint-disable-next-line no-console
		console.log(
			`[Document API] Fetching from S3 - Bucket: ${BUCKET_NAME}, Key: ${s3Key}`
		);

		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		let response;
		try {
			response = await s3Client.send(command);
		} catch (s3Error: any) {
			// eslint-disable-next-line no-console
			console.error("[Document API] S3 Error:", {
				name: s3Error?.name,
				message: s3Error?.message,
				code: s3Error?.Code,
				s3Key,
				bucket: BUCKET_NAME,
			});

			if (
				s3Error?.name === "NoSuchKey" ||
				s3Error?.Code === "NoSuchKey"
			) {
				return NextResponse.json(
					{ error: "File not found in S3" },
					{ status: 404 }
				);
			}

			if (
				s3Error?.name === "AccessDenied" ||
				s3Error?.Code === "AccessDenied"
			) {
				return NextResponse.json(
					{
						error: "Access denied to file. Please check S3 permissions.",
					},
					{ status: 403 }
				);
			}

			throw s3Error;
		}

		if (!response.Body) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 }
			);
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = [];
		const reader = response.Body.transformToWebStream().getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}

		const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

		// Extract filename from S3 key for Content-Disposition header
		const fileName = s3Key.split("/").pop() || "download";
		const contentDisposition = `${disposition}; filename="${encodeURIComponent(fileName)}"`;

		// Return file with proper headers
		return new NextResponse(buffer, {
			headers: {
				"Content-Type":
					response.ContentType || "application/octet-stream",
				"Content-Length":
					response.ContentLength?.toString() ||
					buffer.length.toString(),
				"Content-Disposition": contentDisposition,
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Document API Error:", error);

		return NextResponse.json(
			{
				error: "Failed to access file",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
