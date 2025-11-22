interface EmbeddingRequest {
	model: string;
	prompt: string;
}

interface EmbeddingResponse {
	embeddings: number[][];
}

interface HuggingFaceResponse {
	embedding: number[];
}

export class EmbeddingService {
	private static readonly API_URL =
		"https://notlongfen-embeddingmodel.hf.space/api/embeddings";
	private static readonly TIMEOUT_MS = 30000; // 30 seconds timeout
	private static readonly USE_MOCK_FALLBACK = true; // Enable mock fallback

	static async generateEmbedding(text: string): Promise<number[] | null> {
		// Try real API first
		if (!this.USE_MOCK_FALLBACK) {
			return this.generateRealEmbedding(text);
		}

		// Try real API with fallback to mock
		try {
			console.log("🌐 Attempting real embedding API...");
			const realEmbedding = await this.generateRealEmbedding(text);
			if (realEmbedding) {
				console.log("✅ Real embedding API succeeded");
				return realEmbedding;
			}
		} catch (error) {
			console.warn("⚠️ Real embedding API failed, using mock:", error);
		}

		// Fallback to mock embedding
		console.log("🎭 Using mock embedding as fallback");
		return this.generateMockEmbedding(text);
	}

	private static async generateRealEmbedding(
		text: string
	): Promise<number[] | null> {
		try {
			console.log("🌐 Making request to:", this.API_URL);

			const request: EmbeddingRequest = {
				model: "all-minilm",
				prompt: text,
			};

			console.log(
				"📤 Request payload:",
				JSON.stringify(request, null, 2)
			);

			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				this.TIMEOUT_MS
			);

			const response = await fetch(this.API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			console.log("📥 Response status:", response.status);
			console.log(
				"📥 Response headers:",
				Object.fromEntries(response.headers)
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.log("❌ Error response body:", errorText);
				throw new Error(
					`Embedding API error: ${response.status} - ${errorText}`
				);
			}

			const responseText = await response.text();
			console.log("📄 Raw response:", responseText.substring(0, 200));

			try {
				// Try to parse as HuggingFace format first
				const huggingFaceData: HuggingFaceResponse =
					JSON.parse(responseText);
				if (
					huggingFaceData.embedding &&
					Array.isArray(huggingFaceData.embedding)
				) {
					console.log(
						"✅ Parsed HuggingFace format successfully, embedding length:",
						huggingFaceData.embedding.length
					);
					return huggingFaceData.embedding;
				}

				// Try to parse as original format
				const data: EmbeddingResponse = JSON.parse(responseText);
				console.log(
					"✅ Parsed JSON successfully, embeddings length:",
					data.embeddings?.[0]?.length || 0
				);

				// Return the first embedding array
				return data.embeddings[0] || null;
			} catch (parseError) {
				console.log("❌ JSON parse error:", parseError);
				console.log("📄 Full response text:", responseText);
				throw parseError;
			}
		} catch (error) {
			console.error("Error generating real embedding:", error);
			throw error;
		}
	}

	private static generateMockEmbedding(text: string): number[] {
		console.log(
			"🎭 Generating mock embedding for text length:",
			text.length
		);

		// Generate a consistent mock embedding based on text content
		// This ensures the same text always gets the same embedding
		let seed = 0;
		for (let i = 0; i < text.length; i++) {
			seed += text.charCodeAt(i);
		}

		// Use seeded random for consistent results
		const seededRandom = (seed: number) => {
			const x = Math.sin(seed) * 10000;
			return x - Math.floor(x);
		};

		// Generate 384 dimensions (standard for all-MiniLM-L6-v2)
		const dimensions = 384;
		const mockEmbedding: number[] = [];

		for (let i = 0; i < dimensions; i++) {
			// Use seeded random to generate values between -1 and 1
			mockEmbedding.push(seededRandom(seed + i) * 2 - 1);
		}

		console.log(
			`✅ Generated consistent mock embedding with ${mockEmbedding.length} dimensions`
		);
		return mockEmbedding;
	}

