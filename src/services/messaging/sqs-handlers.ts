import {
	SQSService,
	QUEUE_URLS,
	NotificationMessage,
	NotificationType,
} from "@/config/sqs-config";
import { EmailService } from "@/services/email/email-service";

// SQS Message Handler class
export class SQSMessageHandler {
	/**
	 * Process messages from the notifications queue
	 */
	static async processNotificationMessages(): Promise<void> {
		try {
			console.log("📬 Processing notification messages...");

			const messages = await SQSService.receiveMessages(
				QUEUE_URLS.NOTIFICATIONS
			);

			if (messages.length === 0) {
				console.log(
					"⚠️ No notification messages to process - queue is empty"
				);
				return;
			}

			console.log(
				`✅ Found ${messages.length} notification message(s) in queue`
			);

			for (const message of messages) {
				try {
					console.log(
						`📨 Processing notification message: ${message.MessageId || "unknown"}`
					);
					await this.processNotificationMessage(message);
					// Delete message after successful processing
					await SQSService.deleteMessage(
						QUEUE_URLS.NOTIFICATIONS,
						message.ReceiptHandle!
					);
					console.log(
						`✅ Notification message processed and deleted: ${message.MessageId || "unknown"}`
					);
				} catch (error) {
					console.error(
						`❌ Error processing notification message ${message.MessageId || "unknown"}:`,
						error
					);
					// Message will remain in queue for retry
				}
			}
		} catch (error) {
			console.error("❌ Error processing notification messages:", error);
			throw error;
		}
	}

	/**
	 * Process messages from the emails queue
	 */
	static async processEmailMessages(): Promise<void> {
		try {
			console.log("📧 Processing email messages...");

			const messages = await SQSService.receiveMessages(
				QUEUE_URLS.EMAILS
			);

			if (messages.length === 0) {
				console.log("⚠️ No email messages to process - queue is empty");
				return;
			}

			console.log(
				`✅ Found ${messages.length} email message(s) in queue`
			);

			for (const message of messages) {
				try {
					console.log(
						`📨 Processing email message: ${message.MessageId || "unknown"}`
					);
					await this.processEmailMessage(message);
					// Delete message after successful processing
					await SQSService.deleteMessage(
						QUEUE_URLS.EMAILS,
						message.ReceiptHandle!
					);
					console.log(
						`✅ Email message processed and deleted: ${message.MessageId || "unknown"}`
					);
				} catch (error) {
					console.error(
						`❌ Error processing email message ${message.MessageId || "unknown"}:`,
						error
					);
					// Message will remain in queue for retry
				}
			}
		} catch (error) {
			console.error("❌ Error processing email messages:", error);
			throw error;
		}
	}

	/**
	 * Process a single notification message
	 */
	private static async processNotificationMessage(
		message: any
	): Promise<void> {
		try {
			const notificationMessage: NotificationMessage = JSON.parse(
				message.Body
			);

			console.log(
				`Processing notification: ${notificationMessage.type} for user ${notificationMessage.userId}`
			);

			// Here you can add additional notification processing logic
			// For example: save to database, send push notifications, etc.

			// For now, we'll just log the notification
			await this.logNotification(notificationMessage);

			// Send to email queue for email processing
			await SQSService.sendEmailMessage(notificationMessage);

			console.log(
				`Notification processed successfully: ${notificationMessage.type}`
			);
		} catch (error) {
			console.error("Error processing notification message:", error);
			throw error;
		}
	}

