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
	PostStatusUpdateMessage,
	InstitutionProfileStatusUpdateMessage,
	ProfileCreatedMessage,
	SessionRevokedMessage,
	SubscriptionExpiringMessage,
	SupportReplyMessage,
	UserBannedMessage,
	WelcomeMessage,
	WishlistDeadlineMessage,
} from "@/config/sqs-config";
import { isNotificationEnabled } from "@/utils/notifications/notification-settings-helper";
import nodemailer from "nodemailer";
import {
	CompanyEmailOptions,
	generateAccountDeletedEmailTemplate,
	generateApplicationStatusEmailTemplate,
	generateBanEmailTemplate,
	generateDocumentUpdatedEmailTemplate,
	generatePasswordChangedEmailTemplate,
	generatePaymentDeadlineEmailTemplate,
	generatePaymentFailedEmailTemplate,
	generatePaymentSuccessEmailTemplate,
	generatePostStatusUpdateEmailTemplate,
	generateInstitutionProfileStatusUpdateEmailTemplate,
	generateProfileCreatedEmailTemplate,
	generateRevokeSessionEmailTemplate,
	generateSubscriptionExpiringEmailTemplate,
	generateWelcomeEmailTemplate,
	generateWishlistDeadlineEmailTemplate,
	renderCompanyEmail,
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

	/**
	 * Generate support reply email template
	 * Used for: When admin replies to customer support request
	 */
	static generateSupportReplyEmail(message: SupportReplyMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;

		const subject = `Support Reply - ${metadata.originalSubject}`;

		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Reply</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #126E64; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
        .content { padding: 20px 0; }
        .original-request { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #126E64; }
        .reply-section { background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #1890ff; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin-top: 20px; }
        .button { display: inline-block; background-color: #126E64; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .reference { font-size: 12px; color: #666; margin-top: 15px; }
        .signature { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Support Reply from EduMatch</h1>
            <p>We have responded to your support request</p>
        </div>
        
        <div class="content">
            <p>Hello ${metadata.firstName} ${metadata.lastName},</p>
            
            <p>Thank you for contacting EduMatch support. We have reviewed your request and here is our response:</p>
            
            <div class="original-request">
                <h3>📋 Your Original Request:</h3>
                <p><strong>Subject:</strong> ${metadata.originalSubject}</p>
                <p><strong>Your Message:</strong></p>
                <p>${metadata.originalMessage.replace(/\n/g, "<br>")}</p>
            </div>
            
            <div class="reply-section">
                <h3>💬 Our Response:</h3>
                <p>${metadata.replyMessage.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>If you have any additional questions or need further assistance, please don't hesitate to contact us again.</p>
            
            <div class="footer">
                <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/support" class="button">
                    Contact Support Again
                </a>
                
                <div class="reference">
                    <p><strong>Reference ID:</strong> ${metadata.supportId}</p>
                    <p><strong>Replied on:</strong> ${new Date(metadata.repliedAt).toLocaleString()}</p>
                </div>
            </div>
            
            <div class="signature">
                <p>Best regards,<br>
                The EduMatch Support Team</p>
            </div>
        </div>
    </div>
</body>
</html>`;

		return { subject, html };
	}

	/**
	 * Generate post status update email template
	 * Used for: When admin changes status of institution's post
	 */
	static generatePostStatusUpdateEmail(message: PostStatusUpdateMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generatePostStatusUpdateEmailTemplate(
			metadata.postTitle,
			metadata.postType,
			metadata.institutionName,
			metadata.oldStatus,
			metadata.newStatus,
			metadata.postUrl,
			metadata.rejectionReason
		);
	}

	static generateInstitutionProfileStatusUpdateEmail(
		message: InstitutionProfileStatusUpdateMessage
	): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		return generateInstitutionProfileStatusUpdateEmailTemplate(
			metadata.institutionName,
			metadata.oldStatus,
			metadata.newStatus,
			metadata.profileUrl,
			metadata.rejectionReason
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
				case NotificationType.SUPPORT_REPLY:
					// Support replies are always sent (important for customer service)
					shouldSendEmail = true;
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
				case NotificationType.SUPPORT_REPLY:
					emailContent = EmailTemplates.generateSupportReplyEmail(
						message as SupportReplyMessage
					);
					break;
				case NotificationType.POST_STATUS_UPDATE:
					emailContent = EmailTemplates.generatePostStatusUpdateEmail(
						message as PostStatusUpdateMessage
					);
					break;
				case NotificationType.INSTITUTION_PROFILE_STATUS_UPDATE:
					emailContent =
						EmailTemplates.generateInstitutionProfileStatusUpdateEmail(
							message as InstitutionProfileStatusUpdateMessage
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
