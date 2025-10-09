import {
	SQSService,
	QUEUE_URLS,
	NotificationMessage,
	NotificationType,
} from "./sqs-config";
import { EmailService } from "./email-service";

// SQS Message Handler class
export class SQSMessageHandler {
	/**
	 * Process messages from the notifications queue
	 */
	static async processNotificationMessages(): Promise<void> {
		try {
			console.log("Processing notification messages...");

			const messages = await SQSService.receiveMessages(
				QUEUE_URLS.NOTIFICATIONS
			);

			if (messages.length === 0) {
				console.log("No notification messages to process");
				return;
			}

			console.log(`Processing ${messages.length} notification messages`);

			for (const message of messages) {
				try {
					await this.processNotificationMessage(message);
					// Delete message after successful processing
					await SQSService.deleteMessage(
						QUEUE_URLS.NOTIFICATIONS,
						message.ReceiptHandle!
					);
				} catch (error) {
					console.error(
						"Error processing notification message:",
						error
					);
					// Message will remain in queue for retry
				}
			}
		} catch (error) {
			console.error("Error processing notification messages:", error);
			throw error;
		}
	}

	/**
	 * Process messages from the emails queue
	 */
	static async processEmailMessages(): Promise<void> {
		try {
			console.log("Processing email messages...");

			const messages = await SQSService.receiveMessages(
				QUEUE_URLS.EMAILS
			);

			if (messages.length === 0) {
				console.log("No email messages to process");
				return;
			}

			console.log(`Processing ${messages.length} email messages`);

			for (const message of messages) {
				try {
					await this.processEmailMessage(message);
					// Delete message after successful processing
					await SQSService.deleteMessage(
						QUEUE_URLS.EMAILS,
						message.ReceiptHandle!
					);
				} catch (error) {
					console.error("Error processing email message:", error);
					// Message will remain in queue for retry
				}
			}
		} catch (error) {
			console.error("Error processing email messages:", error);
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
				`Processing email: ${notificationMessage.type} for ${notificationMessage.userEmail}`
			);

			// Send the email
			await EmailService.sendNotificationEmail(notificationMessage);

			console.log(
				`Email processed successfully: ${notificationMessage.type}`
			);
		} catch (error) {
			console.error("Error processing email message:", error);
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
			const { prismaClient } = await import("../../prisma");

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
					url = "/profile/view";
					break;
				case "PAYMENT_DEADLINE":
					title = "Payment Deadline Reminder";
					bodyText = `Your ${message.metadata?.planName || "subscription"} payment is due on ${message.metadata?.deadlineDate || "soon"}.`;
					url = "/pricing";
					break;
				default:
					title = "New Notification";
					bodyText = "You have a new notification from EduMatch.";
					break;
			}

			// Save notification to database
			await prismaClient.notification.create({
				data: {
					id: message.id,
					userId: message.userId,
					type: message.type,
					title,
					bodyText,
					url,
					payload: message.metadata || {},
					createAt: new Date(),
					queuedAt: new Date(),
					status: "sent",
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

		await SQSService.sendNotification(message);
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

		console.log("📤 Sending notification to SQS...");
		console.log("📋 Message:", JSON.stringify(message, null, 2));

		await SQSService.sendNotification(message);
		console.log("✅ Notification sent to SQS successfully!");
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

		await SQSService.sendNotification(message);
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
		institutionName: string
	): Promise<void> {
		const message: NotificationMessage = {
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
			},
		};

		await SQSService.sendNotification(message);
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

		await SQSService.sendNotification(message);
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

		await SQSService.sendNotification(message);
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

		await SQSService.sendNotification(message);
	}
}
