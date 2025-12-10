interface MistralRequest {
	model: string;
	messages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}>;
	temperature?: number;
	max_tokens?: number;
}

interface MistralResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface FileValidationResult {
	isValid: boolean;
	confidence: number;
	reasoning: string;
	suggestions?: string[];
	// action: 'accept' means file is valid and downstream can proceed;
	// 'reupload' means file is not valid and user should re-upload a better file
	action?: "accept" | "reupload";
	// optional structured output when action === 'accept'
	output?: any;
}

export class OllamaFileValidationService {
	// Use Mistral AI API instead of Ollama
	private static readonly API_URL =
		"https://api.mistral.ai/v1/chat/completions";
	private static readonly API_KEY =
		process.env.NEXT_PUBLIC_MISTRAL_OCR_API_KEY;

	private static getValidationPrompt(
		expectedFileType: string,
		extractedText: string
	): { systemMessage: string; userMessage: string } {
		const fileTypeInstructions = {
			"application-documents": `You are a STRICT application document validator. Analyze the provided text and determine whether the document is appropriate for inclusion in an application (supporting documents such as CVs, transcripts, certificates, letters) and DOES NOT contain sensitive personal data.

A valid application document for public upload should:
- Contain only information necessary for assessment (e.g., name, education, qualifications) and NOT include highly sensitive personal data such as full national ID numbers, passport numbers, full credit card numbers, bank account numbers, private medical records, or other personally identifying data.
- Be relevant to the application (e.g., CV, transcript, certificate, recommendation letter) and contain content that matches the expected document type.

Be conservative:
- If the document contains or appears to contain any sensitive personal data (IDs, passport numbers, SSNs, full card numbers, bank account details, un-redacted medical information), you MUST treat it as INVALID and set "isValid": false and "action": "reupload".
- If you are NOT clearly sure that the document is appropriate for an application or it contains extraneous or sensitive content, treat it as INVALID.`,
			"cv-resume": `You are a STRICT CV/Resume validation expert. Analyze the provided text and determine if it's a real CV/Resume document for a person applying for jobs.

A valid CV/Resume should contain, at minimum:
- Personal information (name, contact details like email or phone)
- Work experience or employment history OR education background
- Some indication of skills, competencies, or a professional profile

Be conservative:
- If you are NOT clearly sure that this is a CV/Resume, you MUST treat it as invalid.
- If the text looks like an essay, webpage, article, random text, or anything not clearly structured as a CV/Resume, it is INVALID.
- If the text is too short, noisy, or cannot be reliably interpreted as a CV/Resume, it is INVALID.`,

			"language-certificates": `You are a STRICT language certificate validation expert. Analyze the provided text and determine if it's a language proficiency certificate.

A valid language certificate should contain:
- Test name (e.g., IELTS, TOEFL, TOEIC, HSK, JLPT, TOPIK, etc.)
- Test scores or proficiency levels (band score, points, level, grade)
- Test date or issue date
- Candidate name
- Official certification or issuing authority (organization, institution, logo, or stamp)

Be conservative:
- If key certificate elements (test name, score/level, candidate name) are missing or unclear, treat the document as INVALID.
- If the document looks like instructions, an article, or anything other than an official certificate, it is INVALID.
- If you are not clearly sure, you MUST treat it as invalid.`,

			"degree-certificates": `You are a STRICT academic degree certificate validation expert. Analyze the provided text and determine if it's a degree/diploma certificate.

A valid degree certificate should contain:
- Degree type (e.g., Bachelor's, Master's, PhD, Diploma)
- Field of study / major
- University or institution name
- Graduation date or date of issue
- Student name
- Some indication of official status (seal, signature, stamp, or certificate wording)

Be conservative:
- If the document looks like a transcript, generic letter, or any non-certificate text, treat it as INVALID.
- If core fields like degree type, institution, or student name are missing or unclear, treat it as INVALID.
- If you are not clearly sure, you MUST treat it as invalid.`,

			"academic-transcripts": `You are a STRICT academic transcript validation expert. Analyze the provided text and determine if it's an academic transcript.

A valid academic transcript should contain:
- A list of courses or subjects
- Grades or marks for each course
- Some indication of academic periods / semesters / terms
- Possibly an overall GPA, cumulative grade, or academic summary
- Student name (and ideally student ID)
- Institution name (school, university, or college)

Be conservative:
- If the document looks like a certificate, letter, or general description without detailed course/grade information, treat it as INVALID.
- If there is no clear list of subjects with corresponding marks/grades, it is INVALID.
- If you are not clearly sure, you MUST treat it as invalid.`,

			"institution-verification": `You are an institution verification document expert. Analyze the provided text and determine if it's a valid institution verification document.

A valid institution verification document should contain AT LEAST 2 of these elements:

Primary elements (any 2):
- The institution's official name (university, scholarship provider, government agency, research lab, testing lab, accreditation body, or any formal organization)
- Official identifiers (registration number, certificate number, accreditation ID, reference code)
- Official institution markers (letterhead, logo/emblem, seal/stamp, authorized signature)
- A formal statement from the institution (verification, certification, authentication, approval, or official confirmation)
- Contact information (address, phone, email, or website)

Be reasonable:
- Accept documents that show clear institutional affiliation even if some elements are missing
- Documents from universities, scholarship bodies, government offices, research labs, testing labs, certification bodies, or other recognized institutions are acceptable if they show official nature
- Only treat as INVALID if the document is clearly:
  • an advertisement, brochure, flyer, or commercial product sheet WITHOUT institutional context
  • completely missing institutional identity
  • purely personal content with no official markers
- If the document shows reasonable evidence of being from an official institution, accept it even if not all elements are present
- Give the benefit of the doubt to documents that appear official`,

			"research-papers": `You are a STRICT research paper validation expert. Analyze the provided text and determine if it is a formal academic research paper (journal article, conference paper, workshop paper, or thesis-like document).

A valid research paper should typically contain:
- A clear title of the paper
- Author name(s) (and often affiliation and/or email)
- An abstract or summary of the work
- Structured sections such as: Introduction, Background / Related Work, Methodology / Methods, Experiments / Results, Discussion / Analysis, Conclusion
- References or Bibliography section, with cited works (numbered or author-year style)
- Academic writing style (objective tone, technical terminology, citation markers like [1], (Smith, 2020), etc.)

Be conservative:
- If the text looks like a blog post, news article, marketing copy, simple homework answer, slides, or general essay, it is INVALID.
- If there is no clear abstract and no references section, it is LIKELY INVALID as a formal research paper (unless the text is clearly a short paper but still has structured sections and citations).
- If you cannot identify any typical research structure (e.g. Introduction/Method/Results/Conclusion) and citations, you MUST treat it as INVALID.
- If you are NOT clearly sure that this is a formal research paper, you MUST treat it as INVALID.`,
		};

		const instruction =
			fileTypeInstructions[
				expectedFileType as keyof typeof fileTypeInstructions
			] || fileTypeInstructions["cv-resume"];

		const snippet =
			extractedText.length > 4000
				? extractedText.substring(0, 4000) + "...(truncated)"
				: extractedText;

		return {
			systemMessage: `${instruction}

You are validating a document of type: "${expectedFileType}".

Use the instructions above to decide whether this document is a valid instance of that type.
If the document clearly does NOT meet the required criteria, or you are not sure, you MUST treat it as invalid and set:
"isValid": false
"action": "reupload"

Your response MUST be a valid JSON object with this exact structure:
{
  "isValid": boolean,
  "action": "accept" or "reupload", 
  "confidence": number between 0 and 1,
  "reasoning": "string",
  "suggestions": ["string1", "string2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is valid.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions to help the user re-upload a better file.
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY the JSON object. Do NOT include any extra text, explanations, markdown, or code fences.`,
			userMessage: `Here is the document text to analyze (possibly truncated):

${snippet}`,
		};
	}

