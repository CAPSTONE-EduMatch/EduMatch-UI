import {
	emailOTPClient,
	oneTapClient,
	adminClient,
	customSessionClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import type { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [
		oneTapClient({
			clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
			// Optional client configuration:
			autoSelect: false,
			cancelOnTapOutside: true,
			context: "signin",
			additionalOptions: {
				// Use newer FedCM API to reduce warnings
				use_fedcm_for_prompt: true,
				// Reduce message channel errors
				ux_mode: "popup",
			},
			// Configure prompt behavior and exponential backoff:
			promptOptions: {
				baseDelay: 2000, // Increased delay to reduce rapid attempts
				maxAttempts: 3, // Reduced attempts to prevent message channel errors
			},
		}),
		emailOTPClient(),
		stripeClient({
			subscription: true,
		}),
		adminClient(),
		// Custom session client for optimized responses
		customSessionClient<typeof auth>(),
	],

	/** The base URL of the server (optional if you're using the same domain) */
	baseURL:
		process.env.NODE_ENV === "production"
			? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
				"https://yourdomain.com"
			: "http://localhost:3000",
});
