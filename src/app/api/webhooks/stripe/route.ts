import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prismaClient } from "../../../../../prisma/index";
import { NotificationUtils } from "@/lib/sqs-handlers";

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
		// Find the user by Stripe customer ID
		const user = await prismaClient.user.findFirst({
			where: { stripeCustomerId: subscription.customer as string },
		});

		if (!user) {
			// eslint-disable-next-line no-console
			console.error(
				"User not found for customer:",
				subscription.customer
			);
			return;
		}

		// Get plan name from metadata or price
		const planName =
			subscription.items.data[0]?.price.lookup_key || "standard";
		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Create or update subscription in database
		const existingSubscription = await prismaClient.subscription.findFirst({
			where: { referenceId: user.id },
		});

		if (existingSubscription) {
			await prismaClient.subscription.update({
				where: { id: existingSubscription.id },
				data: {
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

		// Get plan name from metadata or price
		const planName =
			subscription.items.data[0]?.price.lookup_key || "standard";
		const currentPeriodStart = (subscription as any).current_period_start;
		const currentPeriodEnd = (subscription as any).current_period_end;

		// Update subscription in database
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

		// If subscription is being canceled at period end, send notification
		if (subscription.cancel_at_period_end && currentPeriodEnd) {
			const user = await prismaClient.user.findFirst({
				where: { id: existingSubscription.referenceId },
			});

			if (user) {
				const daysRemaining = Math.ceil(
					(new Date(currentPeriodEnd * 1000).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24)
				);

				await NotificationUtils.sendSubscriptionExpiringNotification(
					user.id,
					user.email,
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

		// Update subscription status to canceled
		await prismaClient.subscription.update({
			where: { id: existingSubscription.id },
			data: {
				status: "canceled",
				cancelAtPeriodEnd: false,
			},
		});

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

		// Update subscription status to active
		await prismaClient.subscription.update({
			where: { id: subscription.id },
			data: {
				status: "active",
			},
		});

		// Get user details
		const user = await prismaClient.user.findFirst({
			where: { id: subscription.referenceId },
		});

		if (user) {
			// Send payment success notification
			await NotificationUtils.sendPaymentSuccessNotification(
				user.id,
				user.email,
				subscription.stripeSubscriptionId || "",
				subscription.plan,
				invoice.amount_paid / 100, // Convert from cents to dollars
				invoice.currency.toUpperCase(),
				invoice.id || "unknown"
			);
		}

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
			where: { id: subscription.referenceId },
		});

		if (user) {
			// Send payment failed notification
			await NotificationUtils.sendPaymentFailedNotification(
				user.id,
				user.email,
				subscription.stripeSubscriptionId || "",
				subscription.plan,
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