	/**
	 * Process a single email message
	 */
	private static async processEmailMessage(message: any): Promise<void> {
		try {
			const notificationMessage: NotificationMessage = JSON.parse(
				message.Body
			);

			console.log(
				`📧 Processing email: ${notificationMessage.type} for ${notificationMessage.userEmail} (user: ${notificationMessage.userId})`
			);

			// Send the email
			await EmailService.sendNotificationEmail(notificationMessage);

			console.log(
				`✅ Email sent successfully: ${notificationMessage.type} to ${notificationMessage.userEmail}`
			);
		} catch (error) {
			console.error(
				`❌ Error processing email message for ${message.MessageId || "unknown"}:`,
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
	 * Log notification to database
	 */
	private static async logNotification(
		message: NotificationMessage
	): Promise<void> {
		try {
			console.log(
				`Logging notification: ${message.type} for user ${message.userId}`
			);

			// Import prisma client dynamically to avoid circular dependencies
			const { prismaClient } = await import("../../../prisma");

			// Determine user role to set appropriate URLs
			const user = await prismaClient.user.findUnique({
				where: { id: message.userId },
				select: { role_id: true },
			});

			const isInstitution = user?.role_id === "2";

			// Create notification title and body based on type
			let title = "";
			let bodyText = "";
			let url = "/";

			switch (message.type) {
				case "WELCOME":
					title = "Welcome to EduMatch!";
					bodyText = `Welcome ${message.metadata?.firstName || "User"}! Your account has been created successfully.`;
					url = "/profile/create";
					break;
				case "PROFILE_CREATED":
					title = "Profile Created Successfully!";
					bodyText = `Your ${message.metadata?.role || "profile"} profile has been created and is now live.`;
					url = isInstitution
						? "/institution/dashboard/profile"
						: "/profile/view";
					break;
				case "PAYMENT_DEADLINE":
					title = "Payment Deadline Reminder";
					bodyText = `Your ${message.metadata?.planName || "subscription"} payment is due on ${message.metadata?.deadlineDate || "soon"}.`;
					url = isInstitution
						? "/institution/dashboard/payment"
						: "/pricing";
					break;
				case "APPLICATION_STATUS_UPDATE":
					title = `Application Status Update - ${message.metadata?.programName || "Your Application"}`;
					const status = (
						message.metadata?.newStatus || ""
					).toLowerCase();
					const institutionName =
						message.metadata?.institutionName || "the institution";
					const customMessage = message.metadata?.message;

					if (isInstitution) {
						// Institution receiving notification about new application
						switch (status) {
							case "submitted":
								bodyText = `📝 New application received for "${message.metadata?.programName || "your program"}" from an applicant. Please review the application.`;
								url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
								break;
							default:
								bodyText = `Application status for "${message.metadata?.programName || "your program"}" has been updated.`;
								url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
								break;
						}
					} else {
						// Applicant receiving notification about their application
						switch (status) {
							case "accepted":
								bodyText = `🎉 Congratulations! Your application for "${message.metadata?.programName || "the program"}" has been approved by ${institutionName}. They will contact you soon with next steps.`;
								break;
							case "rejected":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" was not selected by ${institutionName} this time. Don't give up - there are many other opportunities available!`;
								break;
							case "require_update":
								if (customMessage) {
									bodyText = `📋 Action Required: ${institutionName} has reviewed your application for "${message.metadata?.programName || "the program"}" and requires additional information. Message: ${customMessage}`;
								} else {
									bodyText = `📋 Action Required: ${institutionName} has reviewed your application for "${message.metadata?.programName || "the program"}" and requires additional information or updates. Please check your messages for details.`;
								}
								break;
							case "submitted":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" has been submitted and is currently being reviewed by ${institutionName}. We'll notify you as soon as there are any updates.`;
								break;
							case "updated":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" has been updated. The institution will review your changes.`;
								break;
							default:
								bodyText = `Your application status for "${message.metadata?.programName || "the program"}" has been updated by ${institutionName}. Please check your application dashboard for more details.`;
								break;
						}

						// Fetch application to get postId and post type for correct URL
						const applicationId = message.metadata?.applicationId;
						if (applicationId) {
							try {
								const application =
									await prismaClient.application.findUnique({
										where: {
											application_id: applicationId,
										},
										include: {
											post: {
												include: {
													programPost: true,
													scholarshipPost: true,
													jobPost: true,
												},
											},
										},
									});

								if (application?.post) {
									const postId = application.post.post_id;
									// Determine post type and construct URL
									if (application.post.programPost) {
										url = `/explore/programmes/${postId}?applicationId=${applicationId}&from=application`;
									} else if (
										application.post.scholarshipPost
									) {
										url = `/explore/scholarships/${postId}?applicationId=${applicationId}&from=application`;
									} else if (application.post.jobPost) {
										url = `/explore/research-labs/${postId}?applicationId=${applicationId}&from=application`;
									} else {
										// Fallback to applications page if post type cannot be determined
										url = "/applications";
									}
								} else {
									url = "/applications";
								}
							} catch (error) {
								// Fallback to applications page on error
								console.error(
									"Error fetching application for notification URL:",
									error
								);
								url = "/applications";
							}
						} else {
							url = "/applications";
						}
					}
					break;
				case "DOCUMENT_UPDATED":
					title = `Document Updated - ${message.metadata?.programName || "Application"}`;
					bodyText = `📄 ${message.metadata?.applicantName || "An applicant"} has uploaded or updated ${message.metadata?.documentCount || 0} document(s) for their application to "${message.metadata?.programName || "the program"}". Please review the updated documents.`;
					url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
					break;
				case "WISHLIST_DEADLINE":
					title = `Deadline Approaching - ${message.metadata?.postTitle || "Wishlist Item"}`;
					const daysRemaining = message.metadata?.daysRemaining || 0;
					const daysText =
						daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
					bodyText = `⏰ Don't miss this opportunity! "${message.metadata?.postTitle || "An item in your wishlist"}" is approaching its deadline in ${daysText}. Make sure to submit your application before it expires!`;

					// Wishlist is only for applicants, determine URL based on post type
					const postType = message.metadata?.postType || "programme";
					switch (postType) {
						case "scholarship":
							url = `/explore/scholarships/${message.metadata?.postId || ""}`;
							break;
						case "research-lab":
							url = `/explore/research-labs/${message.metadata?.postId || ""}`;
							break;
						case "programme":
						default:
							url = `/explore/programmes/${message.metadata?.postId || ""}`;
							break;
					}
					break;
				default:
					title = "New Notification";
					bodyText = "You have a new notification from EduMatch.";
					break;
			}

			// Check if notification already exists to prevent duplicates
			const existingNotification =
				await prismaClient.notification.findUnique({
					where: { notification_id: message.id },
				});

			if (existingNotification) {
				console.log(
					`⚠️ Notification ${message.id} already exists, skipping duplicate storage`
				);
				return;
			}

			// Save notification to database
			await prismaClient.notification.create({
				data: {
					notification_id: message.id,
					user_id: message.userId,
					type: message.type,
					title,
					body: bodyText,
					url,
					send_at: new Date(),
				},
			});

			console.log(
				`✅ Notification saved to database: ${message.type} for user ${message.userId}`
			);
		} catch (error) {
			console.error("Error logging notification:", error);
			// Don't throw error here as it's not critical
		}
	}
}

// Background job processor
export class BackgroundJobProcessor {
	private static isProcessing = false;
	private static processingInterval: NodeJS.Timeout | null = null;

	/**
	 * Start processing SQS messages in the background
	 */
	static startProcessing(): void {
		if (this.isProcessing) {
			console.log("Background processing already running");
			return;
		}

		console.log("Starting background SQS message processing...");
		this.isProcessing = true;

		// Process messages every 30 seconds
		this.processingInterval = setInterval(async () => {
			try {
				await Promise.all([
					SQSMessageHandler.processNotificationMessages(),
					SQSMessageHandler.processEmailMessages(),
				]);
			} catch (error) {
				console.error("Error in background processing:", error);
			}
		}, 30000); // 30 seconds
	}

	/**
	 * Stop processing SQS messages
	 */
	static stopProcessing(): void {
		if (!this.isProcessing) {
			console.log("Background processing not running");
			return;
		}

		console.log("Stopping background SQS message processing...");
		this.isProcessing = false;

		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
		}
	}

	/**
	 * Check if processing is currently running
	 */
	static isRunning(): boolean {
		return this.isProcessing;
	}
}

// Utility functions for manual message processing
export class NotificationUtils {
	/**
	 * Send a welcome notification
	 */
	static async sendWelcomeNotification(
		userId: string,
		userEmail: string,
		firstName: string,
		lastName: string
	): Promise<void> {
		console.log("🎯 NotificationUtils.sendWelcomeNotification called");
		console.log("👤 User ID:", userId);
		console.log("📧 User Email:", userEmail);
		console.log("👋 First Name:", firstName);
		console.log("👋 Last Name:", lastName);

		const message: NotificationMessage = {
			id: `welcome-${userId}-${Date.now()}`,
			type: NotificationType.WELCOME,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				firstName,
				lastName,
			},
		};

		console.log("📝 Created message:", JSON.stringify(message, null, 2));
		console.log("📤 Calling unified queue API...");

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue welcome notification");
		}

		console.log("✅ Notification queued successfully");

		// Also store directly in database for immediate display
		await this.storeNotificationDirectly(message);
		console.log("✅ Notification stored directly in database!");
	}

