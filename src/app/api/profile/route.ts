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
			// Transform uploadedFiles into categorized arrays for UI
			const transformedProfile = {
				...existingProfile,
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
				// Create language records if provided
				languages: formData.languages
					? {
							create: formData.languages.map((lang: any) => ({
								language: lang.language,
								certificate: lang.certificate,
								score: lang.score,
							})),
						}
					: undefined,
				// Create research paper records if provided
				researchPapers: formData.researchPapers
					? {
							create: formData.researchPapers.map(
								(paper: any) => ({
									title: paper.title,
									discipline: paper.discipline,
									files: paper.files
										? {
												create: paper.files.map(
													(file: any) => ({
														fileId: file.id,
														category: "research",
													})
												),
											}
										: undefined,
								})
							),
						}
					: undefined,
				// Create uploaded file records if provided
				uploadedFiles: formData.uploadedFiles
					? {
							create: formData.uploadedFiles.map((file: any) => ({
								fileId: file.id,
								category: file.category || "other",
							})),
						}
					: undefined,
			},
		});

		// Clear cache after creating profile
		await cacheManager.delete(cacheKey);

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

			// Filter out empty language entries and create new languages if any
			const validLanguages = formData.languages.filter(
				(lang: any) =>
					lang.language &&
					lang.language.trim() !== "" &&
					lang.certificate &&
					lang.certificate.trim() !== "" &&
					lang.score &&
					lang.score.trim() !== ""
			);

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

			// Filter out empty research papers and create new ones if any
			const validResearchPapers = formData.researchPapers.filter(
				(paper: any) =>
					paper.title &&
					paper.title.trim() !== "" &&
					paper.discipline &&
					paper.discipline.trim() !== ""
			);

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
			formData.transcriptFiles !== undefined
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
