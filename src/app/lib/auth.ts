import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, oneTap } from "better-auth/plugins";
import dotenv from "dotenv";
import nodeMailer from "nodemailer";
import Stripe from "stripe";
import { prismaClient } from "../../../prisma/index";
import { redisClient } from "./redis";
dotenv.config();

// const stripeClient =
//   process.env.STRIPE_SECRET_KEY &&
//   !process.env.STRIPE_SECRET_KEY.includes("GET_THIS_FROM")
//     ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
//         apiVersion: "2025-08-27.basil",
//       })
//     : "";
const stripeClient =  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
})

export const auth = betterAuth({
  plugins: [
    oneTap(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`Sending OTP ${otp} to ${email} for ${type}`);
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
        plans: [{
           name: "basic",
           priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
          //  annualDiscountPriceId:
          // limits
          
        }]
      }
    }),
  ],
  database: prismaAdapter(prismaClient, {
    provider: "postgresql",
  }),
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
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("GET_THIS_FROM")
);

// Send verification email using nodemailer
async function sendEmail(to: string, url: string, token: string) {
  //otp or url case
  const isOtp = token.length === 6;
  const subject = isOtp ? "Your OTP Code" : "Verify your email address";
  const html = isOtp
    ? `<p>Your OTP code is: <strong>${token}</strong></p>`
    : `<p>Hello,</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${url}">Verify Email</a></p>
      <p>If you did not request this, please ignore this email.</p>`;

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
