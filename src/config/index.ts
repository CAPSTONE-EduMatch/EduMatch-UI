// Auth configuration
export { auth } from "./auth";
export { authClient } from "./auth-client";

// Redis configuration
export { redisClient } from "./redis";

// Stripe configuration
export { stripePromise } from "./stripe";

// Subscription utilities
export { handleSubscriptionCreation } from "./subscription-utils";

// OTP Rate limiting
export type { OTPType } from "./otp-rate-limit";
export {
	checkOTPRateLimitByType,
	checkOTPRateLimit,
	recordOTPAttemptByType,
	recordOTPAttempt,
	getOTPAttemptInfoByType,
	getOTPAttemptInfo,
	clearOTPAttemptsByType,
	clearOTPAttempts,
	getTimeRemaining,
} from "./otp-rate-limit";

// SQS Configuration
export { sqsClient, QUEUE_URLS } from "./sqs-config";
export {
	NotificationType,
	SQSService,
	type BaseNotificationMessage,
	type ProfileCreatedMessage,
	type PaymentDeadlineMessage,
	type ApplicationStatusMessage,
	type PaymentSuccessMessage,
	type PaymentFailedMessage,
	type SubscriptionExpiringMessage,
	type WelcomeMessage,
	type UserBannedMessage,
	type SessionRevokedMessage,
	type NotificationMessage,
} from "./sqs-config";
