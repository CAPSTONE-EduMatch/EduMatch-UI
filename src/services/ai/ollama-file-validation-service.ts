interface OllamaRequest {
	model: string;
	prompt: string;
	stream?: boolean;
	format?: "json";
}

interface OllamaResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
	context?: number[];
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
	prompt_eval_duration?: number;
	eval_count?: number;
	eval_duration?: number;
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
	// CHỈ GỌI API CỦA CHÍNH APP
	private static readonly API_URL = "/api/ollama/generate";
	// KHÔNG dùng env ở đây nữa, vì file này chạy trên client
	// private static readonly API_KEY = process.env.OLLAMA_API_KEY;

	private static readonly API_KEY = process.env.OLLAMA_API_KEY;

	private static getValidationPrompt(
		expectedFileType: string,
		extractedText: string
	): string {
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
- If you are not clearly sure, you MUST treat it as invalid.`,

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
- If you are not clearly sure, you MUST treat it as invalid.`,

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
			extractedText.length > 3000
				? extractedText.substring(0, 3000) + "...(truncated)"
				: extractedText;

		return `${instruction}

You are validating a document of type: "${expectedFileType}".

Use the instructions above to decide whether this document is a valid instance of that type.
If the document clearly does NOT meet the required criteria, or you are not sure, you MUST treat it as invalid and set:
"isValid": false
"action": "reupload"

Here is the document text to analyze (possibly truncated):

${snippet}

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

Respond with ONLY the JSON object. Do NOT include any extra text, explanations, markdown, or code fences.`;
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

			const prompt = this.getValidationPrompt(
				expectedFileType,
				extractedText
			);

			// Log the prompt being sent to Ollama
			console.log("🤖 OLLAMA VALIDATION PROMPT:", {
				expectedFileType,
				fileName,
				extractedTextLength: extractedText.length,
				extractedTextPreview:
					extractedText.substring(0, 500) +
					(extractedText.length > 500 ? "...(truncated)" : ""),
			});

			const request: OllamaRequest = {
				model: "gpt-oss:120b",
				prompt: prompt,
				stream: false,
			};

			// Log the complete request
			console.log("🚀 OLLAMA VALIDATION REQUEST:", {
				apiUrl: this.API_URL,
				model: request.model,
				promptLength: request.prompt.length,
			});

			// const headers: Record<string, string> = {
			// 	"Content-Type": "application/json",
			// };

			// // Add API key if available (for cloud Ollama)
			// if (this.API_KEY) {
			// 	headers["Authorization"] = `Bearer ${this.API_KEY}`;
			// }

			// const response = await fetch(this.API_URL, {
			// 	method: "POST",
			// 	headers,
			// 	body: JSON.stringify(request),
			// });
			const response = await fetch(this.API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(request), // { model, prompt, stream, format }
			});

			console.log(
				"Response from Ollama:",
				response.status,
				response.statusText
			);

			if (!response.ok) {
				throw new Error(
					`HTTP error! status: ${response.status} ${response.statusText}`
				);
			}

			const data: OllamaResponse = await response.json();
			console.log("Data from Ollama:", data);

			const content = data.response;

			if (!content) {
				throw new Error("No response content from Ollama");
			}

			// Debug: log the raw content string returned by the model
			console.log(
				"📨 Ollama validation content length:",
				content?.length ?? 0
			);
			console.log("📨 Ollama validation content preview:", content);

			// Try to parse JSON response
			let parsed: any = null;
			try {
				parsed = JSON.parse(content) as FileValidationResult;
				console.log("📨 Parsed JSON from Ollama (direct):", parsed);
			} catch (parseError) {
				// Try to extract JSON from noisy content
				parsed = this.extractJsonFromString(content);
				console.log("📨 Parsed JSON from Ollama (extracted):", parsed);
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

				console.log("✅ OLLAMA VALIDATION RESULT:", {
					fileName,
					expectedFileType,
					result: validationResult,
				});

				return validationResult;
			} else {
				// Could not parse JSON, fallback to text-based heuristic
				console.warn(
					"⚠️ Could not parse JSON from Ollama content, using text fallback"
				);
				console.log(
					"📨 Ollama raw content used for fallback preview:",
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
					action: transcriptMatches >= 2 ? "accept" : "reupload",
					suggestions:
						transcriptMatches < 2
							? ["Please upload an official academic transcript"]
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
			transcripts: "Academic Transcript",
			"institution-verification": "Institution Verification Document",
			"research-papers": "Research Paper",
		};
		return displayNames[fileType] || fileType;
	}
}
