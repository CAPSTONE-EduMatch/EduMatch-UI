import {
	checkOTPRateLimitByType,
	recordOTPAttemptByType,
	type OTPType,
} from "@/config/otp-rate-limit";
import { redisClient } from "@/config/redis";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, customSession, emailOTP, oneTap } from "better-auth/plugins";
import dotenv from "dotenv";
import nodeMailer from "nodemailer";
import Stripe from "stripe";
import { prismaClient } from "../../prisma";
dotenv.config();

// Error codes for account status issues
export const AUTH_ERROR_CODES = {
	ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
	ACCOUNT_BANNED: "ACCOUNT_BANNED",
	ACCOUNT_BANNED_TEMPORARY: "ACCOUNT_BANNED_TEMPORARY",
} as const;

/**
 * Check if an account is deactivated or banned
 * @param email - User's email address
 * @returns Object with isBlocked status and appropriate error message
 */
async function checkAccountStatus(email: string): Promise<{
	isBlocked: boolean;
	errorCode?: string;
	errorMessage?: string;
}> {
	const user = await prismaClient.user.findUnique({
		where: { email },
		select: {
			id: true,
			status: true,
			banned: true,
			banExpires: true,
			banReason: true,
		},
	});

	if (!user) {
		// User doesn't exist - let the normal flow handle this
		return { isBlocked: false };
	}

	// Check if account is deactivated (soft deleted)
	if (user.status === false) {
		console.warn(
			`[Auth] Blocked password reset attempt for deactivated account: ${email}`
		);
		return {
			isBlocked: true,
			errorCode: AUTH_ERROR_CODES.ACCOUNT_DEACTIVATED,
			errorMessage:
				"Your account has been deactivated. Please contact support if you wish to reactivate your account.",
		};
	}

	// Check if account is banned
	if (user.banned === true) {
		// Check if it's a temporary ban that hasn't expired
		if (user.banExpires && new Date(user.banExpires) > new Date()) {
			const banExpiryDate = new Date(user.banExpires).toLocaleDateString(
				"en-US",
				{
					year: "numeric",
					month: "long",
					day: "numeric",
				}
			);
			console.warn(
				`[Auth] Blocked password reset attempt for temporarily banned account: ${email} (expires: ${banExpiryDate})`
			);
			return {
				isBlocked: true,
				errorCode: AUTH_ERROR_CODES.ACCOUNT_BANNED_TEMPORARY,
				errorMessage: `Your account has been banned until ${banExpiryDate}. ${user.banReason ? `Reason: ${user.banReason}` : "Please contact support for more information."}`,
			};
		} else if (user.banExpires && new Date(user.banExpires) <= new Date()) {
			// Ban has expired, allow the action (ban should be cleared separately)
			return { isBlocked: false };
		} else {
			// Permanent ban (no expiry date)
			console.warn(
				`[Auth] Blocked password reset attempt for permanently banned account: ${email}`
			);
			return {
				isBlocked: true,
				errorCode: AUTH_ERROR_CODES.ACCOUNT_BANNED,
				errorMessage: `Your account has been permanently banned. ${user.banReason ? `Reason: ${user.banReason}` : "Please contact support for more information."}`,
			};
		}
	}

	return { isBlocked: false };
}

// Validate required environment variables
function validateEnvironment() {
	const required = [
		"BETTER_AUTH_SECRET",
		"BETTER_AUTH_URL",
		"GOOGLE_CLIENT_ID",
		"GOOGLE_CLIENT_SECRET",
	];

	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		console.error("Missing required environment variables:", missing);
		throw new Error(`Missing environment variables: ${missing.join(", ")}`);
	}

	// Environment validation passed for social auth
}

// Validate environment on startup
try {
	validateEnvironment();
} catch (error) {
	console.error("Environment validation failed:", error);
}

// const stripeClient =
//   process.env.STRIPE_SECRET_KEY &&
//   !process.env.STRIPE_SECRET_KEY.includes("GET_THIS_FROM")
//     ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
//         apiVersion:
//  "2025-08-27.basil",
//       })
//     : "";
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-08-27.basil",
});

