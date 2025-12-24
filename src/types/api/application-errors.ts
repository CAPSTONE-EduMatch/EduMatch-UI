/**
 * Specialized error types for application-related errors
 */

export interface ApplicationEligibilityData {
	canApply: boolean;
	planName: string;
	applicationsUsed: number;
	applicationsLimit: number | null;
	periodEnd?: string;
	daysUntilReset?: number;
}

/**
 * Error thrown when user hits their application limit
 */
export class ApplicationLimitError extends Error {
	public eligibility: ApplicationEligibilityData;

	constructor(message: string, eligibility: ApplicationEligibilityData) {
		super(message);
		this.name = "ApplicationLimitError";
		this.eligibility = eligibility;
	}

	/**
	 * Generate a user-friendly error message based on eligibility data
	 */
	getUserFriendlyMessage(): string {
		const { planName, applicationsLimit, daysUntilReset } =
			this.eligibility;

		if (applicationsLimit === null) {
			return "Application limit reached. Please contact support for assistance.";
		}

		if (daysUntilReset && daysUntilReset > 0) {
			return `You've reached your limit of ${applicationsLimit} applications for your ${planName} plan. Your limit will reset in ${daysUntilReset} day${
				daysUntilReset === 1 ? "" : "s"
			}.`;
		}

		return `You've reached your limit of ${applicationsLimit} applications for your ${planName} plan. Upgrade to a higher plan for more applications.`;
	}
}

/**
 * Generic application error
 */
export class ApplicationError extends Error {
	public statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = "ApplicationError";
		this.statusCode = statusCode;
	}
}
