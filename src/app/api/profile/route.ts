import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma";
import { cacheManager } from "@/lib/cache";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		// Check cache first
		const cacheKey = `profile:${userId}`;

		// Add cache manager status check
		const cacheStats = await cacheManager.getStats();

		const cachedProfile = await cacheManager.get(cacheKey);

		if (cachedProfile) {
			return NextResponse.json({ profile: cachedProfile });
		}
		// Check if user already has a profile in the database
		const existingProfile = await prismaClient.profile.findUnique({
			where: { userId: userId },
			include: {
				languages: true,
				researchPapers: {
					include: {
						files: {
							include: {
								file: true,
							},
						},
					},
				},
				uploadedFiles: {
					include: {
						file: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		if (existingProfile) {
			// Debug: Log the existing profile data
			console.log("Existing profile from DB:", existingProfile);
			console.log(
				"Institution disciplines from DB:",
				existingProfile.institutionDisciplines
			);
			console.log("Interests from DB:", existingProfile.interests);
			console.log(
				"Favorite countries from DB:",
				existingProfile.favoriteCountries
			);
			console.log("GPA from DB:", existingProfile.gpa);

			// Transform uploadedFiles into categorized arrays for UI
			const transformedProfile = {
				...existingProfile,
				// Ensure arrays are properly handled - parse if they're strings
				interests: Array.isArray(existingProfile.interests)
					? existingProfile.interests
					: existingProfile.interests
						? JSON.parse(existingProfile.interests)
						: [],
				favoriteCountries: Array.isArray(
					existingProfile.favoriteCountries
				)
					? existingProfile.favoriteCountries
					: existingProfile.favoriteCountries
						? JSON.parse(existingProfile.favoriteCountries)
						: [],
				cvFiles: existingProfile.uploadedFiles
					.filter((pf: any) => pf.category === "cv")
					.map((pf: any) => ({
						id: pf.file.id,
						name: pf.file.name,
						originalName: pf.file.originalName,
						fileName: pf.file.key,
						size: pf.file.size,
						fileSize: pf.file.size,
						url: pf.file.url,
						fileType: pf.file.mimeType,
						category: pf.category,
					})),
				languageCertFiles: existingProfile.uploadedFiles
					.filter((pf: any) => pf.category === "languageCert")
					.map((pf: any) => ({
						id: pf.file.id,
						name: pf.file.name,
						originalName: pf.file.originalName,
						fileName: pf.file.key,
						size: pf.file.size,
						fileSize: pf.file.size,
						url: pf.file.url,
						fileType: pf.file.mimeType,
						category: pf.category,
					})),
				degreeFiles: existingProfile.uploadedFiles
					.filter((pf: any) => pf.category === "degree")
					.map((pf: any) => ({
						id: pf.file.id,
						name: pf.file.name,
						originalName: pf.file.originalName,
						fileName: pf.file.key,
						size: pf.file.size,
						fileSize: pf.file.size,
						url: pf.file.url,
						fileType: pf.file.mimeType,
						category: pf.category,
					})),
				transcriptFiles: existingProfile.uploadedFiles
					.filter((pf: any) => pf.category === "transcript")
					.map((pf: any) => ({
						id: pf.file.id,
						name: pf.file.name,
						originalName: pf.file.originalName,
						fileName: pf.file.key,
						size: pf.file.size,
						fileSize: pf.file.size,
						url: pf.file.url,
						fileType: pf.file.mimeType,
						category: pf.category,
					})),
				verificationDocuments: existingProfile.uploadedFiles
					.filter((pf: any) => pf.category === "verification")
					.map((pf: any) => ({
						id: pf.file.id,
						name: pf.file.name,
						originalName: pf.file.originalName,
						fileName: pf.file.key,
						size: pf.file.size,
						fileSize: pf.file.size,
						url: pf.file.url,
						fileType: pf.file.mimeType,
						category: pf.category,
					})),
				// Transform research papers files
				researchPapers: existingProfile.researchPapers.map(
					(paper: any) => ({
						...paper,
						files: paper.files.map((pf: any) => ({
							id: pf.file.id,
							name: pf.file.name,
							originalName: pf.file.originalName,
							fileName: pf.file.key,
							size: pf.file.size,
							fileSize: pf.file.size,
							url: pf.file.url,
							fileType: pf.file.mimeType,
							category: pf.category,
						})),
					})
				),
			};

			// Cache the transformed profile data for 5 minutes
			await cacheManager.set(cacheKey, transformedProfile, 300);

			return NextResponse.json({
				profile: transformedProfile,
			});
		} else {
			return NextResponse.json(
				{ error: "Profile not found" },
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("Error fetching profile:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const formData = await request.json();
		const userId = session.user.id;
		const cacheKey = `profile:${userId}`;

		// Debug: Log the form data being received
		console.log("POST - Received form data:", formData);
		console.log("POST - Interests received:", formData.interests);
		console.log(
			"POST - Favorite countries received:",
			formData.favoriteCountries
		);
		console.log("POST - GPA received:", formData.gpa);

		// Clean up empty language certificates and research papers
		const cleanedLanguages =
			formData.languages?.filter(
				(lang: any) =>
					lang.language &&
					lang.language.trim() !== "" &&
					lang.certificate &&
					lang.certificate.trim() !== "" &&
					lang.score &&
					lang.score.trim() !== ""
			) || [];

		// Check for research papers with files but missing title/discipline
		const incompleteResearchPapersWithFiles =
			formData.researchPapers?.filter(
				(paper: any) =>
					(!paper.title ||
						paper.title.trim() === "" ||
						!paper.discipline ||
						paper.discipline.trim() === "") &&
					paper.files &&
					paper.files.length > 0
			) || [];

		// If there are incomplete research papers with files, return validation error
		if (incompleteResearchPapersWithFiles.length > 0) {
			return NextResponse.json(
				{
					error: "Research paper validation failed",
					details:
						"Please provide both title and discipline for all research papers before uploading files.",
					validationErrors: {
						researchPapers: incompleteResearchPapersWithFiles.map(
							(paper: any, index: number) => ({
								index,
								message:
									"Title and discipline are required when files are uploaded",
							})
						),
					},
				},
				{ status: 400 }
			);
		}

		// Filter research papers with complete info
		const completeResearchPapers =
			formData.researchPapers?.filter(
				(paper: any) =>
					paper.title &&
					paper.title.trim() !== "" &&
					paper.discipline &&
					paper.discipline.trim() !== ""
			) || [];

		// Check if user exists in database, create if not
		let user = await prismaClient.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			// Check if user exists with same email but different ID
			const existingUserByEmail = await prismaClient.user.findUnique({
				where: { email: session.user.email || "" },
			});

			if (existingUserByEmail) {
				// Update the existing user's ID to match the session
				user = await prismaClient.user.update({
					where: { email: session.user.email || "" },
					data: {
						id: userId,
						name: session.user.name || existingUserByEmail.name,
						image: session.user.image || existingUserByEmail.image,
					},
				});
			} else {
				user = await prismaClient.user.create({
					data: {
						id: userId,
						name: session.user.name || "Unknown",
						email: session.user.email || "",
						image: session.user.image || null,
					},
				});
			}
		}

		// Check if user already has a profile
		const existingProfile = await prismaClient.profile.findUnique({
			where: { userId: userId },
		});

		if (existingProfile) {
			return NextResponse.json(
				{ error: "Profile already exists" },
				{ status: 409 }
			);
		}

		// Helper function to create file records in database
		const createFileRecords = async (files: any[], category: string) => {
			const createdFiles = [];
			for (const file of files) {
				// Check if file already exists in database
				let existingFile = await prismaClient.file.findFirst({
					where: {
						url: file.url,
						userId: userId,
					},
				});

				if (!existingFile) {
					// Create new file record in database
					existingFile = await prismaClient.file.create({
						data: {
							name: file.originalName || file.name,
							originalName: file.originalName || file.name,
							key:
								file.fileName ||
								file.url.split("/").pop() ||
								file.name,
							bucket: BUCKET_NAME,
							size: file.fileSize || file.size,
							mimeType:
								file.fileType ||
								file.type ||
								"application/octet-stream",
							extension:
								(file.originalName || file.name)
									.split(".")
									.pop() || "",
							category: category,
							url: file.url,
							isPublic: true,
							userId: userId,
						},
					});
				}
				createdFiles.push(existingFile);
			}
			return createdFiles;
		};

		// Create the profile in the database
		const newProfile = await prismaClient.profile.create({
			data: {
				userId: userId,
				role: formData.role,
				firstName: formData.firstName,
				lastName: formData.lastName,
				gender: formData.gender,
				birthday: formData.birthday,
				nationality: formData.nationality,
				phoneNumber: formData.phoneNumber,
				countryCode: formData.countryCode,
				interests: formData.interests || [],
				favoriteCountries: formData.favoriteCountries || [],
				profilePhoto: formData.profilePhoto,
				graduationStatus: formData.graduationStatus,
				degree: formData.degree,
				fieldOfStudy: formData.fieldOfStudy,
				university: formData.university,
				graduationYear: formData.graduationYear,
				gpa: formData.gpa,
				countryOfStudy: formData.countryOfStudy,
				scoreType: formData.scoreType,
				scoreValue: formData.scoreValue,
				hasForeignLanguage: formData.hasForeignLanguage,
				// Institution fields
				institutionName: formData.institutionName,
				institutionAbbreviation: formData.institutionAbbreviation,
				institutionHotline: formData.institutionHotline,
				institutionHotlineCode: formData.institutionHotlineCode,
				institutionType:
					typeof formData.institutionType === "object"
						? formData.institutionType?.value
						: formData.institutionType,
				institutionWebsite: formData.institutionWebsite,
				institutionEmail: formData.institutionEmail,
				institutionCountry: formData.institutionCountry,
				institutionAddress: formData.institutionAddress,
				representativeName: formData.representativeName,
				representativeAppellation:
					typeof formData.representativeAppellation === "object"
						? formData.representativeAppellation?.value
						: formData.representativeAppellation,
				representativePosition: formData.representativePosition,
				representativeEmail: formData.representativeEmail,
				representativePhone: formData.representativePhone,
				representativePhoneCode: formData.representativePhoneCode,
				aboutInstitution: formData.aboutInstitution,
				institutionDisciplines: formData.institutionDisciplines || [],
				institutionCoverImage: formData.institutionCoverImage,
				// Create language records if provided and not empty
				languages:
					cleanedLanguages.length > 0
						? {
								create: cleanedLanguages.map((lang: any) => ({
									language: lang.language,
									certificate: lang.certificate,
									score: lang.score,
								})),
							}
						: undefined,
				// Create research paper records if provided and not empty
				researchPapers:
					completeResearchPapers.length > 0
						? {
								create: completeResearchPapers.map(
									(paper: any) => ({
										title: paper.title,
										discipline: paper.discipline,
									})
								),
							}
						: undefined,
			},
		});

		// Handle file uploads after profile creation
		const allFiles = [
			...(formData.cvFiles || []),
			...(formData.languageCertFiles || []),
			...(formData.degreeFiles || []),
			...(formData.transcriptFiles || []),
			...(formData.uploadedFiles || []),
			...(formData.institutionVerificationDocuments || []),
		];

		// Create file records for general uploads
		if (allFiles.length > 0) {
			const createdFiles = await createFileRecords(allFiles, "profile");

			// Create ProfileFile relationships
			await prismaClient.profileFile.createMany({
				data: createdFiles.map((file) => ({
					profileId: newProfile.id,
					fileId: file.id,
					category: file.category,
				})),
			});
		}

		// Handle research paper files
		if (completeResearchPapers.length > 0) {
			for (let i = 0; i < completeResearchPapers.length; i++) {
				const paper = completeResearchPapers[i];
				if (paper.files && paper.files.length > 0) {
					const createdFiles = await createFileRecords(
						paper.files,
						"research"
					);

					// Get the research paper ID (it should be created with the profile)
					const researchPaper =
						await prismaClient.researchPaper.findFirst({
							where: {
								profileId: newProfile.id,
								title: paper.title,
							},
						});

					if (researchPaper) {
						// Create ProfileFile relationships for research papers
						await prismaClient.profileFile.createMany({
							data: createdFiles.map((file) => ({
								profileId: newProfile.id,
								researchPaperId: researchPaper.id,
								fileId: file.id,
								category: "research",
							})),
						});
					}
				}
			}
		}

		// Clear cache after creating profile
		await cacheManager.delete(cacheKey);

		// Send profile created notification
		try {
			console.log("🚀 Starting profile created notification...");
			console.log("📧 User email:", session.user.email);
			console.log("👤 User ID:", userId);
			console.log("📋 Profile ID:", newProfile.id);

			const { NotificationUtils } = await import("@/lib/sqs-handlers");
			console.log("✅ NotificationUtils imported successfully");

			await NotificationUtils.sendProfileCreatedNotification(
				userId,
				session.user.email || "",
				newProfile.id,
				formData.firstName,
				formData.lastName,
				formData.role
			);
			console.log("✅ Profile created notification sent successfully!");
		} catch (notificationError) {
			console.error(
				"❌ Error sending profile created notification:",
				notificationError
			);
			// Don't fail the profile creation if notification fails
		}

		return NextResponse.json({
			success: true,
			message: "Profile created successfully",
			profile: newProfile,
		});
	} catch (error) {
		console.error("Error saving profile:", error);
		return NextResponse.json(
			{ error: "Failed to save profile" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;
		const formData = await request.json();
		const cacheKey = `profile:${userId}`;

		// Clean up empty language certificates and research papers
		const cleanedLanguages =
			formData.languages?.filter(
				(lang: any) =>
					lang.language &&
					lang.language.trim() !== "" &&
					lang.certificate &&
					lang.certificate.trim() !== "" &&
					lang.score &&
					lang.score.trim() !== ""
			) || [];

		// Check for research papers with files but missing title/discipline
		const incompleteResearchPapersWithFiles =
			formData.researchPapers?.filter(
				(paper: any) =>
					(!paper.title ||
						paper.title.trim() === "" ||
						!paper.discipline ||
						paper.discipline.trim() === "") &&
					paper.files &&
					paper.files.length > 0
			) || [];

		// If there are incomplete research papers with files, return validation error
		if (incompleteResearchPapersWithFiles.length > 0) {
			return NextResponse.json(
				{
					error: "Research paper validation failed",
					details:
						"Please provide both title and discipline for all research papers before uploading files.",
					validationErrors: {
						researchPapers: incompleteResearchPapersWithFiles.map(
							(paper: any, index: number) => ({
								index,
								message:
									"Title and discipline are required when files are uploaded",
							})
						),
					},
				},
				{ status: 400 }
			);
		}

		// Filter research papers with complete info
		const completeResearchPapers =
			formData.researchPapers?.filter(
				(paper: any) =>
					paper.title &&
					paper.title.trim() !== "" &&
					paper.discipline &&
					paper.discipline.trim() !== ""
			) || [];

		// Debug: Log the form data being received
		console.log("Received form data:", formData);
		console.log(
			"Institution disciplines received:",
			formData.institutionDisciplines
		);
		console.log("Interests received in PUT:", formData.interests);
		console.log(
			"Favorite countries received in PUT:",
			formData.favoriteCountries
		);
		console.log("GPA received in PUT:", formData.gpa);

		// Update the profile in the database with all fields
		const updatedProfile = await prismaClient.profile.update({
			where: { userId: userId },
			data: {
				// Basic profile fields
				firstName: formData.firstName,
				lastName: formData.lastName,
				gender: formData.gender,
				birthday: formData.birthday,
				nationality: formData.nationality,
				phoneNumber: formData.phoneNumber,
				countryCode: formData.countryCode,
				interests: formData.interests || [],
				favoriteCountries: formData.favoriteCountries || [],
				profilePhoto: formData.profilePhoto,
				// Academic fields
				graduationStatus: formData.graduationStatus,
				degree: formData.degree,
				fieldOfStudy: formData.fieldOfStudy,
				university: formData.university,
				graduationYear: formData.graduationYear,
				gpa: formData.gpa,
				countryOfStudy: formData.countryOfStudy,
				scoreType: formData.scoreType,
				scoreValue: formData.scoreValue,
				hasForeignLanguage: formData.hasForeignLanguage,
				// Institution fields
				institutionName: formData.institutionName,
				institutionAbbreviation: formData.institutionAbbreviation,
				institutionHotline: formData.institutionHotline,
				institutionHotlineCode: formData.institutionHotlineCode,
				institutionType:
					typeof formData.institutionType === "object"
						? formData.institutionType?.value
						: formData.institutionType,
				institutionWebsite: formData.institutionWebsite,
				institutionEmail: formData.institutionEmail,
				institutionCountry: formData.institutionCountry,
				institutionAddress: formData.institutionAddress,
				representativeName: formData.representativeName,
				representativeAppellation:
					typeof formData.representativeAppellation === "object"
						? formData.representativeAppellation?.value
						: formData.representativeAppellation,
				representativePosition: formData.representativePosition,
				representativeEmail: formData.representativeEmail,
				representativePhone: formData.representativePhone,
				representativePhoneCode: formData.representativePhoneCode,
				aboutInstitution: formData.aboutInstitution,
				institutionDisciplines: formData.institutionDisciplines || [],
				institutionCoverImage: formData.institutionCoverImage,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		// Handle languages update if provided
		if (formData.languages !== undefined) {
			// Delete existing languages
			await prismaClient.language.deleteMany({
				where: { profileId: updatedProfile.id },
			});

			// Use cleaned languages (already filtered)
			const validLanguages = cleanedLanguages;

			if (validLanguages.length > 0) {
				await prismaClient.language.createMany({
					data: validLanguages.map((lang: any) => ({
						profileId: updatedProfile.id,
						language: lang.language,
						certificate: lang.certificate,
						score: lang.score,
					})),
				});
			}
		}

		// Handle research papers update if provided
		if (formData.researchPapers !== undefined) {
			// Delete existing research papers and their files
			const existingPapers = await prismaClient.researchPaper.findMany({
				where: { profileId: updatedProfile.id },
				include: { files: true },
			});

			for (const paper of existingPapers) {
				await prismaClient.profileFile.deleteMany({
					where: { researchPaperId: paper.id },
				});
			}

			await prismaClient.researchPaper.deleteMany({
				where: { profileId: updatedProfile.id },
			});

			// Use complete research papers (already filtered)
			const validResearchPapers = completeResearchPapers;

			if (validResearchPapers.length > 0) {
				for (const paper of validResearchPapers) {
					const newPaper = await prismaClient.researchPaper.create({
						data: {
							profileId: updatedProfile.id,
							title: paper.title,
							discipline: paper.discipline,
						},
					});

					// Create files for this research paper
					if (paper.files && paper.files.length > 0) {
						// Create File records in database first (check if exists)
						const createdFiles = [];
						for (const file of paper.files) {
							const fileKey =
								file.fileName ||
								file.url.split("/").pop() ||
								file.name;

							// Check if file already exists
							let existingFile =
								await prismaClient.file.findUnique({
									where: { key: fileKey },
								});

							if (!existingFile) {
								// Create new file if it doesn't exist
								existingFile = await prismaClient.file.create({
									data: {
										name: file.originalName || file.name,
										originalName:
											file.originalName || file.name,
										key: fileKey,
										bucket: BUCKET_NAME,
										size: file.fileSize || file.size,
										mimeType:
											file.fileType ||
											"application/octet-stream",
										extension:
											(file.originalName || file.name)
												.split(".")
												.pop() || "",
										category: file.category || "research",
										url: file.url,
										isPublic: true,
										userId: userId,
									},
								});
							}
							createdFiles.push(existingFile);
						}

						// Create ProfileFile relationships
						await prismaClient.profileFile.createMany({
							data: createdFiles.map((file) => ({
								researchPaperId: newPaper.id,
								fileId: file.id,
								category: file.category || "research",
							})),
						});
					}
				}
			}
		}

		// Handle uploaded files update if provided
		if (
			formData.cvFiles !== undefined ||
			formData.languageCertFiles !== undefined ||
			formData.degreeFiles !== undefined ||
			formData.transcriptFiles !== undefined ||
			formData.verificationDocuments !== undefined ||
			formData.institutionVerificationDocuments !== undefined
		) {
			// Delete existing uploaded files
			await prismaClient.profileFile.deleteMany({
				where: { profileId: updatedProfile.id },
			});

			// Create new uploaded files
			const allFiles = [
				...(formData.cvFiles || []).map((file: any) => ({
					...file,
					category: "cv",
				})),
				...(formData.languageCertFiles || []).map((file: any) => ({
					...file,
					category: "languageCert",
				})),
				...(formData.degreeFiles || []).map((file: any) => ({
					...file,
					category: "degree",
				})),
				...(formData.transcriptFiles || []).map((file: any) => ({
					...file,
					category: "transcript",
				})),
				...(formData.verificationDocuments || []).map((file: any) => ({
					...file,
					category: "verification",
				})),
				...(formData.institutionVerificationDocuments || []).map(
					(file: any) => ({
						...file,
						category: "verification",
					})
				),
			];

			if (allFiles.length > 0) {
				// Create File records in database first (check if exists)
				const createdFiles = [];
				for (const file of allFiles) {
					const fileKey =
						file.fileName || file.url.split("/").pop() || file.name;

					// Check if file already exists
					let existingFile = await prismaClient.file.findUnique({
						where: { key: fileKey },
					});

					if (!existingFile) {
						// Create new file if it doesn't exist
						existingFile = await prismaClient.file.create({
							data: {
								name: file.originalName || file.name,
								originalName: file.originalName || file.name,
								key: fileKey,
								bucket: BUCKET_NAME,
								size: file.fileSize || file.size,
								mimeType:
									file.fileType || "application/octet-stream",
								extension:
									(file.originalName || file.name)
										.split(".")
										.pop() || "",
								category: file.category,
								url: file.url,
								isPublic: true,
								userId: userId,
							},
						});
					}
					createdFiles.push(existingFile);
				}

				// Create ProfileFile relationships
				await prismaClient.profileFile.createMany({
					data: createdFiles.map((file) => ({
						profileId: updatedProfile.id,
						fileId: file.id,
						category: file.category,
					})),
				});
			}
		}

		// Clear cache after updating profile
		await cacheManager.delete(cacheKey);

		return NextResponse.json({
			success: true,
			message: "Profile updated successfully",
			profile: updatedProfile,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		return NextResponse.json(
			{ error: "Failed to update profile" },
			{ status: 500 }
		);
	}
}
