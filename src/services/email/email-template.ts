// Centralized, professional email template for the entire platform
// Usage: renderCompanyEmail({ title, preheader, bodyHtml, ... })

export type EmailCta = {
	label: string;
	url: string;
	style?: "primary" | "secondary";
};

export type CompanyEmailOptions = {
	title?: string;
	preheader?: string;
	bodyHtml: string; // inner HTML already sanitized/encoded by caller
	primaryCta?: EmailCta;
	secondaryCta?: EmailCta;
	footerExtrasHtml?: string; // optional extra footer notes
	brandName?: string;
	brandTagline?: string;
	brandingColor?: string; // hex
	logoUrl?: string; // absolute URL to logo
	unsubscribeUrl?: string;
	helpCenterUrl?: string;
};

export function renderCompanyEmail(options: CompanyEmailOptions): string {
	const brandName =
		options.brandName || process.env.NEXT_PUBLIC_BRAND_NAME || "EduMatch";
	const brandTagline =
		options.brandTagline ||
		"Connecting students and institutions worldwide";
	const primaryColor = options.brandingColor || "#126E64";
	const accentColor = shadeColor(primaryColor, -10);
	const lightBg = "#f7f7fb";
	const contentBg = "#ffffff";
	const textColor = "#1f2937";
	const mutedText = "#6b7280";
	const borderColor = "#e5e7eb";
	// Logo removed - no logo in emails
	const helpCenterUrl =
		options.helpCenterUrl ||
		`${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/support`;
	const unsubscribeUrl = options.unsubscribeUrl;
	const preheader = options.preheader || "";
	const title = options.title || brandName;

	const primaryCtaHtml = options.primaryCta
		? renderButton(
				options.primaryCta.label,
				options.primaryCta.url,
				primaryColor
			)
		: "";
	const secondaryCtaHtml = options.secondaryCta
		? renderButton(
				options.secondaryCta.label,
				options.secondaryCta.url,
				"#374151"
			)
		: "";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: ${lightBg}; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; color: ${textColor}; }
    .container { width: 100%; max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .card { background: ${contentBg}; border: 1px solid ${borderColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${accentColor}); padding: 28px 24px; color: #fff; }
    .brand { display: flex; align-items: center; }
    .brand h1 { margin: 0; font-size: 18px; line-height: 1.2; }
    .brand p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .title { margin: 0 0 12px; font-size: 20px; font-weight: 600; }
    .muted { color: ${mutedText}; font-size: 14px; }
    .body { margin-top: 12px; font-size: 15px; line-height: 1.6; color: ${textColor}; }
    .cta { margin: 20px 0 6px; display: flex; gap: 12px; flex-wrap: wrap; }
    .button { display: inline-block; padding: 12px 18px; border-radius: 8px; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
    .divider { height: 1px; background: ${borderColor}; margin: 8px 0 0; }
    .footer { padding: 16px 24px 22px; }
    .footer-links a { color: ${mutedText}; text-decoration: underline; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }

    @media (prefers-color-scheme: dark) {
      html, body { background: #0b1220; }
      .card { background: #0f172a; border-color: #1f2937; }
      .content { color: #e5e7eb; }
      .muted { color: #9ca3af; }
      .divider { background: #1f2937; }
      .button.secondary { background: #4b5563 !important; }
    }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .footer { padding: 16px 20px 20px; }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(preheader)}</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">
          <div>
            <h1>${escapeHtml(brandName)}</h1>
            <p>${escapeHtml(brandTagline)}</p>
          </div>
        </div>
      </div>
      <div class="content">
        ${title ? `<div class="title">${escapeHtml(title)}</div>` : ""}
        <div class="body">${options.bodyHtml}</div>
        ${
			primaryCtaHtml || secondaryCtaHtml
				? `<div class="cta">${primaryCtaHtml}${secondaryCtaHtml}</div>`
				: ""
		}
      </div>
      <div class="divider"></div>
      <div class="footer">
        ${options.footerExtrasHtml || ""}
        <div class="muted" style="margin-top: 8px;">
          <div class="footer-links">
            <a href="${helpCenterUrl}">Help center</a>
            ${unsubscribeUrl ? ` • <a href="${unsubscribeUrl}">Unsubscribe</a>` : ""}
          </div>
          <div style="margin-top: 10px;">
            © ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderButton(label: string, url: string, color: string): string {
	return `<a class="button" href="${url}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: ${color}; color: #ffffff !important; text-decoration: none !important; font-weight: 600; font-size: 14px; border: none; outline: none;">${escapeHtml(
		label
	)}</a>`;
}

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function shadeColor(hex: string, percent: number): string {
	// Simple hex shade utility
	const f = parseInt(hex.slice(1), 16);
	const t = percent < 0 ? 0 : 255;
	const p = Math.abs(percent) / 100;
	const R = f >> 16;
	const G = (f >> 8) & 0x00ff;
	const B = f & 0x0000ff;
	const newR = Math.round((t - R) * p) + R;
	const newG = Math.round((t - G) * p) + G;
	const newB = Math.round((t - B) * p) + B;
	return `#${(0x1000000 + (newR << 16) + (newG << 8) + newB)
		.toString(16)
		.slice(1)}`;
}

// ============================================================================
// EMAIL TEMPLATES - All notification-based emails use the unified template
// ============================================================================

/**
 * Template: Welcome Email
 * Used for: New user signup
 * Trigger: When a user creates an account
 */
export function generateWelcomeEmailTemplate(
	firstName: string,
	lastName: string
): { subject: string; html: string } {
	const subject = `Welcome to EduMatch, ${escapeHtml(firstName)}!`;

	const bodyHtml = `
		<p>Hello <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
		<p>Welcome to EduMatch! We're thrilled to have you join our community of students and institutions working together to create meaningful educational connections.</p>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What you can do next:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>Complete your profile to get personalized recommendations</li>
			<li>Explore programs and research opportunities</li>
			<li>Connect with institutions worldwide</li>
			<li>Apply for scholarships and funding</li>
		</ul>
		
		<p style="margin-top: 24px;">If you have any questions, our support team is here to help. Just reply to this email or visit our help center.</p>
	`;

	const html = renderCompanyEmail({
		title: "Welcome to EduMatch!",
		preheader: "Your journey to global education starts here",
		bodyHtml,
		primaryCta: {
			label: "Complete Your Profile",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/create`,
		},
	});

	return { subject, html };
}

/**
 * Template: Profile Created Email
 * Used for: When user creates their profile (applicant or institution)
 * Trigger: After profile creation is completed
 */
export function generateProfileCreatedEmailTemplate(
	firstName: string,
	lastName: string,
	role: string
): { subject: string; html: string } {
	const subject = `Profile Created Successfully - Welcome to EduMatch!`;

	const bodyHtml = `
		<p>Congratulations, <strong>${escapeHtml(firstName)}</strong>!</p>
		<p>Your <strong>${escapeHtml(role)}</strong> profile has been successfully created and is now live on EduMatch.</p>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What's next?</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>Your profile is now visible to institutions and other users</li>
			<li>Start exploring programs and research opportunities</li>
			<li>Connect with institutions that match your interests</li>
			<li>Apply for scholarships and funding opportunities</li>
		</ul>
		
		<p style="margin-top: 24px;">Need help getting started? Check out our help center or contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Profile Created Successfully!",
		preheader: "Your profile is now live",
		bodyHtml,
		primaryCta: {
			label: "Start Exploring",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/explore`,
		},
		brandingColor: "#4CAF50",
	});

	return { subject, html };
}

/**
 * Template: Payment Deadline Reminder Email
 * Used for: Payment deadline approaching
 * Trigger: When payment deadline is near
 */
export function generatePaymentDeadlineEmailTemplate(
	planName: string,
	deadlineDate: string,
	amount: string,
	currency: string
): { subject: string; html: string } {
	const deadlineDateFormatted = new Date(deadlineDate).toLocaleDateString();
	const subject = `Payment Deadline Reminder - ${escapeHtml(planName)} Subscription`;

	const bodyHtml = `
		<p>This is a friendly reminder that your <strong>${escapeHtml(planName)}</strong> subscription payment is due soon.</p>
		
		<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
			<p style="margin: 0 0 12px; font-weight: 600;">Payment Details:</p>
			<p style="margin: 4px 0;"><strong>Plan:</strong> ${escapeHtml(planName)}</p>
			<p style="margin: 4px 0;"><strong>Amount:</strong> <span style="font-size: 20px; font-weight: bold; color: #ff9800;">${escapeHtml(currency)} ${escapeHtml(amount)}</span></p>
			<p style="margin: 4px 0;"><strong>Deadline:</strong> ${escapeHtml(deadlineDateFormatted)}</p>
		</div>
		
		<p>To avoid any interruption to your EduMatch services, please complete your payment before the deadline.</p>
		<p style="margin-top: 16px; color: #6b7280; font-size: 14px;">If you have already made this payment, please ignore this email.</p>
	`;

	const html = renderCompanyEmail({
		title: "Payment Deadline Reminder",
		preheader: "Don't miss your payment deadline",
		bodyHtml,
		primaryCta: {
			label: "Pay Now",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view?tab=payment`,
		},
		brandingColor: "#ff9800",
	});

	return { subject, html };
}

/**
 * Template: Wishlist Deadline Reminder Email
 * Used for: Wishlist item deadline approaching
 * Trigger: When wishlist item deadline is near
 */
export function generateWishlistDeadlineEmailTemplate(
	postTitle: string,
	postId: string,
	deadlineDate: string,
	daysRemaining: number,
	institutionName?: string
): { subject: string; html: string } {
	const deadlineDateFormatted = new Date(deadlineDate).toLocaleDateString();
	const daysText = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
	const subject = `Deadline Approaching - ${escapeHtml(postTitle)}`;

	const bodyHtml = `
		<p>This is a friendly reminder that an opportunity in your wishlist is approaching its deadline.</p>
		
		<div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
			<p style="margin: 0 0 12px; font-weight: 600;">Opportunity Details:</p>
			<p style="margin: 4px 0;"><strong>Title:</strong> ${escapeHtml(postTitle)}</p>
			${institutionName ? `<p style="margin: 4px 0;"><strong>Institution:</strong> ${escapeHtml(institutionName)}</p>` : ""}
			<p style="margin: 4px 0;"><strong>Deadline:</strong> <span style="font-weight: bold;">${escapeHtml(deadlineDateFormatted)}</span></p>
			<p style="margin: 4px 0;"><strong>Time Remaining:</strong> <span style="font-size: 18px; font-weight: bold; color: #9C27B0;">${escapeHtml(daysText)}</span></p>
		</div>
		
		<p>Don't miss out on this opportunity! Make sure to submit your application before the deadline.</p>
		<p style="margin-top: 16px; color: #6b7280; font-size: 14px;">If you've already applied or are no longer interested, you can remove this item from your wishlist.</p>
	`;

	const html = renderCompanyEmail({
		title: "⏰ Deadline Approaching",
		preheader: "Don't miss this opportunity",
		bodyHtml,
		primaryCta: {
			label: "View Opportunity",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/explore/programmes/${postId}`,
		},
		brandingColor: "#9C27B0",
	});

	return { subject, html };
}

/**
 * Template: Application Status Update Email
 * Used for: Application status changes
 * Trigger: When application status is updated
 */
export function generateApplicationStatusEmailTemplate(
	programName: string,
	institutionName: string,
	oldStatus: string,
	newStatus: string,
	message?: string
): { subject: string; html: string } {
	const subject = `Application Status Update - ${escapeHtml(programName)}`;

	const statusBadgeColor = getStatusColor(newStatus);
	const statusContent = getStatusSpecificContent(newStatus, message);

	const bodyHtml = `
		<p>We have an update regarding your application to <strong>${escapeHtml(programName)}</strong> at <strong>${escapeHtml(institutionName)}</strong>.</p>
		
		<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
			<p style="margin: 0 0 12px; font-weight: 600;">Application Details:</p>
			<p style="margin: 4px 0;"><strong>Program:</strong> ${escapeHtml(programName)}</p>
			<p style="margin: 4px 0;"><strong>Institution:</strong> ${escapeHtml(institutionName)}</p>
			<p style="margin: 4px 0;"><strong>Previous Status:</strong> ${escapeHtml(oldStatus)}</p>
			<p style="margin: 4px 0;"><strong>New Status:</strong> <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${statusBadgeColor}; color: white; font-weight: 600; font-size: 14px;">${escapeHtml(newStatus)}</span></p>
		</div>
		
		${statusContent}
		
		<p style="margin-top: 20px;">If you have any questions about this update, please don't hesitate to contact the institution directly or reach out to our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Application Status Update",
		preheader: "Your application status has changed",
		bodyHtml,
		primaryCta: {
			label: "View Application",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view?tab=application`,
		},
		brandingColor: "#2196F3",
	});

	return { subject, html };
}

/**
 * Template: Document Updated Email
 * Used for: When applicant uploads/updates documents
 * Trigger: When documents are uploaded/updated for an application
 */
export function generateDocumentUpdatedEmailTemplate(
	programName: string,
	applicantName: string,
	applicationId: string,
	documentCount: number
): { subject: string; html: string } {
	const subject = `Document Updated - ${escapeHtml(programName)}`;

	const bodyHtml = `
		<p>An applicant has uploaded or updated required documents for their application to <strong>${escapeHtml(programName)}</strong>.</p>
		
		<div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
			<p style="margin: 0 0 12px; font-weight: 600;">Application Details:</p>
			<p style="margin: 4px 0;"><strong>Program:</strong> ${escapeHtml(programName)}</p>
			<p style="margin: 4px 0;"><strong>Applicant:</strong> ${escapeHtml(applicantName)}</p>
			<p style="margin: 4px 0;"><strong>Documents Updated:</strong> ${documentCount}</p>
		</div>
		
		<p>Please review the updated documents and take appropriate action on the application.</p>
	`;

	const html = renderCompanyEmail({
		title: "Document Updated",
		preheader: "New documents received",
		bodyHtml,
		primaryCta: {
			label: "Review Application",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/institution/dashboard/applications/${applicationId}`,
		},
		brandingColor: "#9C27B0",
	});

	return { subject, html };
}

/**
 * Template: Payment Success Email
 * Used for: Successful payment processing
 * Trigger: When payment is successfully processed
 */
export function generatePaymentSuccessEmailTemplate(
	planName: string,
	amount: string,
	currency: string,
	transactionId: string
): { subject: string; html: string } {
	const subject = `Payment Successful - ${escapeHtml(planName)} Subscription`;

	const bodyHtml = `
		<p>Your payment has been processed successfully. Your subscription is now active.</p>
		
		<div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
			<p style="margin: 0 0 12px; font-weight: 600;">Payment Details:</p>
			<p style="margin: 4px 0;"><strong>Plan:</strong> ${escapeHtml(planName)}</p>
			<p style="margin: 4px 0;"><strong>Amount:</strong> <span style="font-size: 20px; font-weight: bold; color: #4CAF50;">${escapeHtml(currency)} ${escapeHtml(amount)}</span></p>
			<p style="margin: 4px 0;"><strong>Transaction ID:</strong> ${escapeHtml(transactionId)}</p>
			<p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
		</div>
		
		<p>Your EduMatch subscription is now active and you have access to all premium features.</p>
		<p style="margin-top: 16px;">If you have any questions about your subscription, please contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Payment Successful!",
		preheader: "Thank you for your payment",
		bodyHtml,
		primaryCta: {
			label: "Access Your Profile",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view`,
		},
		brandingColor: "#4CAF50",
	});

	return { subject, html };
}

/**
 * Template: Payment Failed Email
 * Used for: Failed payment processing
 * Trigger: When payment processing fails
 */
export function generatePaymentFailedEmailTemplate(
	planName: string,
	amount: string,
	currency: string,
	failureReason: string
): { subject: string; html: string } {
	const subject = `Payment Failed - ${escapeHtml(planName)} Subscription`;

	const bodyHtml = `
		<p>We were unable to process your payment for the <strong>${escapeHtml(planName)}</strong> subscription.</p>
		
		<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
			<p style="margin: 0 0 12px; font-weight: 600;">Payment Details:</p>
			<p style="margin: 4px 0;"><strong>Plan:</strong> ${escapeHtml(planName)}</p>
			<p style="margin: 4px 0;"><strong>Amount:</strong> ${escapeHtml(currency)} ${escapeHtml(amount)}</p>
			<p style="margin: 4px 0;"><strong>Reason:</strong> ${escapeHtml(failureReason)}</p>
		</div>
		
		<p>Please try updating your payment method or contact your bank if the issue persists.</p>
		<p style="margin-top: 16px;">If you continue to experience issues, please contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Payment Failed",
		preheader: "Payment could not be processed",
		bodyHtml,
		primaryCta: {
			label: "Update Payment Method",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view?tab=payment`,
		},
		brandingColor: "#f44336",
	});

	return { subject, html };
}

/**
 * Template: Subscription Expiring Email
 * Used for: Subscription about to expire
 * Trigger: When subscription is about to expire
 */
export function generateSubscriptionExpiringEmailTemplate(
	planName: string,
	expiryDate: string,
	daysRemaining: number
): { subject: string; html: string } {
	const expiryDateFormatted = new Date(expiryDate).toLocaleDateString();
	const subject = `Subscription Expiring Soon - ${escapeHtml(planName)}`;

	const bodyHtml = `
		<p>Your <strong>${escapeHtml(planName)}</strong> subscription will expire in <strong>${daysRemaining} days</strong>.</p>
		
		<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
			<p style="margin: 0 0 12px; font-weight: 600;">Subscription Details:</p>
			<p style="margin: 4px 0;"><strong>Plan:</strong> ${escapeHtml(planName)}</p>
			<p style="margin: 4px 0;"><strong>Expiry Date:</strong> ${escapeHtml(expiryDateFormatted)}</p>
			<p style="margin: 4px 0;"><strong>Days Remaining:</strong> ${daysRemaining}</p>
		</div>
		
		<p>To continue enjoying all EduMatch premium features, please renew your subscription before it expires.</p>
		<p style="margin-top: 16px;">If you have any questions about your subscription, please contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Subscription Expiring Soon",
		preheader: "Renew your subscription to continue",
		bodyHtml,
		primaryCta: {
			label: "Renew Subscription",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view?tab=payment`,
		},
		brandingColor: "#ff9800",
	});

	return { subject, html };
}

/**
 * Template: User Banned Email
 * Used for: Account suspension/ban
 * Trigger: When user account is banned/suspended
 */
export function generateBanEmailTemplate(
	firstName: string,
	lastName: string,
	reason: string,
	bannedBy: string,
	bannedUntil?: string,
	userId?: string
): { subject: string; html: string } {
	const subject = `Account Suspended - EduMatch`;
	const bannedUntilText = bannedUntil
		? `until ${new Date(bannedUntil).toLocaleDateString()}`
		: "permanently";

	const bodyHtml = `
		<p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
		<p>We regret to inform you that your EduMatch account has been suspended <strong>${escapeHtml(bannedUntilText)}</strong>.</p>
		
		<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
			<p style="margin: 0 0 12px; font-weight: 600;">Suspension Details:</p>
			<p style="margin: 4px 0;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
			<p style="margin: 4px 0;"><strong>Action taken by:</strong> ${escapeHtml(bannedBy)}</p>
			${bannedUntil ? `<p style="margin: 4px 0;"><strong>Suspension period:</strong> Until ${new Date(bannedUntil).toLocaleDateString()}</p>` : `<p style="margin: 4px 0;"><strong>Suspension type:</strong> Permanent</p>`}
		</div>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What this means:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>You will not be able to access your EduMatch account</li>
			<li>Your profile will be hidden from search results</li>
			<li>You cannot submit new applications or messages</li>
			<li>Existing applications may be affected</li>
		</ul>
		
		${bannedUntil ? `<p>Your account will be automatically restored on <strong>${new Date(bannedUntil).toLocaleDateString()}</strong>.</p>` : ""}
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Need to appeal?</h3>
		<p>If you believe this suspension was made in error or would like to appeal this decision, please contact our support team with your case details.</p>
		<p style="margin-top: 16px;">We take violations of our community guidelines seriously to maintain a safe and trusted environment for all users.</p>
	`;

	const html = renderCompanyEmail({
		title: "Account Suspended",
		preheader: "Your account has been suspended",
		bodyHtml,
		primaryCta: {
			label: "Contact Support",
			url: `mailto:support@edumatch.com?subject=Account Suspension Appeal - ${userId || ""}`,
		},
		brandingColor: "#f44336",
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This is an automated notification regarding your account status.</p>`,
	});

	return { subject, html };
}

/**
 * Template: Session Revoked Email
 * Used for: Admin revokes user session
 * Trigger: When admin manually revokes user session
 */
export function generateRevokeSessionEmailTemplate(
	firstName: string,
	lastName: string,
	reason: string,
	revokedBy: string,
	deviceInfo?: string
): { subject: string; html: string } {
	const subject = `Security Alert - Session Revoked`;

	const bodyHtml = `
		<p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
		<p>This is a security notification to inform you that one or more of your active sessions has been revoked by an administrator.</p>
		
		<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
			<p style="margin: 0 0 12px; font-weight: 600;">Session Revocation Details:</p>
			<p style="margin: 4px 0;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
			<p style="margin: 4px 0;"><strong>Action taken by:</strong> ${escapeHtml(revokedBy)}</p>
			${deviceInfo ? `<p style="margin: 4px 0;"><strong>Device/Location:</strong> ${escapeHtml(deviceInfo)}</p>` : ""}
			<p style="margin: 4px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
		</div>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What happened?</h3>
		<p>An administrator has manually terminated your active session(s). This action was taken for security or administrative purposes.</p>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What you need to do:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>You will be logged out from all devices</li>
			<li>You can log back in immediately with your credentials</li>
			<li>Please review your recent account activity</li>
			<li>If you didn't expect this, contact support immediately</li>
		</ul>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Security Tips:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>Ensure your password is strong and unique</li>
			<li>Enable two-factor authentication if available</li>
			<li>Don't share your login credentials</li>
			<li>Always log out from shared or public devices</li>
		</ul>
		
		<p style="margin-top: 20px;"><strong>Didn't recognize this activity?</strong> Contact our support team immediately at <a href="mailto:support@edumatch.com">support@edumatch.com</a></p>
	`;

	const html = renderCompanyEmail({
		title: "Security Alert",
		preheader: "Your session has been revoked",
		bodyHtml,
		primaryCta: {
			label: "Sign In Again",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/signin`,
		},
		brandingColor: "#ff9800",
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This is an automated security notification. Please do not reply to this email.</p>`,
	});

	return { subject, html };
}

/**
 * Template: Password Changed Email
 * Used for: Password change notification
 * Trigger: When user changes their password
 */
export function generatePasswordChangedEmailTemplate(
	firstName: string,
	lastName: string,
	changeTime: string,
	ipAddress?: string
): { subject: string; html: string } {
	const subject = `Security Alert: Password Changed - EduMatch`;

	const bodyHtml = `
		<p>Hello <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
		
		<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
			<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">🔔 Password Change Notification</h3>
			<p style="margin: 4px 0;">Your EduMatch account password was successfully changed.</p>
			<p style="margin: 4px 0;"><strong>Change Time:</strong> ${new Date(changeTime).toLocaleString()}</p>
			${ipAddress ? `<p style="margin: 4px 0;"><strong>IP Address:</strong> ${escapeHtml(ipAddress)}</p>` : ""}
		</div>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What you should do next:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>Verify this was you by checking the change time and location</li>
			<li>If you didn't make this change, <strong>contact support immediately</strong></li>
			<li>Update your password recovery options if needed</li>
			<li>Review your account activity regularly</li>
		</ul>
		
		<p style="margin-top: 20px;"><strong>Didn't make this change?</strong> Contact our security team immediately at <a href="mailto:security@edumatch.com">security@edumatch.com</a> or call our support hotline.</p>
		<p>For your security, we've automatically logged you out of all devices. You'll need to sign in again with your new password.</p>
	`;

	const html = renderCompanyEmail({
		title: "🔐 Security Alert",
		preheader: "Your password has been changed",
		bodyHtml,
		primaryCta: {
			label: "Review Account Security",
			url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://dev.d1jaxpbx3axxsh.amplifyapp.com"}/profile/view`,
		},
		brandingColor: "#667eea",
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This is an automated security notification. Please do not reply to this email.</p>`,
	});

	return { subject, html };
}

/**
 * Template: Account Deleted Email
 * Used for: Account deletion confirmation
 * Trigger: When user account is deleted
 */
export function generateAccountDeletedEmailTemplate(
	firstName: string,
	lastName: string,
	deletionTime: string
): { subject: string; html: string } {
	const subject = `Account Deleted - EduMatch`;

	const bodyHtml = `
		<p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
		<p>This email confirms that your EduMatch account has been successfully deleted.</p>
		
		<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
			<p style="margin: 0 0 12px; font-weight: 600;">Account Deletion Details:</p>
			<p style="margin: 4px 0;"><strong>Deletion Time:</strong> ${new Date(deletionTime).toLocaleString()}</p>
			<p style="margin: 4px 0;"><strong>Account Status:</strong> Deactivated</p>
		</div>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">What this means:</h3>
		<ul style="margin: 12px 0; padding-left: 24px;">
			<li>Your account has been deactivated and is no longer accessible</li>
			<li>Your profile is hidden from all search results</li>
			<li>You cannot submit new applications or access existing ones</li>
			<li>All active sessions have been terminated</li>
		</ul>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Data Retention:</h3>
		<p>Your personal data will be retained for a limited period as required by law and our privacy policy. After this period, your data will be permanently deleted.</p>
		
		<h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Want to come back?</h3>
		<p>If you change your mind, you can create a new account at any time. However, your previous applications and profile information will not be restored.</p>
		
		<p style="margin-top: 20px;">We appreciate the time you spent with EduMatch and wish you the best in your future endeavors.</p>
	`;

	const html = renderCompanyEmail({
		title: "Account Deleted",
		preheader: "Your account has been deactivated",
		bodyHtml,
		brandingColor: "#f44336",
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This is a confirmation of your account deletion request.</p>`,
	});

	return { subject, html };
}

