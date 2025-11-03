import { NotificationUtils } from "@/services/messaging/sqs-handlers";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prismaClient } from "../../../../../prisma/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs to plan names
const PRICE_TO_PLAN_MAPPING = {
	price_1SFXgR1f58RNYg0098jAKotV: "standard",
	price_1S4fZ61f58RNYg00FWakIrLm: "premium",
	// Add fallback for environment variables
	[process.env.STRIPE_STANDARD_PRICE_ID || ""]: "standard",
	[process.env.STRIPE_PREMIUM_PRICE_ID || ""]: "premium",
	[process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID || ""]: "standard",
	[process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || ""]: "premium",
} as const;

// Helper function to get plan name from subscription
function getPlanNameFromSubscription(
	subscription: Stripe.Subscription
): string {
	const priceId = subscription.items.data[0]?.price.id;
	if (!priceId) {
		// eslint-disable-next-line no-console
		console.warn("No price ID found in subscription items");
		return "standard";
	}

	const planName =
		PRICE_TO_PLAN_MAPPING[priceId as keyof typeof PRICE_TO_PLAN_MAPPING];
	if (!planName) {
		// eslint-disable-next-line no-console
		console.warn(`Unknown price ID: ${priceId}, defaulting to standard`);
		return "standard";
	}

	return planName;
}

// Helper function to determine user type (applicant or institution)
async function getUserType(
	userId: string
): Promise<"applicant" | "institution" | null> {
	try {
		// eslint-disable-next-line no-console
		console.log("🔍 Checking user type for user ID:", userId);

		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (applicant) {
			// eslint-disable-next-line no-console
			console.log("✅ User is an applicant:", applicant.applicant_id);
			return "applicant";
		}

		// eslint-disable-next-line no-console
		console.log("❌ No applicant record found, checking institution...");

		const institution = await prismaClient.institution.findUnique({
			where: { user_id: userId },
		});

		if (institution) {
			// eslint-disable-next-line no-console
			console.log(
				"✅ User is an institution:",
				institution.institution_id
			);
			return "institution";
		}

		// eslint-disable-next-line no-console
		console.log("❌ No institution record found either");

		// Additional debugging: Check if user exists in user table
		const user = await prismaClient.user.findUnique({
			where: { id: userId },
		});

		if (user) {
			// eslint-disable-next-line no-console
			console.log(
				"⚠️ User exists in user table but has no applicant/institution profile:",
				{
					id: user.id,
					email: user.email,
					name: user.name,
					createdAt: user.createdAt,
				}
			);
		} else {
			// eslint-disable-next-line no-console
			console.log("❌ User does not exist in user table at all");
		}

		return null;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error determining user type:", error);
		return null;
	}
}

// Helper function to get plan_id from plan name
async function getPlanId(
	planName: string,
	userType: "applicant" | "institution"
): Promise<string | null> {
	try {
		const plan = await prismaClient.plan.findFirst({
			where: {
				name: planName,
				type: userType === "institution" ? 1 : 0, // 1 for institution, 0 for applicant
				status: true,
			},
		});

		return plan?.plan_id || null;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error getting plan ID:", error);
		return null;
	}
}

// Helper function to convert subscription status
function convertSubscriptionStatus(
	stripeStatus: string
): "ACTIVE" | "INACTIVE" | "CANCELLED" | "EXPIRED" {
	switch (stripeStatus) {
		case "active":
		case "trialing":
			return "ACTIVE";
		case "past_due":
		case "unpaid":
			return "INACTIVE";
		case "canceled":
		case "cancelled":
			return "CANCELLED";
		case "incomplete_expired":
			return "EXPIRED";
		default:
			return "INACTIVE";
	}
}

