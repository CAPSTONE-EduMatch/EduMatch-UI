import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prismaClient } from "../../../../../../prisma/index";

// Status transition rules for admin
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ["PROGRESSING", "PUBLISHED", "REJECTED"],
	SUBMITTED: ["PROGRESSING", "PUBLISHED", "REJECTED"],
	UPDATED: ["PROGRESSING", "PUBLISHED", "REJECTED"],
	PROGRESSING: ["PUBLISHED", "REJECTED"],
	PUBLISHED: ["CLOSED"],
	REJECTED: ["SUBMITTED", "PUBLISHED"],
	CLOSED: ["SUBMITTED", "PUBLISHED"],
};

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await requireAuth();

		const postId = params.id;

		if (!postId) {
			return NextResponse.json(
				{
					success: false,
					error: "Post ID is required",
				},
				{ status: 400 }
			);
		}

		const post = await prismaClient.opportunityPost.findUnique({
			where: {
				post_id: postId,
			},
			include: {
				institution: {
					include: {
						user: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: {
							include: {
								discipline: true,
							},
						},
					},
				},
				postDocs: {
					include: {
						documentType: true,
					},
				},
				programPost: {
					include: {
						certificates: true,
					},
				},
				scholarshipPost: true,
				jobPost: true,
			},
		});

		if (!post) {
			return NextResponse.json(
				{
					success: false,
					error: "Post not found",
				},
				{ status: 404 }
			);
		}

		let postType = "Unknown";
		if (post.programPost) postType = "Program";
		else if (post.scholarshipPost) postType = "Scholarship";
		else if (post.jobPost) postType = "Research Lab";

		// Map all subdisciplines
		const subdisciplines = post.subdisciplines.map((ps) => ({
			id: ps.subdiscipline.subdiscipline_id,
			name: ps.subdiscipline.name,
			discipline: ps.subdiscipline.discipline
				? {
						id: ps.subdiscipline.discipline.discipline_id,
						name: ps.subdiscipline.discipline.name,
					}
				: null,
		}));

		// Map required documents
		const documents = post.postDocs.map((pd) => ({
			id: pd.document_id,
			name: pd.name,
			description: pd.description,
			type: pd.documentType.name,
			typeDescription: pd.documentType.description,
		}));

		// Calculate days left until deadline
		const now = new Date();
		const daysLeft = post.end_date
			? Math.max(
					0,
					Math.ceil(
						(post.end_date.getTime() - now.getTime()) /
							(1000 * 60 * 60 * 24)
					)
				)
			: null;

		// Format dates
		const formatDate = (date: Date | null) => {
			if (!date) return null;
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		};

		const transformedPost = {
			id: post.post_id,
			title: post.title,
			description: post.description,
			type: postType,
			status: post.status,
			rejectionReason: post.rejection_reason,
			startDate: post.start_date,
			endDate: post.end_date,
			startDateFormatted: formatDate(post.start_date),
			endDateFormatted: formatDate(post.end_date),
			daysLeft: daysLeft,
			location: post.location,
			otherInfo: post.other_info,
			degreeLevel: post.degree_level,
			createdAt: post.create_at,
			updatedAt: post.update_at,
			institution: post.institution
				? {
						id: post.institution.institution_id,
						name: post.institution.name,
						logo: post.institution.logo,
						website: post.institution.website,
						country: post.institution.country,
						description: post.institution.about,
						email: post.institution.email,
						hotline: post.institution.hotline,
						hotlineCode: post.institution.hotline_code,
						address: post.institution.address,
						coverImage: post.institution.cover_image,
					}
				: null,
			subdisciplines: subdisciplines,
			documents: documents,
		};

		if (postType === "Program" && post.programPost) {
			(transformedPost as any).program = {
				id: post.programPost.post_id,
				duration: post.programPost.duration,
				attendance: post.programPost.attendance,
				degreeLevel: post.degree_level,
				courseInclude: post.programPost.course_include,
				gpa: post.programPost.gpa?.toString(),
				gre: post.programPost.gre,
				gmat: post.programPost.gmat,
				tuitionFee: post.programPost.tuition_fee?.toString(),
				tuitionFeeFormatted: post.programPost.tuition_fee
					? `$${parseFloat(
							post.programPost.tuition_fee.toString()
						).toLocaleString()}`
					: null,
				feeDescription: post.programPost.fee_description,
				scholarshipInfo: post.programPost.scholarship_info,
				languageRequirement: post.programPost.language_requirement,
				certificates: post.programPost.certificates.map((cert) => ({
					id: cert.certificate_id,
					name: cert.name,
					score: cert.score,
				})),
			};
		} else if (postType === "Scholarship" && post.scholarshipPost) {
			(transformedPost as any).scholarship = {
				id: post.scholarshipPost.post_id,
				description: post.scholarshipPost.description,
				type: post.scholarshipPost.type,
				number: post.scholarshipPost.number,
				grant: post.scholarshipPost.grant,
				scholarshipCoverage: post.scholarshipPost.scholarship_coverage,
				essayRequired: post.scholarshipPost.essay_required,
				eligibility: post.scholarshipPost.eligibility,
				awardAmount: post.scholarshipPost.award_amount?.toString(),
				awardDuration: post.scholarshipPost.award_duration,
				renewable: post.scholarshipPost.renewable,
			};
		} else if (postType === "Research Lab" && post.jobPost) {
			(transformedPost as any).researchLab = {
				id: post.jobPost.post_id,
				contractType: post.jobPost.contract_type,
				attendance: post.jobPost.attendance,
				jobType: post.jobPost.job_type,
				minSalary: post.jobPost.min_salary?.toString(),
				maxSalary: post.jobPost.max_salary?.toString(),
				salaryDescription: post.jobPost.salary_description,
				benefit: post.jobPost.benefit,
				mainResponsibility: post.jobPost.main_responsibility,
				qualificationRequirement:
					post.jobPost.qualification_requirement,
				experienceRequirement: post.jobPost.experience_requirement,
				assessmentCriteria: post.jobPost.assessment_criteria,
				otherRequirement: post.jobPost.other_requirement,
				academicBackground: post.jobPost.academic_background,
				applicationDocuments: post.jobPost.application_documents,
				researchAreas: post.jobPost.research_areas,
				technicalSkills: post.jobPost.technical_skills,
			};
		}

		return NextResponse.json({
			success: true,
			data: transformedPost,
		});
	} catch (error) {
		console.error("Error fetching admin post:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await requireAuth();

		const postId = params.id;
		const body = await request.json();

		if (!postId) {
			return NextResponse.json(
				{
					success: false,
					error: "Post ID is required",
				},
				{ status: 400 }
			);
		}

		const { status, rejectionReason } = body;

		const validStatuses = [
			"DRAFT",
			"PUBLISHED",
			"CLOSED",
			"REJECTED",
			"SUBMITTED",
			"UPDATED",
			"DELETED",
			"PROGRESSING",
		];
		if (status && !validStatuses.includes(status)) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Invalid status. Must be one of: " +
						validStatuses.join(", "),
				},
				{ status: 400 }
			);
		}

		// Get current post to validate status transition and get institution info
		const currentPost = await prismaClient.opportunityPost.findUnique({
			where: { post_id: postId },
			include: {
				institution: {
					include: {
						user: true,
					},
				},
				programPost: true,
				scholarshipPost: true,
				jobPost: true,
			},
		});

		if (!currentPost) {
			return NextResponse.json(
				{
					success: false,
					error: "Post not found",
				},
				{ status: 404 }
			);
		}

		// Validate status transition
		// Allow PROGRESSING transition from any status (admin workflow)
		// Skip validation for PROGRESSING status as it's an internal workflow status
		const currentStatus = currentPost.status;
		if (status && status !== "PROGRESSING") {
			const allowedTransitions =
				ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

			if (!allowedTransitions.includes(status)) {
				return NextResponse.json(
					{
						success: false,
						error: `Cannot change status from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(", ") || "none"}`,
					},
					{ status: 400 }
				);
			}
		}

		// Require rejection reason when status is REJECTED
		if (status === "REJECTED" && !rejectionReason?.trim()) {
			return NextResponse.json(
				{
					success: false,
					error: "Rejection reason is required when rejecting a post",
				},
				{ status: 400 }
			);
		}

		// Update post with status and rejection reason
		const updatedPost = await prismaClient.opportunityPost.update({
			where: {
				post_id: postId,
			},
			data: {
				...(status && { status }),
				// Set rejection reason when REJECTED, clear it when changing from REJECTED to another status
				rejection_reason:
					status === "REJECTED"
						? rejectionReason
						: currentStatus === "REJECTED"
							? null
							: undefined,
				update_at: new Date(),
			},
		});

		// Create notification for institution user
		// Only send notifications/emails for status changes that matter to institutions
		// PROGRESSING is an internal workflow status and shouldn't trigger notifications
		if (
			status &&
			status !== "PROGRESSING" &&
			currentPost.institution?.user
		) {
			const institutionUser = currentPost.institution.user;

			// Determine post type
			let postType = "Post";
			if (currentPost.programPost) postType = "Program";
			else if (currentPost.scholarshipPost) postType = "Scholarship";
			else if (currentPost.jobPost) postType = "Research Lab";

			// Generate correct URL based on post type
			const getPostUrl = (type: string, id: string) => {
				if (type === "Program") {
					return `/institution/dashboard/programmes/${id}`;
				} else if (type === "Scholarship") {
					return `/institution/dashboard/scholarships/${id}`;
				} else if (type === "Research Lab") {
					return `/institution/dashboard/reseach-labs/${id}`;
				}
				return `/institution/posts/${id}`; // fallback
			};

			const getPostUrlFull = (type: string, id: string) => {
				const baseUrl =
					process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
					"https://dev.d1jaxpbx3axxsh.amplifyapp.com";
				return `${baseUrl}${getPostUrl(type, id)}`;
			};

			// Get status label
			const statusLabels: Record<string, string> = {
				PUBLISHED: "Published",
				CLOSED: "Closed",
				REJECTED: "Rejected",
				SUBMITTED: "Submitted",
				PROGRESSING: "In Progress",
			};
			const statusLabel = statusLabels[status] || status;

			// Build notification body
			let notificationBody = `Your ${postType.toLowerCase()} "${currentPost.title}" has been ${statusLabel.toLowerCase()}.`;
			if (status === "REJECTED" && rejectionReason) {
				notificationBody += ` Reason: ${rejectionReason}`;
			}

			await prismaClient.notification.create({
				data: {
					notification_id: uuidv4(),
					user_id: institutionUser.id,
					type: "POST_STATUS_UPDATE",
					title: `${postType} ${statusLabel}`,
					body: notificationBody,
					url: getPostUrl(postType, postId),
					send_at: new Date(),
					create_at: new Date(),
				},
			});

			// Send email notification via SQS using utility function
			try {
				const { NotificationUtils } = await import(
					"@/services/messaging/sqs-handlers"
				);

				const postUrl = getPostUrlFull(postType, postId);

				await NotificationUtils.sendPostStatusUpdateNotification(
					institutionUser.id,
					institutionUser.email,
					postId,
					currentPost.title,
					postType as "Program" | "Scholarship" | "Research Lab",
					currentPost.institution.name,
					currentStatus,
					status,
					postUrl,
					status === "REJECTED" ? rejectionReason : undefined
				);
			} catch (emailError) {
				// Log error but don't fail the request
				console.error("Failed to send email notification:", emailError);
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				id: updatedPost.post_id,
				status: updatedPost.status,
				rejectionReason: updatedPost.rejection_reason,
				updatedAt: updatedPost.update_at,
			},
		});
	} catch (error) {
		console.error("Error updating admin post:", error);

		if (
			error instanceof Error &&
			error.message.includes("Record to update not found")
		) {
			return NextResponse.json(
				{
					success: false,
					error: "Post not found",
				},
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