/**
 * Template: Post Status Update Email
 * Used for: Post status change notification for institutions
 * Trigger: When admin changes post status (publish, reject, close)
 */
export function generatePostStatusUpdateEmailTemplate(
	postTitle: string,
	postType: string,
	institutionName: string,
	oldStatus: string,
	newStatus: string,
	postUrl: string,
	rejectionReason?: string
): { subject: string; html: string } {
	const subject = `${postType} Status Update - ${postTitle}`;
	const statusColor = getPostStatusColor(newStatus);
	const statusLabel = getPostStatusLabel(newStatus);

	let statusContent = "";
	if (newStatus === "PUBLISHED") {
		statusContent = `
			<div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">🎉 Your ${postType} has been published!</h3>
				<p style="margin: 0;">Your ${postType.toLowerCase()} is now visible to all users and can receive applications.</p>
			</div>
		`;
	} else if (newStatus === "REJECTED") {
		statusContent = `
			<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">❌ Your ${postType} has been rejected</h3>
				<p style="margin: 0 0 12px;">Unfortunately, your ${postType.toLowerCase()} could not be approved at this time.</p>
				${
					rejectionReason
						? `
					<div style="background: white; padding: 15px; border-radius: 8px; margin: 12px 0; border: 1px solid #e0e0e0;">
						<p style="margin: 0 0 10px; font-weight: 600; color: #333;">Reason for rejection:</p>
						<p style="margin: 0; color: #555; white-space: pre-wrap;">${escapeHtml(rejectionReason)}</p>
					</div>
				`
						: ""
				}
				<p style="margin: 12px 0 0;">Please review the feedback and make the necessary changes. Once updated, you can resubmit your ${postType.toLowerCase()} for review.</p>
			</div>
		`;
	} else if (newStatus === "CLOSED") {
		statusContent = `
			<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">📋 Your ${postType} has been closed</h3>
				<p style="margin: 0;">Your ${postType.toLowerCase()} is no longer accepting applications. You can still view existing applications.</p>
			</div>
		`;
	} else {
		statusContent = `
			<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">📋 Status Updated</h3>
				<p style="margin: 0;">Your ${postType.toLowerCase()} status has changed to ${statusLabel}.</p>
			</div>
		`;
	}

	const bodyHtml = `
		<p>Dear <strong>${escapeHtml(institutionName)}</strong>,</p>
		<p>The status of your ${postType.toLowerCase()} has been updated by our admin team.</p>
		
		<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
			<h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">${escapeHtml(postTitle)}</h3>
			<p style="margin: 4px 0;"><strong>Type:</strong> ${postType}</p>
			<p style="margin: 4px 0;">
				<strong>Status:</strong> 
				<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${statusColor}; color: white; font-weight: 500;">${statusLabel}</span>
			</p>
		</div>
		
		${statusContent}
		
		<div style="text-align: center; margin: 30px 0;">
			<a href="${escapeHtml(postUrl)}" style="display: inline-block; padding: 14px 32px; background: #126E64; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View ${postType}</a>
		</div>
		
		<p>If you have any questions, please don't hesitate to contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: `${postType} Status Update`,
		preheader: `Your ${postType.toLowerCase()} "${postTitle}" status has been updated`,
		bodyHtml,
		brandingColor: statusColor,
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This notification was sent regarding your post on EduMatch.</p>`,
	});

	return { subject, html };
}

