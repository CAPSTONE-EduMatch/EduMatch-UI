import {
	AccountDeletedMessage,
	ApplicationStatusMessage,
	DocumentUpdatedMessage,
	NotificationMessage,
	NotificationType,
	PasswordChangedMessage,
	PaymentDeadlineMessage,
	PaymentFailedMessage,
	PaymentSuccessMessage,
	ProfileCreatedMessage,
	SessionRevokedMessage,
	SubscriptionExpiringMessage,
	UserBannedMessage,
	WelcomeMessage,
	WishlistDeadlineMessage,
} from "@/config/sqs-config";
import { isNotificationEnabled } from "@/utils/notifications/notification-settings-helper";
import nodemailer from "nodemailer";
import {
	CompanyEmailOptions,
	renderCompanyEmail,
	generateWelcomeEmailTemplate,
	generateProfileCreatedEmailTemplate,
	generatePaymentDeadlineEmailTemplate,
	generateWishlistDeadlineEmailTemplate,
	generateApplicationStatusEmailTemplate,
	generateDocumentUpdatedEmailTemplate,
	generatePaymentSuccessEmailTemplate,
	generatePaymentFailedEmailTemplate,
	generateSubscriptionExpiringEmailTemplate,
	generateBanEmailTemplate,
	generateRevokeSessionEmailTemplate,
	generatePasswordChangedEmailTemplate,
	generateAccountDeletedEmailTemplate,
} from "./email-template";

// Email service configuration
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT) || 587,
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

// Email templates
export class EmailTemplates {
	/**
	 * Generate welcome email template
	 * Used for: New user signup
	 */
	static generateWelcomeEmail(message: WelcomeMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateWelcomeEmailTemplate(
			metadata.firstName,
			metadata.lastName
		);
	}

	/**
	 * Generate profile created success email template
	 * Used for: When user creates their profile (applicant or institution)
	 */
	static generateProfileCreatedEmail(message: ProfileCreatedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateProfileCreatedEmailTemplate(
			metadata.firstName,
			metadata.lastName,
			metadata.role
		);
	}

	/**
	 * Generate payment deadline email template
	 * Used for: Payment deadline approaching
	 */
	static generatePaymentDeadlineEmail(message: PaymentDeadlineMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generatePaymentDeadlineEmailTemplate(
			metadata.planName,
			metadata.deadlineDate,
			String(metadata.amount),
			metadata.currency
		);
	}

	/**
	 * Generate wishlist deadline email template
	 * Used for: Wishlist item deadline approaching
	 */
	static generateWishlistDeadlineEmail(message: WishlistDeadlineMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateWishlistDeadlineEmailTemplate(
			metadata.postTitle,
			metadata.postId,
			metadata.deadlineDate,
			metadata.daysRemaining,
			metadata.institutionName
		);
	}

	/**
	 * Generate application status update email template
	 * Used for: Application status changes
	 */
	static generateApplicationStatusEmail(message: ApplicationStatusMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateApplicationStatusEmailTemplate(
			metadata.programName,
			metadata.institutionName,
			metadata.oldStatus,
			metadata.newStatus,
			metadata.message
		);
	}

	/**
	 * Generate document updated email template
	 * Used for: When applicant uploads/updates documents
	 */
	static generateDocumentUpdatedEmail(message: DocumentUpdatedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateDocumentUpdatedEmailTemplate(
			metadata.programName,
			metadata.applicantName,
			metadata.applicationId,
			metadata.documentCount
		);
	}

	/**
	 * Generate payment success email template
	 * Used for: Successful payment processing
	 */
	static generatePaymentSuccessEmail(message: PaymentSuccessMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generatePaymentSuccessEmailTemplate(
			metadata.planName,
			String(metadata.amount),
			metadata.currency,
			metadata.transactionId
		);
	}

