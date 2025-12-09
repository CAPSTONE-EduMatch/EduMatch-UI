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
			async sendVerificationOTP({
				email,
				otp,
				type,
			}: {
				email: string;
				otp: string;
				type: string;
			}) {
				// Check if account is deactivated or banned before sending OTP
				const accountStatus = await checkAccountStatus(email);
				if (accountStatus.isBlocked) {
					throw new Error(accountStatus.errorMessage);
				}

				// Determine OTP type based on the type parameter
				let otpType: OTPType = "email-verification"; // default
				if (type === "sign-up") {
					otpType = "signup";
				} else if (type === "email-verification") {
					otpType = "email-verification";
				}

				// Check rate limiting before sending OTP
				const rateLimitResult = await checkOTPRateLimitByType(
					email,
					otpType
				);

				if (!rateLimitResult.allowed) {
					throw new Error(
						rateLimitResult.message ||
							"Too many OTP requests. Please try again later."
					);
				}

				// Record the attempt
				await recordOTPAttemptByType(email, otpType);

				// Send OTP via email using our sendEmail function
				await sendEmail(email, "", otp);
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
							"price_1SFXgR1f58RNYg0098jAKotV",
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
							"price_1S4fZ61f58RNYg00FWakIrLm",
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
							"price_1InstitutionMonthly",
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
							"price_1InstitutionYearly",
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
					session,
					referenceId,
					action,
				}) => {
					console.log(
						"Authorizing action:",
						action,
						"for user:",
						user.id
					);
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
							console.log(
								"Subscription found for authorization:",
								subscription
							);

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
					// Log detailed info for testing
					// eslint-disable-next-line no-console
					console.log(
						"🎉 [Better-auth] onSubscriptionComplete FIRED!"
					);
					// eslint-disable-next-line no-console
					console.log(
						"📋 Subscription data:",
						JSON.stringify(subscription, null, 2)
					);
					// eslint-disable-next-line no-console
					console.log("📦 Plan data:", JSON.stringify(plan, null, 2));

					// Update subscription in database when payment is complete
					try {
						const stripeSubscription = subscription as any;
						const userId = stripeSubscription.userId;

						// eslint-disable-next-line no-console
						console.log("👤 User ID from subscription:", userId);

						// Create invoice record from subscription
						// This is crucial - Better Auth doesn't create invoices automatically
						try {
							const { createInvoiceFromSubscription } =
								await import("@/services/payments/invoice-service");
							await createInvoiceFromSubscription(
								stripeSubscription.stripeSubscriptionId
							);
							// eslint-disable-next-line no-console
							console.log(
								"✅ Invoice created for subscription:",
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

							// eslint-disable-next-line no-console
							console.log(
								"🔍 Existing subscription found:",
								existingSub ? "YES" : "NO"
							);

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
								// eslint-disable-next-line no-console
								console.log(
									"✅ Subscription UPDATED in database"
								);
							} else {
								// Create new subscription
								const newSub =
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
											periodEnd:
												stripeSubscription.periodEnd
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
								// eslint-disable-next-line no-console
								console.log(
									"✅ Subscription CREATED in database with ID:",
									newSub.id
								);
							}
						} else {
							// eslint-disable-next-line no-console
							console.warn(
								"⚠️ No userId found in subscription data"
							);
						}
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"❌ Error updating subscription on completion:",
							error
						);
					}

					// Log subscription completion for debugging
					if (process.env.NODE_ENV === "development") {
						// eslint-disable-next-line no-console
						console.log(
							`✅ Subscription ${subscription.id} completed for plan ${plan.name}`
						);
					}
				},
				onSubscriptionUpdate: async ({ subscription }) => {
					// eslint-disable-next-line no-console
					console.log("🔄 [Better-auth] onSubscriptionUpdate FIRED!");
					// eslint-disable-next-line no-console
					console.log(
						"📋 Subscription data:",
						JSON.stringify(subscription, null, 2)
					);

					// Update subscription in database
					try {
						const stripeSubscription = subscription as any;

						const result =
							await prismaClient.subscription.updateMany({
								where: {
									stripeSubscriptionId:
										stripeSubscription.stripeSubscriptionId,
								},
								data: {
									status: stripeSubscription.status,
									periodStart: stripeSubscription.periodStart
										? new Date(
												stripeSubscription.periodStart
											)
										: null,
									periodEnd: stripeSubscription.periodEnd
										? new Date(stripeSubscription.periodEnd)
										: null,
									cancelAtPeriodEnd:
										stripeSubscription.cancelAtPeriodEnd ||
										false,
								},
							});

						// eslint-disable-next-line no-console
						console.log(
							`✅ Updated ${result.count} subscription(s) in database`
						);
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"❌ Error updating subscription on update:",
							error
						);
					}

					// Log subscription update for debugging
					if (process.env.NODE_ENV === "development") {
						// eslint-disable-next-line no-console
						console.log(
							`✅ Subscription ${subscription.id} updated`
						);
					}
				},
				onSubscriptionCancel: async ({ subscription }) => {
					// eslint-disable-next-line no-console
					console.log("❌ [Better-auth] onSubscriptionCancel FIRED!");
					// eslint-disable-next-line no-console
					console.log(
						"📋 Subscription data:",
						JSON.stringify(subscription, null, 2)
					);

					// Update subscription status in database
					try {
						const stripeSubscription = subscription as any;

						const result =
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

						// eslint-disable-next-line no-console
						console.log(
							`✅ Canceled ${result.count} subscription(s) in database`
						);
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"❌ Error updating subscription on cancellation:",
							error
						);
					}

					// Log subscription cancellation for debugging
					if (process.env.NODE_ENV === "development") {
						// eslint-disable-next-line no-console
						console.log(
							`✅ Subscription ${subscription.id} canceled`
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

			await sendEmail(
				user.email,
				`Reset your password: Click the link to reset your password: ${url}
		And this is your token: ${token}
		${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/forgot-password?token=${token}
		`,
				// `
				// Click the link to reset your password: ${url}
				// And this is your token: ${token}
				// ${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/forgot-password?token=${token}
				// `
				``
			);
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
		subject = "Your OTP Code";
		html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Verification Code</h2>
        <p>Your OTP code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${token}
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #666;">If you did not request this code, please ignore this email.</p>
      </div>
    `;
	} else if (isReset) {
		subject = "Reset Your Password";
		html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #007cba; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${url}</p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;
	} else {
		subject = "Verify Your Email Address";
		html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome! Please Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${url}</p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666;">If you did not create an account, please ignore this email.</p>
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