// Helper function for post status colors
function getPostStatusColor(status: string): string {
	switch (status.toUpperCase()) {
		case "PUBLISHED":
			return "#126E64";
		case "REJECTED":
			return "#EF4444";
		case "CLOSED":
			return "#6EB6FF";
		case "SUBMITTED":
			return "#3B82F6";
		case "UPDATED":
			return "#10B981";
		case "DRAFT":
			return "#F0A227";
		default:
			return "#6B7280";
	}
}

// Helper function for post status labels
function getPostStatusLabel(status: string): string {
	switch (status.toUpperCase()) {
		case "PUBLISHED":
			return "Published";
		case "REJECTED":
			return "Rejected";
		case "CLOSED":
			return "Closed";
		case "SUBMITTED":
			return "Submitted";
		case "UPDATED":
			return "Updated";
		case "DRAFT":
			return "Draft";
		default:
			return status;
	}
}

/**
 * Template: Institution Profile Status Update Email
 * Used for: Institution profile verification status change notification
 * Trigger: When admin changes institution profile verification status
 */
export function generateInstitutionProfileStatusUpdateEmailTemplate(
	institutionName: string,
	oldStatus: string,
	newStatus: string,
	profileUrl: string,
	rejectionReason?: string
): { subject: string; html: string } {
	const subject = `Institution Profile Status Update - ${institutionName}`;
	const statusColor = getInstitutionStatusColor(newStatus);
	const statusLabel = getInstitutionStatusLabel(newStatus);

	let statusContent = "";
	if (newStatus === "APPROVED") {
		statusContent = `
			<div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">🎉 Your institution profile has been approved!</h3>
				<p style="margin: 0;">Your institution profile is now verified and you have full access to the dashboard. You can now create and manage posts.</p>
			</div>
		`;
	} else if (newStatus === "REJECTED") {
		statusContent = `
			<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">❌ Your institution profile has been rejected</h3>
				<p style="margin: 0 0 12px;">Unfortunately, your institution profile could not be approved at this time.</p>
				${
					rejectionReason
						? `
					<div style="background: white; padding: 15px; border-radius: 8px; margin: 12px 0; border: 1px solid #e0e0e0;">
						<p style="margin: 0 0 10px; font-weight: 600; color: #333;">Reason for rejection:</p>
						<p style="margin: 0; color: #555; white-space: pre-wrap;">${escapeHtml(rejectionReason)}</p>
					</div>
				`
						: ""
				}
				<p style="margin: 12px 0 0;">Please review the feedback and update your profile information. Once updated, you can resubmit your profile for review.</p>
			</div>
		`;
	} else if (newStatus === "REQUIRE_UPDATE") {
		statusContent = `
			<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">📋 Action Required: Profile Update Needed</h3>
				<p style="margin: 0 0 12px;">Our admin team requires additional information or updates to your institution profile.</p>
				${
					rejectionReason
						? `
					<div style="background: white; padding: 15px; border-radius: 8px; margin: 12px 0; border: 1px solid #e0e0e0;">
						<p style="margin: 0 0 10px; font-weight: 600; color: #333;">Additional information needed:</p>
						<p style="margin: 0; color: #555; white-space: pre-wrap;">${escapeHtml(rejectionReason)}</p>
					</div>
				`
						: ""
				}
				<p style="margin: 12px 0 0;">Please review your profile and provide the requested information. Once updated, your profile will be reviewed again.</p>
			</div>
		`;
	} else if (newStatus === "UPDATED") {
		statusContent = `
			<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">✅ Profile Updated Successfully</h3>
				<p style="margin: 0;">Your institution profile has been updated and is now under review. We'll notify you once the review is complete.</p>
			</div>
		`;
	} else {
		statusContent = `
			<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9e9e9e;">
				<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">📋 Status Updated</h3>
				<p style="margin: 0;">Your institution profile status has changed to ${statusLabel}.</p>
			</div>
		`;
	}

	const bodyHtml = `
		<p>Dear <strong>${escapeHtml(institutionName)}</strong>,</p>
		<p>The verification status of your institution profile has been updated.</p>
		
		<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
			<h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Profile Status</h3>
			<p style="margin: 4px 0;">
				<strong>Status:</strong> 
				<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${statusColor}; color: white; font-weight: 500;">${statusLabel}</span>
			</p>
		</div>
		
		${statusContent}
		
		<div style="text-align: center; margin: 30px 0;">
			<a href="${escapeHtml(profileUrl)}" style="display: inline-block; padding: 14px 32px; background: #126E64; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Profile</a>
		</div>
		
		<p>If you have any questions, please don't hesitate to contact our support team.</p>
	`;

	const html = renderCompanyEmail({
		title: "Institution Profile Status Update",
		preheader: `Your institution profile "${institutionName}" status has been updated`,
		bodyHtml,
		brandingColor: statusColor,
		footerExtrasHtml: `<p style="color: #6b7280; font-size: 14px; margin: 0;">This notification was sent regarding your institution profile on EduMatch.</p>`,
	});

	return { subject, html };
}

