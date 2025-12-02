import { prismaClient } from "../../../prisma";

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
	gpa: string;
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
	institutionLogo: string; // Institution logo (small brand mark)
	institutionCoverImage: string; // Institution cover image (large banner)
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
	country_code: string | null;
	favorite_countries: string[];
	graduated: boolean | null;
	level: string | null;
	subdiscipline_id: string | null;
	gpa: any | null;
	university: string | null;
	country_of_study: string | null;
	has_foreign_language: boolean | null;
	languages: any | null;
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
	hotline_code: string | null; // Added: institution hotline country code
	type: string;
	website: string | null; // Added: institution website
	email: string | null; // Added: institution email
	country: string;
	address: string;
	rep_name: string;
	rep_appellation: string | null; // Added: representative appellation
	rep_position: string;
	rep_email: string;
	rep_phone: string;
	rep_phone_code: string | null; // Added: representative phone country code
	about: string;
	logo: string | null; // Institution logo (small brand mark)
	cover_image: string | null; // Institution cover image (large banner)
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
			const profile = await this.getProfile(userId);
			return !!profile;
		} catch (error) {
			console.error("ProfileService.hasProfile error:", error);
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
			const applicant = await prismaClient.applicant.findFirst({
				where: {
					user_id: userId,
					status: true, // Only get active profiles
				},
				include: {
					user: true,
					subdiscipline: {
						include: {
							discipline: true,
						},
					},
					documents: {
						where: {
							status: true, // Only get active documents
						},
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

			const institution = await prismaClient.institution.findFirst({
				where: {
					user_id: userId,
					status: "ACTIVE", // Only get active profiles
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
					country_code: formData.countryCode || null,
					favorite_countries: formData.favoriteCountries || [],
					graduated: formData.graduationStatus === "graduated",
					level: formData.degree || null,
					subdiscipline_id: subdisciplineId,
					gpa: formData.gpa
						? parseFloat(formData.gpa)
						: formData.scoreValue
							? parseFloat(formData.scoreValue)
							: null,
					university: formData.university || null,
					country_of_study: formData.countryOfStudy || null,
					has_foreign_language:
						formData.hasForeignLanguage === "yes"
							? true
							: formData.hasForeignLanguage === "no"
								? false
								: null,
					languages: formData.languages || null,
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
					country_code: formData.countryCode || null,
					favorite_countries: formData.favoriteCountries || [],
					graduated: formData.graduationStatus === "graduated",
					level: formData.degree || null,
					subdiscipline_id: subdisciplineId,
					gpa: formData.gpa
						? parseFloat(formData.gpa)
						: formData.scoreValue
							? parseFloat(formData.scoreValue)
							: null,
					university: formData.university || null,
					country_of_study: formData.countryOfStudy || null,
					has_foreign_language:
						formData.hasForeignLanguage === "yes"
							? true
							: formData.hasForeignLanguage === "no"
								? false
								: null,
					languages: formData.languages || null,
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
					if (interestName && interestName.trim()) {
						const subdiscipline =
							await prismaClient.subdiscipline.findFirst({
								where: { name: interestName.trim() },
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
						} else {
							console.warn(
								`Subdiscipline not found for interest: ${interestName}`
							);
						}
					}
				}
			}

			// Favorite countries are now stored in the database field favorite_countries

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
					"❌ ProfileService: Missing required fields:",
					missingFields
				);
				throw new Error(
					`Missing required fields: ${missingFields.join(", ")}`
				);
			}

			console.log("✅ ProfileService: All required fields validated");
			console.log("📋 ProfileService: Institution data:", {
				name: formData.institutionName,
				type: formData.institutionType,
				country: formData.institutionCountry,
				hasDisciplines: formData.institutionDisciplines?.length || 0,
			});
			console.log("🔍 ProfileService: Field types:", {
				name: typeof formData.institutionName,
				type: typeof formData.institutionType,
				country: typeof formData.institutionCountry,
				hotline: typeof formData.institutionHotline,
				address: typeof formData.institutionAddress,
			});

			// Check if institution already exists
			const existingInstitution =
				await prismaClient.institution.findUnique({
					where: { user_id: userId },
				});

			const isNewInstitution = !existingInstitution;
			const shouldResetVerification =
				existingInstitution?.verification_status === "REJECTED";

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
					// If resubmitting after rejection, reset verification status
					...(shouldResetVerification && {
						verification_status: "PENDING",
						submitted_at: new Date(),
						rejection_reason: null,
						verified_at: null,
						verified_by: null,
					}),
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
					// Set verification status to PENDING for new institutions
					verification_status: "PENDING",
					submitted_at: new Date(),
				},
			});

			console.log(
				"✅ ProfileService: Institution created/updated:",
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
			await this.handleInstitutionDocuments(
				institution.institution_id,
				formData
			);

			// Return updated profile
			return (await this.getProfile(userId)) as InstitutionProfile;
		} catch (error) {
			console.error(
				"❌ ProfileService: Error creating institution profile:",
				error
			);
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
			let role: string;
			if (formData.role === "applicant") {
				roleId = "1"; // student role
				role = "user"; // applicant users have role = "user"
			} else if (formData.role === "institution") {
				roleId = "2"; // institution role
				role = "institution"; // institution users must have role = "institution"
			} else {
				throw new Error("Invalid role specified");
			}

			// Update user's role_id and role
			await prismaClient.user.update({
				where: { id: userId },
				data: { role_id: roleId, role: role },
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
			console.error("❌ ProfileService: Error details:", {
				userId,
				role: formData.role,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
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
			// Soft delete existing documents first to avoid duplicates
			await prismaClient.applicantDocument.updateMany({
				where: {
					applicant_id: applicantId,
					status: true, // Only soft delete active documents
				},
				data: {
					status: false,
					deleted_at: new Date(),
				},
			});

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
							status: true,
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
							status: true,
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
							status: true,
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
							status: true,
						},
					});
				}
			}

			// Handle research papers
			if (formData.researchPapers && formData.researchPapers.length > 0) {
				const researchPaperDocType =
					await this.getOrCreateDocumentType("Research Paper");

				for (const researchPaper of formData.researchPapers) {
					// Create a document for each file in the research paper
					if (researchPaper.files && researchPaper.files.length > 0) {
						for (const file of researchPaper.files) {
							await prismaClient.applicantDocument.create({
								data: {
									document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
									applicant_id: applicantId,
									document_type_id:
										researchPaperDocType.document_type_id,
									name:
										file.name ||
										file.originalName ||
										"Research Paper",
									url: file.url || "",
									size: file.size || 0,
									upload_at: new Date(),
									title: researchPaper.title || null,
									subdiscipline: researchPaper.discipline
										? [researchPaper.discipline]
										: [],
									status: true,
								},
							});
						}
					}
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
	 * Delete user profile (soft delete)
	 */
	static async deleteProfile(userId: string): Promise<boolean> {
		try {
			// Try to soft delete applicant profile first
			try {
				// Get applicant profile to check for documents referenced in snapshots
				const applicant = await prismaClient.applicant.findUnique({
					where: { user_id: userId },
					include: {
						documents: true,
						applications: {
							include: {
								ApplicationProfileSnapshot: true,
							},
						},
					},
				});

				if (applicant) {
					// Find all document IDs that are referenced in profile snapshots
					const snapshotDocumentIds = new Set<string>();
					applicant.applications.forEach((application) => {
						if (
							application.ApplicationProfileSnapshot?.document_ids
						) {
							application.ApplicationProfileSnapshot.document_ids.forEach(
								(docId) => {
									snapshotDocumentIds.add(docId);
								}
							);
						}
					});

					// Soft delete only documents that are NOT referenced in any profile snapshots
					const documentsToSoftDelete = applicant.documents.filter(
						(doc) => !snapshotDocumentIds.has(doc.document_id)
					);

					// Soft delete non-snapshot documents
					if (documentsToSoftDelete.length > 0) {
						await prismaClient.applicantDocument.updateMany({
							where: {
								document_id: {
									in: documentsToSoftDelete.map(
										(doc) => doc.document_id
									),
								},
							},
							data: {
								status: false,
								deleted_at: new Date(),
							},
						});
					}

					// Soft delete the applicant profile by setting status to false
					await prismaClient.applicant.update({
						where: { user_id: userId },
						data: {
							status: false,
							deleted_at: new Date(),
						},
					});

					console.log(
						`✅ Soft deleted applicant profile for user ${userId}. Preserved ${snapshotDocumentIds.size} documents referenced in profile snapshots.`
					);
				}

				return true;
			} catch (error) {
				console.error("Error soft deleting applicant profile:", error);
				// If applicant doesn't exist, try institution
				try {
					await prismaClient.institution.update({
						where: { user_id: userId },
						data: {
							status: "DENIED",
							deleted_at: new Date(),
						},
					});
					return true;
				} catch (institutionError) {
					console.error(
						"Error soft deleting institution profile:",
						institutionError
					);
					return false;
				}
			}
		} catch (error) {
			console.error("Error in deleteProfile:", error);
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
