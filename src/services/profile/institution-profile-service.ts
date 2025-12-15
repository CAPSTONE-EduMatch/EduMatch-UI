import { prismaClient } from "../../../prisma";
import { randomUUID } from "crypto";

// Institution-specific form data interface
export interface InstitutionProfileFormData {
	// Basic info
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	email: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	profilePhoto: string;

	// Institution specific fields
	institutionName: string;
	institutionAbbreviation: string;
	institutionHotline: string;
	institutionHotlineCode: string;
	institutionType: string;
	institutionWebsite: string;
	institutionEmail: string;
	institutionCountry: string;
	institutionAddress: string;
	representativeName: string;
	representativeAppellation: string;
	representativePosition: string;
	representativeEmail: string;
	representativePhone: string;
	representativePhoneCode: string;
	aboutInstitution: string;
	institutionDisciplines: string[];
	institutionLogo: string; // Institution logo (small brand mark)
	institutionCoverImage: string; // Institution cover image (large banner)
	institutionVerificationDocuments: any[];
}

// Database response interface - matches Prisma schema exactly
export interface InstitutionProfile {
	institution_id: string;
	name: string;
	abbreviation: string | null;
	hotline: string;
	hotline_code: string | null;
	type: string;
	website: string | null;
	email: string | null;
	country: string;
	address: string;
	rep_name: string;
	rep_appellation: string | null;
	rep_position: string;
	rep_email: string;
	rep_phone: string;
	rep_phone_code: string | null;
	about: string;
	logo: string | null;
	cover_image: string | null;
	user_id: string;
	verification_status?:
		| "PENDING"
		| "APPROVED"
		| "REJECTED"
		| "REQUIRE_UPDATE"
		| "UPDATED";
	rejection_reason?: string | null;
	submitted_at?: Date | null;
	verified_at?: Date | null;
	verified_by?: string | null;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
	documents: Array<{
		document_id: string;
		name: string;
		url: string;
		size: number;
		documentType: {
			document_type_id: string;
			name: string;
		};
	}>;
	subdisciplines: Array<{
		subdiscipline: {
			subdiscipline_id: string;
			name: string;
			discipline: {
				discipline_id: string;
				name: string;
			};
		};
		status: boolean;
	}>;
}

export class InstitutionProfileService {
	/**
	 * Check if user has an institution profile
	 */
	static async hasProfile(userId: string): Promise<boolean> {
		try {
			const profile = await this.getProfile(userId);
			return !!profile;
		} catch (error) {
			console.error("InstitutionProfileService.hasProfile error:", error);
			return false;
		}
	}

	/**
	 * Get institution profile
	 */
	static async getProfile(
		userId: string
	): Promise<InstitutionProfile | null> {
		try {
			// First try to get active profile
			let institution = await prismaClient.institution.findFirst({
				where: {
					user_id: userId,
					verification_status: "APPROVED", // Only get approved profiles
				},
				include: {
					user: true,
					documents: {
						where: {
							status: true, // Only get active documents
						},
						include: {
							documentType: true,
						},
					},
					subdisciplines: {
						include: {
							subdiscipline: {
								include: {
									discipline: true,
								},
							},
						},
					},
				},
			});

			// If no active profile found, try without status filter
			// This allows fetching PENDING and REJECTED profiles
			// PENDING profiles should remain PENDING until admin approval
			// REJECTED profiles should remain REJECTED so institutions can see the rejection reason
			if (!institution) {
				institution = await prismaClient.institution.findFirst({
					where: {
						user_id: userId,
						// Don't filter by status - get any profile (including PENDING and REJECTED)
					},
					include: {
						user: true,
						documents: {
							where: {
								status: true, // Only get active documents
							},
							include: {
								documentType: true,
							},
						},
						subdisciplines: {
							include: {
								subdiscipline: {
									include: {
										discipline: true,
									},
								},
							},
						},
					},
				});

				// DO NOT auto-approve PENDING profiles - they must go through admin verification
				// REJECTED profiles are returned as-is so the institution can see the rejection reason
			}

			return institution;
		} catch (error) {
			console.error("InstitutionProfileService.getProfile error:", error);
			return null;
		}
	}

