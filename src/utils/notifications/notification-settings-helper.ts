import { prismaClient } from "../../../prisma";

/**
 * Check if user has enabled a specific notification type
 * @param userId - User ID
 * @param notificationType - Type of notification to check
 * @returns true if notification is enabled, false otherwise (defaults to true if settings don't exist)
 */
export async function isNotificationEnabled(
	userId: string,
	notificationType: "application" | "wishlist" | "subscription"
): Promise<boolean> {
	try {
		const settings = await prismaClient.notificationSetting.findUnique({
			where: { user_id: userId },
		});

		// If settings don't exist, default to enabled (backward compatibility)
		if (!settings) {
			return true;
		}

		switch (notificationType) {
			case "application":
				return settings.notify_application;
			case "wishlist":
				return settings.notify_wishlist ?? true; // Default to true if null
			case "subscription":
				return settings.notify_subscription;
			default:
				return true;
		}
	} catch (error) {
		// On error, default to enabled to ensure notifications aren't blocked
		console.error("Error checking notification settings:", error);
		return true;
	}
}
