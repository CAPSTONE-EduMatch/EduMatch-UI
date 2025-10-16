import { prismaClient } from "../../prisma";

// Frontend form data interface - matches exactly what the form components send
export interface ProfileFormData {
	// Role selection
	role: "applicant" | "institution" | "";

	// Basic info (for both roles)
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	email: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	profilePhoto: string;

	// Applicant specific fields
	interests: string[];
	favoriteCountries: string[];
	graduationStatus: "not-yet" | "graduated" | "";
	degree: string;
	fieldOfStudy: string;
	university: string;
	countryOfStudy: string;
	scoreValue: string;
	hasForeignLanguage: "yes" | "no" | "";
	languages: Array<{
		language: string;
		certificate: string;
		score: string;
	}>;
	researchPapers: Array<{
		title: string;
		discipline: string;
		files: any[];
	}>;
	cvFiles: any[];
	languageCertFiles: any[];
	degreeFiles: any[];
	transcriptFiles: any[];

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
	institutionCoverImage: string;
	institutionVerificationDocuments: any[];
}

// Database response interface - matches Prisma schema exactly
export interface ApplicantProfile {
	applicant_id: string;
	first_name: string | null;
	last_name: string | null;
	birthday: Date | null;
	gender: boolean | null;
	nationality: string | null;
	phone_number: string | null;
	graduated: boolean | null;
	level: string | null;
	subdiscipline_id: string | null;
	gpa: any | null;
	user_id: string;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
	subdiscipline?: {
		subdiscipline_id: string;
		name: string;
		discipline: {
			discipline_id: string;
			name: string;
		};
	} | null;
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
	interests: Array<{
		subdiscipline: {
			subdiscipline_id: string;
			name: string;
			discipline: {
				discipline_id: string;
				name: string;
			};
		};
	}>;
}

