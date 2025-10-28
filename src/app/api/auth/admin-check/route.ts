export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to check if the current user has admin role
 */
export async function GET(request: NextRequest) {
	try {
		// Get session from request
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ isAdmin: false, message: "No session found" },
				{ status: 401 }
			);
		}

		// Check if user has admin role
		// Better Auth admin plugin adds role information to user
		const isAdmin =
			user.email === process.env.ADMIN_EMAIL || user.role === "admin";

		return NextResponse.json({
			isAdmin,
			userId: user.id,
			role: user.role,
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