// Helper function for institution status colors
function getInstitutionStatusColor(status: string): string {
	switch (status.toUpperCase()) {
		case "APPROVED":
			return "#4CAF50";
		case "REJECTED":
			return "#f44336";
		case "REQUIRE_UPDATE":
			return "#ff9800";
		case "UPDATED":
			return "#2196F3";
		case "PENDING":
			return "#9e9e9e";
		default:
			return "#6B7280";
	}
}

// Helper function for institution status labels
function getInstitutionStatusLabel(status: string): string {
	switch (status.toUpperCase()) {
		case "APPROVED":
			return "Approved";
		case "REJECTED":
			return "Rejected";
		case "REQUIRE_UPDATE":
			return "Update Required";
		case "UPDATED":
			return "Updated";
		case "PENDING":
			return "Pending Review";
		default:
			return status;
	}
}

// Helper functions for email templates
function getStatusColor(status: string): string {
	switch (status.toLowerCase()) {
		case "accepted":
			return "#4CAF50";
		case "rejected":
			return "#f44336";
		case "require_update":
		case "updated":
			return "#2196F3";
		case "submitted":
			return "#ff9800";
		default:
			return "#2196F3";
	}
}

function getStatusSpecificContent(status: string, message?: string): string {
	switch (status.toLowerCase()) {
		case "accepted":
			return `
				<div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">🎉 Congratulations!</h3>
					<p style="margin: 0;">Your application has been approved! The institution will contact you soon with next steps.</p>
				</div>
			`;
		case "rejected":
			return `
				<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Application Not Selected</h3>
					<p style="margin: 0;">Unfortunately, your application was not selected this time. Don't give up - there are many other opportunities available!</p>
				</div>
			`;
		case "require_update":
			return `
				<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">📋 Action Required - Application Review Update</h3>
					<p style="margin: 0 0 12px;">The institution has reviewed your application and requires additional information or updates.</p>
					${
						message
							? `
						<div style="background: white; padding: 15px; border-radius: 8px; margin: 12px 0; border: 1px solid #e0e0e0;">
							<p style="margin: 0 0 10px; font-weight: 600; color: #333;">Message from the institution:</p>
							<p style="margin: 0; color: #555; white-space: pre-wrap;">${escapeHtml(message)}</p>
						</div>
					`
							: ""
					}
					<p style="margin: 12px 0 0;">Please check your application dashboard and messages to view the complete details and take the necessary action.</p>
				</div>
			`;
		case "submitted":
			return `
				<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Application Under Review</h3>
					<p style="margin: 0;">Your application has been submitted and is currently being reviewed by the institution. We'll notify you as soon as there are any updates.</p>
				</div>
			`;
		case "updated":
			return `
				<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Application Updated</h3>
					<p style="margin: 0;">Your application has been updated. The institution will review your changes.</p>
				</div>
			`;
		default:
			return `
				<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
					<h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Status Update</h3>
					<p style="margin: 0;">Your application status has been updated. Please check your application dashboard for more details.</p>
				</div>
			`;
	}
}