	/**
	 * Create or update institution profile
	 */
	static async upsertProfile(
		userId: string,
		formData: InstitutionProfileFormData
	): Promise<InstitutionProfile | null> {
		// SECURITY: Ensure formData doesn't contain userId that could override
		if ((formData as any).userId || (formData as any).user_id) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ SECURITY: formData contains userId/user_id. This should not happen.",
				{
					userId,
					formDataUserId:
						(formData as any).userId || (formData as any).user_id,
				}
			);
			delete (formData as any).userId;
			delete (formData as any).user_id;
		}
		try {
			console.log(
				"🔄 InstitutionProfileService: Starting profile upsert for user:",
				userId
			);

			// Helper function to extract string value from form data
			const getStringValue = (value: any): string => {
				if (typeof value === "string") return value;
				if (value && typeof value === "object" && value.value)
					return value.value;
				return "";
			};

			// Validate required fields
			const requiredFields = {
				name: getStringValue(formData.institutionName),
				hotline: getStringValue(formData.institutionHotline),
				type: getStringValue(formData.institutionType),
				country: getStringValue(formData.institutionCountry),
				address: getStringValue(formData.institutionAddress),
				rep_name: getStringValue(formData.representativeName),
				rep_position: getStringValue(formData.representativePosition),
				rep_email: getStringValue(
					formData.representativeEmail || formData.institutionEmail
				),
				rep_phone: getStringValue(formData.representativePhone),
				about: getStringValue(formData.aboutInstitution),
			};

			const missingFields = Object.entries(requiredFields)
				.filter(
					([, value]) =>
						!value ||
						(typeof value === "string" && value.trim() === "")
				)
				.map(([key]) => key);

			if (missingFields.length > 0) {
				console.error(
					"❌ InstitutionProfileService: Missing required fields:",
					missingFields
				);
				throw new Error(
					`Missing required fields: ${missingFields.join(", ")}`
				);
			}

			console.log(
				"✅ InstitutionProfileService: All required fields validated"
			);

			// Check if institution already exists
			const existingInstitution =
				await prismaClient.institution.findUnique({
					where: { user_id: userId },
				});

			// Determine if we should reset verification status
			// - If REJECTED: reset to PENDING
			// - If REQUIRE_UPDATE: don't reset - let the profile route handle it (will set to UPDATED)
			// - If APPROVED: keep as APPROVED (don't change)
			const currentStatus = existingInstitution?.verification_status as
				| string
				| undefined;
			const shouldResetVerification = currentStatus === "REJECTED";

			// Create or update institution
			// IMPORTANT: New institutions created through the create profile page
			// must always have verification_status set to PENDING
			const institution = await prismaClient.institution.upsert({
				where: { user_id: userId },
				update: {
					name: requiredFields.name,
					abbreviation:
						getStringValue(formData.institutionAbbreviation) ||
						null,
					hotline: requiredFields.hotline,
					hotline_code:
						getStringValue(formData.institutionHotlineCode) || null,
					type: requiredFields.type,
					website:
						getStringValue(formData.institutionWebsite) || null,
					email: getStringValue(formData.institutionEmail) || null,
					country: requiredFields.country,
					address: requiredFields.address,
					rep_name: requiredFields.rep_name,
					rep_appellation:
						getStringValue(formData.representativeAppellation) ||
						null,
					rep_position: requiredFields.rep_position,
					rep_email: requiredFields.rep_email,
					rep_phone: requiredFields.rep_phone,
					rep_phone_code:
						getStringValue(formData.representativePhoneCode) ||
						null,
					about: requiredFields.about,
					logo:
						getStringValue(formData.institutionLogo) ||
						getStringValue(formData.profilePhoto) ||
						null,
					cover_image:
						getStringValue(formData.institutionCoverImage) || null,
					// If resubmitting after rejection or require_update, reset verification status to PENDING
					...(shouldResetVerification && {
						verification_status: "PENDING",
						submitted_at: new Date(),
						rejection_reason: null,
						verified_at: null,
						verified_by: null,
					}),
				},
				create: {
					institution_id: randomUUID(),
					user_id: userId,
					name: requiredFields.name,
					abbreviation:
						getStringValue(formData.institutionAbbreviation) ||
						null,
					hotline: requiredFields.hotline,
					hotline_code:
						getStringValue(formData.institutionHotlineCode) || null,
					type: requiredFields.type,
					website:
						getStringValue(formData.institutionWebsite) || null,
					email: getStringValue(formData.institutionEmail) || null,
					country: requiredFields.country,
					address: requiredFields.address,
					rep_name: requiredFields.rep_name,
					rep_appellation:
						getStringValue(formData.representativeAppellation) ||
						null,
					rep_position: requiredFields.rep_position,
					rep_email: requiredFields.rep_email,
					rep_phone: requiredFields.rep_phone,
					rep_phone_code:
						getStringValue(formData.representativePhoneCode) ||
						null,
					about: requiredFields.about,
					logo:
						getStringValue(formData.institutionLogo) ||
						getStringValue(formData.profilePhoto) ||
						null,
					cover_image:
						getStringValue(formData.institutionCoverImage) || null,
					// CRITICAL: New institutions must always start with PENDING status
					// This ensures all new institution profiles go through admin verification
					verification_status: "PENDING",
					submitted_at: new Date(),
				},
			});

			console.log(
				"✅ InstitutionProfileService: Institution created/updated:",
				institution.institution_id
			);

			// Profile photo is now saved to institution.logo field (not user.image)
			// This is already handled in the upsert above

			// Handle institution disciplines - only update if provided
			if (formData.institutionDisciplines !== undefined) {
				if (formData.institutionDisciplines.length > 0) {
					// Clear existing disciplines
					await prismaClient.institutionSubdiscipline.deleteMany({
						where: { institution_id: institution.institution_id },
					});

					// Add new disciplines
					for (const disciplineName of formData.institutionDisciplines) {
						const subdiscipline =
							await prismaClient.subdiscipline.findFirst({
								where: { name: disciplineName },
							});

						if (subdiscipline) {
							await prismaClient.institutionSubdiscipline.create({
								data: {
									institution_id: institution.institution_id,
									subdiscipline_id:
										subdiscipline.subdiscipline_id,
									add_at: new Date(),
									status: true, // InstitutionSubdiscipline.status is boolean
								},
							});
							console.log(
								"✅ InstitutionProfileService: Added discipline:",
								disciplineName
							);
						} else {
							console.warn(
								"⚠️ InstitutionProfileService: Subdiscipline not found:",
								disciplineName
							);
						}
					}
				} else {
					// Empty array means remove all disciplines
					await prismaClient.institutionSubdiscipline.deleteMany({
						where: { institution_id: institution.institution_id },
					});
					console.log(
						"🗑️ InstitutionProfileService: Cleared all disciplines"
					);
				}
			} else {
				// undefined means don't change disciplines
				console.log(
					"📄 InstitutionProfileService: Preserving existing disciplines"
				);
			}

			// Handle documents
			await this.handleDocuments(institution.institution_id, formData);

			// Return updated profile
			return (await this.getProfile(userId)) as InstitutionProfile;
		} catch (error) {
			console.error(
				"❌ InstitutionProfileService: Error creating institution profile:",
				error
			);
			return null;
		}
	}

	/**
	 * Handle institution document uploads
	 */
	private static async handleDocuments(
		institutionId: string,
		formData: InstitutionProfileFormData
	): Promise<void> {
		try {
			// Only handle new documents if explicitly provided
			// Don't delete existing documents unless specifically requested
			if (
				!formData.institutionVerificationDocuments ||
				formData.institutionVerificationDocuments.length === 0
			) {
				// No documents to add, keep existing ones
				console.log(
					"📄 InstitutionProfileService: No new documents to add, preserving existing"
				);
				return;
			}

			// Get or create document type for verification documents
			const verificationDocType = await this.getOrCreateDocumentType(
				"Institution Verification"
			);

			// Save all documents directly to database without checking duplicates
			for (const file of formData.institutionVerificationDocuments) {
				// Create document entry
				await prismaClient.institutionDocument.create({
					data: {
						document_id: file.id || randomUUID(),
						institution_id: institutionId,
						document_type_id: verificationDocType.document_type_id,
						name:
							file.name ||
							file.originalName ||
							"Verification Document",
						url: file.url || "",
						size: file.size || file.fileSize || 0,
						upload_at: new Date(),
						status: true,
					},
				});
				console.log(
					"✅ InstitutionProfileService: Saved document to database:",
					file.name
				);
			}
		} catch (error) {
			console.error("Error handling institution documents:", error);
		}
	}

	/**
	 * Get or create document type
	 */
	private static async getOrCreateDocumentType(name: string) {
		let docType = await prismaClient.documentType.findFirst({
			where: { name },
		});

		if (!docType) {
			docType = await prismaClient.documentType.create({
				data: {
					document_type_id: randomUUID(),
					name,
					description: `Document type for ${name}`,
				},
			});
		}

		return docType;
	}

	/**
	 * Delete institution profile (soft delete)
	 */
	static async deleteProfile(userId: string): Promise<boolean> {
		try {
			await prismaClient.institution.update({
				where: { user_id: userId },
				data: {
					verification_status: "REJECTED",
					deleted_at: new Date(),
				},
			});
			return true;
		} catch (error) {
			console.error("Error soft deleting institution profile:", error);
			return false;
		}
	}

	/**
	 * Check if profile is complete
	 */
	static isProfileComplete(profile: InstitutionProfile): boolean {
		return !!(
			profile.name?.trim() &&
			profile.rep_name?.trim() &&
			profile.rep_email?.trim()
		);
	}

	/**
	 * Get profile completion percentage
	 */
	static getProfileCompletionPercentage(profile: InstitutionProfile): number {
		const fields = [
			profile.name,
			profile.abbreviation,
			profile.hotline,
			profile.type,
			profile.country,
			profile.address,
			profile.rep_name,
			profile.rep_position,
			profile.rep_email,
			profile.rep_phone,
			profile.about,
		];
		const completed = fields.filter((field) => field?.trim()).length;
		return Math.round((completed / fields.length) * 100);
	}
}
