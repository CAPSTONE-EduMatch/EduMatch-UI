import { AdminUserService } from "@/services/admin/admin-user-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;

		// Fetch user data from database
		const dbUser = await AdminUserService.getUserDetails(userId);

		if (!dbUser) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		// Transform database data to frontend format
		const userData = AdminUserService.transformUserData(dbUser);

		return NextResponse.json({
			success: true,
			data: userData,
		});
	} catch (error) {
		// Log error in development environment
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching user details:", error);
			// eslint-disable-next-line no-console
			console.error(
				"Error details:",
				error instanceof Error ? error.message : String(error)
			);
			// eslint-disable-next-line no-console
			if (error instanceof Error && error.stack) {
				// eslint-disable-next-line no-console
				console.error("Error stack:", error.stack);
			}
		}
		return NextResponse.json(
			{
				error: "Internal server error",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