	/**
	 * Generate payment failed email template
	 * Used for: Failed payment processing
	 */
	static generatePaymentFailedEmail(message: PaymentFailedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generatePaymentFailedEmailTemplate(
			metadata.planName,
			String(metadata.amount),
			metadata.currency,
			metadata.failureReason
		);
	}

	/**
	 * Generate subscription expiring email template
	 * Used for: Subscription about to expire
	 */
	static generateSubscriptionExpiringEmail(
		message: SubscriptionExpiringMessage
	): { subject: string; html: string } {
		const { metadata } = message;
		return generateSubscriptionExpiringEmailTemplate(
			metadata.planName,
			metadata.expiryDate,
			metadata.daysRemaining
		);
	}

	/**
	 * Generate user banned email template
	 * Used for: Account suspension/ban
	 */
	static generateBanEmail(message: UserBannedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateBanEmailTemplate(
			metadata.firstName,
			metadata.lastName,
			metadata.reason,
			metadata.bannedBy,
			metadata.bannedUntil,
			message.userId
		);
	}

	/**
	 * Generate session revoked email template
	 * Used for: Admin revokes user session
	 */
	static generateRevokeSessionEmail(message: SessionRevokedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateRevokeSessionEmailTemplate(
			metadata.firstName,
			metadata.lastName,
			metadata.reason,
			metadata.revokedBy,
			metadata.deviceInfo
		);
	}

	/**
	 * Generate password changed email template
	 * Used for: Password change notification
	 */
	static generatePasswordChangedEmail(message: PasswordChangedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generatePasswordChangedEmailTemplate(
			metadata.firstName,
			metadata.lastName,
			metadata.changeTime,
			metadata.ipAddress
		);
	}

	/**
	 * Generate account deleted email template
	 * Used for: Account deletion confirmation
	 */
	static generateAccountDeletedEmail(message: AccountDeletedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateAccountDeletedEmailTemplate(
			metadata.firstName,
			metadata.lastName,
			metadata.deletionTime
		);
	}
}

