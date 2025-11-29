import { Mistral } from "@mistralai/mistralai";

export interface OCRResult {
	success: boolean;
	extractedText?: string;
	error?: string;
	confidence?: number;
}

export interface OCRDocument {
	type: "document_url" | "image_url" | "image_base64";
	documentUrl?: string;
	imageUrl?: string;
	imageBase64?: string;
}

class MistralOCRService {
	private client: Mistral | null = null;
	private isEnabled: boolean = false;

	constructor() {
		this.initializeClient();
	}

	private initializeClient() {
		try {
			const apiKey = process.env.NEXT_PUBLIC_MISTRAL_OCR_API_KEY;
			const isEnabled =
				process.env.NEXT_PUBLIC_MISTRAL_OCR_ENABLED === "true";

			if (!apiKey || !isEnabled) {
				console.warn("Mistral OCR: API key not found or OCR disabled");
				this.isEnabled = false;
				return;
			}

			this.client = new Mistral({ apiKey });
			this.isEnabled = true;
			console.log("✅ Mistral OCR service initialized successfully");
		} catch (error) {
			console.error(
				"❌ Failed to initialize Mistral OCR service:",
				error
			);
			this.isEnabled = false;
		}
	}

	/**
	 * Check if OCR service is available
	 */
	public isOCREnabled(): boolean {
		return this.isEnabled && this.client !== null;
	}

	/**
	 * Upload file to Mistral Cloud for OCR processing
	 */
	private async uploadFile(
		file: File
	): Promise<{ id: string; signedUrl: string } | null> {
		if (!this.client) throw new Error("Mistral client not initialized");

		try {
			// Convert File to buffer for upload
			const arrayBuffer = await file.arrayBuffer();
			const buffer = new Uint8Array(arrayBuffer);

			// Upload file to Mistral Cloud
			const uploadedFile = await this.client.files.upload({
				file: {
					fileName: file.name,
					content: buffer,
				},
				purpose: "ocr",
			});

			// Get signed URL for OCR processing
			const signedUrl = await this.client.files.getSignedUrl({
				fileId: uploadedFile.id,
			});

			return {
				id: uploadedFile.id,
				signedUrl: signedUrl.url,
			};
		} catch (error) {
			console.error("❌ Failed to upload file to Mistral:", error);
			throw error;
		}
	}

	/**
	 * Convert file to base64 for direct OCR
	 */
	private async fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result as string;
				// Remove data URL prefix (e.g., "data:image/jpeg;base64,")
				const base64Data = base64.split(",")[1];
				resolve(base64Data);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Process OCR for PDF files
	 */
	public async processPDF(file: File): Promise<OCRResult> {
		if (!this.isOCREnabled()) {
			return { success: false, error: "OCR service not available" };
		}

		try {
			console.log(`🔄 Processing PDF OCR for: ${file.name}`);

			// Upload PDF to Mistral Cloud
			const uploadResult = await this.uploadFile(file);
			if (!uploadResult) {
				throw new Error("Failed to upload PDF file");
			}

			// Process OCR with signed URL
			const ocrResponse = await this.client!.ocr.process({
				model: "mistral-ocr-latest",
				document: {
					type: "document_url",
					documentUrl: uploadResult.signedUrl,
				},
				includeImageBase64: false, // We don't need image data for text extraction
			});
			console.log("OCR Response:", ocrResponse);

			// Clean up uploaded file
			try {
				await this.client!.files.delete({ fileId: uploadResult.id });
			} catch (deleteError) {
				console.warn("⚠️ Failed to delete uploaded file:", deleteError);
			}

			// Extract text from OCR response
			const extractedText = this.extractTextFromResponse(ocrResponse);

			return {
				success: true,
				extractedText,
				confidence: 0.9, // Mistral doesn't provide confidence scores, using default
			};
		} catch (error) {
			console.error("❌ PDF OCR processing failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "PDF OCR processing failed",
			};
		}
	}

	/**
	 * Process OCR for image files
	 */
	public async processImage(file: File): Promise<OCRResult> {
		if (!this.isOCREnabled()) {
			return { success: false, error: "OCR service not available" };
		}

		try {
			console.log(`🔄 Processing Image OCR for: ${file.name}`);

			// Upload image to Mistral Cloud
			const uploadResult = await this.uploadFile(file);
			if (!uploadResult) {
				throw new Error("Failed to upload image file");
			}

			// Process OCR with signed URL
			const ocrResponse = await this.client!.ocr.process({
				model: "mistral-ocr-latest",
				document: {
					type: "image_url",
					imageUrl: uploadResult.signedUrl,
				},
				includeImageBase64: false,
			});

			// Clean up uploaded file
			try {
				await this.client!.files.delete({ fileId: uploadResult.id });
			} catch (deleteError) {
				console.warn("⚠️ Failed to delete uploaded file:", deleteError);
			}

			// Extract text from OCR response
			const extractedText = this.extractTextFromResponse(ocrResponse);

			return {
				success: true,
				extractedText,
				confidence: 0.9, // Mistral doesn't provide confidence scores, using default
			};
		} catch (error) {
			console.error("❌ Image OCR processing failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Image OCR processing failed",
			};
		}
	}