// Helper function to create or update invoice records
async function createOrUpdateInvoiceRecord(
	invoice: Stripe.Invoice,
	paymentIntent?: Stripe.PaymentIntent | null
) {
	try {
		// Find user by Stripe customer ID
		const user = await prismaClient.user.findFirst({
			where: { stripeCustomerId: invoice.customer as string },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error("❌ User not found for customer:", invoice.customer);
			return null;
		}

		// Determine user type
		const userType = await getUserType(user.id);

		// Extract payment method details from payment intent
		let paymentMethodType: string | null = null;
		let paymentMethodDetails: any = null;

		if (paymentIntent && paymentIntent.payment_method) {
			// If payment_method is a string (ID), we need to retrieve it
			let paymentMethod: Stripe.PaymentMethod;

			if (typeof paymentIntent.payment_method === "string") {
				try {
					paymentMethod = await stripe.paymentMethods.retrieve(
						paymentIntent.payment_method
					);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.warn("Could not retrieve payment method:", error);
					paymentMethod = { type: "unknown" } as any;
				}
			} else {
				paymentMethod =
					paymentIntent.payment_method as Stripe.PaymentMethod;
			}

			paymentMethodType = paymentMethod.type;

			// Extract relevant payment method details based on type
			if (paymentMethod.type === "card" && paymentMethod.card) {
				paymentMethodDetails = {
					type: "card",
					brand: paymentMethod.card.brand,
					last4: paymentMethod.card.last4,
					exp_month: paymentMethod.card.exp_month,
					exp_year: paymentMethod.card.exp_year,
					funding: paymentMethod.card.funding,
				};
			} else if (
				paymentMethod.type === "us_bank_account" &&
				paymentMethod.us_bank_account
			) {
				paymentMethodDetails = {
					type: "bank_account",
					bank_name: paymentMethod.us_bank_account.bank_name,
					last4: paymentMethod.us_bank_account.last4,
					account_type: paymentMethod.us_bank_account.account_type,
				};
			} else {
				paymentMethodDetails = {
					type: paymentMethod.type,
				};
			}
		}

		// Create or update the invoice record
		const invoiceData = {
			stripeInvoiceId: invoice.id || `inv_${Date.now()}`,
			stripeCustomerId: invoice.customer as string,
			stripeSubscriptionId:
				((invoice as any).subscription as string) || null,
			userId: user.id,
			userType: userType || null,
			amount: invoice.amount_paid || invoice.total || 0,
			currency: invoice.currency,
			status: invoice.status || "unknown",
			paymentMethod: paymentMethodType,
			paymentMethodDetails: paymentMethodDetails || null,
			hostedInvoiceUrl: invoice.hosted_invoice_url,
			invoicePdf: invoice.invoice_pdf,
			receiptNumber: invoice.receipt_number,
			periodStart: invoice.period_start
				? new Date(invoice.period_start * 1000)
				: null,
			periodEnd: invoice.period_end
				? new Date(invoice.period_end * 1000)
				: null,
			paidAt: invoice.status_transitions?.paid_at
				? new Date(invoice.status_transitions.paid_at * 1000)
				: null,
		};

		// Try to update existing invoice first
		const existingInvoice = await prismaClient.invoice.findFirst({
			where: { stripeInvoiceId: invoice.id },
		});

		let dbInvoice;
		if (existingInvoice) {
			dbInvoice = await prismaClient.invoice.update({
				where: { id: existingInvoice.id },
				data: invoiceData,
			});
			// eslint-disable-next-line no-console
			console.log("✅ Updated existing invoice record:", dbInvoice.id);
		} else {
			dbInvoice = await prismaClient.invoice.create({
				data: invoiceData,
			});
			// eslint-disable-next-line no-console
			console.log("✅ Created new invoice record:", dbInvoice.id);
		}

		return dbInvoice;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error creating/updating invoice record:", error);
		throw error;
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = (await headers()).get("stripe-signature");

		// Debug logging
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("🔍 Webhook Debug Info:");
			// eslint-disable-next-line no-console
			console.log("Body length:", body.length);
			// eslint-disable-next-line no-console
			console.log("Signature present:", !!signature);
			// eslint-disable-next-line no-console
			console.log("Webhook secret configured:", !!webhookSecret);
		}

		if (!signature) {
			// eslint-disable-next-line no-console
			console.error("❌ No stripe-signature header found");
			return NextResponse.json(
				{ error: "No signature found" },
				{ status: 400 }
			);
		}

		if (!webhookSecret) {
			// eslint-disable-next-line no-console
			console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
			return NextResponse.json(
				{ error: "Webhook secret not configured" },
				{ status: 500 }
			);
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(
				body,
				signature,
				webhookSecret
			);
		} catch (err) {
			const error = err as Error;
			// eslint-disable-next-line no-console
			console.error(
				`❌ Webhook signature verification failed: ${error.message}`
			);
			// eslint-disable-next-line no-console
			console.error("Signature header:", signature);
			// eslint-disable-next-line no-console
			console.error("Body sample:", body.substring(0, 200));

			// In development, allow processing without signature verification
			// This is ONLY for debugging - remove in production
			if (
				process.env.NODE_ENV === "development" &&
				process.env.ALLOW_UNSAFE_WEBHOOK === "true"
			) {
				// eslint-disable-next-line no-console
				console.warn(
					"⚠️ Processing webhook without signature verification (DEVELOPMENT ONLY)"
				);

				try {
					event = JSON.parse(body);
				} catch (parseError) {
					// eslint-disable-next-line no-console
					console.error(
						"❌ Failed to parse webhook body:",
						parseError
					);
					return NextResponse.json(
						{ error: "Invalid JSON body" },
						{ status: 400 }
					);
				}
			} else {
				return NextResponse.json(
					{
						error: `Webhook Error: ${error.message}`,
						code: "WEBHOOK_ERROR_NO_SIGNATURES_FOUND_MATCHING_THE_EXPECTED_SIGNATURE_FOR_PAYLOAD_ARE_YOU_PASSING_THE_RAW_REQUEST_BODY_YOU_RECEIVED_FROM_STRIPE__IF_A_WEBHOOK_REQUEST_IS_BEING_FORWARDED_BY_A_THIRDPARTY_TOOL_ENSURE_THAT_THE_EXACT_REQUEST_BODY_INCLUDING_JSON_FORMATTING_AND_NEW_LINE_STYLE_IS_PRESERVEDLEARN_MORE_ABOUT_WEBHOOK_SIGNING_AND_EXPLORE_WEBHOOK_INTEGRATION_EXAMPLES_FOR_VARIOUS_FRAMEWORKS_AT_HTTPSDOCSSTRIPECOMWEBHOOKSSIGNATURE",
					},
					{ status: 400 }
				);
			}
		}

		// Handle the event
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log(`Processing Stripe event: ${event.type}`);
		}

		switch (event.type) {
			case "customer.subscription.created":
				await handleSubscriptionCreated(
					event.data.object as Stripe.Subscription
				);
				break;

			case "customer.subscription.updated":
				await handleSubscriptionUpdated(
					event.data.object as Stripe.Subscription
				);
				break;

			case "customer.subscription.deleted":
				await handleSubscriptionDeleted(
					event.data.object as Stripe.Subscription
				);
				break;

			case "invoice.payment_succeeded":
				await handlePaymentSucceeded(
					event.data.object as Stripe.Invoice
				);
				break;

			case "invoice.payment_failed":
				await handlePaymentFailed(event.data.object as Stripe.Invoice);
				break;

			case "invoice.created":
				await handleInvoiceCreated(event.data.object as Stripe.Invoice);
				break;

			case "invoice.updated":
				await handleInvoiceUpdated(event.data.object as Stripe.Invoice);
				break;

			case "checkout.session.completed":
				await handleCheckoutSessionCompleted(
					event.data.object as Stripe.Checkout.Session
				);
				break;

			default:
				if (process.env.NODE_ENV === "development") {
					// eslint-disable-next-line no-console
					console.log(`Unhandled event type: ${event.type}`);
				}
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling subscription created:", subscription.id);
		// eslint-disable-next-line no-console
		console.log(
			"Subscription details:",
			JSON.stringify(subscription, null, 2)
		);
	}

	// NOTE: For subscription.created events, we always create NEW subscription records
	// This maintains proper subscription history when users cancel and resubscribe
	// We only update existing records if they have the exact same stripeSubscriptionId

	try {
		// eslint-disable-next-line no-console
		console.log(
			"🔍 Looking for user with customer ID:",
			subscription.customer
		);

		// Find the user by Stripe customer ID
		const user = await prismaClient.user.findFirst({
			where: { stripeCustomerId: subscription.customer as string },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ User not found for customer:",
				subscription.customer
			);
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ Found user:", user.id, user.email);

		// Get plan name from subscription using price ID mapping
		const planName = getPlanNameFromSubscription(subscription);
		// eslint-disable-next-line no-console
		console.log("✅ Determined plan name:", planName);

		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Determine user type and get plan ID
		const userType = await getUserType(user.id);
		if (!userType) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ Could not determine user type for user:",
				user.id
			);
			// eslint-disable-next-line no-console
			console.log(
				"⚠️ This user exists in the user table but has no applicant or institution profile"
			);
			// eslint-disable-next-line no-console
			console.log(
				"💡 This may be a newly registered user who hasn't completed their profile setup"
			);
			// eslint-disable-next-line no-console
			console.log(
				"📝 The subscription will be created in Better Auth table only"
			);

			// Continue with Better Auth subscription creation only
			// Create or update subscription in Better Auth table
			// For subscription.created events, only check by stripeSubscriptionId
			const existingSubscription =
				await prismaClient.subscription.findFirst({
					where: { stripeSubscriptionId: subscription.id },
				});

			try {
				if (existingSubscription) {
					await prismaClient.subscription.update({
						where: { id: existingSubscription.id },
						data: {
							referenceId: user.id, // Ensure correct user association
							stripeSubscriptionId: subscription.id,
							stripeCustomerId: subscription.customer as string,
							plan: planName,
							status: subscription.status,
							periodStart: currentPeriodStart
								? new Date(currentPeriodStart * 1000)
								: null,
							periodEnd: currentPeriodEnd
								? new Date(currentPeriodEnd * 1000)
								: null,
							cancelAtPeriodEnd:
								subscription.cancel_at_period_end,
							trialStart: subscription.trial_start
								? new Date(subscription.trial_start * 1000)
								: null,
							trialEnd: subscription.trial_end
								? new Date(subscription.trial_end * 1000)
								: null,
						},
					});
				} else {
					await prismaClient.subscription.create({
						data: {
							id: crypto.randomUUID(),
							referenceId: user.id,
							stripeSubscriptionId: subscription.id,
							stripeCustomerId: subscription.customer as string,
							plan: planName,
							status: subscription.status,
							periodStart: currentPeriodStart
								? new Date(currentPeriodStart * 1000)
								: null,
							periodEnd: currentPeriodEnd
								? new Date(currentPeriodEnd * 1000)
								: null,
							cancelAtPeriodEnd:
								subscription.cancel_at_period_end,
							seats: 1,
							trialStart: subscription.trial_start
								? new Date(subscription.trial_start * 1000)
								: null,
							trialEnd: subscription.trial_end
								? new Date(subscription.trial_end * 1000)
								: null,
						},
					});
				}
			} catch (error: any) {
				// Handle unique constraint violations
				if (
					error?.code === "P2002" &&
					error?.meta?.target?.includes("stripeSubscriptionId")
				) {
					// eslint-disable-next-line no-console
					console.log(
						"⚠️ Subscription with this Stripe ID already exists (no profile case)"
					);
					// In this case, we'll just continue since the subscription exists
				} else {
					throw error;
				}
			}

			// eslint-disable-next-line no-console
			console.log(
				"✅ Created/updated Better Auth subscription for user without profile"
			);
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ User type determined:", userType);

		const planId = await getPlanId(planName, userType);
		if (!planId) {
			// eslint-disable-next-line no-console
			console.error(
				`❌ Plan not found for name: ${planName}, type: ${userType}`
			);
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ Found plan ID:", planId);

		// Create or update subscription in Better Auth table
		// For subscription.created events, we should create a new record unless
		// a subscription with the exact same stripeSubscriptionId already exists
		const existingSubscription = await prismaClient.subscription.findFirst({
			where: { stripeSubscriptionId: subscription.id },
		});

		// eslint-disable-next-line no-console
		console.log(
			"🔍 Existing Better Auth subscription by Stripe ID:",
			existingSubscription ? existingSubscription.id : "None"
		);

		let betterAuthSubscriptionId: string;

		try {
			if (existingSubscription) {
				// eslint-disable-next-line no-console
				console.log(
					"🔄 Updating existing Better Auth subscription (same Stripe ID)"
				);

				// Ensure the subscription belongs to the correct user
				const updatedSubscription =
					await prismaClient.subscription.update({
						where: { id: existingSubscription.id },
						data: {
							referenceId: user.id, // Ensure correct user association
							stripeSubscriptionId: subscription.id,
							stripeCustomerId: subscription.customer as string,
							plan: planName,
							status: subscription.status,
							periodStart: currentPeriodStart
								? new Date(currentPeriodStart * 1000)
								: null,
							periodEnd: currentPeriodEnd
								? new Date(currentPeriodEnd * 1000)
								: null,
							cancelAtPeriodEnd:
								subscription.cancel_at_period_end,
							trialStart: subscription.trial_start
								? new Date(subscription.trial_start * 1000)
								: null,
							trialEnd: subscription.trial_end
								? new Date(subscription.trial_end * 1000)
								: null,
						},
					});
				betterAuthSubscriptionId = updatedSubscription.id;

				// eslint-disable-next-line no-console
				console.log(
					"✅ Updated Better Auth subscription:",
					betterAuthSubscriptionId
				);
			} else {
				// eslint-disable-next-line no-console
				console.log(
					"🆕 Creating new Better Auth subscription (new subscription)"
				);

				const newSubscription = await prismaClient.subscription.create({
					data: {
						id: crypto.randomUUID(),
						referenceId: user.id,
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						plan: planName,
						status: subscription.status,
						periodStart: currentPeriodStart
							? new Date(currentPeriodStart * 1000)
							: null,
						periodEnd: currentPeriodEnd
							? new Date(currentPeriodEnd * 1000)
							: null,
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						seats: 1,
						trialStart: subscription.trial_start
							? new Date(subscription.trial_start * 1000)
							: null,
						trialEnd: subscription.trial_end
							? new Date(subscription.trial_end * 1000)
							: null,
					},
				});
				betterAuthSubscriptionId = newSubscription.id;

				// eslint-disable-next-line no-console
				console.log(
					"✅ Created new Better Auth subscription:",
					betterAuthSubscriptionId
				);
			}
		} catch (error: any) {
			// Handle unique constraint violations
			if (
				error?.code === "P2002" &&
				error?.meta?.target?.includes("stripeSubscriptionId")
			) {
				// eslint-disable-next-line no-console
				console.log(
					"⚠️ Subscription with this Stripe ID already exists, attempting to find and use it"
				);

				// Find the existing subscription by stripeSubscriptionId
				const existingByStripeId =
					await prismaClient.subscription.findFirst({
						where: { stripeSubscriptionId: subscription.id },
					});

				if (existingByStripeId) {
					betterAuthSubscriptionId = existingByStripeId.id;
					// eslint-disable-next-line no-console
					console.log(
						"✅ Using existing Better Auth subscription:",
						betterAuthSubscriptionId
					);
				} else {
					// eslint-disable-next-line no-console
					console.error(
						"❌ Could not find existing subscription by Stripe ID"
					);
					throw error;
				}
			} else {
				throw error;
			}
		}

		// Create in the appropriate subscription table
		// For subscription.created events, always create new records
		const subscriptionStatus = convertSubscriptionStatus(
			subscription.status
		);

		if (userType === "applicant") {
			const applicant = await prismaClient.applicant.findUnique({
				where: { user_id: user.id },
			});

			if (applicant) {
				// eslint-disable-next-line no-console
				console.log("🆕 Creating new applicant subscription record");

				await prismaClient.applicantSubscription.create({
					data: {
						subscription_id: crypto.randomUUID(),
						applicant_id: applicant.applicant_id,
						plan_id: planId,
						status: subscriptionStatus,
						better_auth_sub_id: betterAuthSubscriptionId,
					},
				});

				// eslint-disable-next-line no-console
				console.log("✅ Created new applicant subscription");
			}
		} else if (userType === "institution") {
			const institution = await prismaClient.institution.findUnique({
				where: { user_id: user.id },
			});

			if (institution) {
				// eslint-disable-next-line no-console
				console.log("🆕 Creating new institution subscription record");

				await prismaClient.institutionSubscription.create({
					data: {
						subscription_id: crypto.randomUUID(),
						institution_id: institution.institution_id,
						plan_id: planId,
						status: subscriptionStatus,
						better_auth_sub_id: betterAuthSubscriptionId,
					},
				});

				// eslint-disable-next-line no-console
				console.log("✅ Created new institution subscription");
			}
		}

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Subscription created successfully in database");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling subscription created:", error);
		throw error;
	}
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling subscription updated:", subscription.id);
	}

	try {
		// Find subscription by Stripe subscription ID
		const existingSubscription = await prismaClient.subscription.findFirst({
			where: { stripeSubscriptionId: subscription.id },
		});

		if (!existingSubscription) {
			// eslint-disable-next-line no-console
			console.error("Subscription not found:", subscription.id);
			return;
		}

		// Get plan name from subscription using price ID mapping
		const planName = getPlanNameFromSubscription(subscription);
		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Get user from the existing subscription
		const user = await prismaClient.user.findFirst({
			where: { id: existingSubscription.referenceId! },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error("User not found for subscription:", subscription.id);
			return;
		}

		// Determine user type and get plan ID
		const userType = await getUserType(user.id);
		if (!userType) {
			// eslint-disable-next-line no-console
			console.error("Could not determine user type for user:", user.id);
			// eslint-disable-next-line no-console
			console.log(
				"⚠️ User has no profile - updating Better Auth subscription only"
			);

			// Update subscription in Better Auth table only
			await prismaClient.subscription.update({
				where: { id: existingSubscription.id },
				data: {
					plan: planName,
					status: subscription.status,
					periodStart: currentPeriodStart
						? new Date(currentPeriodStart * 1000)
						: null,
					periodEnd: currentPeriodEnd
						? new Date(currentPeriodEnd * 1000)
						: null,
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					trialStart: subscription.trial_start
						? new Date(subscription.trial_start * 1000)
						: null,
					trialEnd: subscription.trial_end
						? new Date(subscription.trial_end * 1000)
						: null,
				},
			});

			// eslint-disable-next-line no-console
			console.log(
				"✅ Updated Better Auth subscription for user without profile"
			);
			return;
		}

		const planId = await getPlanId(planName, userType);
		if (!planId) {
			// eslint-disable-next-line no-console
			console.error(
				`Plan not found for name: ${planName}, type: ${userType}`
			);
			return;
		}

		// Update subscription in Better Auth table
		await prismaClient.subscription.update({
			where: { id: existingSubscription.id },
			data: {
				plan: planName,
				status: subscription.status,
				periodStart: currentPeriodStart
					? new Date(currentPeriodStart * 1000)
					: null,
				periodEnd: currentPeriodEnd
					? new Date(currentPeriodEnd * 1000)
					: null,
				cancelAtPeriodEnd: subscription.cancel_at_period_end,
				trialStart: subscription.trial_start
					? new Date(subscription.trial_start * 1000)
					: null,
				trialEnd: subscription.trial_end
					? new Date(subscription.trial_end * 1000)
					: null,
			},
		});

		// Update in the appropriate subscription table
		const subscriptionStatus = convertSubscriptionStatus(
			subscription.status
		);

		if (userType === "applicant") {
			const applicant = await prismaClient.applicant.findUnique({
				where: { user_id: user.id },
			});

			if (applicant) {
				const existingApplicantSub =
					await prismaClient.applicantSubscription.findFirst({
						where: { better_auth_sub_id: existingSubscription.id },
					});

				if (existingApplicantSub) {
					await prismaClient.applicantSubscription.update({
						where: {
							subscription_id:
								existingApplicantSub.subscription_id,
						},
						data: {
							plan_id: planId,
							status: subscriptionStatus,
						},
					});
				}
			}
		} else if (userType === "institution") {
			const institution = await prismaClient.institution.findUnique({
				where: { user_id: user.id },
			});

			if (institution) {
				const existingInstitutionSub =
					await prismaClient.institutionSubscription.findFirst({
						where: { better_auth_sub_id: existingSubscription.id },
					});

				if (existingInstitutionSub) {
					await prismaClient.institutionSubscription.update({
						where: {
							subscription_id:
								existingInstitutionSub.subscription_id,
						},
						data: {
							plan_id: planId,
							status: subscriptionStatus,
						},
					});
				}
			}
		}

		// If subscription is being canceled at period end, send notification
		if (subscription.cancel_at_period_end && currentPeriodEnd) {
			// Find user by Stripe customer ID instead of referenceId
			const userForNotification = await prismaClient.user.findFirst({
				where: { stripeCustomerId: subscription.customer as string },
			});

			if (userForNotification) {
				const daysRemaining = Math.ceil(
					(new Date(currentPeriodEnd * 1000).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24)
				);

				await NotificationUtils.sendSubscriptionExpiringNotification(
					userForNotification.id,
					userForNotification.email,
					subscription.id,
					planName,
					new Date(currentPeriodEnd * 1000).toISOString(),
					daysRemaining
				);
			}
		}

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Subscription updated successfully in database");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling subscription updated:", error);
		throw error;
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling subscription deleted:", subscription.id);
	}

	try {
		// Find subscription by Stripe subscription ID
		const existingSubscription = await prismaClient.subscription.findFirst({
			where: { stripeSubscriptionId: subscription.id },
		});

		if (!existingSubscription) {
			// eslint-disable-next-line no-console
			console.error("Subscription not found:", subscription.id);
			return;
		}

		// Get user from the existing subscription
		const user = await prismaClient.user.findFirst({
			where: { id: existingSubscription.referenceId! },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error("User not found for subscription:", subscription.id);
			return;
		}

		// Determine user type
		const userType = await getUserType(user.id);
		if (!userType) {
			// eslint-disable-next-line no-console
			console.error("Could not determine user type for user:", user.id);
			// eslint-disable-next-line no-console
			console.log(
				"⚠️ User has no profile - updating Better Auth subscription only"
			);

			// Update subscription status to canceled in Better Auth table only
			await prismaClient.subscription.update({
				where: { id: existingSubscription.id },
				data: {
					status: "canceled",
					cancelAtPeriodEnd: false,
				},
			});

			// eslint-disable-next-line no-console
			console.log(
				"✅ Canceled Better Auth subscription for user without profile"
			);
			return;
		}

		// Update subscription status to canceled in Better Auth table
		await prismaClient.subscription.update({
			where: { id: existingSubscription.id },
			data: {
				status: "canceled",
				cancelAtPeriodEnd: false,
			},
		});

		// Update status in the appropriate subscription table
		if (userType === "applicant") {
			const existingApplicantSub =
				await prismaClient.applicantSubscription.findFirst({
					where: { better_auth_sub_id: existingSubscription.id },
				});

			if (existingApplicantSub) {
				await prismaClient.applicantSubscription.update({
					where: {
						subscription_id: existingApplicantSub.subscription_id,
					},
					data: {
						status: "CANCELLED",
					},
				});
			}
		} else if (userType === "institution") {
			const existingInstitutionSub =
				await prismaClient.institutionSubscription.findFirst({
					where: { better_auth_sub_id: existingSubscription.id },
				});

			if (existingInstitutionSub) {
				await prismaClient.institutionSubscription.update({
					where: {
						subscription_id: existingInstitutionSub.subscription_id,
					},
					data: {
						status: "CANCELLED",
					},
				});
			}
		}

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Subscription deleted successfully in database");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling subscription deleted:", error);
		throw error;
	}
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling payment succeeded:", invoice.id);
		// eslint-disable-next-line no-console
		console.log("Invoice details:", JSON.stringify(invoice, null, 2));
	}

	try {
		// Retrieve payment intent details for more comprehensive invoice data
		let paymentIntent: Stripe.PaymentIntent | null = null;
		if ((invoice as any).payment_intent) {
			try {
				paymentIntent = await stripe.paymentIntents.retrieve(
					(invoice as any).payment_intent as string,
					{
						expand: ["payment_method"],
					}
				);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn("Could not retrieve payment intent:", error);
			}
		}

		// Create or update invoice record in our database
		const dbInvoice = await createOrUpdateInvoiceRecord(
			invoice,
			paymentIntent
		);

		if (!dbInvoice) {
			// eslint-disable-next-line no-console
			console.error("❌ Could not create/update invoice record");
			return;
		}

		const invoiceSubscription = (invoice as any).subscription;

		if (!invoiceSubscription) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("Invoice not associated with a subscription");
			}
			return;
		}

		// eslint-disable-next-line no-console
		console.log(
			"🔍 Looking for subscription with Stripe ID:",
			invoiceSubscription
		);

		// Find subscription by Stripe subscription ID
		const subscription = await prismaClient.subscription.findFirst({
			where: { stripeSubscriptionId: invoiceSubscription as string },
		});

		if (!subscription) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ Subscription not found for invoice:",
				invoiceSubscription
			);
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ Found Better Auth subscription:", subscription.id);

		// Update subscription status to active
		await prismaClient.subscription.update({
			where: { id: subscription.id },
			data: {
				status: "active",
			},
		});

		// eslint-disable-next-line no-console
		console.log("✅ Updated Better Auth subscription status to active");

		// Get user details
		const user = await prismaClient.user.findFirst({
			where: { stripeCustomerId: invoice.customer as string },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error("❌ User not found for customer:", invoice.customer);
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ Found user:", user.id, user.email);

		// Determine user type and update related subscription tables
		const userType = await getUserType(user.id);
		if (!userType) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ Could not determine user type for user:",
				user.id
			);
			// eslint-disable-next-line no-console
			console.log(
				"⚠️ User has no profile - payment succeeded but no related tables to update"
			);
			// eslint-disable-next-line no-console
			console.log(
				"💡 User may need to complete their profile setup to access premium features"
			);

			// Send payment success notification anyway
			await NotificationUtils.sendPaymentSuccessNotification(
				user.id,
				user.email,
				subscription.stripeSubscriptionId || "",
				subscription.plan || "unknown",
				invoice.amount_paid / 100, // Convert from cents to dollars
				invoice.currency.toUpperCase(),
				invoice.id || "unknown"
			);

			// eslint-disable-next-line no-console
			console.log("✅ Sent payment success notification");
			return;
		}

		// eslint-disable-next-line no-console
		console.log("✅ User type determined:", userType);

		// Update the appropriate subscription table to ACTIVE status
		if (userType === "applicant") {
			const applicant = await prismaClient.applicant.findUnique({
				where: { user_id: user.id },
			});

			if (applicant) {
				// eslint-disable-next-line no-console
				console.log("✅ Found applicant:", applicant.applicant_id);

				const existingApplicantSub =
					await prismaClient.applicantSubscription.findFirst({
						where: { better_auth_sub_id: subscription.id },
					});

				if (existingApplicantSub) {
					// eslint-disable-next-line no-console
					console.log(
						"✅ Found existing applicant subscription:",
						existingApplicantSub.subscription_id
					);

					await prismaClient.applicantSubscription.update({
						where: {
							subscription_id:
								existingApplicantSub.subscription_id,
						},
						data: {
							status: "ACTIVE",
						},
					});

					// eslint-disable-next-line no-console
					console.log(
						"✅ Updated applicant subscription status to ACTIVE"
					);
				} else {
					// eslint-disable-next-line no-console
					console.warn(
						"⚠️ No applicant subscription found linked to Better Auth subscription"
					);
				}
			} else {
				// eslint-disable-next-line no-console
				console.error(
					"❌ Applicant profile not found for user:",
					user.id
				);
			}
		} else if (userType === "institution") {
			const institution = await prismaClient.institution.findUnique({
				where: { user_id: user.id },
			});

			if (institution) {
				// eslint-disable-next-line no-console
				console.log(
					"✅ Found institution:",
					institution.institution_id
				);

				const existingInstitutionSub =
					await prismaClient.institutionSubscription.findFirst({
						where: { better_auth_sub_id: subscription.id },
					});

				if (existingInstitutionSub) {
					// eslint-disable-next-line no-console
					console.log(
						"✅ Found existing institution subscription:",
						existingInstitutionSub.subscription_id
					);

					await prismaClient.institutionSubscription.update({
						where: {
							subscription_id:
								existingInstitutionSub.subscription_id,
						},
						data: {
							status: "ACTIVE",
						},
					});

					// eslint-disable-next-line no-console
					console.log(
						"✅ Updated institution subscription status to ACTIVE"
					);
				} else {
					// eslint-disable-next-line no-console
					console.warn(
						"⚠️ No institution subscription found linked to Better Auth subscription"
					);
				}
			} else {
				// eslint-disable-next-line no-console
				console.error(
					"❌ Institution profile not found for user:",
					user.id
				);
			}
		}

		// Send payment success notification
		await NotificationUtils.sendPaymentSuccessNotification(
			user.id,
			user.email,
			subscription.stripeSubscriptionId || "",
			subscription.plan || "unknown",
			invoice.amount_paid / 100, // Convert from cents to dollars
			invoice.currency.toUpperCase(),
			invoice.id || "unknown"
		);

		// eslint-disable-next-line no-console
		console.log("✅ Sent payment success notification");

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("✅ Payment succeeded handled successfully");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error handling payment succeeded:", error);
		throw error;
	}
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling payment failed:", invoice.id);
	}

	try {
		// Create or update invoice record in our database (even for failed payments)
		const dbInvoice = await createOrUpdateInvoiceRecord(invoice);

		if (!dbInvoice) {
			// eslint-disable-next-line no-console
			console.error("❌ Could not create/update invoice record");
			return;
		}

		const invoiceSubscription = (invoice as any).subscription;

		if (!invoiceSubscription) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("Invoice not associated with a subscription");
			}
			return;
		}

		// Find subscription by Stripe subscription ID
		const subscription = await prismaClient.subscription.findFirst({
			where: { stripeSubscriptionId: invoiceSubscription as string },
		});

		if (!subscription) {
			// eslint-disable-next-line no-console
			console.error(
				"Subscription not found for invoice:",
				invoiceSubscription
			);
			return;
		}

		// Update subscription status to past_due or unpaid
		await prismaClient.subscription.update({
			where: { id: subscription.id },
			data: {
				status: "past_due",
			},
		});

		// Get user details
		const user = await prismaClient.user.findFirst({
			where: { stripeCustomerId: invoice.customer as string },
		});

		if (user) {
			// Send payment failed notification
			await NotificationUtils.sendPaymentFailedNotification(
				user.id,
				user.email,
				subscription.stripeSubscriptionId || "",
				subscription.plan || "unknown",
				invoice.amount_due / 100, // Convert from cents to dollars
				invoice.currency.toUpperCase(),
				invoice.last_finalization_error?.message || "Payment failed"
			);
		}

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Payment failed handled successfully");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling payment failed:", error);
		throw error;
	}
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling invoice created:", invoice.id);
	}

	try {
		// Create invoice record when it's first created
		const dbInvoice = await createOrUpdateInvoiceRecord(invoice);

		if (dbInvoice) {
			// eslint-disable-next-line no-console
			console.log("✅ Invoice created and stored:", dbInvoice.id);
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error handling invoice created:", error);
		throw error;
	}
}

async function handleInvoiceUpdated(invoice: Stripe.Invoice) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling invoice updated:", invoice.id);
	}

	try {
		// Update invoice record when status changes
		const dbInvoice = await createOrUpdateInvoiceRecord(invoice);

		if (dbInvoice) {
			// eslint-disable-next-line no-console
			console.log("✅ Invoice updated:", dbInvoice.id);
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error handling invoice updated:", error);
		throw error;
	}
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session
) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling checkout session completed:", session.id);
	}

	try {
		// If this is a subscription checkout
		if (session.mode === "subscription" && session.subscription) {
			// The subscription will be handled by the subscription.created event
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log(
					"Subscription checkout completed - will be handled by subscription.created event"
				);
			}
		}

		// If this is a one-time payment
		if (session.mode === "payment") {
			// Handle one-time payment if needed
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("One-time payment checkout completed");
			}
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling checkout session completed:", error);
		throw error;
	}
}
// export {};
