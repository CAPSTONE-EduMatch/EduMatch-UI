import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { ApplicantProfileService } from "@/services/profile/applicant-profile-service";
import { InstitutionProfileService } from "@/services/profile/institution-profile-service";
import { prismaClient } from "../../../../prisma";

export async function GET() {
	try {
		// Check if user is authenticated using optimized auth utilities
		const { user } = await requireAuth();

		const userId = user.id;
		// Get user with role information to determine profile type
		const userRecord = await prismaClient.user.findUnique({
			where: { id: userId },
			include: { userRole: true },
		});

		if (!userRecord) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		let profile: any = null;
		let profileType = "";

		// Fetch profile based on user role - only one query needed
		// Handle both string and number comparisons for role_id
		const roleId = userRecord.role_id?.toString();

		if (roleId === "1") {
			// Student/Applicant role
			profile = await ApplicantProfileService.getProfile(userId);
			profileType = "applicant";
		} else if (roleId === "2") {
			// Institution role
			profile = await InstitutionProfileService.getProfile(userId);
			profileType = "institution";
		} else {
			// No role set or invalid role - check if profile exists (fallback)
			// This handles backward compatibility for users who have profiles but no role_id set
			const hasApplicantProfile =
				await ApplicantProfileService.hasProfile(userId);
			const hasInstitutionProfile =
				await InstitutionProfileService.hasProfile(userId);

			if (hasApplicantProfile) {
				profile = await ApplicantProfileService.getProfile(userId);
				profileType = "applicant";
				// Update role_id for backward compatibility
				await prismaClient.user.update({
					where: { id: userId },
					data: { role_id: "1" },
				});
			} else if (hasInstitutionProfile) {
				profile = await InstitutionProfileService.getProfile(userId);
				profileType = "institution";
				// Update role_id for backward compatibility
				await prismaClient.user.update({
					where: { id: userId },
					data: { role_id: "2" },
				});
			}
		}

		if (profile) {
			// Transform profile data to include role field for frontend
			let transformedProfile;
			if (profileType === "applicant") {
				// This is an applicant profile
				transformedProfile = {
					...profile,
					role: "applicant",
					id: profile.applicant_id,
					firstName: profile.first_name,
					lastName: profile.last_name,
					gender:
						profile.gender === true
							? "male"
							: profile.gender === false
								? "female"
								: "",
					birthday:
						profile.birthday?.toISOString().split("T")[0] || "",
					nationality: profile.nationality || "",
					phoneNumber: profile.phone_number || "",
					countryCode: profile.country_code || "+1",
					interests:
						profile.interests?.map(
							(i: any) => i.subdiscipline?.name || ""
						) || [],
					favoriteCountries: profile.favorite_countries || [],
					profilePhoto: profile.user?.image || "",
					graduationStatus: profile.graduated
						? "graduated"
						: "not-yet",
					degree: profile.level || "",
					fieldOfStudy: profile.subdiscipline?.name || "",
					university: profile.university || "",
					graduationYear: "", // Should be stored in DB
					gpa: profile.gpa?.toString() || "",
					countryOfStudy: profile.country_of_study || "",
					scoreType: "gpa",
					scoreValue: profile.gpa?.toString() || "",
					hasForeignLanguage:
						profile.has_foreign_language === true
							? "yes"
							: profile.has_foreign_language === false
								? "no"
								: "",
					languages: profile.languages || [],
					researchPapers:
						profile.documents
							?.filter(
								(doc: any) =>
									doc.documentType?.name === "Research Paper"
							)
							.reduce((acc: any[], doc: any) => {
								// Group documents by title to form research papers
								const existingPaper = acc.find(
									(paper) => paper.title === doc.title
								);
								if (existingPaper) {
									existingPaper.files.push({
										id: doc.document_id,
										name: doc.name,
										originalName: doc.name,
										url: doc.url,
										size: doc.size,
										fileSize: doc.size,
										category: "researchPaper",
									});
								} else {
									acc.push({
										title:
											doc.title ||
											"Untitled Research Paper",
										discipline:
											doc.subdiscipline?.[0] || "",
										files: [
											{
												id: doc.document_id,
												name: doc.name,
												originalName: doc.name,
												url: doc.url,
												size: doc.size,
												fileSize: doc.size,
												category: "researchPaper",
											},
										],
									});
								}
								return acc;
							}, []) || [],
					// Categorize documents by type
					cvFiles:
						profile.documents
							?.filter(
								(doc: any) =>
									doc.documentType?.name === "CV/Resume"
							)
							.map((doc: any) => ({
								id: doc.document_id,
								name: doc.name,
								originalName: doc.name,
								url: doc.url,
								size: doc.size,
								fileSize: doc.size,
								category: "cv",
							})) || [],
					languageCertFiles:
						profile.documents
							?.filter(
								(doc: any) =>
									doc.documentType?.name ===
									"Language Certificate"
							)
							.map((doc: any) => ({
								id: doc.document_id,
								name: doc.name,
								originalName: doc.name,
								url: doc.url,
								size: doc.size,
								fileSize: doc.size,
								category: "languageCert",
							})) || [],
					degreeFiles:
						profile.documents
							?.filter(
								(doc: any) =>
									doc.documentType?.name ===
									"Degree Certificate"
							)
							.map((doc: any) => ({
								id: doc.document_id,
								name: doc.name,
								originalName: doc.name,
								url: doc.url,
								size: doc.size,
								fileSize: doc.size,
								category: "degree",
							})) || [],
					transcriptFiles:
						profile.documents
							?.filter(
								(doc: any) =>
									doc.documentType?.name ===
									"Academic Transcript"
							)
							.map((doc: any) => ({
								id: doc.document_id,
								name: doc.name,
								originalName: doc.name,
								url: doc.url,
								size: doc.size,
								fileSize: doc.size,
								category: "transcript",
							})) || [],
					uploadedFiles:
						profile.documents?.map((doc: any) => ({
							id: doc.document_id,
							file: {
								id: doc.document_id,
								name: doc.name,
								url: doc.url,
								size: doc.size,
							},
							category: doc.documentType?.name || "document",
						})) || [],
					user: {
						id: profile.user.id,
						name: profile.user.name || "",
						email: profile.user.email,
						image: profile.user.image || "",
					},
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			} else if (profileType === "institution") {
				// This is an institution profile
				transformedProfile = {
					...profile,
					role: "institution",
					id: profile.institution_id,
					firstName: profile.rep_name || "",
					lastName: "",
					gender: "",
					birthday: "",
					nationality: profile.country || "",
					phoneNumber: profile.rep_phone || "",
					countryCode: profile.rep_phone_code || "+1",
					interests:
						profile.subdisciplines?.map(
							(s: any) => s.subdiscipline?.name || ""
						) || [],
					favoriteCountries: [],
					profilePhoto: profile.user?.image || profile.logo || "",
					// Institution-specific fields mapped correctly
					institutionName: profile.name || "",
					institutionAbbreviation: profile.abbreviation || "",
					institutionType: profile.type || "",
					institutionWebsite: profile.website || "",
					institutionHotline: profile.hotline || "",
					institutionHotlineCode: profile.hotline_code || "+84",
					institutionAddress: profile.address || "",
					institutionCountry: profile.country || "",
					representativeName: profile.rep_name || "",
					representativePosition: profile.rep_position || "",
					representativeEmail: profile.rep_email || "",
					representativePhone: profile.rep_phone || "",
					representativePhoneCode: profile.rep_phone_code || "+84",
					aboutInstitution: profile.about || "",
					institutionDisciplines:
						profile.subdisciplines?.map(
							(s: any) => s.subdiscipline?.name || ""
						) || [],
					institutionCoverImage: profile.cover_image || "",
					verificationDocuments:
						profile.documents?.map((doc: any) => ({
							id: doc.document_id,
							name: doc.name,
							originalName: doc.name,
							url: doc.url,
							size: doc.size,
							fileSize: doc.size,
							fileType: doc.documentType?.name || "Unknown",
							category: "verification",
						})) || [],
					// Verification status fields
					verification_status:
						profile.verification_status || "PENDING",
					submitted_at: profile.submitted_at?.toISOString() || null,
					verified_at: profile.verified_at?.toISOString() || null,
					verified_by: profile.verified_by || null,
					rejection_reason: profile.rejection_reason || null,
					user: {
						id: profile.user.id,
						name: profile.user.name || "",
						email: profile.user.email,
						image: profile.user.image || "",
					},
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			} else {
				transformedProfile = profile;
			}

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
		return NextResponse.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		const formData = await request.json();

		const userId = user.id;

		// Check if profile already exists based on role
		let hasExistingProfile = false;
		if (formData.role === "applicant") {
			hasExistingProfile =
				await ApplicantProfileService.hasProfile(userId);
		} else if (formData.role === "institution") {
			hasExistingProfile =
				await InstitutionProfileService.hasProfile(userId);
		}

		if (hasExistingProfile) {
			return NextResponse.json(
				{ error: "Profile already exists" },
				{ status: 409 }
			);
		}

		// Update user's role_id and role FIRST before creating profile
		// This ensures role_id and role are set correctly for profile retrieval
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

		// Use the appropriate profile service based on role
		let newProfile;
		if (formData.role === "applicant") {
			console.log("📝 Creating applicant profile with data:", {
				firstName: formData.firstName,
				role: formData.role,
				fieldOfStudy: formData.fieldOfStudy,
				// Log other key fields but not sensitive data
				hasData: !!formData,
			});
			newProfile = await ApplicantProfileService.upsertProfile(
				userId,
				formData
			);
			console.log(
				"✅ Profile created, embedding should have been processed"
			);
		} else if (formData.role === "institution") {
			newProfile = await InstitutionProfileService.upsertProfile(
				userId,
				formData
			);
		} else {
			throw new Error("Invalid role specified");
		}

		// Send notifications
		if (newProfile) {
			try {
				const { NotificationUtils } = await import(
					"@/services/messaging/sqs-handlers"
				);

				// Send welcome notification (for new users)
				await NotificationUtils.sendWelcomeNotification(
					userId,
					user.email || "",
					formData.firstName || "",
					formData.lastName || ""
				);

				// Send profile created notification
				await NotificationUtils.sendProfileCreatedNotification(
					userId,
					user.email || "",
					("applicant_id" in newProfile
						? newProfile.applicant_id
						: newProfile.institution_id) || userId,
					formData.firstName || "",
					formData.lastName || "",
					formData.role || "applicant"
				);
			} catch (notificationError) {
				// Don't fail the profile creation if notification fails
			}
		}

		return NextResponse.json({
			success: true,
			message: "Profile created successfully",
			profile: newProfile,
		});
	} catch (error) {
		console.error("❌ Profile creation failed:", error);
		return NextResponse.json(
			{
				error: "Failed to save profile",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Check if user is authenticated using optimized auth utilities
		const { user } = await requireAuth();

		const userId = user.id;
		const formData = await request.json();

		// Validate role before proceeding
		if (
			!formData.role ||
			(formData.role !== "applicant" && formData.role !== "institution")
		) {
			return NextResponse.json(
				{
					error: "Invalid role specified. Must be 'applicant' or 'institution'",
				},
				{ status: 400 }
			);
		}

		// Map verificationDocuments to institutionVerificationDocuments for institution profiles
		if (formData.role === "institution" && formData.verificationDocuments) {
			formData.institutionVerificationDocuments =
				formData.verificationDocuments;
		}

		// Update user's role_id and role FIRST before updating profile
		// This ensures role_id and role are set correctly for profile retrieval
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

		// Use the appropriate profile service based on role
		let updatedProfile;
		if (formData.role === "applicant") {
			updatedProfile = await ApplicantProfileService.upsertProfile(
				userId,
				formData
			);
		} else if (formData.role === "institution") {
			updatedProfile = await InstitutionProfileService.upsertProfile(
				userId,
				formData
			);
		} else {
			throw new Error("Invalid role specified");
		}

		return NextResponse.json({
			success: true,
			message: "Profile updated successfully",
			profile: updatedProfile,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update profile" },
			{ status: 500 }
		);
	}
}
