import crypto from "crypto";

// Encryption algorithm - AES-256-GCM provides authenticated encryption
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM authentication tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT SECURE for production)
 */
function getEncryptionKey(): Buffer {
	const keyString = process.env.MESSAGE_ENCRYPTION_KEY;

	if (!keyString) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"MESSAGE_ENCRYPTION_KEY environment variable is required in production"
			);
		}
		// Development fallback - warn user
		console.warn(
			"⚠️  MESSAGE_ENCRYPTION_KEY not set. Using default key (NOT SECURE for production)"
		);
		// Use a default key for development (32 bytes)
		return crypto
			.createHash("sha256")
			.update("default-dev-key-change-in-production")
			.digest();
	}

	// Convert hex string to buffer, or hash if not hex
	if (keyString.length === 64 && /^[0-9a-fA-F]+$/.test(keyString)) {
		// Hex string (64 chars = 32 bytes)
		return Buffer.from(keyString, "hex");
	}

	// Hash the key string to get 32 bytes
	return crypto.createHash("sha256").update(keyString).digest();
}

/**
 * Encrypt message content
 * @param plaintext - The message content to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all base64)
 */
export function encryptMessage(plaintext: string): string {
	if (!plaintext) {
		return plaintext;
	}

	try {
		const key = getEncryptionKey();
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

		let encrypted = cipher.update(plaintext, "utf8", "base64");
		encrypted += cipher.final("base64");

		const authTag = cipher.getAuthTag();

		// Return format: iv:authTag:encryptedData (all base64)
		return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
	} catch (error) {
		console.error("Encryption error:", error);
		throw new Error("Failed to encrypt message");
	}
}

/**
 * Decrypt message content
 * @param encryptedData - The encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export function decryptMessage(encryptedData: string): string {
	if (!encryptedData) {
		return encryptedData;
	}

	// Check if the data is already decrypted (for backward compatibility)
	// Encrypted data should have the format: iv:authTag:encryptedData
	if (!encryptedData.includes(":")) {
		// Assume it's plaintext (for existing unencrypted messages)
		return encryptedData;
	}

	try {
		const parts = encryptedData.split(":");
		if (parts.length !== 3) {
			// Invalid format, assume plaintext
			console.warn("Invalid encrypted format, treating as plaintext");
			return encryptedData;
		}

		const [ivBase64, authTagBase64, encrypted] = parts;
		const key = getEncryptionKey();
		const iv = Buffer.from(ivBase64, "base64");
		const authTag = Buffer.from(authTagBase64, "base64");

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted, "base64", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	} catch (error) {
		console.error("Decryption error:", error);
		// If decryption fails, return the original data (might be plaintext)
		// This allows backward compatibility with unencrypted messages
		return encryptedData;
	}
}

/**
 * Check if a string is encrypted
 * @param data - The data to check
 * @returns true if the data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
	if (!data) return false;
	// Encrypted data should have format: iv:authTag:encryptedData (3 parts separated by :)
	return data.includes(":") && data.split(":").length === 3;
}
