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
	 * For dense embedding models (like all-minilm), similarity scores typically range from 0.5 to 1.0
	 * We map this realistic range to a more intuitive 0-100% scale:
	 *
	 * Cosine similarity mapping (adjusted for embedding model behavior):
	 * < 0.5 = very poor match → 0%
	 * 0.5 = baseline/random match → 0%
	 * 0.6-0.7 = weak match → 20-40%
	 * 0.7-0.8 = moderate match → 40-60%
	 * 0.8-0.9 = good match → 60-80%
	 * 0.9-0.95 = strong match → 80-90%
	 * > 0.95 = excellent match → 90-100%
	 */
	static similarityToMatchPercentage(similarity: number): string {
		// Clamp similarity to [0, 1] range (negative values are rare with embeddings)
		const clampedSimilarity = Math.max(0, Math.min(1, similarity));

		// Adjust the range: map [0.5, 1.0] to [0, 100]
		// Anything below 0.5 is considered 0% match
		if (clampedSimilarity < 0.5) {
			return "0%";
		}

		// Linear mapping from [0.5, 1.0] to [0, 100]
		// Formula: (similarity - 0.5) * 200
		// 0.5 → 0%, 0.75 → 50%, 1.0 → 100%
		const percentage = (clampedSimilarity - 0.5) * 200;

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
