interface ValidationRequest {
	model: string;
	messages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}>;
	stream: boolean;
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

export class FileValidationService {
	private static readonly API_URL =
		"https://notlongfen-embeddingmodel.hf.space/api/chat";

	private static getSystemPrompt(expectedFileType: string): string {
		const prompts = {
			"cv-resume": `You are a STRICT CV/Resume validation expert. Analyze the provided text and determine if it's a real CV/Resume document for a person applying for jobs.

A valid CV/Resume should contain, at minimum:
- Personal information (name, contact details like email or phone)
- Work experience or employment history OR education background
- Some indication of skills, competencies, or a professional profile

Be conservative:
- If you are NOT clearly sure that this is a CV/Resume, you MUST treat it as invalid.
- If the text looks like an essay, webpage, article, random text, or anything not clearly structured as a CV/Resume, it is INVALID.
- If the text is too short, noisy, or cannot be reliably interpreted as a CV/Resume, it is INVALID.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": true,
  "action": "reupload",
  "confidence": 0.73,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid CV/Resume.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions to help the user re-upload a better file (e.g. clearer scan, correct document type, include missing information).
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

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
- If you are not clearly sure, you MUST treat it as invalid.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": false,
  "action": "reupload",
  "confidence": 0.41,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid language certificate.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions (e.g. upload the official score report, ensure the whole certificate is visible, include all pages).
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

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
- If you are not clearly sure, you MUST treat it as invalid.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": true,
  "action": "accept",
  "confidence": 0.88,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid degree certificate.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions (e.g. upload the official diploma, ensure all edges are visible, use a clearer scan).
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

			transcripts: `You are a STRICT academic transcript validation expert. Analyze the provided text and determine if it's an academic transcript.

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
- If you are not clearly sure, you MUST treat it as invalid.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": true,
  "action": "accept",
  "confidence": 0.91,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid academic transcript.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions (e.g. upload a full transcript that shows all courses and grades).
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

			"institution-verification": `You are a STRICT institution verification document expert. Analyze the provided text and determine if it's a valid institution verification document.

A valid institution verification document should contain:
- Institution name and official details
- Registration numbers or accreditation information, if applicable
- Official letterhead, logo, seal, or certification marks
- Some statement of legal status, authorization, or recognition
- Contact information of the institution (address, email, phone, or website)

Be conservative:
- If the document looks like a general brochure, advertisement, or informal text without formal verification details, treat it as INVALID.
- If key information about the institution's identity and official status is missing or unclear, treat it as INVALID.
- If you are not clearly sure, you MUST treat it as invalid.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": false,
  "action": "reupload",
  "confidence": 0.37,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid institution verification document.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid.
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear, practical suggestions (e.g. upload an official letter on institutional letterhead, include registration number, clearer scan).
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

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
- If you are NOT clearly sure that this is a formal research paper, you MUST treat it as INVALID.

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": true,
  "action": "accept",
  "confidence": 0.85,
  "reasoning": "Brief explanation of your decision",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document is a valid research paper.
  - Use "reupload" if the document is invalid or you are unsure.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation of why the document is valid or invalid (e.g. “has abstract, methods, results, and references” or “no references, no structured sections”).
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions (e.g. "Please upload the full research paper with title, abstract, main sections, and references", "Ensure you are not uploading slides or a blog post").
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,

			"application-documents": `You are a STRICT application document content moderation expert. Analyze the provided text to determine if it's appropriate for an educational application system.

A valid application document should be:
- Professional and appropriate for academic/educational purposes
- Free from sensitive, personal, or inappropriate content
- Contain legitimate information relevant to educational applications

INVALID content includes (but not limited to):
- Personal sensitive information: Social Security Numbers, detailed financial information, medical records, personal identification numbers
- Inappropriate content: Offensive language, discriminatory remarks, personal attacks, political propaganda
- Harmful content: Instructions for illegal activities, harmful advice, malicious content

Be strict about content safety:
- If you detect ANY potentially sensitive, inappropriate, or harmful content, you MUST treat it as INVALID
- If the content seems irrelevant to educational applications, treat it as INVALID
- If you are unsure about the appropriateness of the content, you MUST treat it as INVALID
- Only accept documents that are clearly appropriate and relevant for educational applications

Return your response as a single JSON object with this exact structure (example values):

{
  "isValid": false,
  "action": "reupload",
  "confidence": 0.92,
  "reasoning": "Brief explanation of your decision focusing on content appropriateness",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Field requirements:
- "isValid" MUST be a boolean (true or false).
- "action" MUST be either "accept" or "reupload".
  - Use "accept" ONLY if you are clearly confident the document contains appropriate, non-sensitive content suitable for educational applications.
  - Use "reupload" if the document contains sensitive, inappropriate, or irrelevant content.
- "confidence" MUST be a number between 0 and 1 (0.0 to 1.0).
- "reasoning" MUST be a short explanation focusing on content safety and appropriateness (e.g. "contains appropriate educational content" or "contains sensitive personal information").
- "suggestions" MUST be an array of strings.
  - When the document is invalid, give clear suggestions for uploading appropriate content (e.g. "Please remove sensitive personal information", "Upload documents relevant to your educational application", "Ensure content is professional and appropriate").
  - When the document is valid, "suggestions" may be an empty array.

Respond with ONLY this JSON object. Do NOT include markdown, code fences, or any extra text.`,
		};

		return (
			prompts[expectedFileType as keyof typeof prompts] ||
			prompts["cv-resume"]
		);
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
				};
			}

			const systemPrompt = this.getSystemPrompt(expectedFileType);

			// Log the prompt being sent to AI model
			// eslint-disable-next-line no-console
			console.log("🤖 AI VALIDATION PROMPT:", {
				expectedFileType,
				fileName,
				systemPrompt,
				extractedTextLength: extractedText.length,
				extractedTextPreview:
					extractedText.substring(0, 500) +
					(extractedText.length > 500 ? "...(truncated)" : ""),
			});
			const snippet =
				extractedText.length > 3000
					? extractedText.substring(0, 3000) + "...(truncated)"
					: extractedText;

			const userPrompt = `
					You are validating a document of type: "${expectedFileType}".

					Use the instructions in the system message to decide whether this document is a valid instance of that type.
					If the document clearly does NOT meet the required criteria, or you are not sure, you MUST treat it as invalid and set:
					"isValid": false
					"action": "reupload"

					Here is the document text to analyze (possibly truncated):

					${snippet}

					Your entire response MUST be a single JSON object following the schema described in the system message:
					{
					"isValid": boolean,
					"action": "accept" or "reupload",
					"confidence": number between 0 and 1,
					"reasoning": string,
					"suggestions": string[]
					}

					Do NOT include any extra text, explanations, markdown, or code fences. Only output the JSON object.
					`;

			const request: ValidationRequest = {
				model: "gemma3:1b",
				messages: [
					{
						role: "system",
						content: systemPrompt,
					},
					{
						role: "user",
						content: userPrompt,
					},
				],
				stream: false,
			};

			// Log the complete request
			// eslint-disable-next-line no-console
			console.log("🚀 AI VALIDATION REQUEST:", {
				apiUrl: this.API_URL,
				model: request.model,
				systemMessage: request.messages[0].content,
				userMessage: request.messages[1].content,
			});

			const response = await fetch(this.API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			// eslint-disable-next-line no-console
			console.log("Response from AI model:", response);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Try to parse response as JSON, but be ready for different shapes
			let data: any = null;
			try {
				data = await response.json();
				// eslint-disable-next-line no-console
				console.log("Data from AI model:", data);
			} catch (e) {
				// not JSON, will try to read as text later
				data = null;
			}

			// If data not JSON, read raw text
			let rawContentText: string | undefined = undefined;
			if (
				data &&
				data.message &&
				typeof data.message.content === "string"
			) {
				rawContentText = data.message.content;
			} else {
				// try to read as text
				rawContentText = await response.text();
			}

			if (!rawContentText) {
				throw new Error("No response content from AI model");
			}

			const content = rawContentText;

			// Debug: log the raw content string returned by the model
			// eslint-disable-next-line no-console
			console.log(
				"📨 AI validation content length:",
				content?.length ?? 0
			);
			// eslint-disable-next-line no-console
			console.log("📨 AI validation content preview:", content);

			// Try to parse JSON response------------------------------------------------------------------------------------------------------------------------------------
			// Attempt to parse JSON from the model content. If direct parse fails,
			// try to extract a JSON object embedded in the text (markdown/code fences).
			let parsed: any = null;
			try {
				parsed = JSON.parse(content) as FileValidationResult;
				// eslint-disable-next-line no-console
				console.log("📨 Parsed JSON from model (direct):", parsed);
			} catch (parseError) {
				// Try to extract JSON from noisy content
				parsed = this.extractJsonFromString(content);
				// eslint-disable-next-line no-console
				console.log("📨 Parsed JSON from model (extracted):", parsed);
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
				console.log("✅ AI VALIDATION RESULT:", {
					fileName,
					expectedFileType,
					result: validationResult,
				});

				return validationResult;
			} else {
				// Could not parse JSON, fallback to text-based heuristic
				// eslint-disable-next-line no-console
				console.warn(
					"⚠️ Could not parse JSON from model content, using text fallback"
				);
				// eslint-disable-next-line no-console
				console.log(
					"📨 Model raw content used for fallback preview:",
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
				};
			}

			case "transcripts": {
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
					reasoning: `Found ${transcriptMatches} transcript-related keywords. ${transcriptMatches >= 2 ? "Likely an academic transcript." : "May not be a transcript."}`,
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
						suggestions: [
							"Please remove sensitive information and upload appropriate educational documents",
						],
					};
				}

				return {
					isValid: educationalMatches >= 1,
					confidence: Math.min(0.8, educationalMatches * 0.3),
					reasoning: `Found ${educationalMatches} educational keywords. ${educationalMatches >= 1 ? "Appears appropriate for educational applications." : "Content may not be suitable for educational applications."}`,
				};
			}

			default:
				return {
					isValid: true,
					confidence: 0.5,
					reasoning: "Unknown file type, validation skipped",
				};
		}
	}

	static getFileTypeDisplayName(fileType: string): string {
		const displayNames: { [key: string]: string } = {
			"cv-resume": "CV/Resume",
			"language-certificates": "Language Certificate",
			"degree-certificates": "Degree Certificate",
			transcripts: "Academic Transcript",
			"institution-verification": "Institution Verification Document",
			"application-documents": "Application Document",
		};
		return displayNames[fileType] || fileType;
	}
}
