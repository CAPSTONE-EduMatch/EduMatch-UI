import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// GET /api/institution/[id] - Get institution details
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const institutionId = params.id;

		// Get institution data
		const institution = await prismaClient.institution.findUnique({
			where: {
				institution_id: institutionId,
			},
			select: {
				institution_id: true,
				name: true,
				abbreviation: true,
				type: true,
				website: true,
				hotline: true,
				hotline_code: true,
				address: true,
				country: true,
				rep_name: true,
				rep_position: true,
				rep_email: true,
				rep_phone: true,
				rep_phone_code: true,
				about: true,
				cover_image: true,
				logo: true,
				verification_status: true,
				deleted_at: true,
				user: {
					select: {
						email: true,
					},
				},
				subdisciplines: {
					select: {
						subdiscipline: {
							select: {
								name: true,
								discipline: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
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

		// Transform subdisciplines to include discipline information
		const disciplines = institution.subdisciplines.map((sub) => ({
			name: sub.subdiscipline.name,
			disciplineName: sub.subdiscipline.discipline.name,
		}));

		// Transform the institution data
		const transformedInstitution = {
			id: institution.institution_id,
			name: institution.name,
			abbreviation: institution.abbreviation,
			institutionType: institution.type,
			website: institution.website,
			hotline: institution.hotline,
			hotlineCode: institution.hotline_code,
			address: institution.address,
			country: institution.country,
			representativeName: institution.rep_name,
			representativePosition: institution.rep_position,
			representativeEmail: institution.rep_email,
			representativePhone: institution.rep_phone,
			representativePhoneCode: institution.rep_phone_code,
			about: institution.about,
			disciplines: disciplines,
			coverImage: institution.cover_image,
			logo: institution.logo,
			status: institution.verification_status,
			deletedAt: institution.deleted_at,
			email: institution.user?.email,
		};

		return NextResponse.json({
			success: true,
			institution: transformedInstitution,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch institution",
			},
			{ status: 500 }
		);
	}
}