export const auth = betterAuth({
	plugins: [
		admin({
			defaultRole: "user",
		}),
		oneTap(),
		// Custom session plugin for optimized responses
		customSession(async ({ user, session }) => {
			// Only include essential user data to reduce payload size
			const optimizedUser = {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};

			// Optimized session data
			const optimizedSession = {
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
			};

			return {
				user: optimizedUser,
				session: optimizedSession,
			};
		}),
		emailOTP({
			async sendVerificationOTP(
				data: {
					email: string;
					otp: string;
					type: "sign-in" | "email-verification" | "forget-password";
				},
				_ctx?: any
			) {
				// Check if account is deactivated or banned before sending OTP
				const accountStatus = await checkAccountStatus(data.email);
				if (accountStatus.isBlocked) {
					throw new Error(accountStatus.errorMessage);
				}

				// Determine OTP type based on the type parameter
				// Better Auth uses 'sign-in' for new users during signup
				let otpType: OTPType = "email-verification"; // default
				if (data.type === "sign-in") {
					// Check if user exists - if not, this is a signup
					const user = await prismaClient.user.findUnique({
						where: { email: data.email },
						select: { id: true },
					});
					otpType = user ? "email-verification" : "signup";
				} else if (data.type === "email-verification") {
					otpType = "email-verification";
				} else if (data.type === "forget-password") {
					otpType = "forgot-password";
				}

				// Check rate limiting before sending OTP
				const rateLimitResult = await checkOTPRateLimitByType(
					data.email,
					otpType
				);

				if (!rateLimitResult.allowed) {
					throw new Error(
						rateLimitResult.message ||
							"Too many OTP requests. Please try again later."
					);
				}

				// Record the attempt
				await recordOTPAttemptByType(data.email, otpType);

				// Send OTP via email using our sendEmail function
				await sendEmail(data.email, "", data.otp);
			},
			// disableSignUp: false, // Allow sign-ups via OTP
			// allowedAttempts: 5, // Max 5 attempts per hour
			expiresIn: 300, // OTP expires in 5 minutes
		}),
		// Stripe plugin - Better Auth handles webhooks at /api/auth/stripe/webhook
		// We add onSubscriptionComplete hook to also create invoices
		stripe({
			stripeClient,
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			createCustomerOnSignUp: true,
			subscription: {
				enabled: true,
				plans: [
					{
						name: "standard",
						priceId:
							process.env.STRIPE_STANDARD_PRICE_ID ||
							process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID ||
							"price_1ScKov1f58RNYg00vyTjn04c",
						limits: {
							applications: 10,
							scholarships: 50,
							programs: 30,
						},
					},
					{
						name: "premium",
						priceId:
							process.env.STRIPE_PREMIUM_PRICE_ID ||
							process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ||
							"price_1ScKqu1f58RNYg00CW5F6SIp",
						limits: {
							applications: 25,
							scholarships: 100,
							programs: 75,
						},
					},
					{
						name: "institution_monthly",
						priceId:
							process.env.STRIPE_INSTITUTION_MONTHLY_PRICE_ID ||
							process.env
								.NEXT_PUBLIC_STRIPE_INSTITUTION_MONTHLY_PRICE_ID ||
							"price_1ScKre1f58RNYg00yfjkz3ZE",
						limits: {
							applications: 999999,
							scholarships: 999999,
							programs: 999999,
						},
					},
					{
						name: "institution_yearly",
						priceId:
							process.env.STRIPE_INSTITUTION_YEARLY_PRICE_ID ||
							process.env
								.NEXT_PUBLIC_STRIPE_INSTITUTION_YEARLY_PRICE_ID ||
							"price_1ScL0R1f58RNYg00KHw5wAFS",
						limits: {
							applications: 999999,
							scholarships: 999999,
							programs: 999999,
						},
					},
				],
				// Authorization callback for billing portal and subscription management
				authorizeReference: async ({
					user,
					session: _session,
					referenceId,
					action,
				}) => {
					// For billing portal access, ensure user owns the subscription
					if (action === "billing-portal") {
						// The referenceId should be the user's ID for individual subscriptions
						// In your case, since subscriptions are per-user, check if referenceId matches user.id
						return referenceId === user.id;
					}

					// For subscription management actions
					if (
						action === "upgrade-subscription" ||
						action === "cancel-subscription" ||
						action === "restore-subscription"
					) {
						// Check if user owns this subscription
						try {
							const subscription =
								await prismaClient.subscription.findFirst({
									where: {
										referenceId: referenceId,
										// Ensure it's the current user's subscription
										OR: [
											{ referenceId: user.id },
											// If you store user email in subscription, you could also check:
											// { stripeCustomerId: user.stripeCustomerId }
										],
									},
								});

							return subscription !== null;
						} catch (error) {
							console.error(
								"Error checking subscription authorization:",
								error
							);
							return false;
						}
					}

					// Default: allow other actions
					return true;
				},
				onSubscriptionComplete: async ({ subscription, plan }) => {
					// Update subscription in database when payment is complete
					try {
						const stripeSubscription = subscription as any;
						const userId = stripeSubscription.userId;

						// Create invoice record from subscription
						// This is crucial - Better Auth doesn't create invoices automatically
						try {
							const { createInvoiceFromSubscription } =
								await import("@/services/payments/invoice-service");
							await createInvoiceFromSubscription(
								stripeSubscription.stripeSubscriptionId
							);
						} catch (invoiceError) {
							// eslint-disable-next-line no-console
							console.error(
								"❌ Error creating invoice from subscription:",
								invoiceError
							);
							// Don't fail the whole process if invoice creation fails
						}

						if (userId) {
							// Find existing subscription
							const existingSub =
								await prismaClient.subscription.findFirst({
									where: {
										stripeSubscriptionId:
											stripeSubscription.stripeSubscriptionId,
									},
								});

							if (existingSub) {
								// Update existing subscription
								await prismaClient.subscription.update({
									where: { id: existingSub.id },
									data: {
										plan: plan.name,
										status: "active",
										periodStart:
											stripeSubscription.periodStart
												? new Date(
														stripeSubscription.periodStart
													)
												: null,
										periodEnd: stripeSubscription.periodEnd
											? new Date(
													stripeSubscription.periodEnd
												)
											: null,
										cancelAtPeriodEnd:
											stripeSubscription.cancelAtPeriodEnd ||
											false,
									},
								});
							} else {
								// Create new subscription
								await prismaClient.subscription.create({
									data: {
										id: crypto.randomUUID(),
										referenceId: userId,
										stripeSubscriptionId:
											stripeSubscription.stripeSubscriptionId,
										stripeCustomerId:
											stripeSubscription.customerId,
										plan: plan.name,
										status: "active",
										periodStart:
											stripeSubscription.periodStart
												? new Date(
														stripeSubscription.periodStart
													)
												: null,
										periodEnd: stripeSubscription.periodEnd
											? new Date(
													stripeSubscription.periodEnd
												)
											: null,
										cancelAtPeriodEnd:
											stripeSubscription.cancelAtPeriodEnd ||
											false,
										seats: 1,
										updatedAt: new Date(),
									},
								});
							}
						}
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"Error updating subscription on completion:",
							error
						);
					}
				},
				onSubscriptionUpdate: async ({ subscription }) => {
					// Update subscription in database
					try {
						const stripeSubscription = subscription as any;

						await prismaClient.subscription.updateMany({
							where: {
								stripeSubscriptionId:
									stripeSubscription.stripeSubscriptionId,
							},
							data: {
								status: stripeSubscription.status,
								periodStart: stripeSubscription.periodStart
									? new Date(stripeSubscription.periodStart)
									: null,
								periodEnd: stripeSubscription.periodEnd
									? new Date(stripeSubscription.periodEnd)
									: null,
								cancelAtPeriodEnd:
									stripeSubscription.cancelAtPeriodEnd ||
									false,
							},
						});
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"Error updating subscription on update:",
							error
						);
					}
				},
				onSubscriptionCancel: async ({ subscription }) => {
					// Update subscription status in database
					try {
						const stripeSubscription = subscription as any;

						await prismaClient.subscription.updateMany({
							where: {
								stripeSubscriptionId:
									stripeSubscription.stripeSubscriptionId,
							},
							data: {
								status: "canceled",
								cancelAtPeriodEnd: false,
							},
						});
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"Error updating subscription on cancellation:",
							error
						);
					}
				},
			},
		}),
		// captcha({
		// 	provider: "cloudflare-turnstile", // or google-recaptcha, hcaptcha
		// 	secretKey: process.env.TURNSTILE_SECRET_KEY!,
		// }),
	],
	database: prismaAdapter(prismaClient, {
		provider: "postgresql",
	}),
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					// Check if user is deactivated (status = false) or banned
					const user = await prismaClient.user.findUnique({
						where: { id: session.userId },
						select: {
							status: true,
							email: true,
							banned: true,
							banExpires: true,
							banReason: true,
						},
					});

					if (!user) {
						throw new Error("User not found");
					}

					if (user.status === false) {
						throw new Error(
							"Your account has been deactivated. Please contact support to reactivate your account."
						);
					}

					// Check if user is banned
					if (user.banned === true) {
						// Check if it's a temporary ban that hasn't expired
						if (
							user.banExpires &&
							new Date(user.banExpires) > new Date()
						) {
							const banExpiryDate = new Date(
								user.banExpires
							).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							});
							throw new Error(
								`Your account has been banned until ${banExpiryDate}. ${user.banReason ? `Reason: ${user.banReason}` : "Please contact support for more information."}`
							);
						} else if (
							!user.banExpires ||
							new Date(user.banExpires) <= new Date()
						) {
							// Permanent ban or expired ban that wasn't cleared
							if (!user.banExpires) {
								throw new Error(
									`Your account has been permanently banned. ${user.banReason ? `Reason: ${user.banReason}` : "Please contact support for more information."}`
								);
							}
							// Ban has expired - allow login (ban should be cleared separately)
						}
					}
				},
			},
		},
	},
	session: {
		// Optimized cookie caching with longer maxAge to reduce API calls
		cookieCache: {
			enabled: true,
			maxAge: 10 * 60, // 10 minutes - increased to reduce API calls
		},
		// Extended session lifetime with proper refresh strategy
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 30, // 30 minutes - less frequent updates
		// Disable session refresh for better performance
		disableSessionRefresh: false,
		// Fresh session age for sensitive operations
		freshAge: 60 * 10, // 10 minutes - increased to reduce calls
		// Use Redis for session storage to prevent database hits
		...(redisClient && {
			store: {
				async get(sessionId: string) {
					try {
						const cached = await redisClient.get(
							`session:${sessionId}`
						);
						return cached ? JSON.parse(cached) : null;
					} catch (error) {
						console.error("Redis session get error:", error);
						return null;
					}
				},
				async set(sessionId: string, sessionData: any, maxAge: number) {
					try {
						await redisClient.setEx(
							`session:${sessionId}`,
							maxAge,
							JSON.stringify(sessionData)
						);
					} catch (error) {
						console.error("Redis session set error:", error);
					}
				},
				async delete(sessionId: string) {
					try {
						await redisClient.del(`session:${sessionId}`);
					} catch (error) {
						console.error("Redis session delete error:", error);
					}
				},
			},
		}),
	},
	secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	// Advanced cookie configuration for better security and performance
	advanced: {
		cookiePrefix: "edumatch",
		useSecureCookies: process.env.NODE_ENV === "production",
		crossSubDomainCookies: {
			enabled: process.env.NODE_ENV === "production",
			domain: process.env.COOKIE_DOMAIN || undefined, // Set in production
		},
		cookies: {
			session_token: {
				name: "edumatch.session_token",
				attributes: {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax" as const,
					path: "/",
				},
			},
			session_data: {
				name: "edumatch.session_data",
				attributes: {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax" as const,
					path: "/",
				},
			},
		},
		trustedOrigins:
			process.env.NODE_ENV === "production"
				? [
						process.env.BETTER_AUTH_URL || "https://yourdomain.com",
						process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
							"https://yourdomain.com",
					]
				: ["http://localhost:3000"],
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true, // Require email verification for sign-up
		sendResetPassword: async ({
			user,
			url,
			token,
		}: {
			user: { email: string; id: string };
			url: string;
			token: string;
		}) => {
			// Check if account is deactivated or banned before sending password reset
			const accountStatus = await checkAccountStatus(user.email);
			if (accountStatus.isBlocked) {
				throw new Error(accountStatus.errorMessage);
			}

			// Check rate limiting for forgot password requests
			const rateLimitResult = await checkOTPRateLimitByType(
				user.email,
				"forgot-password"
			);

			if (!rateLimitResult.allowed) {
				throw new Error(
					rateLimitResult.message ||
						"Too many password reset requests. Please try again later."
				);
			}

			// Record the attempt
			await recordOTPAttemptByType(user.email, "forgot-password");

			await sendEmail(user.email, url, token);
		},
		resetPasswordTokenExpiresIn: 900, // 15 minutes
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			prompt: "select_account",
			accessType: "offline",
		},
	},
	// emailVerification: {
	//   sendVerificationEmail: async ({ user, url, token }) => {
	//     console.log("Sending verification email to:", user.email);

	//     // Cache verification token in Redis for faster lookup
	//     try {
	//       await redisClient.setEx(`verification:${token}`, 3600, JSON.stringify({
	//         userId: user.id,
	//         email: user.email,
	//         timestamp: Date.now()
	//       }));
	//       console.log("Verification token cached in Redis");
	//     } catch (error) {
	//       console.error("Redis caching error:", error);
	//     }

	//     await sendEmail(user.email, url, token);
	//   },
	//   sendOnSignUp: true, // Automatically send verification email after sign-up
	//   autoSignInAfterVerification: true, // Automatically sign in the user after email verification
	//   expiresIn: 3600, // Email verification link expires in 1 hour
	// }
});

