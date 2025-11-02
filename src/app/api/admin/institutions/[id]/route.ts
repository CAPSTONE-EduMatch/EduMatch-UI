import { requireAuth } from "@/lib/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../prisma/index";

// Get detailed information for a specific institution
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

		// Fetch institution with all related data
		const institution = await prismaClient.institution.findUnique({
			where: {
				institution_id: institutionId,
			},
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
					},
				},
				documents: {
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

		if (!institution) {
			return Response.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		// Calculate application statistics
		const allApplications = institution.posts.flatMap(
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
		];

		documentCategories.forEach((category) => {
			documentsByType[category] = [];
		});

		// Group documents by their type
		institution.documents.forEach((doc) => {
			const typeName = doc.documentType.name;
			if (!documentsByType[typeName]) {
				documentsByType[typeName] = [];
			}

			documentsByType[typeName].push({
				id: doc.document_id,
				name: doc.name,
				url: doc.url,
				size: doc.size,
				uploadedAt: doc.upload_at.toISOString(),
				type: {
					id: doc.documentType.document_type_id,
					name: doc.documentType.name,
					description: doc.documentType.description,
				},
			});
		});

		// Transform subdisciplines data
		const subdisciplines = institution.subdisciplines.map((item) => ({
			subdisciplineId: item.subdiscipline.subdiscipline_id,
			name: item.subdiscipline.name,
			discipline: {
				disciplineId: item.subdiscipline.discipline.discipline_id,
				name: item.subdiscipline.discipline.name,
			},
		}));

		// Determine status
		let status: "Active" | "Inactive" | "Suspended" = "Active";
		if (institution.user.banned) {
			status = "Suspended";
		} else if (!institution.user.status) {
			status = "Inactive";
		}

		// Build the response
		const institutionDetails = {
			id: institution.institution_id,
			name: institution.name,
			abbreviation: institution.abbreviation,
			type: institution.type,
			country: institution.country,
			address: institution.address,
			website: institution.website,
			email: institution.email || institution.user.email,
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
			userId: institution.user.id,
			userEmail: institution.user.email,
			userName: institution.user.name,
			userImage: null, // Add if available in user model

			// Status information
			status,
			banned: institution.user.banned || false,
			banReason: institution.user.banReason,
			banExpires: institution.user.banExpires?.toISOString(),
			createdAt: institution.user.createdAt.toISOString(),
			lastActive: institution.user.updatedAt?.toISOString(),

			// Documents grouped by category
			documents: {
				accreditationCertificates:
					documentsByType["Accreditation Certificate"] || [],
				operatingLicenses: documentsByType["Operating License"] || [],
				taxDocuments: documentsByType["Tax Document"] || [],
				representativeDocuments:
					documentsByType["Representative Document"] || [],
				otherDocuments: documentsByType["Other"] || [],
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
