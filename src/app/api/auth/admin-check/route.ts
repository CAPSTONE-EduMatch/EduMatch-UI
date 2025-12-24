export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to check if the current user has admin role
 */
export async function GET(request: NextRequest) {
	try {
		// Get session from request with role information
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ isAdmin: false, message: "No session found" },
				{ status: 401 }
			);
		}

		// Check if user has admin role from database
		const isAdmin =
			user.email === process.env.ADMIN_EMAIL || user.role === "admin";

		// eslint-disable-next-line no-console
		console.log(
			`[ADMIN CHECK API] User: ${user.email} (${user.id}) - Role: ${user.role || "none"} - IsAdmin: ${isAdmin}`
		);

		return NextResponse.json({
			isAdmin,
			userId: user.id,
			role: user.role || null,
			email: user.email,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[ADMIN CHECK API] Error:", error);
		return NextResponse.json(
			{
				isAdmin: false,
				error: "Failed to check admin status",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
