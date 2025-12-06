import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

// GET /api/institution/info-requests - Get pending information requests for the logged-in institution
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Find the institution for this user
		const institution = await prismaClient.institution.findFirst({
			where: {
				user_id: user.id,
			},
			select: {
				institution_id: true,
			},
		});

		if (!institution) {
			return NextResponse.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		// Fetch pending info requests for this institution
		const pendingRequests =
			await prismaClient.institutionInfoRequest.findMany({
				where: {
					institution_id: institution.institution_id,
					status: "PENDING",
				},
				include: {
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: {
					created_at: "desc",
				},
			});

		// Transform the data
		const transformedRequests = pendingRequests.map((request) => ({
			infoRequestId: request.info_request_id,
			requestedBy: {
				userId: request.requested_by_user_id,
				name: request.requestedBy.name || request.requestedBy.email,
				email: request.requestedBy.email,
			},
			requestMessage: request.request_message,
			requestedFields: request.requested_fields,
			createdAt: request.created_at.toISOString(),
		}));

		return NextResponse.json({
			success: true,
			data: transformedRequests,
			pendingCount: transformedRequests.length,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching institution info requests:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch information requests",
			},
			{ status: 500 }
		);
	}
}
