/**
 * Plan-Based Authorization Service
 *
 * This service uses the existing Better Auth subscription model (periodStart/periodEnd)
 * and tracks application counts by querying the applications table directly.
 *
 * Key Features:
 * - Uses Better Auth subscription periods (no duplicate tracking)
 * - Real-time application counting from database
 * - Clean, maintainable code structure
 */

import {
	APPLICANT_PLAN_FEATURES,
	ApplicantPlan,
	ApplicationEligibility,
	AuthorizationResult,
	InstitutionPlan,
} from "@/types/domain/subscription";
import { prismaClient } from "../../../prisma";

/**
 * Map plan names to enum values
 */
function getPlanType(planName: string): ApplicantPlan | InstitutionPlan {
	const name = planName.toLowerCase();
	if (name.includes("free")) return ApplicantPlan.FREE;
	if (name.includes("standard")) return ApplicantPlan.STANDARD;
	if (name.includes("premium")) return ApplicantPlan.PREMIUM;
	return InstitutionPlan.INSTITUTION;
}

/**
 * Calculate days remaining in the subscription period
 */
function getDaysUntilReset(periodEnd: Date | null): number | null {
	if (!periodEnd) return null;
	const now = new Date();
	const diffTime = periodEnd.getTime() - now.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get current subscription period for Standard plan tracking
 */
async function getCurrentSubscriptionPeriod(userId: string) {
	// Get the most recent active Better Auth subscription
	const subscription = await prismaClient.subscription.findFirst({
		where: {
			referenceId: userId,
			status: "active",
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	if (!subscription?.periodStart || !subscription?.periodEnd) {
		return null;
	}

	const now = new Date();
	const periodStart = new Date(subscription.periodStart);
	const periodEnd = new Date(subscription.periodEnd);

	// Check if we're within the current period
	if (now >= periodStart && now <= periodEnd) {
		return {
			start: periodStart,
			end: periodEnd,
			isActive: true,
		};
	}

	return {
		start: periodStart,
		end: periodEnd,
		isActive: false, // Period has expired
	};
}

/**
 * Check if an applicant can apply to opportunities
 */
export async function canApplyToOpportunity(
	applicantId: string
): Promise<ApplicationEligibility> {
	try {
		// Get applicant with user info to access subscription
		const applicant = await prismaClient.applicant.findUnique({
			where: { applicant_id: applicantId },
			include: { user: true },
		});

		if (!applicant) {
			return {
				canApply: false,
				reason: "Applicant not found",
				planName: "Unknown",
				applicationsUsed: 0,
				applicationsLimit: 0,
				periodStart: null,
				periodEnd: null,
				daysUntilReset: null,
			};
		}

		// Get user's Better Auth subscription
		const subscription = await prismaClient.subscription.findFirst({
			where: {
				referenceId: applicant.user_id,
				status: "active",
			},
			orderBy: { createdAt: "desc" },
		});

		// Default to Free plan if no subscription
		const planName = subscription?.plan || "Free";
		const planType = getPlanType(planName) as ApplicantPlan;
		const features = APPLICANT_PLAN_FEATURES[planType];

		// FREE PLAN: Cannot apply
		if (planType === ApplicantPlan.FREE) {
			return {
				canApply: false,
				reason: "Free plan users cannot submit applications. Please upgrade to Standard or Premium.",
				planName,
				applicationsUsed: 0,
				applicationsLimit: 0,
				periodStart: null,
				periodEnd: null,
				daysUntilReset: null,
			};
		}

		// PREMIUM PLAN: Unlimited applications
		if (planType === ApplicantPlan.PREMIUM) {
			return {
				canApply: true,
				planName,
				applicationsUsed: 0,
				applicationsLimit: null,
				periodStart: null,
				periodEnd: null,
				daysUntilReset: null,
			};
		}

		// STANDARD PLAN: Check 3 applications per subscription period limit
		if (planType === ApplicantPlan.STANDARD) {
			const subscriptionPeriod = await getCurrentSubscriptionPeriod(
				applicant.user_id
			);

			if (!subscriptionPeriod) {
				return {
					canApply: false,
					reason: "No active subscription period found",
					planName,
					applicationsUsed: 0,
					applicationsLimit: 3,
					periodStart: null,
					periodEnd: null,
					daysUntilReset: null,
				};
			}

			if (!subscriptionPeriod.isActive) {
				return {
					canApply: false,
					reason: "Subscription period has expired. Please renew your subscription.",
					planName,
					applicationsUsed: 0,
					applicationsLimit: 3,
					periodStart: subscriptionPeriod.start,
					periodEnd: subscriptionPeriod.end,
					daysUntilReset: null,
				};
			}

			// Count applications submitted in current period
			const applicationsCount = await prismaClient.application.count({
				where: {
					applicant_id: applicantId,
					apply_at: {
						gte: subscriptionPeriod.start,
						lte: subscriptionPeriod.end,
					},
				},
			});

			const limit = features.maxApplicationsPerPeriod || 3;

			if (applicationsCount >= limit) {
				return {
					canApply: false,
					reason: `You have reached your application limit (${limit} per subscription period). Your limit will reset when your subscription renews.`,
					planName,
					applicationsUsed: applicationsCount,
					applicationsLimit: limit,
					periodStart: subscriptionPeriod.start,
					periodEnd: subscriptionPeriod.end,
					daysUntilReset: getDaysUntilReset(subscriptionPeriod.end),
				};
			}

			return {
				canApply: true,
				planName,
				applicationsUsed: applicationsCount,
				applicationsLimit: limit,
				periodStart: subscriptionPeriod.start,
				periodEnd: subscriptionPeriod.end,
				daysUntilReset: getDaysUntilReset(subscriptionPeriod.end),
			};
		}

		// Fallback
		return {
			canApply: false,
			reason: "Unknown plan type",
			planName,
			applicationsUsed: 0,
			applicationsLimit: 0,
			periodStart: null,
			periodEnd: null,
			daysUntilReset: null,
		};
	} catch (error) {
		return {
			canApply: false,
			reason: "Error checking eligibility",
			planName: "Unknown",
			applicationsUsed: 0,
			applicationsLimit: 0,
			periodStart: null,
			periodEnd: null,
			daysUntilReset: null,
		};
	}
}

/**
 * Check if an applicant can see matching scores (Premium only)
 */
export async function canSeeMatchingScore(
	applicantId: string
): Promise<AuthorizationResult> {
	try {
		// Get applicant with user info to access subscription
		const applicant = await prismaClient.applicant.findUnique({
			where: { applicant_id: applicantId },
			include: { user: true },
		});

		if (!applicant) {
			return {
				authorized: false,
				reason: "Applicant not found",
			};
		}

		// Get user's Better Auth subscription
		const subscription = await prismaClient.subscription.findFirst({
			where: {
				referenceId: applicant.user_id,
				status: "active",
			},
			orderBy: { createdAt: "desc" },
		});

		const planName = subscription?.plan || "Free";
		const planType = getPlanType(planName) as ApplicantPlan;

		if (planType !== ApplicantPlan.PREMIUM) {
			return {
				authorized: false,
				reason: "Only Premium users can see matching scores. Please upgrade to Premium.",
			};
		}

		return { authorized: true };
	} catch (error) {
		return {
			authorized: false,
			reason: "Error checking permission",
		};
	}
}

/**
 * Check if an institution can create posts (requires active subscription)
 */
export async function canCreatePost(
	institutionId: string
): Promise<AuthorizationResult> {
	try {
		const institutionSub =
			await prismaClient.institutionSubscription.findFirst({
				where: {
					institution_id: institutionId,
					status: "ACTIVE",
				},
				include: { plan: true },
				orderBy: { subscribe_at: "desc" },
			});

		if (!institutionSub) {
			return {
				authorized: false,
				reason: "Institution must have an active subscription to create posts.",
			};
		}

		return { authorized: true };
	} catch (error) {
		return {
			authorized: false,
			reason: "Error checking permission",
		};
	}
}

/**
 * Check if an institution can view full applicant details
 */
export async function canViewFullApplicantDetails(
	institutionId: string
): Promise<AuthorizationResult> {
	return canCreatePost(institutionId); // Same logic - requires active subscription
}

/**
 * Check if an institution can receive applications
 */
export async function canReceiveApplications(
	institutionId: string
): Promise<AuthorizationResult> {
	return canCreatePost(institutionId); // Same logic - requires active subscription
}

/**
 * Get application limits for an applicant
 */
export async function getApplicationLimit(applicantId: string): Promise<{
	limit: number | null;
	used: number;
	remaining: number | null;
	periodEnd: Date | null;
}> {
	try {
		const eligibility = await canApplyToOpportunity(applicantId);

		return {
			limit: eligibility.applicationsLimit,
			used: eligibility.applicationsUsed,
			remaining:
				eligibility.applicationsLimit === null
					? null
					: Math.max(
							0,
							eligibility.applicationsLimit -
								eligibility.applicationsUsed
						),
			periodEnd: eligibility.periodEnd,
		};
	} catch (error) {
		return {
			limit: 0,
			used: 0,
			remaining: 0,
			periodEnd: null,
		};
	}
}