	/**
	 * Process OCR for images using image URL
	 */
	public async processImageFromURL(imageUrl: string): Promise<OCRResult> {
		if (!this.isOCREnabled()) {
			return { success: false, error: "OCR service not available" };
		}

		try {
			console.log(`🔄 Processing Image OCR from URL: ${imageUrl}`);

			// Process OCR with image URL
			const ocrResponse = await this.client!.ocr.process({
				model: "mistral-ocr-latest",
				document: {
					type: "image_url",
					imageUrl: imageUrl,
				},
				includeImageBase64: false,
			});

			// Extract text from OCR response
			const extractedText = this.extractTextFromResponse(ocrResponse);

			return {
				success: true,
				extractedText,
				confidence: 0.9, // Mistral doesn't provide confidence scores, using default
			};
		} catch (error) {
			console.error("❌ Image URL OCR processing failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Image URL OCR processing failed",
			};
		}
	}

	/**
	 * Extract text content from Mistral OCR response
	 */
	private extractTextFromResponse(response: any): string {
		try {
			console.log("🔍 Extracting text from response:", response);

			// Check if response has pages array (new Mistral OCR format)
			if (response.pages && Array.isArray(response.pages)) {
				let extractedText = "";

				for (const page of response.pages) {
					console.log("🔍 Processing page:", page);

					// Try different possible text fields in the page
					if (page.markdown) {
						extractedText += page.markdown + "\n";
						console.log(
							"🔍 Found text in markdown field, length:",
							page.markdown.length
						);
					} else if (page.content) {
						extractedText += page.content + "\n";
					} else if (page.text) {
						extractedText += page.text + "\n";
					} else if (page.extractedText) {
						extractedText += page.extractedText + "\n";
					} else if (page.blocks && Array.isArray(page.blocks)) {
						// Process blocks within page
						for (const block of page.blocks) {
							if (block.text) {
								extractedText += block.text + "\n";
							} else if (block.content) {
								extractedText += block.content + "\n";
							}
						}
					} else {
						// Log the page structure to understand format
						console.log("🔍 Page structure:", Object.keys(page));
					}
				}

				const trimmedText = extractedText.trim();
				if (trimmedText) {
					console.log(
						"✅ Successfully extracted text from pages:",
						trimmedText.substring(0, 200)
					);
					return trimmedText;
				}
			}

			// Fallback: Check for other possible response structures
			if (response.text) {
				return response.text;
			}

			if (response.content) {
				return response.content;
			}

			if (response.choices && response.choices[0]?.message?.content) {
				return response.choices[0].message.content;
			}

			// If response structure is different, try to extract text from the response
			if (typeof response === "string") {
				return response;
			}

			console.warn("⚠️ Unknown OCR response structure:", {
				responseKeys: Object.keys(response),
				response: response,
			});
			return "";
		} catch (error) {
			console.error(
				"❌ Failed to extract text from OCR response:",
				error
			);
			return "";
		}
	}

	/**
	 * Process OCR based on file type
	 */
	public async processFile(file: File): Promise<OCRResult> {
		if (!this.isOCREnabled()) {
			return { success: false, error: "OCR service not available" };
		}

		const fileType = file.type.toLowerCase();

		// Check if file is supported
		if (!this.isSupportedFileType(file)) {
			return {
				success: false,
				error: "Unsupported file type. Only PDF and image files are supported.",
			};
		}

		try {
			if (fileType === "application/pdf") {
				return await this.processPDF(file);
			} else if (fileType.startsWith("image/")) {
				return await this.processImage(file);
			} else {
				return {
					success: false,
					error: "Unsupported file type",
				};
			}
		} catch (error) {
			console.error("❌ OCR processing failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "OCR processing failed",
			};
		}
	}

	/**
	 * Check if file type is supported for OCR
	 */
	public isSupportedFileType(file: File): boolean {
		const supportedTypes = [
			"application/pdf",
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/bmp",
			"image/webp",
		];

		return supportedTypes.includes(file.type.toLowerCase());
	}

	/**
	 * Get file size limit for OCR processing (in bytes)
	 */
	public getFileSizeLimit(): number {
		return 10 * 1024 * 1024; // 10MB limit
	}

	/**
	 * Validate file for OCR processing
	 */
	public validateFile(file: File): { valid: boolean; error?: string } {
		if (!this.isSupportedFileType(file)) {
			return {
				valid: false,
				error: "Unsupported file type. Only PDF and image files are supported.",
			};
		}

		if (file.size > this.getFileSizeLimit()) {
			return {
				valid: false,
				error: "File size exceeds 10MB limit.",
			};
		}

		return { valid: true };
	}
}

// Export singleton instance
export const mistralOCRService = new MistralOCRService();
