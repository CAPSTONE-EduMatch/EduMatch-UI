"use client";

import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";

export interface Subscription {
	id: string;
	status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
	plan: string;
	priceId: string;
	referenceId: string;
	stripeCustomerId: string;
	stripeSubscriptionId: string;
	periodStart: Date;
	periodEnd: Date;
	cancelAtPeriodEnd: boolean;
	seats: number;
	limits: {
		applications: number;
		scholarships: number;
		programs: number;
	};
	trialStart: Date | null;
	trialEnd: Date | null;
}

export interface SubscriptionHook {
	subscriptions: Subscription[];
	currentPlan: string | null;
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
	fetchSubscriptions: () => Promise<void>;
	upgradeSubscription: (planId: string) => Promise<void>;
	cancelSubscription: (subscriptionId: string) => Promise<void>;
	restoreSubscription: (subscriptionId: string) => Promise<void>;
	canUpgradeTo: (planId: string) => boolean;
}

const PLAN_HIERARCHY = {
	free: 0,
	standard: 1,
	premium: 2,
} as const;

// Map plan names to Stripe price IDs
// IMPORTANT: Update these with your actual Stripe price IDs from your Stripe Dashboard
const PLAN_PRICE_MAPPING = {
	standard: "price_1SFXgR1f58RNYg0098jAKotV", // Your actual standard plan price ID
	premium: "price_1S4fZ61f58RNYg00FWakIrLm", // Your actual premium plan price ID
} as const;

