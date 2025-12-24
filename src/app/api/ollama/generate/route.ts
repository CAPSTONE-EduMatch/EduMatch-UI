// app/api/ollama/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
// Bạn đang nói dùng: https://ollama.com/api/generate
const OLLAMA_BASE_URL = "https://ollama.com/api";

export async function POST(req: NextRequest) {
	if (!OLLAMA_API_KEY) {
		return NextResponse.json(
			{ error: "Missing OLLAMA_API_KEY" },
			{ status: 500 }
		);
	}

	try {
		// Body từ client chính là OllamaRequest: { model, prompt, stream?, format? }
		const body = await req.json();

		const res = await fetch(`${OLLAMA_BASE_URL}/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${OLLAMA_API_KEY}`,
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const text = await res.text();
			console.error("Ollama cloud error:", res.status, text);
			return NextResponse.json(
				{ error: `Ollama error: ${res.status} - ${text}` },
				{ status: res.status }
			);
		}

		const data = await res.json();
		return NextResponse.json(data);
	} catch (err: any) {
		console.error("Ollama generate API error:", err);
		return NextResponse.json(
			{ error: err?.message || "Unknown error" },
			{ status: 500 }
		);
	}
}
