import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../../../prisma/index";

// Get information requests for a specific institution
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const id = params.id;

		if (!id) {
			return Response.json(
				{
					success: false,
					error: "Institution ID is required",
				},
				{ status: 400 }
			);
		}

		// Determine if the ID is an institution_id or user_id
		let whereClause: any;
		if (id.startsWith("institution_")) {
			whereClause = { institution_id: id };
		} else {
			// It's a user_id, find by user_id
			whereClause = { user_id: id };
		}

		// Find the institution
		const institution = await prismaClient.institution.findFirst({
			where: whereClause,
			select: {
				institution_id: true,
			},
		});

		if (!institution) {
			return Response.json(
				{
					success: false,
					error: "Institution not found",
				},
				{ status: 404 }
			);
		}

		// Fetch all info requests for this institution
		const infoRequests = await prismaClient.institutionInfoRequest.findMany(
			{
				where: {
					institution_id: institution.institution_id,
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
			}
		);

		// Transform the data
		const transformedRequests = infoRequests.map((request) => ({
			infoRequestId: request.info_request_id,
			institutionId: request.institution_id,
			requestedBy: {
				userId: request.requested_by_user_id,
				name: request.requestedBy.name || request.requestedBy.email,
				email: request.requestedBy.email,
			},
			requestMessage: request.request_message,
			requestedFields: request.requested_fields,
			status: request.status,
			createdAt: request.created_at.toISOString(),
			responseSubmittedAt:
				request.response_submitted_at?.toISOString() || null,
			responseMessage: request.response_message || null,
		}));

		return Response.json({
			success: true,
			data: transformedRequests,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching institution info requests:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to fetch information requests",
			},
			{ status: 500 }
		);
	}
}
