import { prismaClient } from "../../../prisma/index";
import { EmbeddingService } from "../embedding/embedding-service";
import { randomUUID } from "crypto";

// Applicant-specific form data interface
export interface ApplicantProfileFormData {
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
	interests: string[];
	favoriteCountries: string[];

	// Academic fields
	graduationStatus: "not-yet" | "graduated" | "";
	degree: string;
	fieldOfStudy: string;
	university: string;
	graduationYear: string;
	gpa: string;
	countryOfStudy: string;
	scoreType: string;
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

export class ApplicantProfileService {
	/**
	 * Check if user has an applicant profile
	 */
	static async hasProfile(userId: string): Promise<boolean> {
		try {
			const profile = await this.getProfile(userId);
			return !!profile;
		} catch (error) {
			console.error("ApplicantProfileService.hasProfile error:", error);
			return false;
		}
	}

	/**
	 * Get applicant profile
	 */
	static async getProfile(userId: string): Promise<ApplicantProfile | null> {
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

			return applicant;
		} catch (error) {
			console.error("ApplicantProfileService.getProfile error:", error);
			return null;
		}
	}

	/**
	 * Create or update applicant profile
	 */
	static async upsertProfile(
		userId: string,
		formData: ApplicantProfileFormData
	): Promise<ApplicantProfile | null> {
		try {
			// SECURITY: Ensure formData doesn't contain userId that could override
			if ((formData as any).userId || (formData as any).user_id) {
				// eslint-disable-next-line no-console
				console.error(
					"❌ SECURITY: formData contains userId/user_id. This should not happen.",
					{
						userId,
						formDataUserId:
							(formData as any).userId ||
							(formData as any).user_id,
					}
				);
				delete (formData as any).userId;
				delete (formData as any).user_id;
			}

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
					applicant_id: randomUUID(),
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

			// Handle documents
			await this.handleDocuments(applicant.applicant_id, formData);

			// Generate and save embedding for the applicant profile
			try {
				console.log(
					"🔄 ApplicantProfileService: Generating embedding for applicant profile..."
				);

				// Format applicant data for embedding
				const textForEmbedding =
					EmbeddingService.formatApplicantDataForEmbedding(formData);
				console.log(
					"📝 ApplicantProfileService: Formatted text for embedding:",
					textForEmbedding.substring(0, 200) + "..."
				);

				// Generate embedding
				const embedding =
					await EmbeddingService.generateEmbedding(textForEmbedding);

				if (embedding && embedding.length > 0) {
					// Save embedding to database
					await prismaClient.applicant.update({
						where: { applicant_id: applicant.applicant_id },
						data: { embedding: embedding },
					});
					console.log(
						"✅ ApplicantProfileService: Embedding generated and saved successfully"
					);
				} else {
					console.warn(
						"⚠️ ApplicantProfileService: Failed to generate embedding"
					);
				}
			} catch (embeddingError) {
				console.error(
					"❌ ApplicantProfileService: Error generating embedding:",
					embeddingError
				);
				// Don't fail the profile creation if embedding generation fails
			}

			// Return updated profile
			const fetchedProfile = await this.getProfile(userId);
			return fetchedProfile;
		} catch (error) {
			console.error(
				"ApplicantProfileService.upsertProfile error:",
				error
			);
			return null;
		}
	}

	/**
	 * Handle applicant document uploads
	 */
	private static async handleDocuments(
		applicantId: string,
		formData: ApplicantProfileFormData
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
							document_id: randomUUID(),
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
							document_id: randomUUID(),
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
							document_id: randomUUID(),
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
							document_id: randomUUID(),
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
									document_id: randomUUID(),
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
	 * Delete applicant profile (soft delete)
	 */
	static async deleteProfile(userId: string): Promise<boolean> {
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
					if (application.ApplicationProfileSnapshot?.document_ids) {
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
			return false;
		}
	}

	/**
	 * Check if profile is complete
	 */
	static isProfileComplete(profile: ApplicantProfile): boolean {
		return !!(
			profile.first_name?.trim() &&
			profile.last_name?.trim() &&
			profile.user?.email
		);
	}

	/**
	 * Get profile completion percentage
	 */
	static getProfileCompletionPercentage(profile: ApplicantProfile): number {
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
	}
}
