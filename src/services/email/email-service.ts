import nodemailer from "nodemailer";
import { renderCompanyEmail, CompanyEmailOptions } from "./email-template";
import {
	NotificationMessage,
	NotificationType,
	ProfileCreatedMessage,
	PaymentDeadlineMessage,
	ApplicationStatusMessage,
	PaymentSuccessMessage,
	PaymentFailedMessage,
	SubscriptionExpiringMessage,
	WelcomeMessage,
	UserBannedMessage,
	SessionRevokedMessage,
	WishlistDeadlineMessage,
} from "@/config/sqs-config";
import { isNotificationEnabled } from "@/utils/notifications/notification-settings-helper";

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
	 */
	static generateWelcomeEmail(message: WelcomeMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Welcome to EduMatch, ${metadata.firstName}!`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduMatch</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to EduMatch!</h1>
          <p>Your journey to global education starts here</p>
        </div>
        <div class="content">
          <h2>Hello ${metadata.firstName} ${metadata.lastName},</h2>
          <p>Welcome to EduMatch! We're thrilled to have you join our community of students and institutions working together to create meaningful educational connections.</p>
          
          <h3>What you can do next:</h3>
          <ul>
            <li>Complete your profile to get personalized recommendations</li>
            <li>Explore programs and research opportunities</li>
            <li>Connect with institutions worldwide</li>
            <li>Apply for scholarships and funding</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile/create" class="button">Complete Your Profile</a>
          </div>
          
          <p>If you have any questions, our support team is here to help. Just reply to this email or visit our help center.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
          <p>You received this email because you signed up for EduMatch.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate profile created success email template
	 */
	static generateProfileCreatedEmail(message: ProfileCreatedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Profile Created Successfully - Welcome to EduMatch!`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile Created Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; color: #4CAF50; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Profile Created Successfully!</h1>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <h2>Congratulations, ${metadata.firstName}!</h2>
          <p>Your ${metadata.role} profile has been successfully created and is now live on EduMatch.</p>
          
          <h3>What's next?</h3>
          <ul>
            <li>Your profile is now visible to institutions and other users</li>
            <li>Start exploring programs and research opportunities</li>
            <li>Connect with institutions that match your interests</li>
            <li>Apply for scholarships and funding opportunities</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/explore" class="button">Start Exploring</a>
          </div>
          
          <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/help">help center</a> or contact our support team.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate payment deadline email template
	 */
	static generatePaymentDeadlineEmail(message: PaymentDeadlineMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const deadlineDate = new Date(
			metadata.deadlineDate
		).toLocaleDateString();
		const subject = `Payment Deadline Reminder - ${metadata.planName} Subscription`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Deadline Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; color: #ff9800; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .amount { font-size: 24px; font-weight: bold; color: #ff9800; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Deadline Reminder</h1>
        </div>
        <div class="content">
          <div class="warning-icon">⚠</div>
          <h2>Don't Miss Your Payment Deadline</h2>
          <p>This is a friendly reminder that your <strong>${metadata.planName}</strong> subscription payment is due soon.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p><strong>Payment Details:</strong></p>
            <p>Plan: ${metadata.planName}</p>
            <p>Amount: <span class="amount">${metadata.currency} ${metadata.amount}</span></p>
            <p>Deadline: <strong>${deadlineDate}</strong></p>
          </div>
          
          <p>To avoid any interruption to your EduMatch services, please complete your payment before the deadline.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile/view?tab=payment" class="button">Pay Now</a>
          </div>
          
          <p>If you have already made this payment, please ignore this email.</p>
          
          <p>Need help? Contact our support team at <a href="mailto:support@edumatch.com">support@edumatch.com</a></p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate wishlist deadline email template
	 */
	static generateWishlistDeadlineEmail(message: WishlistDeadlineMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const deadlineDate = new Date(
			metadata.deadlineDate
		).toLocaleDateString();
		const daysText =
			metadata.daysRemaining === 1
				? "1 day"
				: `${metadata.daysRemaining} days`;
		const subject = `Deadline Approaching - ${metadata.postTitle}`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wishlist Deadline Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; color: #9C27B0; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #9C27B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .deadline-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #9C27B0; }
          .days-remaining { font-size: 24px; font-weight: bold; color: #9C27B0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ Deadline Approaching</h1>
        </div>
        <div class="content">
          <div class="warning-icon">📅</div>
          <h2>Don't Miss This Opportunity!</h2>
          <p>This is a friendly reminder that an opportunity in your wishlist is approaching its deadline.</p>
          
          <div class="deadline-box">
            <p><strong>Opportunity Details:</strong></p>
            <p><strong>Title:</strong> ${metadata.postTitle}</p>
            ${metadata.institutionName ? `<p><strong>Institution:</strong> ${metadata.institutionName}</p>` : ""}
            <p><strong>Deadline:</strong> <span class="days-remaining">${deadlineDate}</span></p>
            <p><strong>Time Remaining:</strong> <span class="days-remaining">${daysText}</span></p>
          </div>
          
          <p>Don't miss out on this opportunity! Make sure to submit your application before the deadline.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ""}/explore/programs/program-detail?postId=${metadata.postId}" class="button">View Opportunity</a>
          </div>
          
          <p>If you've already applied or are no longer interested, you can remove this item from your wishlist.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate application status update email template
	 */
	static generateApplicationStatusEmail(message: ApplicationStatusMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Application Status Update - ${metadata.programName}`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .status-approved { background: #4CAF50; color: white; }
          .status-pending { background: #ff9800; color: white; }
          .status-rejected { background: #f44336; color: white; }
          .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Application Status Update</h1>
        </div>
        <div class="content">
          <h2>Your Application Status Has Been Updated</h2>
          <p>We have an update regarding your application to <strong>${metadata.programName}</strong> at <strong>${metadata.institutionName}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Application Details:</strong></p>
            <p>Program: ${metadata.programName}</p>
            <p>Institution: ${metadata.institutionName}</p>
            <p>Previous Status: ${metadata.oldStatus}</p>
            <p>New Status: <span class="status-badge status-${metadata.newStatus.toLowerCase()}">${metadata.newStatus}</span></p>
          </div>
          
          ${this.getStatusSpecificContent(metadata.newStatus, metadata.message)}
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile/applications" class="button">View Application</a>
          </div>
          
          <p>If you have any questions about this update, please don't hesitate to contact the institution directly or reach out to our support team.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate payment success email template
	 */
	static generatePaymentSuccessEmail(message: PaymentSuccessMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Payment Successful - ${metadata.planName} Subscription`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; color: #4CAF50; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Successful!</h1>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <h2>Thank You for Your Payment</h2>
          <p>Your payment has been processed successfully. Your subscription is now active.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <p><strong>Payment Details:</strong></p>
            <p>Plan: ${metadata.planName}</p>
            <p>Amount: <span class="amount">${metadata.currency} ${metadata.amount}</span></p>
            <p>Transaction ID: ${metadata.transactionId}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Your EduMatch subscription is now active and you have access to all premium features.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile" class="button">Access Your Profile</a>
          </div>
          
          <p>If you have any questions about your subscription, please contact our support team.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate payment failed email template
	 */
	static generatePaymentFailedEmail(message: PaymentFailedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Payment Failed - ${metadata.planName} Subscription`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .error-icon { font-size: 48px; color: #f44336; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Failed</h1>
        </div>
        <div class="content">
          <div class="error-icon">✗</div>
          <h2>Payment Could Not Be Processed</h2>
          <p>We were unable to process your payment for the <strong>${metadata.planName}</strong> subscription.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
            <p><strong>Payment Details:</strong></p>
            <p>Plan: ${metadata.planName}</p>
            <p>Amount: ${metadata.currency} ${metadata.amount}</p>
            <p>Reason: ${metadata.failureReason}</p>
          </div>
          
          <p>Please try updating your payment method or contact your bank if the issue persists.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile/view?tab=payment" class="button">Update Payment Method</a>
          </div>
          
          <p>If you continue to experience issues, please contact our support team at <a href="mailto:support@edumatch.com">support@edumatch.com</a></p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate subscription expiring email template
	 */
	static generateSubscriptionExpiringEmail(
		message: SubscriptionExpiringMessage
	): { subject: string; html: string } {
		const { metadata } = message;
		const expiryDate = new Date(metadata.expiryDate).toLocaleDateString();
		const subject = `Subscription Expiring Soon - ${metadata.planName}`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Expiring Soon</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; color: #ff9800; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Subscription Expiring Soon</h1>
        </div>
        <div class="content">
          <div class="warning-icon">⏰</div>
          <h2>Your Subscription Will Expire Soon</h2>
          <p>Your <strong>${metadata.planName}</strong> subscription will expire in <strong>${metadata.daysRemaining} days</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p><strong>Subscription Details:</strong></p>
            <p>Plan: ${metadata.planName}</p>
            <p>Expiry Date: <strong>${expiryDate}</strong></p>
            <p>Days Remaining: <strong>${metadata.daysRemaining}</strong></p>
          </div>
          
          <p>To continue enjoying all EduMatch premium features, please renew your subscription before it expires.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/profile/view?tab=payment" class="button">Renew Subscription</a>
          </div>
          
          <p>If you have any questions about your subscription, please contact our support team.</p>
          
          <p>Best regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate user banned email template
	 */
	static generateBanEmail(message: UserBannedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Account Suspended - EduMatch`;
		const bannedUntilText = metadata.bannedUntil
			? `until ${new Date(metadata.bannedUntil).toLocaleDateString()}`
			: "permanently";

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; color: #f44336; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .alert-box { background: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Account Suspended</h1>
        </div>
        <div class="content">
          <div class="warning-icon">🚫</div>
          <h2>Dear ${metadata.firstName} ${metadata.lastName},</h2>
          <p>We regret to inform you that your EduMatch account has been suspended <strong>${bannedUntilText}</strong>.</p>
          
          <div class="alert-box">
            <p><strong>Suspension Details:</strong></p>
            <p><strong>Reason:</strong> ${metadata.reason}</p>
            <p><strong>Action taken by:</strong> ${metadata.bannedBy}</p>
            ${metadata.bannedUntil ? `<p><strong>Suspension period:</strong> Until ${new Date(metadata.bannedUntil).toLocaleDateString()}</p>` : `<p><strong>Suspension type:</strong> Permanent</p>`}
          </div>
          
          <h3>What this means:</h3>
          <ul>
            <li>You will not be able to access your EduMatch account</li>
            <li>Your profile will be hidden from search results</li>
            <li>You cannot submit new applications or messages</li>
            <li>Existing applications may be affected</li>
          </ul>
          
          ${metadata.bannedUntil ? `<p>Your account will be automatically restored on <strong>${new Date(metadata.bannedUntil).toLocaleDateString()}</strong>.</p>` : ""}
          
          <h3>Need to appeal?</h3>
          <p>If you believe this suspension was made in error or would like to appeal this decision, please contact our support team with your case details.</p>
          
          <div style="text-align: center;">
            <a href="mailto:support@edumatch.com?subject=Account Suspension Appeal - ${message.userId}" class="button">Contact Support</a>
          </div>
          
          <p>We take violations of our community guidelines seriously to maintain a safe and trusted environment for all users.</p>
          
          <p>Regards,<br>The EduMatch Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
          <p>This is an automated notification regarding your account status.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Generate session revoked email template
	 */
	static generateRevokeSessionEmail(message: SessionRevokedMessage): {
		subject: string;
		html: string;
	} {
		const { metadata } = message;
		const subject = `Security Alert - Session Revoked`;

		const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Revoked</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; color: #ff9800; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .security-box { background: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Security Alert</h1>
        </div>
        <div class="content">
          <div class="warning-icon">🔐</div>
          <h2>Dear ${metadata.firstName} ${metadata.lastName},</h2>
          <p>This is a security notification to inform you that one or more of your active sessions has been revoked by an administrator.</p>
          
          <div class="security-box">
            <p><strong>Session Revocation Details:</strong></p>
            <p><strong>Reason:</strong> ${metadata.reason}</p>
            <p><strong>Action taken by:</strong> ${metadata.revokedBy}</p>
            ${metadata.deviceInfo ? `<p><strong>Device/Location:</strong> ${metadata.deviceInfo}</p>` : ""}
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <h3>What happened?</h3>
          <p>An administrator has manually terminated your active session(s). This action was taken for security or administrative purposes.</p>
          
          <h3>What you need to do:</h3>
          <ul>
            <li>You will be logged out from all devices</li>
            <li>You can log back in immediately with your credentials</li>
            <li>Please review your recent account activity</li>
            <li>If you didn't expect this, contact support immediately</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/signin" class="button">Sign In Again</a>
          </div>
          
          <h3>Security Tips:</h3>
          <ul>
            <li>Ensure your password is strong and unique</li>
            <li>Enable two-factor authentication if available</li>
            <li>Don't share your login credentials</li>
            <li>Always log out from shared or public devices</li>
          </ul>
          
          <p><strong>Didn't recognize this activity?</strong> Contact our support team immediately at <a href="mailto:support@edumatch.com">support@edumatch.com</a></p>
          
          <p>Best regards,<br>The EduMatch Security Team</p>
        </div>
        <div class="footer">
          <p>© 2024 EduMatch. All rights reserved.</p>
          <p>This is an automated security notification. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

		return { subject, html };
	}

	/**
	 * Get status-specific content for application status emails
	 */
	private static getStatusSpecificContent(
		status: string,
		message?: string
	): string {
		switch (status.toLowerCase()) {
			case "accepted":
				return `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3>🎉 Congratulations!</h3>
            <p>Your application has been approved! The institution will contact you soon with next steps.</p>
          </div>
        `;
			case "rejected":
				return `
          <div style="background: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3>Application Not Selected</h3>
            <p>Unfortunately, your application was not selected this time. Don't give up - there are many other opportunities available!</p>
          </div>
        `;
			case "require_update":
				return `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <h3>📋 Action Required - Application Review Update</h3>
            <p>The institution has reviewed your application and requires additional information or updates.</p>
            ${
				message
					? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; font-weight: 600; color: #333;">Message from the institution:</p>
              <p style="margin: 0; color: #555; white-space: pre-wrap;">${message
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#39;")}</p>
            </div>
            `
					: ""
			}
            <p>Please check your application dashboard and messages to view the complete details and take the necessary action.</p>
          </div>
        `;
			case "submitted":
				return `
          <div style="background: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3>Application Under Review</h3>
            <p>Your application has been submitted and is currently being reviewed by the institution. We'll notify you as soon as there are any updates.</p>
          </div>
        `;
			case "updated":
				return `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <h3>Application Updated</h3>
            <p>Your application has been updated. The institution will review your changes.</p>
          </div>
        `;
			default:
				return `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <h3>Status Update</h3>
            <p>Your application status has been updated. Please check your application dashboard for more details.</p>
          </div>
        `;
		}
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
			// Check notification settings before sending email
			let shouldSendEmail = true;

			switch (message.type) {
				case NotificationType.APPLICATION_STATUS_UPDATE:
					shouldSendEmail = await isNotificationEnabled(
						message.userId,
						"application"
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
					break;
				// Other notification types (WELCOME, PROFILE_CREATED, etc.) are always sent
				default:
					shouldSendEmail = true;
			}

			// If user has disabled this notification type, skip sending email
			if (!shouldSendEmail) {
				if (process.env.NODE_ENV === "development") {
					console.log(
						`⏭️ Skipping email for ${message.type} - user has disabled this notification type`
					);
				}
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
				default:
					throw new Error(
						`Unsupported notification type: ${(message as any).type}`
					);
			} // Send email
			await transporter.sendMail({
				from: process.env.SMTP_FROM || "noreply@edumatch.com",
				to: message.userEmail,
				subject: emailContent.subject,
				html: emailContent.html,
			});
		} catch (error) {
			console.error("Error sending notification email:", error);
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
