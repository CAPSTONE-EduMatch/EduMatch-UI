import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface S3Config {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
}

export class DocumentService {
	private s3Client: S3Client;
	private bucketName: string;

	constructor(config?: S3Config) {
		// Use environment variables or provided config
		const s3Config = config || {
			region: process.env.AWS_REGION || "us-east-1",
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
			bucketName: process.env.AWS_S3_BUCKET_NAME || "edumatch-documents",
		};

		this.s3Client = new S3Client({
			region: s3Config.region,
			credentials: {
				accessKeyId: s3Config.accessKeyId,
				secretAccessKey: s3Config.secretAccessKey,
			},
		});

		this.bucketName = s3Config.bucketName;
	}

	/**
	 * Get a document from S3 bucket
	 */
	async getDocument(documentUrl: string): Promise<ReadableStream | null> {
		try {
			// Extract the S3 key from the URL
			// Assuming URLs are in format: https://bucket.s3.region.amazonaws.com/key
			// or s3://bucket/key
			const s3Key = this.extractS3Key(documentUrl);

			if (!s3Key) {
				throw new Error("Invalid S3 URL format");
			}

			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: s3Key,
			});

			const response = await this.s3Client.send(command);

			if (!response.Body) {
				return null;
			}

			// Convert the response body to a readable stream
			return response.Body as ReadableStream;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error fetching document from S3:", error);
			}
			throw new Error("Failed to fetch document from storage");
		}
	}

	/**
	 * Get a presigned URL for document download (alternative approach)
	 */
	async getPresignedDownloadUrl(
		documentUrl: string,
		expiresIn: number = 3600
	): Promise<string> {
		try {
			const s3Key = this.extractS3Key(documentUrl);

			if (!s3Key) {
				throw new Error("Invalid S3 URL format");
			}

			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: s3Key,
			});

			const signedUrl = await getSignedUrl(this.s3Client, command, {
				expiresIn,
			});

			return signedUrl;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error generating presigned URL:", error);
			}
			throw new Error("Failed to generate document download URL");
		}
	}

	/**
	 * Get document metadata from S3
	 */
	async getDocumentMetadata(documentUrl: string) {
		try {
			const s3Key = this.extractS3Key(documentUrl);

			if (!s3Key) {
				throw new Error("Invalid S3 URL format");
			}

			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: s3Key,
			});

			const response = await this.s3Client.send(command);

			return {
				contentType: response.ContentType,
				contentLength: response.ContentLength,
				lastModified: response.LastModified,
				etag: response.ETag,
			};
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error fetching document metadata:", error);
			}
			throw new Error("Failed to fetch document metadata");
		}
	}

	/**
	 * Extract S3 key from various URL formats
	 */
	private extractS3Key(url: string): string | null {
		try {
			// Handle s3:// protocol
			if (url.startsWith("s3://")) {
				const parts = url.replace("s3://", "").split("/");
				parts.shift(); // Remove bucket name
				return parts.join("/");
			}

			// Handle https://bucket.s3.region.amazonaws.com/key format
			if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
				const urlObj = new URL(url);
				return urlObj.pathname.substring(1); // Remove leading slash
			}

			// Handle direct key (assume it's already a key)
			if (!url.startsWith("http")) {
				return url;
			}

			return null;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Stream document directly for download
	 */
	async streamDocument(documentUrl: string): Promise<{
		stream: ReadableStream;
		contentType: string;
		filename: string;
	}> {
		try {
			const s3Key = this.extractS3Key(documentUrl);

			if (!s3Key) {
				throw new Error("Invalid S3 URL format");
			}

			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: s3Key,
			});

			const response = await this.s3Client.send(command);

			if (!response.Body) {
				throw new Error("Document not found");
			}

			// Extract filename from the S3 key
			const filename = s3Key.split("/").pop() || "document";

			return {
				stream: response.Body as ReadableStream,
				contentType: response.ContentType || "application/octet-stream",
				filename,
			};
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error streaming document:", error);
			}
			throw new Error("Failed to stream document");
		}
	}
}

// Singleton instance
let documentService: DocumentService | null = null;

export function getDocumentService(): DocumentService {
	if (!documentService) {
		documentService = new DocumentService();
	}
	return documentService;
}
