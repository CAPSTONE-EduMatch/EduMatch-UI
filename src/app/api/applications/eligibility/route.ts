import {
	canApplyToOpportunity,
	getApplicationLimit,
} from "@/services/authorization";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

/**
 * GET /api/applications/eligibility
 *
 * Check if the authenticated applicant is eligible to submit applications
 * Returns plan details, application limits, and current usage
 *
 * This endpoint is useful for frontend components to:
 * - Show/hide application buttons based on plan
 * - Display remaining application count
 * - Show upgrade prompts for Free users
 * - Display warning when nearing limit for Standard users
 */
export async function GET() {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Check application eligibility
		const eligibility = await canApplyToOpportunity(applicant.applicant_id);

		// Get detailed application limit information
		const limitInfo = await getApplicationLimit(applicant.applicant_id);

		// Return eligibility information
		return NextResponse.json({
			success: true,
			eligibility: {
				canApply: eligibility.canApply,
				reason: eligibility.reason,
				planName: eligibility.planName,
				applicationsUsed: eligibility.applicationsUsed,
				applicationsLimit: eligibility.applicationsLimit,
				applicationsRemaining: limitInfo.remaining,
				periodStart: eligibility.periodStart?.toISOString() || null,
				periodEnd: eligibility.periodEnd?.toISOString() || null,
				daysUntilReset: eligibility.daysUntilReset,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to check eligibility" },
			{ status: 500 }
		);
	}
}
