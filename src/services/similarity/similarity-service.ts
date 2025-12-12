/**
 * Service for calculating similarity between applicant profiles and posts
 */

interface SimilarityCalculationOptions {
	applicantEmbedding: number[];
	postEmbedding: number[];
}

export class SimilarityService {
	/**
	 * Calculate cosine similarity between two vectors
	 */
	static calculateCosineSimilarity(
		vectorA: number[],
		vectorB: number[]
	): number {
		if (
			!vectorA ||
			!vectorB ||
			vectorA.length === 0 ||
			vectorB.length === 0
		) {
			return 0;
		}

		if (vectorA.length !== vectorB.length) {
			console.warn(
				`Vector length mismatch: ${vectorA.length} vs ${vectorB.length}`
			);
			return 0;
		}

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < vectorA.length; i++) {
			dotProduct += vectorA[i] * vectorB[i];
			normA += vectorA[i] * vectorA[i];
			normB += vectorB[i] * vectorB[i];
		}

		normA = Math.sqrt(normA);
		normB = Math.sqrt(normB);

		if (normA === 0 || normB === 0) {
			return 0;
		}

		return dotProduct / (normA * normB);
	}

	/**
	 * Calculate match percentage from cosine similarity
	 *
	 * For dense embedding models (embeddinggemma:300m, all-minilm), similarity scores
	 * typically range from 0.3 to 1.0. We map this realistic range to 0-100% scale:
	 *
	 * Cosine similarity mapping (adjusted for dense embedding behavior):
	 * < 0.3 = very poor match / unrelated → 0%
	 * 0.3 = baseline/low match → 0%
	 * 0.4 = weak match → ~14%
	 * 0.5 = moderate match → ~29%
	 * 0.6 = fair match → ~43%
	 * 0.7 = good match → ~57%
	 * 0.8 = strong match → ~71%
	 * 0.9 = very strong match → ~86%
	 * 1.0 = perfect match → 100%
	 */
	static similarityToMatchPercentage(similarity: number): string {
		// Clamp similarity to [0, 1] range
		const clampedSimilarity = Math.max(0, Math.min(1, similarity));

		// Filter out very poor matches: anything below 0.3 is considered 0% match
		if (clampedSimilarity < 0.3) {
			return "0%";
		}

		// Linear mapping from [0.3, 1.0] to [0, 100]
		// Formula: (similarity - 0.3) / 0.7 * 100
		// 0.3 → 0%, 0.65 → 50%, 1.0 → 100%
		const percentage = ((clampedSimilarity - 0.3) / 0.7) * 100;

		// Round to nearest integer
		return `${Math.round(percentage)}%`;
	}

	/**
	 * Calculate match score for multiple posts against an applicant
	 */
	static calculateMatchScores(
		applicantEmbedding: number[],
		posts: Array<{ id: string; embedding?: number[] | null }>
	): Record<string, string> {
		const matchScores: Record<string, string> = {};

		if (!applicantEmbedding || applicantEmbedding.length === 0) {
			// If no applicant embedding, return 0%
			posts.forEach((post) => {
				matchScores[post.id] = "0%";
			});
			return matchScores;
		}

		posts.forEach((post) => {
			if (post.embedding && Array.isArray(post.embedding)) {
				try {
					const similarity = this.calculateCosineSimilarity(
						applicantEmbedding,
						post.embedding
					);
					matchScores[post.id] =
						this.similarityToMatchPercentage(similarity);
				} catch (error) {
					console.warn(
						`Failed to calculate similarity for post ${post.id}:`,
						error
					);
					matchScores[post.id] = "0%"; // No valid calculation possible
				}
			} else {
				// No embedding available for post, cannot calculate similarity
				matchScores[post.id] = "0%";
			}
		});

		return matchScores;
	}

	/**
	 * Sort posts by similarity score (descending)
	 */
	static sortByMatchScore<T extends { id: string; match: string }>(
		items: T[]
	): T[] {
		return [...items].sort((a, b) => {
			const matchA = parseFloat(a.match.replace("%", ""));
			const matchB = parseFloat(b.match.replace("%", ""));
			return matchB - matchA; // Descending order (highest match first)
		});
	}
}
