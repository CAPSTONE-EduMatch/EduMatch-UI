import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
	SendMessageCommand,
} from "@aws-sdk/client-sqs";

// SQS Configuration
const sqsClient = new SQSClient({
	region: process.env.REGION || "ap-northeast-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID!,
		secretAccessKey: process.env.SECRET_ACCESS_KEY!,
	},
});

// Queue URLs
export const QUEUE_URLS = {
	NOTIFICATIONS: process.env.SQS_NOTIFICATIONS_QUEUE_URL!,
	EMAILS: process.env.SQS_EMAILS_QUEUE_URL!,
} as const;

// Debug logging
console.log("🔧 SQS Configuration:");
console.log("📍 Region:", process.env.REGION || "ap-northeast-1");
console.log(
	"🔑 Access Key:",
	process.env.ACCESS_KEY_ID ? "✅ Set" : "❌ Missing"
);
console.log(
	"🔐 Secret Key:",
	process.env.SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
	"📧 Notifications Queue:",
	process.env.SQS_NOTIFICATIONS_QUEUE_URL ? "✅ Set" : "❌ Missing"
);
console.log(
	"📬 Emails Queue:",
	process.env.SQS_EMAILS_QUEUE_URL ? "✅ Set" : "❌ Missing"
);

// Message types for notifications
export enum NotificationType {
	PROFILE_CREATED = "PROFILE_CREATED",
	PAYMENT_DEADLINE = "PAYMENT_DEADLINE",
	APPLICATION_STATUS_UPDATE = "APPLICATION_STATUS_UPDATE",
	PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
	PAYMENT_FAILED = "PAYMENT_FAILED",
	SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING",
	WELCOME = "WELCOME",
	USER_BANNED = "USER_BANNED",
	SESSION_REVOKED = "SESSION_REVOKED",
	WISHLIST_DEADLINE = "WISHLIST_DEADLINE",
}

// Base notification message structure
export interface BaseNotificationMessage {
	id: string;
	type: NotificationType;
	userId: string;
	userEmail: string;
	timestamp: string;
	metadata?: Record<string, any>;
}

// Specific notification message types
export interface ProfileCreatedMessage extends BaseNotificationMessage {
	type: NotificationType.PROFILE_CREATED;
	metadata: {
		profileId: string;
		firstName: string;
		lastName: string;
		role: string;
	};
}

export interface PaymentDeadlineMessage extends BaseNotificationMessage {
	type: NotificationType.PAYMENT_DEADLINE;
	metadata: {
		subscriptionId: string;
		planName: string;
		deadlineDate: string;
		amount: number;
		currency: string;
	};
}

export interface ApplicationStatusMessage extends BaseNotificationMessage {
	type: NotificationType.APPLICATION_STATUS_UPDATE;
	metadata: {
		applicationId: string;
		programName: string;
		oldStatus: string;
		newStatus: string;
		institutionName: string;
		message?: string; // Optional message for REQUIRE_UPDATE status
	};
}

export interface PaymentSuccessMessage extends BaseNotificationMessage {
	type: NotificationType.PAYMENT_SUCCESS;
	metadata: {
		subscriptionId: string;
		planName: string;
		amount: number;
		currency: string;
		transactionId: string;
	};
}

export interface PaymentFailedMessage extends BaseNotificationMessage {
	type: NotificationType.PAYMENT_FAILED;
	metadata: {
		subscriptionId: string;
		planName: string;
		amount: number;
		currency: string;
		failureReason: string;
	};
}

export interface SubscriptionExpiringMessage extends BaseNotificationMessage {
	type: NotificationType.SUBSCRIPTION_EXPIRING;
	metadata: {
		subscriptionId: string;
		planName: string;
		expiryDate: string;
		daysRemaining: number;
	};
}

export interface WelcomeMessage extends BaseNotificationMessage {
	type: NotificationType.WELCOME;
	metadata: {
		firstName: string;
		lastName: string;
	};
}

export interface UserBannedMessage extends BaseNotificationMessage {
	type: NotificationType.USER_BANNED;
	metadata: {
		firstName: string;
		lastName: string;
		reason: string;
		bannedBy: string;
		bannedUntil?: string; // Optional - permanent ban if not provided
	};
}

