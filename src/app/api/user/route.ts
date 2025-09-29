//Check if user exists by email

import { NextRequest } from "next/server";
import { prismaClient } from "../../../../prisma";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const email = searchParams.get("email");

		if (!email) {
			return new Response(
				JSON.stringify({ error: "Email is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const user = await prismaClient.user.findUnique({
			where: { email },
		});

		return new Response(JSON.stringify({ exists: !!user }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ error: "Internal server error" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