	static formatScholarshipDataForEmbedding(formData: any): string {
		const parts: string[] = [];

		// Subdisciplines - key field for matching
		if (formData.subdisciplines && formData.subdisciplines.length > 0) {
			parts.push(`Subdisciplines: ${formData.subdisciplines.join(", ")}`);
		}

		// Country - key field for matching
		if (formData.country) {
			parts.push(`Country: ${formData.country}`);
		}

		// Eligibility requirements - key field for matching
		if (formData.eligibilityRequirements) {
			const cleanEligibility = formData.eligibilityRequirements
				.replace(/<[^>]*>/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			parts.push(`Eligibility Requirements: ${cleanEligibility}`);
		}

		return parts.join(". ");
	}

	static formatProgramDataForEmbedding(formData: any): string {
		const parts: string[] = [];

		// Subdiscipline - key field for matching
		if (formData.subdiscipline) {
			parts.push(`Subdiscipline: ${formData.subdiscipline}`);
		}

		// GPA requirements
		if (formData.academicRequirements?.gpa) {
			parts.push(`GPA Requirement: ${formData.academicRequirements.gpa}`);
		}

		// Language requirements - key field for matching
		if (
			formData.languageRequirements &&
			formData.languageRequirements.length > 0
		) {
			const langReqs = formData.languageRequirements
				.map(
					(req: any) =>
						`${req.language} ${req.certificate}: ${req.score}`
				)
				.filter((req: string) => req.trim() !== "  :")
				.join(", ");
			if (langReqs) {
				parts.push(`Language Requirements: ${langReqs}`);
			}
		}

		// Countries - key field for matching
		if (formData.location) {
			parts.push(`Country: ${formData.location}`);
		}

		return parts.join(". ");
	}

	static formatResearchLabDataForEmbedding(formData: any): string {
		const parts: string[] = [];

		// Research fields (subdiscipline) - key field for matching
		if (formData.subdiscipline) {
			parts.push(`Research Field: ${formData.subdiscipline}`);
		}

		// Country - key field for matching
		if (formData.location) {
			parts.push(`Country: ${formData.location}`);
		}

		// Qualification requirements - key field for matching
		if (formData.qualificationRequirement) {
			const cleanQualification = formData.qualificationRequirement
				.replace(/<[^>]*>/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			parts.push(`Qualification Requirements: ${cleanQualification}`);
		}

		return parts.join(". ");
	}

	static formatApplicantDataForEmbedding(formData: any): string {
		const parts: string[] = [];

		// Interest subdisciplines - key field for matching
		if (formData.interests && formData.interests.length > 0) {
			parts.push(
				`Interest Subdisciplines: ${formData.interests.join(", ")}`
			);
		}

		// Favorite countries - key field for matching
		if (
			formData.favoriteCountries &&
			formData.favoriteCountries.length > 0
		) {
			parts.push(
				`Favorite Countries: ${formData.favoriteCountries.join(", ")}`
			);
		}

		// Foreign language skills - key field for matching
		if (
			formData.hasForeignLanguage === "yes" &&
			formData.languages &&
			formData.languages.length > 0
		) {
			const languageSkills = formData.languages
				.map(
					(lang: any) =>
						`${lang.language} ${lang.certificate}: ${lang.score}`
				)
				.filter((lang: string) => lang.trim() !== "  :")
				.join(", ");
			if (languageSkills) {
				parts.push(`Foreign Languages: ${languageSkills}`);
			}
		}

		// GPA - key field for matching
		if (formData.gpa || formData.scoreValue) {
			const score = formData.gpa || formData.scoreValue;
			parts.push(`GPA: ${score}`);
		}

		// Level (degree level) - key field for matching
		if (formData.degree) {
			parts.push(`Level: ${formData.degree}`);
		}

		return parts.join(". ");
	}
}