	/**
	 * Try to extract a JSON object from a noisy string (markdown, code fences, extra text).
	 * Returns parsed object or null if none found.
	 */
	private static extractJsonFromString(content: string): any | null {
		if (!content) return null;

		// Remove triple-backtick fences but keep inner content
		let s = content.replace(/```([\s\S]*?)```/g, (_m, g1) => g1);
		// Remove single backticks
		s = s.replace(/`/g, "");
		// Trim
		s = s.trim();

		// Find first open brace
		const first = s.indexOf("{");
		if (first === -1) return null;

		// Find matching closing brace using a simple stack
		let stack = 0;
		for (let i = first; i < s.length; i++) {
			if (s[i] === "{") stack++;
			else if (s[i] === "}") {
				stack--;
				if (stack === 0) {
					const candidate = s.slice(first, i + 1);
					try {
						return JSON.parse(candidate);
					} catch (e) {
						// continue searching
					}
				}
			}
		}

		// Fallback: try to match a JSON-like block
		const match = s.match(/\{[\s\S]*\}/);
		if (match) {
			try {
				return JSON.parse(match[0]);
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	static async validateFile(
		extractedText: string,
		expectedFileType: string,
		fileName: string
	): Promise<FileValidationResult> {
		try {
			if (!extractedText || extractedText.trim().length < 50) {
				return {
					isValid: false,
					confidence: 0.1,
					reasoning:
						"Extracted text is too short or empty to validate properly",
					suggestions: [
						"Please ensure the file is clear and readable",
						"Try uploading a higher quality image or PDF",
					],
					action: "reupload",
				};
			}

			const promptResult = this.getValidationPrompt(
				expectedFileType,
				extractedText
			);

			// Log the prompt being sent to Mistral
			// eslint-disable-next-line no-console
			console.log("🤖 MISTRAL VALIDATION PROMPT:", {
				expectedFileType,
				fileName,
				extractedTextLength: extractedText.length,
				extractedTextPreview:
					extractedText.substring(0, 500) +
					(extractedText.length > 500 ? "...(truncated)" : ""),
			});

			const request: MistralRequest = {
				model: "mistral-large-latest",
				messages: [
					{
						role: "system",
						content: promptResult.systemMessage,
					},
					{
						role: "user",
						content: promptResult.userMessage,
					},
				],
				temperature: 0.1,
				max_tokens: 1000,
			};

			// Log the complete request
			// eslint-disable-next-line no-console
			console.log("🚀 MISTRAL VALIDATION REQUEST:", {
				apiUrl: this.API_URL,
				model: request.model,
				messagesLength: request.messages.length,
			});

			if (!this.API_KEY) {
				throw new Error(
					"Mistral API key not found in environment variables"
				);
			}

			const response = await fetch(this.API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.API_KEY}`,
				},
				body: JSON.stringify(request),
			});

			// eslint-disable-next-line no-console
			console.log(
				"Response from Mistral:",
				response.status,
				response.statusText
			);

			if (!response.ok) {
				throw new Error(
					`HTTP error! status: ${response.status} ${response.statusText}`
				);
			}

			const data: MistralResponse = await response.json();
			// eslint-disable-next-line no-console
			console.log("Data from Mistral:", data);

			const content = data.choices?.[0]?.message?.content;

			if (!content) {
				throw new Error("No response content from Mistral");
			}

			// Debug: log the raw content string returned by the model
			// eslint-disable-next-line no-console
			console.log(
				"📨 Mistral validation content length:",
				content?.length ?? 0
			);
			// eslint-disable-next-line no-console
			console.log("📨 Mistral validation content preview:", content);

			// Try to parse JSON response
			let parsed: any = null;
			try {
				parsed = JSON.parse(content) as FileValidationResult;
				// eslint-disable-next-line no-console
				console.log("📨 Parsed JSON from Mistral (direct):", parsed);
			} catch (parseError) {
				// Try to extract JSON from noisy content
				parsed = this.extractJsonFromString(content);
				// eslint-disable-next-line no-console
				console.log("📨 Parsed JSON from Mistral (extracted):", parsed);
			}

			if (parsed) {
				const validationResult: FileValidationResult = {
					isValid: parsed.isValid || false,
					confidence: Math.max(
						0,
						Math.min(1, parsed.confidence || 0)
					),
					reasoning: parsed.reasoning || "No reasoning provided",
					suggestions: parsed.suggestions || [],
					action:
						parsed.action ||
						(parsed.isValid ? "accept" : "reupload"),
					output: parsed.output || undefined,
				};

				// eslint-disable-next-line no-console
				console.log("✅ MISTRAL VALIDATION RESULT:", {
					fileName,
					expectedFileType,
					result: validationResult,
				});

				return validationResult;
			} else {
				// Could not parse JSON, fallback to text-based heuristic
				// eslint-disable-next-line no-console
				console.warn(
					"⚠️ Could not parse JSON from Mistral content, using text fallback"
				);
				// eslint-disable-next-line no-console
				console.log(
					"📨 Mistral raw content used for fallback preview:",
					content?.substring(0, 500)
				);

				const isValidMatch = content.toLowerCase().includes("true");
				const confidenceMatch = content.match(
					/confidence["\s:]*(\d+\.?\d*)/i
				);

				return {
					isValid: isValidMatch,
					confidence: confidenceMatch
						? Math.min(
								1,
								Math.max(0, parseFloat(confidenceMatch[1]))
							)
						: 0.5,
					reasoning:
						content.length > 200
							? content.substring(0, 200) + "..."
							: content,
					suggestions: !isValidMatch
						? [
								"Please check if you uploaded the correct document type",
							]
						: [],
					action: isValidMatch ? "accept" : "reupload",
				};
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("File validation error:", error);

			// Fallback validation based on simple text analysis
			return this.fallbackValidation(
				extractedText,
				expectedFileType,
				fileName
			);
		}
	}

	private static fallbackValidation(
		extractedText: string,
		expectedFileType: string,
		fileName: string
	): FileValidationResult {
		const lowerText = extractedText.toLowerCase();
		const lowerFileName = fileName.toLowerCase();

		switch (expectedFileType) {
			case "cv-resume": {
				const cvKeywords = [
					"experience",
					"education",
					"skills",
					"work",
					"employment",
					"resume",
					"cv",
					"curriculum",
				];
				const cvMatches = cvKeywords.filter(
					(keyword) =>
						lowerText.includes(keyword) ||
						lowerFileName.includes(keyword)
				).length;
				return {
					isValid: cvMatches >= 2,
					confidence: Math.min(0.8, cvMatches * 0.2),
					reasoning: `Found ${cvMatches} CV-related keywords. ${cvMatches >= 2 ? "Likely a CV/Resume." : "May not be a CV/Resume."}`,
					action: cvMatches >= 2 ? "accept" : "reupload",
					suggestions:
						cvMatches < 2
							? [
									"Please ensure you upload a proper CV/Resume document",
								]
							: [],
				};
			}

			case "language-certificates": {
				const langKeywords = [
					"ielts",
					"toefl",
					"toeic",
					"cambridge",
					"hsk",
					"jlpt",
					"topik",
					"language",
					"proficiency",
					"certificate",
				];
				const langMatches = langKeywords.filter(
					(keyword) =>
						lowerText.includes(keyword) ||
						lowerFileName.includes(keyword)
				).length;
				return {
					isValid: langMatches >= 1,
					confidence: Math.min(0.8, langMatches * 0.3),
					reasoning: `Found ${langMatches} language certificate keywords. ${langMatches >= 1 ? "Likely a language certificate." : "May not be a language certificate."}`,
					action: langMatches >= 1 ? "accept" : "reupload",
					suggestions:
						langMatches < 1
							? [
									"Please upload an official language proficiency certificate",
								]
							: [],
				};
			}

			case "degree-certificates": {
				const degreeKeywords = [
					"degree",
					"diploma",
					"bachelor",
					"master",
					"phd",
					"university",
					"graduation",
					"conferred",
					"awarded",
				];
				const degreeMatches = degreeKeywords.filter(
					(keyword) =>
						lowerText.includes(keyword) ||
						lowerFileName.includes(keyword)
				).length;
				return {
					isValid: degreeMatches >= 2,
					confidence: Math.min(0.8, degreeMatches * 0.2),
					reasoning: `Found ${degreeMatches} degree-related keywords. ${degreeMatches >= 2 ? "Likely a degree certificate." : "May not be a degree certificate."}`,
					action: degreeMatches >= 2 ? "accept" : "reupload",
					suggestions:
						degreeMatches < 2
							? [
									"Please upload an official degree or diploma certificate",
								]
							: [],
				};
			}

			case "academic-transcripts": {
				const transcriptKeywords = [
					"transcript",
					"gpa",
					"grade",
					"course",
					"semester",
					"credit",
					"academic",
					"marks",
				];
				const transcriptMatches = transcriptKeywords.filter(
					(keyword) =>
						lowerText.includes(keyword) ||
						lowerFileName.includes(keyword)
				).length;
				return {
					isValid: transcriptMatches >= 2,
					confidence: Math.min(0.8, transcriptMatches * 0.25),
					reasoning: `Found ${transcriptMatches} transcript-related keywords. ${
						transcriptMatches >= 2
							? "Likely an academic transcript."
							: "May not be a transcript."
					}`,
					action: transcriptMatches >= 2 ? "accept" : "reupload",
					suggestions:
						transcriptMatches < 2
							? ["Please upload an official academic transcript"]
							: [],
				};
			}

			case "application-documents": {
				// Check for sensitive content patterns
				const sensitivePatterns = [
					/\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
					/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
					/\bconfidential\b/i,
					/\bprivate\b/i,
					/\binternal use only\b/i,
				];

				const inappropriateWords = [
					"fuck",
					"shit",
					"damn",
					"hate",
					"kill",
					"fraud",
					"fake",
					"scam",
				];

				const hasSensitiveContent = sensitivePatterns.some((pattern) =>
					pattern.test(extractedText)
				);
				const hasInappropriateContent = inappropriateWords.some(
					(word) => lowerText.includes(word.toLowerCase())
				);

				const educationalKeywords = [
					"education",
					"academic",
					"school",
					"university",
					"college",
					"student",
					"application",
					"program",
					"course",
					"study",
				];

				const educationalMatches = educationalKeywords.filter(
					(keyword) =>
						lowerText.includes(keyword) ||
						lowerFileName.includes(keyword)
				).length;

				if (hasSensitiveContent || hasInappropriateContent) {
					return {
						isValid: false,
						confidence: 0.9,
						reasoning:
							"Document contains potentially sensitive or inappropriate content",
						action: "reupload",
						suggestions: [
							"Please remove sensitive information and upload appropriate educational documents",
						],
					};
				}

				return {
					isValid: educationalMatches >= 1,
					confidence: Math.min(0.8, educationalMatches * 0.3),
					reasoning: `Found ${educationalMatches} educational keywords. ${
						educationalMatches >= 1
							? "Appears appropriate for educational applications."
							: "Content may not be suitable for educational applications."
					}`,
					action: educationalMatches >= 1 ? "accept" : "reupload",
					suggestions:
						educationalMatches < 1
							? [
									"Please upload content relevant to educational applications",
								]
							: [],
				};
			}
			default:
				return {
					isValid: true,
					confidence: 0.5,
					reasoning: "Unknown file type, validation skipped",
					action: "accept",
					suggestions: [],
				};
		}
	}

	static getFileTypeDisplayName(fileType: string): string {
		const displayNames: { [key: string]: string } = {
			"cv-resume": "CV/Resume",
			"language-certificates": "Language Certificate",
			"degree-certificates": "Degree Certificate",
			"academic-transcripts": "Academic Transcript",
			"institution-verification": "Institution Verification Document",
			"research-papers": "Research Paper",
			"application-documents": "Application Document",
		};
		return displayNames[fileType] || fileType;
	}
}