	/**
	 * Send a profile created notification
	 */
	static async sendProfileCreatedNotification(
		userId: string,
		userEmail: string,
		profileId: string,
		firstName: string,
		lastName: string,
		role: string
	): Promise<void> {
		console.log("📝 Creating profile created notification message...");

		const message: NotificationMessage = {
			id: `profile-created-${userId}-${Date.now()}`,
			type: NotificationType.PROFILE_CREATED,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				profileId,
				firstName,
				lastName,
				role,
			},
		};

		console.log("📤 Sending notification to queue API...");
		console.log("📋 Message:", JSON.stringify(message, null, 2));

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue profile created notification");
		}

		console.log("✅ Notification queued successfully!");

		// Also store directly in database for immediate display
		await this.storeNotificationDirectly(message);
		console.log("✅ Notification stored directly in database!");
	}

	/**
	 * Store notification directly in database (for immediate display)
	 */
	private static async storeNotificationDirectly(
		message: NotificationMessage
	): Promise<void> {
		try {
			// Import prisma client dynamically to avoid circular dependencies
			const { prismaClient } = await import("../../../prisma");

			// Determine user role to set appropriate URLs
			const user = await prismaClient.user.findUnique({
				where: { id: message.userId },
				select: { role_id: true },
			});

			const isInstitution = user?.role_id === "2";

			// Create notification title and body based on type
			let title = "";
			let bodyText = "";
			let url = "/";

			switch (message.type) {
				case "WELCOME":
					title = "Welcome to EduMatch!";
					bodyText = `Welcome ${message.metadata?.firstName || "User"}! Your account has been created successfully.`;
					url = "/profile/create";
					break;
				case "PROFILE_CREATED":
					title = "Profile Created Successfully!";
					bodyText = `Your ${message.metadata?.role || "profile"} profile has been created and is now live.`;
					url = isInstitution
						? "/institution/dashboard/profile"
						: "/profile/view";
					break;
				case "PAYMENT_DEADLINE":
					title = "Payment Deadline Reminder";
					bodyText = `Your ${message.metadata?.planName || "subscription"} payment is due on ${message.metadata?.deadlineDate || "soon"}.`;
					url = isInstitution
						? "/institution/dashboard/payment"
						: "/pricing";
					break;
				case "APPLICATION_STATUS_UPDATE":
					title = `Application Status Update - ${message.metadata?.programName || "Your Application"}`;
					const status = (
						message.metadata?.newStatus || ""
					).toLowerCase();
					const institutionName =
						message.metadata?.institutionName || "the institution";
					const customMessage = message.metadata?.message;

					if (isInstitution) {
						// Institution receiving notification about new application
						switch (status) {
							case "submitted":
								bodyText = `📝 New application received for "${message.metadata?.programName || "your program"}" from an applicant. Please review the application.`;
								url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
								break;
							default:
								bodyText = `Application status for "${message.metadata?.programName || "your program"}" has been updated.`;
								url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
								break;
						}
					} else {
						// Applicant receiving notification about their application
						switch (status) {
							case "accepted":
								bodyText = `🎉 Congratulations! Your application for "${message.metadata?.programName || "the program"}" has been approved by ${institutionName}. They will contact you soon with next steps.`;
								break;
							case "rejected":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" was not selected by ${institutionName} this time. Don't give up - there are many other opportunities available!`;
								break;
							case "require_update":
								if (customMessage) {
									bodyText = `📋 Action Required: ${institutionName} has reviewed your application for "${message.metadata?.programName || "the program"}" and requires additional information. Message: ${customMessage}`;
								} else {
									bodyText = `📋 Action Required: ${institutionName} has reviewed your application for "${message.metadata?.programName || "the program"}" and requires additional information or updates. Please check your messages for details.`;
								}
								break;
							case "submitted":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" has been submitted and is currently being reviewed by ${institutionName}. We'll notify you as soon as there are any updates.`;
								break;
							case "updated":
								bodyText = `Your application for "${message.metadata?.programName || "the program"}" has been updated. The institution will review your changes.`;
								break;
							default:
								bodyText = `Your application status for "${message.metadata?.programName || "the program"}" has been updated by ${institutionName}. Please check your application dashboard for more details.`;
								break;
						}

						// Fetch application to get postId and post type for correct URL
						const applicationId = message.metadata?.applicationId;
						if (applicationId) {
							try {
								const application =
									await prismaClient.application.findUnique({
										where: {
											application_id: applicationId,
										},
										include: {
											post: {
												include: {
													programPost: true,
													scholarshipPost: true,
													jobPost: true,
												},
											},
										},
									});

								if (application?.post) {
									const postId = application.post.post_id;
									// Determine post type and construct URL
									if (application.post.programPost) {
										url = `/explore/programmes/${postId}?applicationId=${applicationId}&from=application`;
									} else if (
										application.post.scholarshipPost
									) {
										url = `/explore/scholarships/${postId}?applicationId=${applicationId}&from=application`;
									} else if (application.post.jobPost) {
										url = `/explore/research-labs/${postId}?applicationId=${applicationId}&from=application`;
									} else {
										// Fallback to applications page if post type cannot be determined
										url = "/applications";
									}
								} else {
									url = "/applications";
								}
							} catch (error) {
								// Fallback to applications page on error
								console.error(
									"Error fetching application for notification URL:",
									error
								);
								url = "/applications";
							}
						} else {
							url = "/applications";
						}
					}
					break;
				case "DOCUMENT_UPDATED":
					title = `Document Updated - ${message.metadata?.programName || "Application"}`;
					bodyText = `📄 ${message.metadata?.applicantName || "An applicant"} has uploaded or updated ${message.metadata?.documentCount || 0} document(s) for their application to "${message.metadata?.programName || "the program"}". Please review the updated documents.`;
					url = `/institution/dashboard/applications/${message.metadata?.applicationId || ""}`;
					break;
				case "WISHLIST_DEADLINE":
					title = `Deadline Approaching - ${message.metadata?.postTitle || "Wishlist Item"}`;
					const daysRemainingWishlist =
						message.metadata?.daysRemaining || 0;
					const daysTextWishlist =
						daysRemainingWishlist === 1
							? "1 day"
							: `${daysRemainingWishlist} days`;
					bodyText = `⏰ Don't miss this opportunity! "${message.metadata?.postTitle || "An item in your wishlist"}" is approaching its deadline in ${daysTextWishlist}. Make sure to submit your application before it expires!`;

					// Wishlist is only for applicants, determine URL based on post type
					const postTypeWishlist =
						message.metadata?.postType || "programme";
					switch (postTypeWishlist) {
						case "scholarship":
							url = `/explore/scholarships/${message.metadata?.postId || ""}`;
							break;
						case "research-lab":
							url = `/explore/research-labs/${message.metadata?.postId || ""}`;
							break;
						case "programme":
						default:
							url = `/explore/programmes/${message.metadata?.postId || ""}`;
							break;
					}
					break;
				case "POST_STATUS_UPDATE":
					title = `${message.metadata?.postType || "Post"} Status Update - ${message.metadata?.postTitle || "Your Post"}`;
					const postStatus = (
						message.metadata?.newStatus || ""
					).toUpperCase();
					const postStatusLabels: Record<string, string> = {
						PUBLISHED: "Published",
						CLOSED: "Closed",
						REJECTED: "Rejected",
						SUBMITTED: "Submitted",
						UPDATED: "Updated",
						DRAFT: "Draft",
					};
					const postStatusLabel =
						postStatusLabels[postStatus] || postStatus;

					if (postStatus === "PUBLISHED") {
						bodyText = `🎉 Your ${(message.metadata?.postType || "post").toLowerCase()} "${message.metadata?.postTitle || "your post"}" has been published and is now visible to all users.`;
					} else if (postStatus === "REJECTED") {
						const reason = message.metadata?.rejectionReason
							? ` Reason: ${message.metadata.rejectionReason}`
							: "";
						bodyText = `❌ Your ${(message.metadata?.postType || "post").toLowerCase()} "${message.metadata?.postTitle || "your post"}" has been rejected.${reason}`;
					} else if (postStatus === "CLOSED") {
						bodyText = `📋 Your ${(message.metadata?.postType || "post").toLowerCase()} "${message.metadata?.postTitle || "your post"}" has been closed and is no longer accepting applications.`;
					} else {
						bodyText = `Your ${(message.metadata?.postType || "post").toLowerCase()} "${message.metadata?.postTitle || "your post"}" status has been updated to ${postStatusLabel}.`;
					}
					url =
						message.metadata?.postUrl ||
						"/institution/dashboard/posts";
					break;
				case "INSTITUTION_PROFILE_STATUS_UPDATE":
					title = "Institution Profile Status Update";
					const profileStatus = (
						message.metadata?.newStatus || ""
					).toUpperCase();
					const profileStatusLabels: Record<string, string> = {
						PENDING: "Pending Review",
						APPROVED: "Approved",
						REJECTED: "Rejected",
						REQUIRE_UPDATE: "Update Required",
						UPDATED: "Updated",
					};
					const profileStatusLabel =
						profileStatusLabels[profileStatus] || profileStatus;

					if (profileStatus === "APPROVED") {
						bodyText = `🎉 Congratulations! Your institution profile "${message.metadata?.institutionName || "your profile"}" has been approved. You now have full access to the dashboard.`;
					} else if (profileStatus === "REJECTED") {
						const reason = message.metadata?.rejectionReason
							? ` Reason: ${message.metadata.rejectionReason}`
							: "";
						bodyText = `❌ Your institution profile "${message.metadata?.institutionName || "your profile"}" has been rejected.${reason} Please review and update your profile information.`;
					} else if (profileStatus === "REQUIRE_UPDATE") {
						bodyText = `📋 Action Required: Your institution profile "${message.metadata?.institutionName || "your profile"}" requires updates. Please review the feedback and update your profile.`;
					} else if (profileStatus === "UPDATED") {
						bodyText = `✅ Your institution profile "${message.metadata?.institutionName || "your profile"}" has been updated and is under review.`;
					} else {
						bodyText = `Your institution profile "${message.metadata?.institutionName || "your profile"}" status has been updated to ${profileStatusLabel}.`;
					}
					url =
						message.metadata?.profileUrl ||
						"/institution/dashboard/profile";
					break;
				default:
					title = "New Notification";
					bodyText = "You have a new notification from EduMatch.";
					break;
			}

			// Check if notification already exists to prevent duplicates
			const existingNotification =
				await prismaClient.notification.findUnique({
					where: { notification_id: message.id },
				});

			if (existingNotification) {
				console.log(
					`⚠️ Notification ${message.id} already exists, skipping duplicate storage`
				);
				return;
			}

			// Save notification to database
			await prismaClient.notification.create({
				data: {
					notification_id: message.id,
					user_id: message.userId,
					type: message.type,
					title,
					body: bodyText,
					url,
					send_at: new Date(),
				},
			});

			console.log(
				`✅ Notification stored directly in database: ${message.type} for user ${message.userId}`
			);
		} catch (error) {
			console.error("Error storing notification directly:", error);
			// Don't throw error here as it's not critical
		}
	}

	/**
	 * Send a payment deadline notification
	 */
	static async sendPaymentDeadlineNotification(
		userId: string,
		userEmail: string,
		subscriptionId: string,
		planName: string,
		deadlineDate: string,
		amount: number,
		currency: string = "USD"
	): Promise<void> {
		const message: NotificationMessage = {
			id: `payment-deadline-${userId}-${Date.now()}`,
			type: NotificationType.PAYMENT_DEADLINE,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				subscriptionId,
				planName,
				deadlineDate,
				amount,
				currency,
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue payment deadline notification");
		}
	}

	/**
	 * Send an application status update notification
	 */
	static async sendApplicationStatusNotification(
		userId: string,
		userEmail: string,
		applicationId: string,
		programName: string,
		oldStatus: string,
		newStatus: string,
		institutionName: string,
		message?: string // Optional message for REQUIRE_UPDATE status
	): Promise<void> {
		const notificationMessage: NotificationMessage = {
			id: `app-status-${userId}-${Date.now()}`,
			type: NotificationType.APPLICATION_STATUS_UPDATE,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				applicationId,
				programName,
				oldStatus,
				newStatus,
				institutionName,
				...(message && { message }),
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(notificationMessage),
		});

		if (!response.ok) {
			throw new Error("Failed to queue application status notification");
		}

		// Also store directly in database for immediate display
		await this.storeNotificationDirectly(notificationMessage);
		console.log("✅ Notification stored directly in database!");
	}

	/**
	 * Send a payment success notification
	 */
	static async sendPaymentSuccessNotification(
		userId: string,
		userEmail: string,
		subscriptionId: string,
		planName: string,
		amount: number,
		currency: string,
		transactionId: string
	): Promise<void> {
		try {
			console.log(
				`📧 Sending payment success notification for user ${userId} (${userEmail})`
			);

			const message: NotificationMessage = {
				id: `payment-success-${userId}-${Date.now()}`,
				type: NotificationType.PAYMENT_SUCCESS,
				userId,
				userEmail,
				timestamp: new Date().toISOString(),
				metadata: {
					subscriptionId,
					planName,
					amount,
					currency,
					transactionId,
				},
			};

			console.log(
				`📋 Payment success message created: ${JSON.stringify(message, null, 2)}`
			);

			// Use unified API endpoint for consistency
			const baseUrl =
				process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
				process.env.NEXT_PUBLIC_APP_URL ||
				"http://localhost:3000";

			const response = await fetch(`${baseUrl}/api/notifications/queue`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Failed to queue payment success notification: ${errorText}`
				);
			}

			console.log(
				`✅ Payment success notification queued successfully for ${userEmail}`
			);
		} catch (error) {
			console.error(
				`❌ Error sending payment success notification for user ${userId}:`,
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
	 * Send a payment failed notification
	 */
	static async sendPaymentFailedNotification(
		userId: string,
		userEmail: string,
		subscriptionId: string,
		planName: string,
		amount: number,
		currency: string,
		failureReason: string
	): Promise<void> {
		const message: NotificationMessage = {
			id: `payment-failed-${userId}-${Date.now()}`,
			type: NotificationType.PAYMENT_FAILED,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				subscriptionId,
				planName,
				amount,
				currency,
				failureReason,
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Failed to queue payment failed notification: ${errorText}`
			);
		}
	}

	/**
	 * Send a subscription expiring notification
	 */
	static async sendSubscriptionExpiringNotification(
		userId: string,
		userEmail: string,
		subscriptionId: string,
		planName: string,
		expiryDate: string,
		daysRemaining: number
	): Promise<void> {
		const message: NotificationMessage = {
			id: `subscription-expiring-${userId}-${Date.now()}`,
			type: NotificationType.SUBSCRIPTION_EXPIRING,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				subscriptionId,
				planName,
				expiryDate,
				daysRemaining,
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error(
				"Failed to queue subscription expiring notification"
			);
		}
	}

	/**
	 * Send a subscription canceled notification
	 */
	static async sendSubscriptionCanceledNotification(
		userId: string,
		userEmail: string,
		subscriptionId: string,
		planName: string,
		canceledAt: string,
		accessUntil?: string
	): Promise<void> {
		try {
			console.log(
				`📧 Sending subscription canceled notification for user ${userId} (${userEmail})`
			);

			const message: NotificationMessage = {
				id: `subscription-canceled-${userId}-${Date.now()}`,
				type: NotificationType.SUBSCRIPTION_CANCELED,
				userId,
				userEmail,
				timestamp: new Date().toISOString(),
				metadata: {
					subscriptionId,
					planName,
					canceledAt,
					...(accessUntil && { accessUntil }),
				},
			};

			console.log(
				`📋 Subscription canceled message created: ${JSON.stringify(message, null, 2)}`
			);

			// Use unified API endpoint for consistency
			const baseUrl =
				process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
				process.env.NEXT_PUBLIC_APP_URL ||
				"http://localhost:3000";

			const response = await fetch(`${baseUrl}/api/notifications/queue`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Failed to queue subscription canceled notification: ${errorText}`
				);
			}

			console.log(
				`✅ Subscription canceled notification queued successfully for ${userEmail}`
			);
		} catch (error) {
			console.error(
				`❌ Error sending subscription canceled notification for user ${userId}:`,
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
	 * Send a document updated notification
	 */
	static async sendDocumentUpdateNotification(
		userId: string,
		userEmail: string,
		applicationId: string,
		programName: string,
		applicantName: string,
		institutionName: string,
		documentCount: number
	): Promise<void> {
		const message: NotificationMessage = {
			id: `document-updated-${userId}-${Date.now()}`,
			type: NotificationType.DOCUMENT_UPDATED,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				applicationId,
				programName,
				applicantName,
				institutionName,
				documentCount,
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue document update notification");
		}

		// Also store directly in database for immediate display
		await this.storeNotificationDirectly(message);
	}

	/**
	 * Send a wishlist deadline notification
	 */
	static async sendWishlistDeadlineNotification(
		userId: string,
		userEmail: string,
		postId: string,
		postTitle: string,
		deadlineDate: string,
		daysRemaining: number,
		institutionName?: string,
		postType: "programme" | "scholarship" | "research-lab" = "programme"
	): Promise<void> {
		const message: NotificationMessage = {
			id: `wishlist-deadline-${userId}-${postId}-${Date.now()}`,
			type: NotificationType.WISHLIST_DEADLINE,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				postId,
				postTitle,
				deadlineDate,
				daysRemaining,
				postType,
				...(institutionName && { institutionName }),
			},
		};

		console.log(
			`📤 Attempting to queue wishlist deadline notification for user ${userId}, post ${postId}`
		);
		try {
			// Use unified API endpoint for consistency
			const baseUrl =
				process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
				process.env.NEXT_PUBLIC_APP_URL ||
				"http://localhost:3000";

			const response = await fetch(`${baseUrl}/api/notifications/queue`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				throw new Error(
					"Failed to queue wishlist deadline notification"
				);
			}

			console.log(
				`✅ Successfully queued wishlist deadline notification for user ${userId}`
			);
		} catch (error) {
			console.error(
				`❌ Failed to queue wishlist deadline notification for user ${userId}:`,
				error
			);
			if (error instanceof Error) {
				console.error(`❌ Error details:`, error.message);
				console.error(`❌ Error stack:`, error.stack);
			}
			// Re-throw to ensure the error is visible
			throw error;
		}

		// Also store directly in database for immediate display
		await this.storeNotificationDirectly(message);
	}

	/**
	 * Send a post status update notification to institution
	 */
	static async sendPostStatusUpdateNotification(
		userId: string,
		userEmail: string,
		postId: string,
		postTitle: string,
		postType: "Program" | "Scholarship" | "Research Lab",
		institutionName: string,
		oldStatus: string,
		newStatus: string,
		postUrl: string,
		rejectionReason?: string
	): Promise<void> {
		const message: NotificationMessage = {
			id: `post-status-${postId}-${Date.now()}`,
			type: NotificationType.POST_STATUS_UPDATE,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				postId,
				postTitle,
				postType,
				institutionName,
				oldStatus,
				newStatus,
				postUrl,
				...(rejectionReason && { rejectionReason }),
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue post status update notification");
		}

		await this.storeNotificationDirectly(message);
	}

	/**
	 * Send an institution profile status update notification
	 */
	static async sendInstitutionProfileStatusUpdateNotification(
		userId: string,
		userEmail: string,
		institutionId: string,
		institutionName: string,
		oldStatus: string,
		newStatus: string,
		profileUrl: string,
		rejectionReason?: string
	): Promise<void> {
		const message: NotificationMessage = {
			id: `institution-profile-status-${institutionId}-${Date.now()}`,
			type: NotificationType.INSTITUTION_PROFILE_STATUS_UPDATE,
			userId,
			userEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				institutionId,
				institutionName,
				oldStatus,
				newStatus,
				profileUrl,
				...(rejectionReason && { rejectionReason }),
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error(
				"Failed to queue institution profile status update notification"
			);
		}

		await this.storeNotificationDirectly(message);
	}

	/**
	 * Send a new application notification to institution
	 * This is called when an applicant applies to a post
	 */
	static async sendNewApplicationNotification(
		institutionUserId: string,
		institutionUserEmail: string,
		applicationId: string,
		postTitle: string,
		applicantName: string,
		institutionName: string
	): Promise<void> {
		// Use APPLICATION_STATUS_UPDATE type but with SUBMITTED status for new applications
		const message: NotificationMessage = {
			id: `new-application-${applicationId}-${Date.now()}`,
			type: NotificationType.APPLICATION_STATUS_UPDATE,
			userId: institutionUserId,
			userEmail: institutionUserEmail,
			timestamp: new Date().toISOString(),
			metadata: {
				applicationId,
				programName: postTitle,
				oldStatus: "",
				newStatus: "SUBMITTED",
				institutionName,
				applicantName, // Add applicant name for institution notifications
			},
		};

		// Use unified API endpoint for consistency
		const baseUrl =
			process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";

		const response = await fetch(`${baseUrl}/api/notifications/queue`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			throw new Error("Failed to queue new application notification");
		}

		await this.storeNotificationDirectly(message);
	}
}
