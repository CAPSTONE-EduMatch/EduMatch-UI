import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";

// Helper function to calculate days left from a date string
function calculateDaysLeft(dateString: Date): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

// Helper function to calculate match percentage (placeholder logic)
function calculateMatchPercentage(): string {
	return `${Math.floor(Math.random() * 30) + 70}%`;
}

// Helper function to format date to readable string
function formatDate(date: Date): string {
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// Helper function to format currency
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get("id");

		if (!postId) {
			return NextResponse.json(
				{ message: "Program ID is required" },
				{ status: 400 }
			);
		}

		// Fetch OpportunityPost with all related data
		const opportunityPost = await prismaClient.opportunityPost.findUnique({
			where: {
				post_id: postId,
			},
			include: {
				// Include ProgramPost details
				programPost: {
					include: {
						certificates: true, // Include certificates
					},
				},
				// Include Institution details
				institution: true,
				// Include Documents
				postDocs: {
					include: {
						documentType: true,
					},
				},
				// Include Subdisciplines
				subdisciplines: {
					include: {
						subdiscipline: {
							include: {
								discipline: true,
							},
						},
					},
				},
				// Include Applications count
				applications: {
					select: {
						application_id: true,
						status: true,
					},
				},
				// Include wishlists count
				wishlists: {
					select: {
						applicant_id: true,
					},
				},
			},
		});

		if (!opportunityPost) {
			return NextResponse.json(
				{ message: "Program not found" },
				{ status: 404 }
			);
		}

		// Check if it's a program post (not job or scholarship)
		if (!opportunityPost.programPost) {
			return NextResponse.json(
				{ message: "This post is not a program" },
				{ status: 400 }
			);
		}

		// Calculate derived fields
		const daysLeft = opportunityPost.end_date
			? calculateDaysLeft(opportunityPost.end_date)
			: 0;
		const match = calculateMatchPercentage();
		const applicationCount = opportunityPost.applications.length;
		const wishlistCount = opportunityPost.wishlists.length;

		// Get application status counts
		const applicationStats = {
			total: applicationCount,
			pending: opportunityPost.applications.filter(
				(app) => app.status === "PENDING"
			).length,
			reviewed: opportunityPost.applications.filter(
				(app) => app.status === "REVIEWED"
			).length,
			accepted: opportunityPost.applications.filter(
				(app) => app.status === "ACCEPTED"
			).length,
			rejected: opportunityPost.applications.filter(
				(app) => app.status === "REJECTED"
			).length,
		};

		// Format the response
		const programDetail = {
			// Basic post information
			id: opportunityPost.post_id,
			title: opportunityPost.title,
			description: opportunityPost.other_info || "",
			otherInfo: opportunityPost.other_info || "",
			location: opportunityPost.location || "",
			startDate: opportunityPost.start_date,
			endDate: opportunityPost.end_date,
			startDateFormatted: formatDate(opportunityPost.start_date),
			endDateFormatted: opportunityPost.end_date
				? formatDate(opportunityPost.end_date)
				: null,
			status: opportunityPost.status,
			createdAt: opportunityPost.create_at,
			updatedAt: opportunityPost.update_at,
			daysLeft,
			match,

			// Institution information
			institution: opportunityPost.institution
				? {
						id: opportunityPost.institution.institution_id,
						name: opportunityPost.institution.name,
						abbreviation: opportunityPost.institution.abbreviation,
						logo: opportunityPost.institution.logo,
						country: opportunityPost.institution.country,
						address: opportunityPost.institution.address,
						website: opportunityPost.institution.website,
						email: opportunityPost.institution.email,
						hotline: opportunityPost.institution.hotline,
						hotlineCode: opportunityPost.institution.hotline_code,
						about: opportunityPost.institution.about,
						coverImage: opportunityPost.institution.cover_image,
						type: opportunityPost.institution.type,
					}
				: null,

			// Program-specific information
			program: opportunityPost.programPost
				? {
						duration: opportunityPost.programPost.duration,
						degreeLevel: opportunityPost.programPost.degree_level,
						attendance: opportunityPost.programPost.attendance,
						courseInclude:
							opportunityPost.programPost.course_include,
						gpa: opportunityPost.programPost.gpa
							? parseFloat(
									opportunityPost.programPost.gpa.toString()
								)
							: null,
						gre: opportunityPost.programPost.gre,
						gmat: opportunityPost.programPost.gmat,
						tuitionFee: opportunityPost.programPost.tuition_fee
							? parseFloat(
									opportunityPost.programPost.tuition_fee.toString()
								)
							: null,
						tuitionFeeFormatted: opportunityPost.programPost
							.tuition_fee
							? formatCurrency(
									parseFloat(
										opportunityPost.programPost.tuition_fee.toString()
									)
								)
							: null,
						feeDescription:
							opportunityPost.programPost.fee_description,
						scholarshipInfo:
							opportunityPost.programPost.scholarship_info,
						certificates:
							opportunityPost.programPost.certificates.map(
								(cert) => ({
									id: cert.certificate_id,
									name: cert.name,
									score: cert.score,
								})
							),
					}
				: null,

			// Subdisciplines/Fields
			fields: opportunityPost.subdisciplines.map((ps) => ({
				subdisciplineId: ps.subdiscipline.subdiscipline_id,
				subdisciplineName: ps.subdiscipline.name,
				disciplineId: ps.subdiscipline.discipline.discipline_id,
				disciplineName: ps.subdiscipline.discipline.name,
				addedAt: ps.add_at,
			})),

			// Documents
			documents: opportunityPost.postDocs.map((doc) => ({
				id: doc.document_id,
				name: doc.name,
				description: doc.description,
				documentType: {
					id: doc.documentType.document_type_id,
					name: doc.documentType.name,
					description: doc.documentType.description,
				},
			})),

			// Statistics
			statistics: {
				applications: applicationStats,
				wishlistCount,
			},
		};

		return NextResponse.json(
			{
				success: true,
				data: programDetail,
			},
			{ status: 200 }
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching program details:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
