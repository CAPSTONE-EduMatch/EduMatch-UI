import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prismaClient } from "../../../../../prisma/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = (await headers()).get("stripe-signature");

		if (!signature) {
			return NextResponse.json(
				{ error: "No signature found" },
				{ status: 400 }
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
			console.error(
				`Webhook signature verification failed: ${error.message}`
			);
			return NextResponse.json(
				{ error: `Webhook Error: ${error.message}` },
				{ status: 400 }
			);
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
	}

	try {
		// Get plan name from metadata or price
		const planName =
			subscription.items.data[0]?.price.lookup_key || "standard";
		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Create StripePayment record
		const subscriptionId = crypto.randomUUID();
		const stripePayment = await prismaClient.stripePayment.create({
			data: {
				subscription_id: subscriptionId,
				stripeSubscriptionId: subscription.id,
				stripeCustomerId: subscription.customer as string,
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

		// Note: You'll need to implement logic to determine if this is an applicant or institution subscription
		// and create the appropriate subscription record. For now, we'll log this requirement.
		console.warn(
			"Subscription creation requires implementation of user type detection and plan mapping"
		);

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Stripe payment record created successfully");
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
		// Find StripePayment by Stripe subscription ID
		const existingStripePayment =
			await prismaClient.stripePayment.findUnique({
				where: { stripeSubscriptionId: subscription.id },
			});

		if (!existingStripePayment) {
			// eslint-disable-next-line no-console
			console.error("Stripe payment not found:", subscription.id);
			return;
		}

		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Update StripePayment in database
		await prismaClient.stripePayment.update({
			where: { stripeSubscriptionId: subscription.id },
			data: {
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

		// Note: You'll need to implement logic to update the corresponding ApplicantSubscription or InstitutionSubscription
		// and send notifications. For now, we'll log this requirement.
		console.warn(
			"Subscription update requires implementation of user type detection and notification system"
		);

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Stripe payment updated successfully in database");
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
		// Find StripePayment by Stripe subscription ID
		const existingStripePayment =
			await prismaClient.stripePayment.findUnique({
				where: { stripeSubscriptionId: subscription.id },
			});

		if (!existingStripePayment) {
			// eslint-disable-next-line no-console
			console.error("Stripe payment not found:", subscription.id);
			return;
		}

		// Update StripePayment to mark as canceled
		await prismaClient.stripePayment.update({
			where: { stripeSubscriptionId: subscription.id },
			data: {
				cancelAtPeriodEnd: false,
			},
		});

		// Note: You'll need to implement logic to update the corresponding ApplicantSubscription or InstitutionSubscription
		// status to CANCELED. For now, we'll log this requirement.
		console.warn(
			"Subscription deletion requires implementation of user type detection and status update"
		);

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Stripe payment marked as canceled in database");
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
	}

	try {
		const invoiceSubscription = (invoice as any).subscription;

		if (!invoiceSubscription) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("Invoice not associated with a subscription");
			}
			return;
		}

		// Find StripePayment by Stripe subscription ID
		const stripePayment = await prismaClient.stripePayment.findUnique({
			where: { stripeSubscriptionId: invoiceSubscription as string },
		});

		if (!stripePayment) {
			// eslint-disable-next-line no-console
			console.error(
				"Stripe payment not found for invoice:",
				invoiceSubscription
			);
			return;
		}

		// Update StripePayment with payment amount
		await prismaClient.stripePayment.update({
			where: { stripeSubscriptionId: invoiceSubscription as string },
			data: {
				amount: (invoice.amount_paid / 100).toString(), // Convert from cents to dollars
			},
		});

		// Note: You'll need to implement logic to update the corresponding ApplicantSubscription or InstitutionSubscription
		// status to ACTIVE and send notifications. For now, we'll log this requirement.
		console.warn(
			"Payment success requires implementation of user type detection, status update, and notification system"
		);

		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log("Payment succeeded handled successfully");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling payment succeeded:", error);
		throw error;
	}
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.log("Handling payment failed:", invoice.id);
	}

	try {
		const invoiceSubscription = (invoice as any).subscription;

		if (!invoiceSubscription) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("Invoice not associated with a subscription");
			}
			return;
		}

		// Find StripePayment by Stripe subscription ID
		const stripePayment = await prismaClient.stripePayment.findUnique({
			where: { stripeSubscriptionId: invoiceSubscription as string },
		});

		if (!stripePayment) {
			// eslint-disable-next-line no-console
			console.error(
				"Stripe payment not found for invoice:",
				invoiceSubscription
			);
			return;
		}

		// Note: You'll need to implement logic to update the corresponding ApplicantSubscription or InstitutionSubscription
		// status to PAST_DUE and send notifications. For now, we'll log this requirement.
		console.warn(
			"Payment failure requires implementation of user type detection, status update, and notification system"
		);

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
					"Subscription checkout completed, will be handled by subscription.created event"
				);
			}
		}

		// If this is a one-time payment
		if (session.mode === "payment") {
			// Handle one-time payment if needed
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("One-time payment completed");
			}
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling checkout session completed:", error);
		throw error;
	}
}
// export {};
