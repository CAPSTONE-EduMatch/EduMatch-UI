import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma/index";

// GET - Get single discipline with all subdisciplines and stats
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await requireAuth();

		const disciplineId = params.id;

		// Fetch discipline with all subdisciplines
		const discipline = await prismaClient.discipline.findUnique({
			where: { discipline_id: disciplineId },
			include: {
				subdisciplines: {
					orderBy: { name: "asc" },
				},
			},
		});

		if (!discipline) {
			return NextResponse.json(
				{
					success: false,
					error: "Discipline not found",
				},
				{ status: 404 }
			);
		}

		// Get usage statistics
		const subdisciplineIds = discipline.subdisciplines.map(
			(sub) => sub.subdiscipline_id
		);

		// Count related posts
		const postsCount = await prismaClient.postSubdiscipline.count({
			where: {
				subdiscipline_id: {
					in: subdisciplineIds,
				},
			},
		});

		// Count related institutions
		const institutionsCount =
			await prismaClient.institutionSubdiscipline.count({
				where: {
					subdiscipline_id: {
						in: subdisciplineIds,
					},
				},
			});

		// Count related applicants
		const applicantsCount = await prismaClient.applicantInterest.count({
			where: {
				subdiscipline_id: {
					in: subdisciplineIds,
				},
			},
		});

		// Transform subdisciplines for response
		const transformedSubdisciplines = discipline.subdisciplines.map(
			(sub) => ({
				id: sub.subdiscipline_id,
				name: sub.name,
				status: sub.status ? "Active" : "Inactive",
				createdAt: new Date().toLocaleDateString("en-US", {
					month: "2-digit",
					day: "2-digit",
					year: "numeric",
				}),
			})
		);

		return NextResponse.json({
			success: true,
			data: {
				id: discipline.discipline_id,
				name: discipline.name,
				status: discipline.status ? "Active" : "Inactive",
				subdisciplines: transformedSubdisciplines,
				stats: {
					totalSubdisciplines: discipline.subdisciplines.length,
					activeSubdisciplines: discipline.subdisciplines.filter(
						(s) => s.status
					).length,
					inactiveSubdisciplines: discipline.subdisciplines.filter(
						(s) => !s.status
					).length,
					linkedPosts: postsCount,
					linkedInstitutions: institutionsCount,
					linkedApplicants: applicantsCount,
				},
			},
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching discipline details:", error);
		}
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch discipline details",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
