/**
 * Plan-based Access Control Types
 *
 * This file defines the core types, enums, and interfaces for the subscription
 * and authorization system for both Applicant and Institution roles.
 */

/**
 * User roles in the platform
 */
export enum UserRole {
	APPLICANT = "applicant",
	INSTITUTION = "institution",
	ADMIN = "admin",
}

/**
 * Applicant subscription plans
 */
export enum ApplicantPlan {
	FREE = "free",
	STANDARD = "standard",
	PREMIUM = "premium",
}

/**
 * Institution plan types
 * Institutions have a single plan type that must be active
 */
export enum InstitutionPlan {
	INSTITUTION = "institution",
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
	EXPIRED = "EXPIRED",
	CANCELLED = "CANCELLED",
	PENDING = "PENDING",
}

/**
 * Feature permissions for each plan
 */
export interface PlanFeatures {
	// Authentication
	canRegisterAndLogin: boolean;

	// Profile management
	canCreateProfile: boolean;
	canEditProfile: boolean;

	// Search & Exploration
	canSearchOpportunities: boolean;

	// Applications (Applicant-specific)
	canApplyToOpportunities: boolean;
	maxApplicationsPerPeriod: number | null; // null means unlimited
	applicationPeriodDays: number | null; // null for no period restriction

	// Matching (Applicant-specific)
	canSeeMatchingScores: boolean;

	// Recommendations (Applicant-specific)
	canSeeRecommendations: boolean; // Standard+ can see personalized recommendations
	canBoostProfileToInstitutions: boolean; // Premium only - profile recommended to institutions

	// Posts (Institution-specific)
	canCreatePosts: boolean;
	canPublishPosts: boolean;
	canViewFullApplicantDetails: boolean;
	canReceiveApplications: boolean;
}

/**
 * Applicant plan features configuration
 */
export const APPLICANT_PLAN_FEATURES: Record<ApplicantPlan, PlanFeatures> = {
	[ApplicantPlan.FREE]: {
		canRegisterAndLogin: true,
		canCreateProfile: true,
		canEditProfile: true,
		canSearchOpportunities: true,
		canApplyToOpportunities: false, // Free users cannot apply
		maxApplicationsPerPeriod: 0,
		applicationPeriodDays: null,
		canSeeMatchingScores: false,
		canSeeRecommendations: false, // Free users cannot see personalized recommendations
		canBoostProfileToInstitutions: false,
		// Institution features (N/A for applicants)
		canCreatePosts: false,
		canPublishPosts: false,
		canViewFullApplicantDetails: false,
		canReceiveApplications: false,
	},
	[ApplicantPlan.STANDARD]: {
		canRegisterAndLogin: true,
		canCreateProfile: true,
		canEditProfile: true,
		canSearchOpportunities: true,
		canApplyToOpportunities: true,
		maxApplicationsPerPeriod: 3, // 3 applications per subscription window
		applicationPeriodDays: 30, // 30-day rolling window from subscription date
		canSeeMatchingScores: false,
		canSeeRecommendations: true, // Standard users can see personalized recommendations
		canBoostProfileToInstitutions: false,
		// Institution features (N/A for applicants)
		canCreatePosts: false,
		canPublishPosts: false,
		canViewFullApplicantDetails: false,
		canReceiveApplications: false,
	},
	[ApplicantPlan.PREMIUM]: {
		canRegisterAndLogin: true,
		canCreateProfile: true,
		canEditProfile: true,
		canSearchOpportunities: true,
		canApplyToOpportunities: true,
		maxApplicationsPerPeriod: null, // Unlimited applications
		applicationPeriodDays: null,
		canSeeMatchingScores: true, // Premium users can see matching scores
		canSeeRecommendations: true, // Premium users can see personalized recommendations
		canBoostProfileToInstitutions: true, // Premium users can have profile recommended to institutions
		// Institution features (N/A for applicants)
		canCreatePosts: false,
		canPublishPosts: false,
		canViewFullApplicantDetails: false,
		canReceiveApplications: false,
	},
};

/**
 * Institution plan features configuration
 */
export const INSTITUTION_PLAN_FEATURES: Record<InstitutionPlan, PlanFeatures> =
	{
		[InstitutionPlan.INSTITUTION]: {
			canRegisterAndLogin: true,
			canCreateProfile: true,
			canEditProfile: true,
			canSearchOpportunities: false, // Institutions don't search for opportunities
			// Application features (N/A for institutions)
			canApplyToOpportunities: false,
			maxApplicationsPerPeriod: null,
			applicationPeriodDays: null,
			canSeeMatchingScores: false,
			canSeeRecommendations: false, // N/A for institutions
			canBoostProfileToInstitutions: false, // N/A for institutions
			// Institution-specific features (only with active subscription)
			canCreatePosts: true,
			canPublishPosts: true,
			canViewFullApplicantDetails: true,
			canReceiveApplications: true,
		},
	};

/**
 * Interface for subscription with tracking information
 */
export interface SubscriptionInfo {
	subscriptionId: string;
	planId: string;
	planName: string;
	planType: ApplicantPlan | InstitutionPlan;
	status: SubscriptionStatus;
	subscribeAt: Date;
	periodStart: Date | null;
	periodEnd: Date | null;
	applicationsUsed: number;
	applicationsLimit: number | null; // null = unlimited
	features: PlanFeatures;
}

/**
 * Application eligibility check result
 */
export interface ApplicationEligibility {
	canApply: boolean;
	reason?: string;
	planName: string;
	applicationsUsed: number;
	applicationsLimit: number | null;
	periodStart: Date | null;
	periodEnd: Date | null;
	daysUntilReset: number | null;
}

/**
 * Authorization check result
 */
export interface AuthorizationResult {
	authorized: boolean;
	reason?: string;
}

/**
 * Subscription window for tracking application limits
 */
export interface SubscriptionWindow {
	windowStart: Date;
	windowEnd: Date;
	applicationsUsed: number;
	applicationsLimit: number;
	isActive: boolean;
}
