import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

export async function POST(request: NextRequest) {
	try {
		const { userId, status } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Update user status
		const updatedUser = await prismaClient.user.update({
			where: { id: userId },
			data: { status: status ?? false },
			select: {
				id: true,
				email: true,
				status: true,
				name: true,
			},
		});

		return NextResponse.json({
			success: true,
			message: `User status updated to ${updatedUser.status}`,
			user: updatedUser,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update user status" },
			{ status: 500 }
		);
	}
}