// Auth initialized with Google provider
// Stripe integration: DISABLED (handling manually)
// Stripe secret key available
// Stripe publishable key valid

// Send verification email using nodemailer
async function sendEmail(to: string, url: string, token: string) {
	// Determine email type based on content
	const isOtp = token.length === 6 && /^\d{6}$/.test(token);
	const isReset = url.includes("reset-password") || token.includes("reset");

	let subject: string;
	let html: string;

	if (isOtp) {
		subject = "Your Verification Code";
		html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #126E64; margin: 0; font-size: 28px; font-weight: 600;">Your Verification Code</h1>
        </div>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Please use the following verification code to complete your request:</p>
          <div style="background-color: #ffffff; border: 2px solid #126E64; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #126E64; font-family: 'Courier New', monospace;">
              ${token}
            </div>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">⏱️ This code will expire in 5 minutes.</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">If you did not request this code, please ignore this email.</p>
        </div>
      </div>
    `;
	} else if (isReset) {
		subject = "Reset Your Password";
		html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #126E64; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
        </div>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #126E64; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 500; box-shadow: 0 2px 4px rgba(18, 110, 100, 0.2);">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #126E64; font-size: 13px; word-break: break-all; margin: 10px 0; padding: 10px; background-color: #ffffff; border-radius: 4px; border: 1px solid #e0e0e0;">${url}</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">⏱️ This link will expire in 1 hour for security reasons.</p>
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Need help? Contact our support team.</p>
        </div>
      </div>
    `;
	} else {
		subject = "Verify Your Email Address";
		html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #126E64; margin: 0; font-size: 28px; font-weight: 600;">Welcome! Please Verify Your Email</h1>
        </div>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #126E64; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 500; box-shadow: 0 2px 4px rgba(18, 110, 100, 0.2);">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #126E64; font-size: 13px; word-break: break-all; margin: 10px 0; padding: 10px; background-color: #ffffff; border-radius: 4px; border: 1px solid #e0e0e0;">${url}</p>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">⏱️ This link will expire in 1 hour.</p>
          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">If you did not create an account, please ignore this email.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Need help? Contact our support team.</p>
        </div>
      </div>
    `;
	}

	const transporter = nodeMailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const mailOptions = {
		from: process.env.SMTP_FROM || "noreply@yourdomain.com",
		to,
		subject: subject,
		html: html,
	};

	try {
		await transporter.sendMail(mailOptions);
		// Verification email sent
	} catch (error) {
		// Log error for monitoring
		// eslint-disable-next-line no-console
		console.error("Error sending verification email:", error);
		throw new Error("Failed to send email");
	}
}