export function useSubscription(): SubscriptionHook {
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Get current active subscription plan
	const currentPlan =
		subscriptions.find((sub) => sub.status === "active")?.plan || "free";

	const fetchSubscriptions = async () => {
		try {
			setLoading(true);
			setError(null);

			// Ensure we have an authenticated session before calling protected endpoints
			const { data: session } = await authClient.getSession();
			if (!session || !session.user) {
				// Not signed in; do not attempt to call protected subscription endpoints
				setSubscriptions([]);
				setIsAuthenticated(false);
				setError(null);
				return;
			}

			// User is authenticated
			setIsAuthenticated(true);

			// Use the authClient to fetch subscriptions
			const { data } = await authClient.subscription.list();

			if (data) {
				// Map the BetterAuth subscription data to our interface
				const mappedSubscriptions: Subscription[] = data.map(
					(sub: any) => ({
						id: sub.id,
						status: sub.status,
						plan: sub.plan,
						priceId: sub.priceId,
						referenceId: sub.referenceId,
						stripeCustomerId: sub.stripeCustomerId,
						stripeSubscriptionId: sub.stripeSubscriptionId,
						periodStart: new Date(sub.periodStart),
						periodEnd: new Date(sub.periodEnd),
						cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
						seats: sub.seats,
						limits: sub.limits,
						trialStart: sub.trialStart
							? new Date(sub.trialStart)
							: null,
						trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : null,
					})
				);
				setSubscriptions(mappedSubscriptions);
			}
		} catch (err: any) {
			// If the auth client returns an unauthorized error, normalize the message
			if (err && err.status === 401) {
				setError("Unauthorized: please sign in to view subscriptions");
				setIsAuthenticated(false);
			} else {
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch subscriptions"
				);
				setIsAuthenticated(false);
			}
		} finally {
			setLoading(false);
		}
	};

	const upgradeSubscription = async (planId: string) => {
		try {
			setError(null);

			// Ensure user is authenticated before attempting an upgrade
			const { data: session } = await authClient.getSession();
			if (!session || !session.user) {
				const message = "Unauthorized: please sign in to upgrade";
				setError(message);
				throw new Error(message);
			}

			// Get the current active subscription (if any)
			const activeSubscription = subscriptions.find(
				(sub) => sub.status === "active"
			);

			// Get the price ID for the plan
			const priceId =
				PLAN_PRICE_MAPPING[planId as keyof typeof PLAN_PRICE_MAPPING];
			if (!priceId) {
				throw new Error(
					`Invalid plan: ${planId}. Supported plans: standard, premium`
				);
			}

			// Prepare upgrade parameters for Checkout Session
			// Always create a new subscription via Checkout Session to avoid Customer Portal issues
			const upgradeParams: any = {
				plan: planId,
				// price: priceId, // Add the Stripe price ID
				successUrl: `${window.location.origin}/pricing?success=true`,
				cancelUrl: `${window.location.origin}/pricing?canceled=true`,
			};

			// If user has an existing subscription, we need to handle the upgrade differently
			if (activeSubscription) {
				// Add metadata to track this as an upgrade rather than a new subscription
				upgradeParams.metadata = {
					upgrade_from_subscription: activeSubscription.id,
					upgrade_from_plan: activeSubscription.plan,
				};
			}

			// Log parameters for debugging
			// eslint-disable-next-line no-console
			console.log("Upgrade parameters:", upgradeParams);

			// Use the authClient to create subscription
			const { error, data: upgradeData } =
				await authClient.subscription.upgrade(upgradeParams);

			// Log the full response for debugging
			// eslint-disable-next-line no-console
			console.log("BetterAuth upgrade response:", { error, upgradeData });

			// If the auth client created a Stripe Checkout session and returned a URL,
			// redirect the browser so the user can complete payment.
			if (upgradeData && (upgradeData as any).sessionUrl) {
				window.location.href = (upgradeData as any).sessionUrl;
				// The browser will navigate away; we don't need to refresh subscriptions now.
				return;
			}

			if (error) {
				// Log the detailed error for debugging
				// eslint-disable-next-line no-console
				console.error("BetterAuth subscription upgrade error:", error);

				// Handle specific Stripe errors with more user-friendly messages
				if (error.message?.includes("portal configuration")) {
					throw new Error(
						"Unable to process subscription upgrade. Please contact support for assistance."
					);
				} else if (
					error.message?.includes("subscription cannot be updated")
				) {
					throw new Error(
						"Subscription upgrade is not available at this time. Please try again later or contact support."
					);
				} else if (error.message?.includes("No such price")) {
					throw new Error(
						"Invalid subscription plan selected. Please try a different plan."
					);
				} else if (error.message?.includes("No such customer")) {
					throw new Error(
						"Customer account not found. Please try signing out and back in."
					);
				}

				// For unknown errors, include the actual error message in development
				if (process.env.NODE_ENV === "development") {
					throw new Error(
						`Subscription upgrade failed: ${error.message}`
					);
				}

				throw new Error(
					"Unable to process subscription upgrade. Please contact support for assistance."
				);
			}

			// Refresh subscriptions after successful upgrade
			await fetchSubscriptions();
		} catch (err: any) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to upgrade subscription";
			setError(errorMessage);
			throw new Error(errorMessage);
		}
	};

	const cancelSubscription = async (subscriptionId: string) => {
		try {
			setError(null);

			// Use the authClient to cancel subscription
			const { error } = await authClient.subscription.cancel({
				subscriptionId,
				returnUrl: `${window.location.origin}/pricing`,
			});

			if (error) {
				throw new Error(error.message);
			}

			// Refresh subscriptions after successful cancellation
			await fetchSubscriptions();
		} catch (err: any) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to cancel subscription";
			setError(errorMessage);
			throw new Error(errorMessage);
		}
	};

	// eslint-disable-next-line no-unused-vars
	const restoreSubscription = async (_subscriptionId: string) => {
		try {
			setError(null);

			// For restoration, we might need to upgrade again
			// This would depend on the specific BetterAuth implementation
			await fetchSubscriptions();
		} catch (err: any) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to restore subscription";
			setError(errorMessage);
			throw new Error(errorMessage);
		}
	};

	const canUpgradeTo = (planId: string): boolean => {
		const currentLevel =
			PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
		const targetLevel =
			PLAN_HIERARCHY[planId as keyof typeof PLAN_HIERARCHY];

		return targetLevel !== undefined && targetLevel > currentLevel;
	};

	// Fetch subscriptions on component mount
	useEffect(() => {
		fetchSubscriptions();
	}, []);

	return {
		subscriptions,
		currentPlan,
		loading,
		error,
		isAuthenticated,
		fetchSubscriptions,
		upgradeSubscription,
		cancelSubscription,
		restoreSubscription,
		canUpgradeTo,
	};
}
