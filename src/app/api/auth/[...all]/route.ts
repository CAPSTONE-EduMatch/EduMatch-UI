export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/config/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { POST: _POST, GET: _GET } = toNextJsHandler(auth.handler);

export async function POST(request: NextRequest) {
	try {
		return await _POST(request);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Auth API POST error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		// Removed verbose logging to reduce console spam
		// The requests are expected and handled by Better Auth's caching
		return await _GET(request);
	} catch (error) {
		// Only log errors
		// eslint-disable-next-line no-console
		console.error("Auth API GET error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
