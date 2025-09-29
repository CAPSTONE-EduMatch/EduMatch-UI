import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";

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

		// For testing purposes, just log the data and return success
		// Files are already uploaded to S3 with user-specific paths
		console.log("Profile data received for user:", userId, {
			role: formData.role,
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			// Log file counts for verification
			cvFiles: formData.cvFiles?.length || 0,
			languageCertFiles: formData.languageCertFiles?.length || 0,
			degreeFiles: formData.degreeFiles?.length || 0,
			transcriptFiles: formData.transcriptFiles?.length || 0,
			researchPapers: formData.researchPapers?.length || 0,
			institutionVerificationDocuments:
				formData.institutionVerificationDocuments?.length || 0,
		});

		return NextResponse.json({
			success: true,
			message:
				"Profile data received successfully (testing mode - no database save)",
			userId: userId,
			data: {
				role: formData.role,
				fileCounts: {
					cvFiles: formData.cvFiles?.length || 0,
					languageCertFiles: formData.languageCertFiles?.length || 0,
					degreeFiles: formData.degreeFiles?.length || 0,
					transcriptFiles: formData.transcriptFiles?.length || 0,
					researchPapers: formData.researchPapers?.length || 0,
					institutionVerificationDocuments:
						formData.institutionVerificationDocuments?.length || 0,
				},
			},
		});
	} catch (error) {
		console.error("Error saving profile:", error);
		return NextResponse.json(
			{ error: "Failed to save profile" },
			{ status: 500 }
		);
	}
}
