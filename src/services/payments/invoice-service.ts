import Stripe from "stripe";
import { prismaClient } from "../../../prisma/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-08-27.basil",
});

// Helper function to determine user type (applicant or institution)
async function getUserType(
	userId: string
): Promise<"applicant" | "institution" | null> {
	try {
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (applicant) {
			return "applicant";
		}

		const institution = await prismaClient.institution.findUnique({
			where: { user_id: userId },
		});

		if (institution) {
			return "institution";
		}

		return null;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error determining user type:", error);
		return null;
	}
}

/**
 * Creates or updates an invoice record in the database from Stripe invoice data
 * This function can be called from:
 * - Better Auth's onSubscriptionComplete hook
 * - Custom webhook handlers
 * - Payment success handlers
 */
export async function createOrUpdateInvoiceRecord(
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

		// eslint-disable-next-line no-console
		console.log("🔍 Creating/updating invoice record with data:", {
			...invoiceData,
			paymentMethodDetails: paymentMethodDetails
				? "(details present)"
				: null,
		});

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

/**
 * Creates an invoice record from a Stripe subscription after successful payment
 * This is typically called from Better Auth's onSubscriptionComplete hook
 */
export async function createInvoiceFromSubscription(
	stripeSubscriptionId: string
) {
	try {
		// eslint-disable-next-line no-console
		console.log(
			"🔍 Creating invoice from subscription:",
			stripeSubscriptionId
		);

		// Get the latest invoice for this subscription
		const invoices = await stripe.invoices.list({
			subscription: stripeSubscriptionId,
			limit: 1, // Get only the most recent invoice
		});

		if (invoices.data.length === 0) {
			// eslint-disable-next-line no-console
			console.warn(
				"⚠️ No invoices found for subscription:",
				stripeSubscriptionId
			);
			return null;
		}

		const invoice = invoices.data[0];

		// Get payment intent if available
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

		// Create the invoice record
		const dbInvoice = await createOrUpdateInvoiceRecord(
			invoice,
			paymentIntent
		);

		if (dbInvoice) {
			// eslint-disable-next-line no-console
			console.log(
				"✅ Successfully created invoice from subscription:",
				dbInvoice.id
			);
		}

		return dbInvoice;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error creating invoice from subscription:", error);
		throw error;
	}
}
