import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, oneTap } from "better-auth/plugins";
import dotenv from "dotenv";
import nodeMailer from "nodemailer";
import Stripe from "stripe";
import { prismaClient } from "../../../prisma/index";
import { checkOTPRateLimit, recordOTPAttempt } from "./otp-rate-limit";
import { redisClient } from "./redis";
dotenv.config();

// const stripeClient =
//   process.env.STRIPE_SECRET_KEY &&
//   !process.env.STRIPE_SECRET_KEY.includes("GET_THIS_FROM")
//     ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
//         apiVersion: "2025-08-27.basil",
//       })
//     : "";
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-08-27.basil",
});

export const auth = betterAuth({
	plugins: [
		oneTap(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				// Check rate limiting before sending OTP
				const rateLimitResult = await checkOTPRateLimit(email);

				if (!rateLimitResult.allowed) {
					throw new Error(
						rateLimitResult.message ||
							"Too many OTP requests. Please try again later."
					);
				}

				// Record the attempt
				await recordOTPAttempt(email);

				// Send OTP via email using our sendEmail function
				await sendEmail(email, "", otp);
			},
		}),
		// Stripe plugin disabled - handling subscriptions manually
		// ...(stripeClient && process.env.STRIPE_WEBHOOK_SECRET && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('GET_THIS_FROM') ? [
		//   stripe({
		//     stripeClient,
		//     stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
		//     createCustomerOnSignUp: false, // Don't create subscriptions on signup
		//     subscription: {
		//       enabled: false, // Disable automatic subscription management
		//       plans: [] // Empty plans when disabled
		//     }
		//   })
		// ] : [])
		stripe({
			stripeClient,
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			createCustomerOnSignUp: true,
			subscription: {
				enabled: true,
				plans: [
					{
						name: "basic",
						priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
						//  annualDiscountPriceId:
						// limits
					},
				],
			},
		}),
	],
	database: prismaAdapter(prismaClient, {
		provider: "postgresql",
	}),
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
	},
	// Redis as secondary storage for session caching
	secondaryStorage: {
		get: async (key: string) => {
			try {
				return await redisClient.get(key);
			} catch (error) {
				console.error("Redis get error:", error);
				return null;
			}
		},
		set: async (key: string, value: string, ttl?: number) => {
			try {
				if (ttl) {
					await redisClient.setEx(key, ttl, value);
				} else {
					await redisClient.set(key, value);
				}
			} catch (error) {
				console.error("Redis set error:", error);
			}
		},
		delete: async (key: string) => {
			try {
				await redisClient.del(key);
			} catch (error) {
				console.error("Redis delete error:", error);
			}
		},
	},
	secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true, // Require email verification for sign-up
		sendResetPassword: async ({ user, url, token }) => {
			// Check rate limiting for forgot password requests
			const rateLimitResult = await checkOTPRateLimit(user.email);

			if (!rateLimitResult.allowed) {
				throw new Error(
					rateLimitResult.message ||
						"Too many password reset requests. Please try again later."
				);
			}

			// Record the attempt
			await recordOTPAttempt(user.email);

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
		resetPasswordTokenExpiresIn: 3600, // 1 hour
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

console.log(
	"Auth initialized with Google provider:",
	!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
);
console.log("Stripe integration: DISABLED (handling manually)");
console.log(
	"Stripe secret key available:",
	!!process.env.STRIPE_SECRET_KEY &&
		!process.env.STRIPE_SECRET_KEY.includes("GET_THIS_FROM")
);
console.log(
	"Stripe publishable key valid:",
	!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
		!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes(
			"GET_THIS_FROM"
		)
);

// Send verification email using nodemailer
async function sendEmail(to: string, url: string, token: string) {
	// Determine email type based on content
	const isOtp = token.length === 6 && /^\d{6}$/.test(token);
	const isReset = url.includes("reset-password") || token.includes("reset");
	const isVerify = !isOtp && !isReset;

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
		console.log("Verification email sent to", to);
	} catch (error) {
		console.error("Error sending verification email:", error);
	}
}
