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

	static async generateEmbedding(text: string): Promise<number[] | null> {
		try {
			const embedding = await this.generateRealEmbedding(text);
			if (embedding) {
				console.log("✅ Real embedding API succeeded");
				return embedding;
			}
		} catch (error) {
			console.error("❌ Real embedding API failed:", error);
		}

		// Return null if API fails - no mock fallback
		return null;
	}

	private static async generateRealEmbedding(
		text: string
	): Promise<number[] | null> {
		try {
			console.log("🌐 Making request to:", this.API_URL);

			const request: EmbeddingRequest = {
				model: "embeddinggemma:300m",
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

		// Subdiscipline - normalize to match program format
		if (formData.interests && formData.interests.length > 0) {
			parts.push(`Subdiscipline: ${formData.interests.join(", ")}`);
		}

		// GPA Requirement - normalize to match program format
		if (formData.gpa || formData.scoreValue) {
			const score = formData.gpa || formData.scoreValue;
			parts.push(`GPA Requirement: ${score}`);
		}

		// Language Requirements - normalize to match program format
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
				parts.push(`Language Requirements: ${languageSkills}`);
			}
		}

		// Country - normalize to match program format
		if (
			formData.favoriteCountries &&
			formData.favoriteCountries.length > 0
		) {
			parts.push(`Country: ${formData.favoriteCountries.join(", ")}`);
		}

		// Degree Level - additional context for matching
		if (formData.degree) {
			parts.push(`Level: ${formData.degree}`);
		}

		return parts.join(". ");
	}
}
