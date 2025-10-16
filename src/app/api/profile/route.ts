import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ProfileService, ProfileFormData } from "@/lib/profile-service";

export async function GET(request: NextRequest) {
	console.log("🚨 API ROUTE HIT: GET /api/profile");
	try {
		console.log("🔵 API: GET profile request received");

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found for GET");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;
		console.log("✅ API: User authenticated for GET:", userId);

		// Use the profile service to get the profile
		console.log("🔍 API: Fetching profile from ProfileService...");
		const profile = await ProfileService.getProfile(userId);
		console.log(
			"🔍 API: ProfileService returned:",
			profile ? "Found profile" : "No profile found"
		);

		if (profile) {
			console.log("✅ API: Returning profile to client");

			// Transform profile data to include role field for frontend
			let transformedProfile;
			if ("applicant_id" in profile) {
				// This is an applicant profile
				transformedProfile = {
					...profile,
					role: "applicant",
					id: profile.applicant_id,
					firstName: profile.first_name,
					lastName: profile.last_name,
					gender: profile.gender ? "male" : "female",
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
			} else if ("institution_id" in profile) {
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
					countryCode: "+1", // Default
					interests:
						profile.subdisciplines?.map(
							(s: any) => s.subdiscipline?.name || ""
						) || [],
					favoriteCountries: [],
					profilePhoto: profile.user?.image || "",
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
			console.log("❌ API: Profile not found, returning 404");
			return NextResponse.json(
				{ error: "Profile not found" },
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("❌ API: Error fetching profile:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		console.log("🔵 API: Profile creation request received");

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		console.log("✅ API: User authenticated:", session.user.id);

		const formData: ProfileFormData = await request.json();
		console.log("📋 API: Form data received:", {
			role: formData.role,
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			// Don't log sensitive data
		});

		const userId = session.user.id;

		// Check if profile already exists
		const existingProfile = await ProfileService.getProfile(userId);
		if (existingProfile) {
			console.log("⚠️ API: Profile already exists");
			return NextResponse.json(
				{ error: "Profile already exists" },
				{ status: 409 }
			);
		}

		console.log("💾 API: Creating new profile...");
		// Use the profile service to create the profile
		const newProfile = await ProfileService.upsertProfile(userId, formData);
		console.log(
			"✅ API: Profile created successfully:",
			newProfile ? "Success" : "Failed"
		);

		return NextResponse.json({
			success: true,
			message: "Profile created successfully",
			profile: newProfile,
		});
	} catch (error) {
		console.error("❌ API: Error saving profile:", error);
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
		const formData: ProfileFormData = await request.json();

		console.log("🔍 API: PUT request formData:", {
			role: formData.role,
			firstName: formData.firstName,
			lastName: formData.lastName,
			// Don't log sensitive data
		});

		// Validate role before proceeding
		if (
			!formData.role ||
			(formData.role !== "applicant" && formData.role !== "institution")
		) {
			console.error(
				"❌ API: Invalid role in PUT request:",
				formData.role
			);
			return NextResponse.json(
				{
					error: "Invalid role specified. Must be 'applicant' or 'institution'",
				},
				{ status: 400 }
			);
		}

		// Use the profile service to update the profile
		const updatedProfile = await ProfileService.upsertProfile(
			userId,
			formData
		);

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