// Email service class
export class EmailService {
	/**
	 * Send email based on notification message
	 * Checks user notification settings before sending
	 */
	static async sendNotificationEmail(
		message: NotificationMessage
	): Promise<void> {
		try {
			console.log(
				`📧 EmailService.sendNotificationEmail called for ${message.type} to ${message.userEmail}`
			);

			// Check notification settings before sending email
			let shouldSendEmail = true;

			switch (message.type) {
				case NotificationType.APPLICATION_STATUS_UPDATE:
					shouldSendEmail = await isNotificationEnabled(
						message.userId,
						"application"
					);
					break;
				case NotificationType.DOCUMENT_UPDATED:
					shouldSendEmail = await isNotificationEnabled(
						message.userId,
						"wishlist"
					);
					break;
				case NotificationType.PAYMENT_DEADLINE:
					shouldSendEmail = await isNotificationEnabled(
						message.userId,
						"subscription"
					);
					break;
				case NotificationType.WISHLIST_DEADLINE:
					shouldSendEmail = await isNotificationEnabled(
						message.userId,
						"wishlist"
					);
					console.log(
						`🔔 Wishlist notification enabled check: ${shouldSendEmail} for user ${message.userId}`
					);
					break;
				// Other notification types (WELCOME, PROFILE_CREATED, etc.) are always sent
				default:
					shouldSendEmail = true;
			}

			// If user has disabled this notification type, skip sending email
			if (!shouldSendEmail) {
				console.log(
					`⏭️ Skipping email for ${message.type} - user ${message.userId} has disabled this notification type`
				);
				return;
			}

			let emailContent: { subject: string; html: string };

			// Generate email content based on notification type
			switch (message.type) {
				case NotificationType.WELCOME:
					emailContent = EmailTemplates.generateWelcomeEmail(
						message as WelcomeMessage
					);
					break;
				case NotificationType.PROFILE_CREATED:
					emailContent = EmailTemplates.generateProfileCreatedEmail(
						message as ProfileCreatedMessage
					);
					break;
				case NotificationType.PAYMENT_DEADLINE:
					emailContent = EmailTemplates.generatePaymentDeadlineEmail(
						message as PaymentDeadlineMessage
					);
					break;
				case NotificationType.APPLICATION_STATUS_UPDATE:
					emailContent =
						EmailTemplates.generateApplicationStatusEmail(
							message as ApplicationStatusMessage
						);
					break;
				case NotificationType.DOCUMENT_UPDATED:
					emailContent = EmailTemplates.generateDocumentUpdatedEmail(
						message as DocumentUpdatedMessage
					);
					break;
				case NotificationType.PAYMENT_SUCCESS:
					emailContent = EmailTemplates.generatePaymentSuccessEmail(
						message as PaymentSuccessMessage
					);
					break;
				case NotificationType.PAYMENT_FAILED:
					emailContent = EmailTemplates.generatePaymentFailedEmail(
						message as PaymentFailedMessage
					);
					break;
				case NotificationType.SUBSCRIPTION_EXPIRING:
					emailContent =
						EmailTemplates.generateSubscriptionExpiringEmail(
							message as SubscriptionExpiringMessage
						);
					break;
				case NotificationType.USER_BANNED:
					emailContent = EmailTemplates.generateBanEmail(
						message as UserBannedMessage
					);
					break;
				case NotificationType.SESSION_REVOKED:
					emailContent = EmailTemplates.generateRevokeSessionEmail(
						message as SessionRevokedMessage
					);
					break;
				case NotificationType.WISHLIST_DEADLINE:
					emailContent = EmailTemplates.generateWishlistDeadlineEmail(
						message as WishlistDeadlineMessage
					);
					break;
				case NotificationType.PASSWORD_CHANGED:
					emailContent = EmailTemplates.generatePasswordChangedEmail(
						message as PasswordChangedMessage
					);
					break;
				case NotificationType.ACCOUNT_DELETED:
					emailContent = EmailTemplates.generateAccountDeletedEmail(
						message as AccountDeletedMessage
					);
					break;
				default:
					throw new Error(
						`Unsupported notification type: ${(message as any).type}`
					);
			}

			// Send email
			console.log(
				`📤 Sending email to ${message.userEmail} with subject: ${emailContent.subject}`
			);
			const emailResult = await transporter.sendMail({
				from: process.env.SMTP_FROM || "noreply@edumatch.com",
				to: message.userEmail,
				subject: emailContent.subject,
				html: emailContent.html,
			});
			console.log(
				`✅ Email sent successfully! MessageId: ${emailResult.messageId}, Response: ${emailResult.response}`
			);
		} catch (error) {
			console.error(
				`❌ Error sending notification email to ${message.userEmail}:`,
				error
			);
			if (error instanceof Error) {
				console.error(`❌ Error details: ${error.message}`);
				console.error(`❌ Error stack: ${error.stack}`);
			}
			throw error;
		}
	}

	/**
	 * Send a simple email with custom content
	 */
	static async sendCustomEmail(
		to: string,
		subject: string,
		html: string,
		from?: string,
		attachments?: Array<{
			filename: string;
			content: Buffer;
			contentType?: string;
		}>
	): Promise<void> {
		try {
			await transporter.sendMail({
				from: from || process.env.SMTP_FROM || "noreply@edumatch.com",
				to,
				subject,
				html,
				attachments,
			});
		} catch (error) {
			console.error("Error sending custom email:", error);
			throw error;
		}
	}

	/**
	 * Send a company-branded email using the shared template
	 */
	static async sendCompanyEmail(
		to: string,
		subject: string,
		options: CompanyEmailOptions,
		attachments?: Array<{
			filename: string;
			content: Buffer;
			contentType?: string;
		}>
	): Promise<void> {
		const html = renderCompanyEmail(options);
		return EmailService.sendCustomEmail(
			to,
			subject,
			html,
			undefined,
			attachments
		);
	}
}

export { transporter };
