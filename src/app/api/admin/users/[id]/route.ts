import { AdminUserService } from "@/lib/admin-user-service";
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
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
