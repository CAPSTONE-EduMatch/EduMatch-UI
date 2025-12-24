/**
 * Client-side message encryption utility using Web Crypto API
 * Note: This requires the encryption key to be available on the client side
 * For better security, consider proxying AppSync messages through server-side API routes
 */

// Encryption algorithm - AES-GCM
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 12 bytes for AES-GCM (recommended)

/**
 * Get encryption key from environment variable
 * In production, this should be handled more securely (e.g., via API route)
 */
async function getEncryptionKey(): Promise<CryptoKey> {
	const keyString = process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY;

	if (!keyString) {
		throw new Error(
			"NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY environment variable is required"
		);
	}

	// Convert hex string to ArrayBuffer, or derive key if not hex
	let keyMaterial: ArrayBuffer;
	if (keyString.length === 64 && /^[0-9a-fA-F]+$/.test(keyString)) {
		// Hex string (64 chars = 32 bytes)
		const keyBytes = new Uint8Array(
			keyString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
		);
		keyMaterial = keyBytes.buffer;
	} else {
		// Hash the key string to get 32 bytes
		const encoder = new TextEncoder();
		const data = encoder.encode(keyString);
		keyMaterial = await crypto.subtle.digest("SHA-256", data);
	}

	// Import the key
	return crypto.subtle.importKey(
		"raw",
		keyMaterial,
		{ name: ALGORITHM },
		false,
		["encrypt", "decrypt"]
	);
}

/**
 * Encrypt message content (client-side)
 * @param plaintext - The message content to encrypt
 * @returns Encrypted string in format: iv:encryptedData (both base64)
 */
export async function encryptMessageClient(plaintext: string): Promise<string> {
	if (!plaintext) {
		return plaintext;
	}

	try {
		const key = await getEncryptionKey();
		const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
		const encoder = new TextEncoder();
		const data = encoder.encode(plaintext);

		const encrypted = await crypto.subtle.encrypt(
			{
				name: ALGORITHM,
				iv: iv,
			},
			key,
			data
		);

		// Convert to base64
		const ivBase64 = btoa(
			Array.from(iv)
				.map((byte) => String.fromCharCode(byte))
				.join("")
		);
		const encryptedBase64 = btoa(
			Array.from(new Uint8Array(encrypted))
				.map((byte) => String.fromCharCode(byte))
				.join("")
		);

		// Return format: iv:encryptedData
		return `${ivBase64}:${encryptedBase64}`;
	} catch (error) {
		console.error("Client encryption error:", error);
		throw new Error("Failed to encrypt message");
	}
}

/**
 * Decrypt message content (client-side)
 * @param encryptedData - The encrypted string in format: iv:encryptedData
 * @returns Decrypted plaintext string
 */
export async function decryptMessageClient(
	encryptedData: string
): Promise<string> {
	if (!encryptedData) {
		return encryptedData;
	}

	// Check if the data is already decrypted (for backward compatibility)
	if (!encryptedData.includes(":")) {
		// Assume it's plaintext (for existing unencrypted messages)
		return encryptedData;
	}

	try {
		const parts = encryptedData.split(":");
		if (parts.length !== 2) {
			// Invalid format, assume plaintext
			console.warn("Invalid encrypted format, treating as plaintext");
			return encryptedData;
		}

		const [ivBase64, encryptedBase64] = parts;
		const key = await getEncryptionKey();

		// Convert from base64
		const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
		const encrypted = Uint8Array.from(atob(encryptedBase64), (c) =>
			c.charCodeAt(0)
		);

		const decrypted = await crypto.subtle.decrypt(
			{
				name: ALGORITHM,
				iv: iv,
			},
			key,
			encrypted
		);

		const decoder = new TextDecoder();
		return decoder.decode(decrypted);
	} catch (error) {
		console.error("Client decryption error:", error);
		// If decryption fails, return the original data (might be plaintext)
		// This allows backward compatibility with unencrypted messages
		return encryptedData;
	}
}

/**
 * Check if a string is encrypted (client-side)
 * @param data - The data to check
 * @returns true if the data appears to be encrypted
 */
export function isEncryptedClient(data: string): boolean {
	if (!data) return false;
	// Encrypted data should have format: iv:encryptedData (2 parts separated by :)
	return data.includes(":") && data.split(":").length === 2;
}