export interface InstitutionProfile {
	institution_id: string;
	name: string;
	abbreviation: string | null;
	hotline: string;
	type: string;
	country: string;
	address: string;
	rep_name: string;
	rep_position: string;
	rep_email: string;
	rep_phone: string;
	about: string;
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

export class ProfileService {
	/**
	 * Check if user has a profile
	 */
	static async hasProfile(userId: string): Promise<boolean> {
		try {
			const [applicant, institution] = await Promise.all([
				prismaClient.applicant.findUnique({
					where: { user_id: userId },
					select: { applicant_id: true },
				}),
				prismaClient.institution.findUnique({
					where: { user_id: userId },
					select: { institution_id: true },
				}),
			]);

			return !!(applicant || institution);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get user profile (applicant or institution)
	 */
	static async getProfile(
		userId: string
	): Promise<ApplicantProfile | InstitutionProfile | null> {
		try {
			const applicant = await prismaClient.applicant.findUnique({
				where: { user_id: userId },
				include: {
					user: true,
					subdiscipline: {
						include: {
							discipline: true,
						},
					},
					documents: {
						include: {
							documentType: true,
						},
					},
					interests: {
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

			if (applicant) {
				return applicant;
			}

			const institution = await prismaClient.institution.findUnique({
				where: { user_id: userId },
				include: {
					user: true,
					documents: {
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
			return null;
		}
	}

	/**
	 * Create or update applicant profile
	 */
	static async upsertApplicantProfile(
		userId: string,
		formData: ProfileFormData
	): Promise<ApplicantProfile | null> {
		try {
			// Find or create subdiscipline for field of study
			let subdisciplineId: string | null = null;
			if (formData.fieldOfStudy) {
				const subdiscipline =
					await prismaClient.subdiscipline.findFirst({
						where: { name: formData.fieldOfStudy },
					});
				if (subdiscipline) {
					subdisciplineId = subdiscipline.subdiscipline_id;
				}
			}

			// Create or update applicant
			const applicant = await prismaClient.applicant.upsert({
				where: { user_id: userId },
				update: {
					first_name: formData.firstName || null,
					last_name: formData.lastName || null,
					birthday: formData.birthday
						? new Date(formData.birthday)
						: null,
					gender:
						formData.gender === "male"
							? true
							: formData.gender === "female"
								? false
								: null,
					nationality: formData.nationality || null,
					phone_number: formData.phoneNumber || null,
					graduated: formData.graduationStatus === "graduated",
					level: formData.degree || null,
					subdiscipline_id: subdisciplineId,
					gpa: formData.scoreValue
						? parseFloat(formData.scoreValue)
						: null,
				},
				create: {
					applicant_id: `applicant_${userId}`,
					user_id: userId,
					first_name: formData.firstName || null,
					last_name: formData.lastName || null,
					birthday: formData.birthday
						? new Date(formData.birthday)
						: null,
					gender:
						formData.gender === "male"
							? true
							: formData.gender === "female"
								? false
								: null,
					nationality: formData.nationality || null,
					phone_number: formData.phoneNumber || null,
					graduated: formData.graduationStatus === "graduated",
					level: formData.degree || null,
					subdiscipline_id: subdisciplineId,
					gpa: formData.scoreValue
						? parseFloat(formData.scoreValue)
						: null,
				},
			});

			// Update user image
			if (formData.profilePhoto) {
				await prismaClient.user.update({
					where: { id: userId },
					data: { image: formData.profilePhoto },
				});
			}

			// Handle interests (subdisciplines)
			if (formData.interests && formData.interests.length > 0) {
				// Clear existing interests
				await prismaClient.applicantInterest.deleteMany({
					where: { applicant_id: applicant.applicant_id },
				});

				// Add new interests
				for (const interestName of formData.interests) {
					const subdiscipline =
						await prismaClient.subdiscipline.findFirst({
							where: { name: interestName },
						});

					if (subdiscipline) {
						await prismaClient.applicantInterest.create({
							data: {
								applicant_id: applicant.applicant_id,
								subdiscipline_id:
									subdiscipline.subdiscipline_id,
								add_at: new Date(),
							},
						});
					}
				}
			}

			// Handle documents
			await this.handleApplicantDocuments(
				applicant.applicant_id,
				formData
			);

			// Return updated profile
			const fetchedProfile = await this.getProfile(userId);
			return fetchedProfile as ApplicantProfile;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Create or update institution profile
	 */
	static async upsertInstitutionProfile(
		userId: string,
		formData: ProfileFormData
	): Promise<InstitutionProfile | null> {
		try {
			// Create or update institution
			const institution = await prismaClient.institution.upsert({
				where: { user_id: userId },
				update: {
					name: formData.institutionName || "",
					abbreviation: formData.institutionAbbreviation || null,
					hotline: formData.institutionHotline || "",
					type: formData.institutionType || "",
					country: formData.institutionCountry || "",
					address: formData.institutionAddress || "",
					rep_name: formData.representativeName || "",
					rep_position: formData.representativePosition || "",
					rep_email:
						formData.representativeEmail ||
						formData.institutionEmail ||
						"",
					rep_phone: formData.representativePhone || "",
					about: formData.aboutInstitution || "",
				},
				create: {
					institution_id: `institution_${userId}`,
					user_id: userId,
					name: formData.institutionName || "",
					abbreviation: formData.institutionAbbreviation || null,
					hotline: formData.institutionHotline || "",
					type: formData.institutionType || "",
					country: formData.institutionCountry || "",
					address: formData.institutionAddress || "",
					rep_name: formData.representativeName || "",
					rep_position: formData.representativePosition || "",
					rep_email:
						formData.representativeEmail ||
						formData.institutionEmail ||
						"",
					rep_phone: formData.representativePhone || "",
					about: formData.aboutInstitution || "",
				},
			});

			// Update user image
			if (formData.profilePhoto) {
				await prismaClient.user.update({
					where: { id: userId },
					data: { image: formData.profilePhoto },
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
			await this.handleInstitutionDocuments(
				institution.institution_id,
				formData
			);

			// Return updated profile
			return (await this.getProfile(userId)) as InstitutionProfile;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Main upsert method that routes to appropriate handler
	 */
	static async upsertProfile(
		userId: string,
		formData: ProfileFormData
	): Promise<ApplicantProfile | InstitutionProfile | null> {
		try {
			console.log(
				"🔄 ProfileService: Starting profile upsert for user:",
				userId
			);
			console.log("📋 ProfileService: Role:", formData.role);

			// Update user's role in the database first
			let roleId: string;
			if (formData.role === "applicant") {
				roleId = "1"; // student role
				console.log(
					"👤 ProfileService: Updating user role to student (1)..."
				);
			} else if (formData.role === "institution") {
				roleId = "2"; // institution role
				console.log(
					"🏫 ProfileService: Updating user role to institution (2)..."
				);
			} else {
				throw new Error("Invalid role specified");
			}

			// Update user's role_id
			await prismaClient.user.update({
				where: { id: userId },
				data: { role_id: roleId },
			});
			console.log("✅ ProfileService: User role updated successfully");

			if (formData.role === "applicant") {
				console.log("👤 ProfileService: Creating applicant profile...");
				return await this.upsertApplicantProfile(userId, formData);
			} else if (formData.role === "institution") {
				console.log(
					"🏫 ProfileService: Creating institution profile..."
				);
				return await this.upsertInstitutionProfile(userId, formData);
			}

			throw new Error("Invalid role specified");
		} catch (error) {
			console.error("❌ ProfileService: Error upserting profile:", error);
			return null;
		}
	}

	/**
	 * Handle applicant document uploads
	 */
	private static async handleApplicantDocuments(
		applicantId: string,
		formData: ProfileFormData
	): Promise<void> {
		try {
			// Get or create document types
			const cvDocType = await this.getOrCreateDocumentType("CV/Resume");
			const languageCertDocType = await this.getOrCreateDocumentType(
				"Language Certificate"
			);
			const degreeDocType =
				await this.getOrCreateDocumentType("Degree Certificate");
			const transcriptDocType = await this.getOrCreateDocumentType(
				"Academic Transcript"
			);

			// Handle CV files
			if (formData.cvFiles && formData.cvFiles.length > 0) {
				for (const file of formData.cvFiles) {
					await prismaClient.applicantDocument.create({
						data: {
							document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							applicant_id: applicantId,
							document_type_id: cvDocType.document_type_id,
							name:
								file.name || file.originalName || "CV Document",
							url: file.url || "",
							size: file.size || 0,
							upload_at: new Date(),
						},
					});
				}
			}

			// Handle language certificate files
			if (
				formData.languageCertFiles &&
				formData.languageCertFiles.length > 0
			) {
				for (const file of formData.languageCertFiles) {
					await prismaClient.applicantDocument.create({
						data: {
							document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							applicant_id: applicantId,
							document_type_id:
								languageCertDocType.document_type_id,
							name:
								file.name ||
								file.originalName ||
								"Language Certificate",
							url: file.url || "",
							size: file.size || 0,
							upload_at: new Date(),
						},
					});
				}
			}

			// Handle degree files
			if (formData.degreeFiles && formData.degreeFiles.length > 0) {
				for (const file of formData.degreeFiles) {
					await prismaClient.applicantDocument.create({
						data: {
							document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							applicant_id: applicantId,
							document_type_id: degreeDocType.document_type_id,
							name:
								file.name ||
								file.originalName ||
								"Degree Certificate",
							url: file.url || "",
							size: file.size || 0,
							upload_at: new Date(),
						},
					});
				}
			}

			// Handle transcript files
			if (
				formData.transcriptFiles &&
				formData.transcriptFiles.length > 0
			) {
				for (const file of formData.transcriptFiles) {
					await prismaClient.applicantDocument.create({
						data: {
							document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							applicant_id: applicantId,
							document_type_id:
								transcriptDocType.document_type_id,
							name:
								file.name ||
								file.originalName ||
								"Academic Transcript",
							url: file.url || "",
							size: file.size || 0,
							upload_at: new Date(),
						},
					});
				}
			}
		} catch (error) {
			console.error("Error handling applicant documents:", error);
		}
	}

	/**
	 * Handle institution document uploads
	 */
	private static async handleInstitutionDocuments(
		institutionId: string,
		formData: ProfileFormData
	): Promise<void> {
		try {
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
	 * Delete user profile
	 */
	static async deleteProfile(userId: string): Promise<boolean> {
		try {
			// Try to delete applicant profile first
			try {
				await prismaClient.applicant.delete({
					where: { user_id: userId },
				});
				return true;
			} catch {
				// If applicant doesn't exist, try institution
				try {
					await prismaClient.institution.delete({
						where: { user_id: userId },
					});
					return true;
				} catch {
					return false;
				}
			}
		} catch {
			return false;
		}
	}

	/**
	 * Check if profile is complete
	 */
	static isProfileComplete(
		profile: ApplicantProfile | InstitutionProfile
	): boolean {
		if ("applicant_id" in profile) {
			// Applicant profile
			return !!(
				profile.first_name?.trim() &&
				profile.last_name?.trim() &&
				profile.user?.email
			);
		} else {
			// Institution profile
			return !!(
				profile.name?.trim() &&
				profile.rep_name?.trim() &&
				profile.rep_email?.trim()
			);
		}
	}

	/**
	 * Get profile completion percentage
	 */
	static getProfileCompletionPercentage(
		profile: ApplicantProfile | InstitutionProfile
	): number {
		if ("applicant_id" in profile) {
			// Applicant profile
			const fields = [
				profile.first_name,
				profile.last_name,
				profile.gender !== null ? "set" : null,
				profile.birthday,
				profile.nationality,
				profile.phone_number,
				profile.user?.image,
				profile.graduated !== null ? "set" : null,
				profile.level,
				profile.gpa !== null ? "set" : null,
			];
			const completed = fields.filter(
				(field) => field && field !== "set"
			).length;
			return Math.round((completed / fields.length) * 100);
		} else {
			// Institution profile
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
}
