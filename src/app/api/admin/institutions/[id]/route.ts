import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../prisma/index";

// Get detailed information for a specific institution
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const id = params.id;

		if (!id) {
			return Response.json(
				{
					success: false,
					error: "Institution ID is required",
				},
				{ status: 400 }
			);
		}

		// Determine if the ID is an institution_id or user_id
		// Both are now UUIDs, so we try institution_id first, then user_id
		// For backward compatibility, also check old format "institution_${userId}"
		let institution;
		if (id.startsWith("institution_")) {
			// Legacy format: extract user_id from "institution_${userId}"
			const userId = id.replace("institution_", "");
			institution = await prismaClient.institution.findFirst({
				where: { user_id: userId },
			});
		} else {
			// Try as institution_id first
			institution = await prismaClient.institution.findFirst({
				where: { institution_id: id },
			});
			// If not found, try as user_id
			if (!institution) {
				institution = await prismaClient.institution.findFirst({
					where: { user_id: id },
				});
			}
		}

		// If institution not found, return error
		if (!institution) {
			return Response.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		// Fetch institution with all related data
		const institutionWithRelations =
			await prismaClient.institution.findFirst({
				where: { institution_id: institution.institution_id },
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true,
							banned: true,
							status: true,
							banReason: true,
							banExpires: true,
							createdAt: true,
							updatedAt: true,
							image: true,
						},
					},
					documents: {
						where: {
							status: true, // Only fetch active documents, matching institution profile behavior
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
					},
					subdisciplines: {
						include: {
							subdiscipline: {
								select: {
									subdiscipline_id: true,
									name: true,
									discipline: {
										select: {
											discipline_id: true,
											name: true,
										},
									},
								},
							},
						},
					},
					posts: {
						include: {
							applications: {
								select: {
									application_id: true,
									status: true,
									apply_at: true,
								},
							},
						},
					},
				},
			});

		// Ensure institutionWithRelations is not null
		if (!institutionWithRelations) {
			return Response.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		// Calculate application statistics
		const allApplications = institutionWithRelations.posts.flatMap(
			(post) => post.applications
		);
		const totalApplications = allApplications.length;
		const acceptedApplications = allApplications.filter(
			(app) => app.status === "ACCEPTED"
		).length;
		const pendingApplications = allApplications.filter(
			(app) => app.status === "SUBMITTED"
		).length;
		const rejectedApplications = allApplications.filter(
			(app) => app.status === "REJECTED"
		).length;

		// Group documents by type
		const documentsByType: Record<string, any[]> = {};

		// Initialize document categories
		const documentCategories = [
			"Accreditation Certificate",
			"Operating License",
			"Tax Document",
			"Representative Document",
			"Other",
			"Institution Verification", // Include verification documents
		];

		documentCategories.forEach((category) => {
			documentsByType[category] = [];
		});

		// Group documents by their type and transform to match InstitutionDocument interface
		institutionWithRelations.documents.forEach((doc) => {
			const typeName = doc.documentType.name;
			if (!documentsByType[typeName]) {
				documentsByType[typeName] = [];
			}

			// Transform to match InstitutionDocument interface
			documentsByType[typeName].push({
				documentId: doc.document_id,
				name: doc.name,
				url: doc.url,
				size: doc.size,
				uploadDate: doc.upload_at.toISOString(),
				documentType: doc.documentType.name, // String instead of nested object
			});
		});

		// Transform subdisciplines data
		const subdisciplines = institutionWithRelations.subdisciplines.map(
			(item) => ({
				subdisciplineId: item.subdiscipline.subdiscipline_id,
				name: item.subdiscipline.name,
				discipline: {
					disciplineId: item.subdiscipline.discipline.discipline_id,
					name: item.subdiscipline.discipline.name,
				},
			})
		);

		// Determine status based on verification_status first, then user status
		let status:
			| "Active"
			| "Inactive"
			| "Suspended"
			| "Pending"
			| "Rejected"
			| "Require Update"
			| "Updated" = "Active";
		if (institutionWithRelations.user.banned) {
			status = "Suspended";
		} else if (institutionWithRelations.verification_status === "PENDING") {
			status = "Pending";
		} else if (
			institutionWithRelations.verification_status === "REJECTED"
		) {
			status = "Rejected";
		} else if (
			institutionWithRelations.verification_status === "REQUIRE_UPDATE"
		) {
			// Institutions requiring updates should show as "Require Update"
			status = "Require Update";
		} else if ((institution.verification_status as string) === "UPDATED") {
			// Institutions that have updated their profile need admin review
			status = "Updated";
		} else if (
			institutionWithRelations.verification_status === "APPROVED"
		) {
			// Approved institutions show as "Active" if user status is true
			status = institutionWithRelations.user.status
				? "Active"
				: "Inactive";
		} else if (!institutionWithRelations.user.status) {
			status = "Inactive";
		}

		// Build the response
		const institutionDetails = {
			id: institutionWithRelations.institution_id,
			name: institutionWithRelations.name,
			abbreviation: institution.abbreviation,
			type: institution.type,
			country: institution.country,
			address: institution.address,
			website: institution.website,
			email:
				institutionWithRelations.email ||
				institutionWithRelations.user.email,
			hotline: institution.hotline,
			hotlineCode: institution.hotline_code,
			logo: institution.logo,
			coverImage: institution.cover_image,
			about: institution.about,

			// Representative information
			repName: institution.rep_name,
			repAppellation: institution.rep_appellation,
			repPosition: institution.rep_position,
			repEmail: institution.rep_email,
			repPhone: institution.rep_phone,
			repPhoneCode: institution.rep_phone_code,

			// User account information
			userId: institutionWithRelations.user.id,
			userEmail: institutionWithRelations.user.email,
			userName: institutionWithRelations.user.name,
			userImage: institutionWithRelations.user.image,

			// Status information
			status,
			banned: institutionWithRelations.user.banned || false,
			banReason: institutionWithRelations.user.banReason,
			banExpires: institutionWithRelations.user.banExpires?.toISOString(),
			createdAt: institutionWithRelations.user.createdAt.toISOString(),
			lastActive: institutionWithRelations.user.updatedAt?.toISOString(),

			// Verification information
			verification_status:
				institutionWithRelations.verification_status || "PENDING",
			submitted_at: institution.submitted_at?.toISOString() || null,
			verified_at: institution.verified_at?.toISOString() || null,
			verified_by: institution.verified_by || null,
			rejection_reason: institution.rejection_reason || null,

			// Documents grouped by category
			documents: {
				accreditationCertificates:
					documentsByType["Accreditation Certificate"] || [],
				operatingLicenses: documentsByType["Operating License"] || [],
				taxDocuments: documentsByType["Tax Document"] || [],
				representativeDocuments:
					documentsByType["Representative Document"] || [],
				otherDocuments: documentsByType["Other"] || [],
				verificationDocuments:
					documentsByType["Institution Verification"] || [],
			},

			// Academic information
			subdisciplines,

			// Statistics
			stats: {
				totalApplications,
				acceptedApplications,
				pendingApplications,
				rejectedApplications,
			},
		};

		return Response.json({
			success: true,
			data: institutionDetails,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching institution details:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to fetch institution details",
			},
			{ status: 500 }
		);
	}
}
