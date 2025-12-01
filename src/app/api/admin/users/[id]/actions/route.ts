import { AdminUserService } from "@/services/admin/admin-user-service";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const userId = params.id;
		const body = await request.json();
		const { action, banReason, banDuration } = body;

		if (action === "contact") {
			// Log the contact attempt in the database
			await AdminUserService.logContactAttempt(userId);

			// TODO: Implement actual email sending functionality
			// You could integrate with services like SendGrid, SES, etc.

			return NextResponse.json({
				success: true,
				message: "Contact request logged successfully",
			});
		}

		if (action === "ban") {
			// Verify user exists first
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			// Ban the user with reason and optional duration
			await AdminUserService.banUser(userId, banReason, banDuration);
			await AdminUserService.revokeUserSessions(userId);

			return NextResponse.json({
				success: true,
				message: "User banned successfully",
			});
		}

		if (action === "unban") {
			// Verify user exists first
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			// Unban the user
			await AdminUserService.unbanUser(userId);

			return NextResponse.json({
				success: true,
				message: "User unbanned successfully",
			});
		}

		if (action === "revoke-sessions") {
			// Verify user exists first
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			// Revoke all sessions for the user
			await AdminUserService.revokeUserSessions(userId);

			return NextResponse.json({
				success: true,
				message: "All user sessions revoked successfully",
			});
		}

		if (action === "activate") {
			// Verify user exists first
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			// Activate the user
			await AdminUserService.activateUser(userId);

			return NextResponse.json({
				success: true,
				message: "User activated successfully",
			});
		}

		if (action === "deactivate") {
			// Verify user exists first
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			// Deactivate the user
			await AdminUserService.deactivateUser(userId);

			return NextResponse.json({
				success: true,
				message: "User deactivated successfully",
			});
		}

		if (action === "approve") {
			// Verify user exists and is an institution
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			if (user.role !== "institution") {
				return NextResponse.json(
					{ error: "User is not an institution" },
					{ status: 400 }
				);
			}

			// Get current admin user ID
			const { user: currentAdmin } = await requireAuth();

			// Approve the institution
			await AdminUserService.approveInstitution(userId, currentAdmin.id);

			return NextResponse.json({
				success: true,
				message: "Institution approved successfully",
			});
		}

		if (action === "deny") {
			// Verify user exists and is an institution
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			if (user.role !== "institution") {
				return NextResponse.json(
					{ error: "User is not an institution" },
					{ status: 400 }
				);
			}

			// Get current admin user ID and rejection reason
			const { user: currentAdmin } = await requireAuth();
			const body = await request.json();
			const { rejectionReason } = body;

			// Deny the institution
			await AdminUserService.denyInstitution(
				userId,
				rejectionReason,
				currentAdmin.id
			);

			return NextResponse.json({
				success: true,
				message: "Institution denied successfully",
			});
		}

		if (action === "require-info") {
			// Verify user exists and is an institution
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			if (user.role !== "institution") {
				return NextResponse.json(
					{ error: "User is not an institution" },
					{ status: 400 }
				);
			}

			const { note } = body;
			if (!note || typeof note !== "string" || note.trim().length === 0) {
				return NextResponse.json(
					{ error: "Note is required" },
					{ status: 400 }
				);
			}

			// Log the additional info request
			await AdminUserService.logAdditionalInfoRequest(
				userId,
				note.trim()
			);

			return NextResponse.json({
				success: true,
				message: "Additional information request sent successfully",
			});
		}

		// Legacy support for "deactivate" action
		if (action === "deactivate") {
			// Redirect to ban action with default reason
			const user = await AdminUserService.getUserDetails(userId);

			if (!user) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			await AdminUserService.banUser(
				userId,
				"Account deactivated by administrator",
				30
			);

			return NextResponse.json({
				success: true,
				message: "User banned successfully",
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error processing user action:", error);
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
