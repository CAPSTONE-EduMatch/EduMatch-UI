import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/services/email/email-service";
import {
	WelcomeMessage,
	ProfileCreatedMessage,
	PaymentDeadlineMessage,
	WishlistDeadlineMessage,
	ApplicationStatusMessage,
	DocumentUpdatedMessage,
	PaymentSuccessMessage,
	PaymentFailedMessage,
	SubscriptionExpiringMessage,
	UserBannedMessage,
	SessionRevokedMessage,
	PasswordChangedMessage,
	AccountDeletedMessage,
	NotificationType,
} from "@/config/sqs-config";

export const dynamic = "force-dynamic";

/**
 * Test API endpoint for email templates
 * Only available in development mode or for admin users
 *
 * Usage:
 * POST /api/test/email
 * Body: { type: "welcome", to: "test@example.com" }
 */
export async function POST(request: NextRequest) {
	try {
		// Only allow in development or for admin users
		if (process.env.NODE_ENV === "production") {
			const { user } = await requireAuth();
			const isAdmin =
				user?.email === process.env.ADMIN_EMAIL ||
				user?.role === "admin";
			if (!isAdmin) {
				return NextResponse.json(
					{
						error: "This endpoint is only available to admins in production",
					},
					{ status: 403 }
				);
			}
		}

		const body = await request.json();
		const { type, to } = body;

		if (!type || !to) {
			return NextResponse.json(
				{ error: "Missing required fields: type, to" },
				{ status: 400 }
			);
		}

		// Get test user ID (use a default test ID or from auth)
		let testUserId = "test-user-id";
		try {
			const { user } = await requireAuth();
			if (user?.id) {
				testUserId = user.id;
			}
		} catch {
			// If not authenticated, use test ID
		}

		// Create test message based on type
		let testMessage: any;

		switch (type) {
			case "welcome":
				testMessage = {
					id: `test-welcome-${Date.now()}`,
					type: NotificationType.WELCOME,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: "John",
						lastName: "Doe",
					},
				} as WelcomeMessage;
				break;

			case "profile_created":
				testMessage = {
					id: `test-profile-created-${Date.now()}`,
					type: NotificationType.PROFILE_CREATED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						profileId: "test-profile-id",
						firstName: "Jane",
						lastName: "Smith",
						role: "applicant",
					},
				} as ProfileCreatedMessage;
				break;

			case "payment_deadline":
				testMessage = {
					id: `test-payment-deadline-${Date.now()}`,
					type: NotificationType.PAYMENT_DEADLINE,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						subscriptionId: "test-subscription-id",
						planName: "Premium Plan",
						deadlineDate: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000
						).toISOString(),
						amount: 99.99,
						currency: "USD",
					},
				} as PaymentDeadlineMessage;
				break;

			case "wishlist_deadline":
				testMessage = {
					id: `test-wishlist-deadline-${Date.now()}`,
					type: NotificationType.WISHLIST_DEADLINE,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						postTitle: "PhD in Computer Science",
						postId: "test-post-id",
						deadlineDate: new Date(
							Date.now() + 14 * 24 * 60 * 60 * 1000
						).toISOString(),
						daysRemaining: 14,
						institutionName: "Test University",
					},
				} as WishlistDeadlineMessage;
				break;

			case "application_status":
				testMessage = {
					id: `test-application-status-${Date.now()}`,
					type: NotificationType.APPLICATION_STATUS_UPDATE,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						applicationId: "test-app-id",
						programName: "Master's in Data Science",
						institutionName: "Test University",
						oldStatus: "submitted",
						newStatus: "accepted",
						message:
							"Congratulations! Your application has been accepted.",
					},
				} as ApplicationStatusMessage;
				break;

			case "document_updated":
				testMessage = {
					id: `test-document-updated-${Date.now()}`,
					type: NotificationType.DOCUMENT_UPDATED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						applicationId: "test-app-id",
						programName: "PhD in Engineering",
						applicantName: "John Doe",
						institutionName: "Test University",
						documentCount: 3,
					},
				} as DocumentUpdatedMessage;
				break;

			case "payment_success":
				testMessage = {
					id: `test-payment-success-${Date.now()}`,
					type: NotificationType.PAYMENT_SUCCESS,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						subscriptionId: "test-subscription-id",
						planName: "Premium Plan",
						amount: 99.99,
						currency: "USD",
						transactionId: "txn_test_123456",
					},
				} as PaymentSuccessMessage;
				break;

			case "payment_failed":
				testMessage = {
					id: `test-payment-failed-${Date.now()}`,
					type: NotificationType.PAYMENT_FAILED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						subscriptionId: "test-subscription-id",
						planName: "Premium Plan",
						amount: 99.99,
						currency: "USD",
						failureReason: "Insufficient funds",
					},
				} as PaymentFailedMessage;
				break;

			case "subscription_expiring":
				testMessage = {
					id: `test-subscription-expiring-${Date.now()}`,
					type: NotificationType.SUBSCRIPTION_EXPIRING,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						subscriptionId: "test-subscription-id",
						planName: "Premium Plan",
						expiryDate: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000
						).toISOString(),
						daysRemaining: 7,
					},
				} as SubscriptionExpiringMessage;
				break;

			case "user_banned":
				testMessage = {
					id: `test-user-banned-${Date.now()}`,
					type: NotificationType.USER_BANNED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: "John",
						lastName: "Doe",
						reason: "Violation of terms of service",
						bannedBy: "Admin User",
						bannedUntil: new Date(
							Date.now() + 30 * 24 * 60 * 60 * 1000
						).toISOString(),
					},
				} as UserBannedMessage;
				break;

			case "session_revoked":
				testMessage = {
					id: `test-session-revoked-${Date.now()}`,
					type: NotificationType.SESSION_REVOKED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: "John",
						lastName: "Doe",
						reason: "Security precaution",
						revokedBy: "Admin User",
						deviceInfo: "Chrome on Windows",
					},
				} as SessionRevokedMessage;
				break;

			case "password_changed":
				testMessage = {
					id: `test-password-changed-${Date.now()}`,
					type: NotificationType.PASSWORD_CHANGED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: "John",
						lastName: "Doe",
						changeTime: new Date().toISOString(),
						ipAddress: "192.168.1.1",
					},
				} as PasswordChangedMessage;
				break;

			case "account_deleted":
				testMessage = {
					id: `test-account-deleted-${Date.now()}`,
					type: NotificationType.ACCOUNT_DELETED,
					userId: testUserId,
					userEmail: to,
					timestamp: new Date().toISOString(),
					metadata: {
						firstName: "John",
						lastName: "Doe",
						deletionTime: new Date().toISOString(),
					},
				} as AccountDeletedMessage;
				break;

			default:
				return NextResponse.json(
					{
						error: `Unknown email type: ${type}`,
						availableTypes: [
							"welcome",
							"profile_created",
							"payment_deadline",
							"wishlist_deadline",
							"application_status",
							"document_updated",
							"payment_success",
							"payment_failed",
							"subscription_expiring",
							"user_banned",
							"session_revoked",
							"password_changed",
							"account_deleted",
						],
					},
					{ status: 400 }
				);
		}

		// Send the test email
		await EmailService.sendNotificationEmail(testMessage);

		return NextResponse.json({
			success: true,
			message: `Test ${type} email sent to ${to}`,
			type,
			to,
		});
	} catch (error) {
		console.error("Error sending test email:", error);
		return NextResponse.json(
			{
				error: "Failed to send test email",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

/**
 * GET endpoint to list available email types
 */
export async function GET() {
	return NextResponse.json({
		availableTypes: [
			{
				type: "welcome",
				description: "Welcome email for new users",
			},
			{
				type: "profile_created",
				description: "Profile creation confirmation",
			},
			{
				type: "payment_deadline",
				description: "Payment deadline reminder",
			},
			{
				type: "wishlist_deadline",
				description: "Wishlist deadline reminder",
			},
			{
				type: "application_status",
				description: "Application status update",
			},
			{
				type: "document_updated",
				description: "Document upload notification",
			},
			{
				type: "payment_success",
				description: "Successful payment confirmation",
			},
			{
				type: "payment_failed",
				description: "Failed payment notification",
			},
			{
				type: "subscription_expiring",
				description: "Subscription expiration warning",
			},
			{
				type: "user_banned",
				description: "Account suspension notification",
			},
			{
				type: "session_revoked",
				description: "Session revocation security alert",
			},
			{
				type: "password_changed",
				description: "Password change notification",
			},
			{
				type: "account_deleted",
				description: "Account deletion confirmation",
			},
		],
		usage: {
			method: "POST",
			endpoint: "/api/test/email",
			body: {
				type: "welcome",
				to: "your-email@example.com",
			},
		},
	});
}
