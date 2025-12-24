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

			// Get the reason from body
			const { reason } = body;

			// Deactivate the user
			await AdminUserService.deactivateUser(userId);

			// Send email notification to user
			if (user.email && reason) {
				try {
					const emailResponse = await fetch(
						`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								to: user.email,
								subject:
									"Account Deactivation Notice - EduMatch",
								html: `
									<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
										<div style="background-color: #126E64; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
											<h2 style="margin: 0;">EduMatch Admin</h2>
										</div>
										<div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
											<h3 style="color: #E20000; margin-top: 0;">Account Deactivation Notice</h3>
											<p style="color: #333; line-height: 1.6;">Dear ${user.name || "User"},</p>
											<p style="color: #333; line-height: 1.6;">
												Your EduMatch account has been deactivated by our administration team.
											</p>
											<div style="background-color: #fff; padding: 15px; border-left: 4px solid #E20000; margin: 20px 0;">
												<strong>Reason:</strong><br/>
												<p style="margin: 10px 0 0 0; color: #555;">${reason}</p>
											</div>
											<p style="color: #333; line-height: 1.6;">
												If you believe this action was taken in error or would like to discuss this matter, 
												please contact our support team.
											</p>
											<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
											<p style="color: #666; font-size: 12px; margin: 0;">
												This email was sent from EduMatch administration system.
											</p>
										</div>
									</div>
								`,
							}),
						}
					);

					if (!emailResponse.ok) {
						console.error("Failed to send deactivation email");
					}
				} catch (emailError) {
					console.error(
						"Error sending deactivation email:",
						emailError
					);
				}
			}

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
