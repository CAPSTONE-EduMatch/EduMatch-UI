import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma";
import { cacheManager } from "@/lib/cache";

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
		const cachedProfile = await cacheManager.get(cacheKey);
		if (cachedProfile) {
			console.log("Profile loaded from cache:", cacheKey);
			return NextResponse.json({ profile: cachedProfile });
		}

		console.log("Profile not in cache, fetching from database:", cacheKey);
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
			// Cache the profile data for 5 minutes
			await cacheManager.set(cacheKey, existingProfile, 300);
			console.log("Profile cached:", cacheKey);

			return NextResponse.json({
				profile: existingProfile,
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
		console.log("Profile cache cleared after creation:", cacheKey);

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
