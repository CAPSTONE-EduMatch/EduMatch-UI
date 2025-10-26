import { prismaClient } from "../../prisma";

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
			const institution = await prismaClient.institution.findFirst({
				where: {
					user_id: userId,
					status: true, // Only get active profiles
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

			// Create or update institution
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
					logo: getStringValue(formData.institutionLogo) || null,
					cover_image:
						getStringValue(formData.institutionCoverImage) || null,
				},
				create: {
					institution_id: `institution_${userId}`,
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
					logo: getStringValue(formData.institutionLogo) || null,
					cover_image:
						getStringValue(formData.institutionCoverImage) || null,
				},
			});

			console.log(
				"✅ InstitutionProfileService: Institution created/updated:",
				institution.institution_id
			);

			// Update user image
			const profilePhoto = getStringValue(formData.profilePhoto);
			if (profilePhoto) {
				await prismaClient.user.update({
					where: { id: userId },
					data: { image: profilePhoto },
				});
			}

			// Handle institution disciplines
			if (
				formData.institutionDisciplines &&
				formData.institutionDisciplines.length > 0
			) {
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
								status: true,
							},
						});
					}
				}
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
			// Soft delete existing documents first to avoid duplicates
			await prismaClient.institutionDocument.updateMany({
				where: {
					institution_id: institutionId,
					status: true, // Only soft delete active documents
				},
				data: {
					status: false,
					deleted_at: new Date(),
				},
			});

			// Get or create document type for verification documents
			const verificationDocType = await this.getOrCreateDocumentType(
				"Institution Verification"
			);

			// Handle verification documents
			if (
				formData.institutionVerificationDocuments &&
				formData.institutionVerificationDocuments.length > 0
			) {
				for (const file of formData.institutionVerificationDocuments) {
					await prismaClient.institutionDocument.create({
						data: {
							document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							institution_id: institutionId,
							document_type_id:
								verificationDocType.document_type_id,
							name:
								file.name ||
								file.originalName ||
								"Verification Document",
							url: file.url || "",
							size: file.size || 0,
							upload_at: new Date(),
							status: true,
						},
					});
				}
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
					document_type_id: `doctype_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
					status: false,
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