export interface SessionRevokedMessage extends BaseNotificationMessage {
	type: NotificationType.SESSION_REVOKED;
	metadata: {
		firstName: string;
		lastName: string;
		reason: string;
		revokedBy: string;
		deviceInfo?: string;
	};
}

export interface WishlistDeadlineMessage extends BaseNotificationMessage {
	type: NotificationType.WISHLIST_DEADLINE;
	metadata: {
		postId: string;
		postTitle: string;
		deadlineDate: string;
		daysRemaining: number;
		institutionName?: string;
	};
}

// Union type for all notification messages
export type NotificationMessage =
	| ProfileCreatedMessage
	| PaymentDeadlineMessage
	| ApplicationStatusMessage
	| PaymentSuccessMessage
	| PaymentFailedMessage
	| SubscriptionExpiringMessage
	| WelcomeMessage
	| UserBannedMessage
	| SessionRevokedMessage
	| WishlistDeadlineMessage;

// SQS Service class
export class SQSService {
	/**
	 * Send a notification message to SQS
	 */
	static async sendNotification(message: NotificationMessage): Promise<void> {
		try {
			console.log("🔧 SQS sendNotification called");
			console.log("📍 Queue URL:", QUEUE_URLS.NOTIFICATIONS);
			console.log("📋 Message body:", JSON.stringify(message, null, 2));

			const command = new SendMessageCommand({
				QueueUrl: QUEUE_URLS.NOTIFICATIONS,
				MessageBody: JSON.stringify(message),
				MessageAttributes: {
					Type: {
						DataType: "String",
						StringValue: message.type,
					},
					UserId: {
						DataType: "String",
						StringValue: message.userId,
					},
					UserEmail: {
						DataType: "String",
						StringValue: message.userEmail,
					},
				},
				MessageGroupId: message.userId, // For FIFO queues - group by user
				MessageDeduplicationId: message.id, // For FIFO queues - use message ID
			});

			console.log("📤 Sending command to AWS SQS...");
			const result = await sqsClient.send(command);
			console.log("✅ SQS Response:", result);
			console.log(
				`🎉 Notification sent to SQS: ${message.type} for user ${message.userId}`
			);
		} catch (error) {
			console.error("❌ Error sending notification to SQS:", error);
			throw error;
		}
	}

	/**
	 * Send an email message to SQS
	 */
	static async sendEmailMessage(message: NotificationMessage): Promise<void> {
		try {
			const command = new SendMessageCommand({
				QueueUrl: QUEUE_URLS.EMAILS,
				MessageBody: JSON.stringify(message),
				MessageAttributes: {
					Type: {
						DataType: "String",
						StringValue: message.type,
					},
					UserEmail: {
						DataType: "String",
						StringValue: message.userEmail,
					},
				},
				MessageGroupId: message.userEmail, // For FIFO queues - group by email
				MessageDeduplicationId: message.id, // For FIFO queues - use message ID
			});

			await sqsClient.send(command);
			console.log(
				`Email message sent to SQS: ${message.type} for ${message.userEmail}`
			);
		} catch (error) {
			console.error("Error sending email message to SQS:", error);
			throw error;
		}
	}

	/**
	 * Receive messages from SQS queue
	 */
	static async receiveMessages(
		queueUrl: string,
		maxMessages: number = 10
	): Promise<any[]> {
		try {
			const command = new ReceiveMessageCommand({
				QueueUrl: queueUrl,
				MaxNumberOfMessages: maxMessages,
				WaitTimeSeconds: 20, // Long polling
				MessageAttributeNames: ["All"],
			});

			const response = await sqsClient.send(command);
			return response.Messages || [];
		} catch (error) {
			console.error("Error receiving messages from SQS:", error);
			throw error;
		}
	}

	/**
	 * Delete a message from SQS queue
	 */
	static async deleteMessage(
		queueUrl: string,
		receiptHandle: string
	): Promise<void> {
		try {
			const command = new DeleteMessageCommand({
				QueueUrl: queueUrl,
				ReceiptHandle: receiptHandle,
			});

			await sqsClient.send(command);
			console.log("Message deleted from SQS queue");
		} catch (error) {
			console.error("Error deleting message from SQS:", error);
			throw error;
		}
	}
}

export { sqsClient };
