import { SimilarityService } from "@/services/similarity/similarity-service";
import { requireAuth } from "@/utils/auth/auth-utils";
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

// Helper function to calculate real match percentage based on similarity
async function calculateMatchPercentage(
	postId: string,
	userId?: string
): Promise<string> {
	if (!userId) {
		// No authenticated user, return 0%
		return "0%";
	}

	try {
		// Get applicant embedding
		const applicant = await prismaClient.applicant.findFirst({
			where: { user_id: userId },
			select: { embedding: true },
		});

		if (!applicant?.embedding) {
			// No applicant embedding, return 0%
			return "0%";
		}

		// Get job post embedding (research position)
		const jobPost = await prismaClient.jobPost.findUnique({
			where: { post_id: postId },
			select: { embedding: true },
		});

		if (!jobPost?.embedding) {
			// No post embedding, return 0%
			return "0%";
		}

		// Calculate similarity
		const similarity = SimilarityService.calculateCosineSimilarity(
			applicant.embedding as number[],
			jobPost.embedding as number[]
		);

		return SimilarityService.similarityToMatchPercentage(similarity);
	} catch (error) {
		// Log error for debugging but don't throw
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error calculating match percentage:", error);
		}
		return "0%";
	}
}

// Helper function to format currency with commas
function formatCurrency(amount: any): string {
	if (!amount) return "0";
	const num =
		typeof amount === "string"
			? parseFloat(amount)
			: typeof amount === "number"
				? amount
				: parseFloat(amount.toString()); // Handle Prisma Decimal
	if (isNaN(num)) return "0";
	return num.toLocaleString("en-US");
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ message: "Research Lab ID is required" },
				{ status: 400 }
			);
		}

		// Get user from session (if authenticated)
		let userId: string | undefined;
		try {
			const { user } = await requireAuth();
			userId = user.id;
		} catch (error) {
			// User not authenticated, will use default scores
		}

		// Query the opportunity post with job data for research lab
		// Note: Not filtering by status to allow institutions to view their own research labs regardless of status
		const post = await prismaClient.opportunityPost.findUnique({
			where: {
				post_id: id,
			},
			include: {
				institution: {
					select: {
						institution_id: true,
						user_id: true,
						name: true,
						abbreviation: true,
						logo: true,
						country: true,
						website: true,
						about: true,
						verification_status: true,
						deleted_at: true,
					},
				},
				jobPost: true,
				applications: {
					select: {
						application_id: true,
					},
				},
				postDocs: {
					include: {
						documentType: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: true,
					},
				},
			},
		});

		if (!post || !post.jobPost) {
			return NextResponse.json(
				{ message: "Research Lab not found" },
				{ status: 404 }
			);
		}

		// Verify this is a job post (research labs use JobPost model)
		const jobData = post.jobPost;

		// JobPost exists means it's a valid job posting (could be research lab or other job)
		// We'll accept any job post for research lab detail page

		// Format research lab data
		const daysLeft = post.end_date ? calculateDaysLeft(post.end_date) : 0;
		const match = await calculateMatchPercentage(id, userId);

		// Format salary display
		const formatSalary = () => {
			if (jobData.min_salary && jobData.max_salary) {
				return `$${formatCurrency(jobData.min_salary)} - $${formatCurrency(jobData.max_salary)}`;
			} else if (jobData.min_salary) {
				return `From $${formatCurrency(jobData.min_salary)}`;
			} else if (jobData.max_salary) {
				return `Up to $${formatCurrency(jobData.max_salary)}`;
			}
			//  else if (jobData.salary_description) {
			// 	return jobData.salary_description;
			// }
			return "Competitive";
		};

		const researchLab = {
			id: post.post_id,
			title: post.title,
			description: jobData?.main_responsibility || post.other_info || "",
			organization: post.institution?.name || "",
			university: post.institution?.name || "",
			country: post.institution?.country || "",
			date: post.end_date
				? new Date(post.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",
			daysLeft,
			salary: formatSalary(),
			match,
			otherInfo: post.other_info || "",
			applicationCount: post.applications.length,
			jobType: jobData?.job_type || "Researcher",
			professorName: jobData?.professor_name || "",
			contractType: jobData?.contract_type || "",
			attendance: jobData?.attendance || "",
			location: post.location || "",
			startDate: post.start_date
				? new Date(post.start_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",
			applicationDeadline: post.end_date
				? new Date(post.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})
				: "",

			// Job Description Details
			// Get research fields from subdisciplines (join table) - these are the actual names
			researchFields: post.subdisciplines
				? post.subdisciplines
						.map((sd) => sd.subdiscipline?.name || "")
						.filter((name) => name !== "")
				: [],
			researchFocus: jobData?.research_focus || "",
			researchExperience: jobData?.research_experience || "",
			researchProposal: jobData?.research_proposal || "",
			technicalSkills: jobData?.technical_skills || "",
			academicBackground: jobData?.academic_background || "",

			// Offer Information
			benefit: jobData?.benefit || "",
			salaryDescription: jobData?.salary_description || "",

			// Job Requirements
			mainResponsibility: jobData?.main_responsibility || "",
			qualificationRequirement: jobData?.qualification_requirement || "",
			experienceRequirement: jobData?.experience_requirement || "",
			assessmentCriteria: jobData?.assessment_criteria || "",
			otherRequirement: jobData?.other_requirement || "",

			// Lab Information
			labType: jobData?.lab_type || "",
			labDirector: jobData?.lab_director || "",
			labCapacity: jobData?.lab_capacity || 0,
			labFacilities: jobData?.lab_facilities || "",
			labWebsite: jobData?.lab_website || "",
			labContactEmail: jobData?.lab_contact_email || "",
			recommendations: jobData?.recommendations || "",
			applicationDocuments: jobData?.application_documents || "",

			institution: {
				id: post.institution?.institution_id,
				userId: post.institution?.user_id,
				name: post.institution?.name,
				abbreviation: post.institution?.abbreviation,
				logo: post.institution?.logo,
				country: post.institution?.country,
				website: post.institution?.website,
				about: post.institution?.about,
				status: post.institution?.verification_status,
				deletedAt: post.institution?.deleted_at?.toISOString() || null,
			},
			requiredDocuments: post.postDocs.map((doc) => ({
				id: doc.document_id,
				name: doc.name || "",
				description: doc.description || "",
			})),
			subdisciplines: post.subdisciplines.map((sd) => ({
				id: sd.subdiscipline?.subdiscipline_id,
				name: sd.subdiscipline?.name || "",
			})),
			status: post.status || "DRAFT",
		};

		return NextResponse.json(
			{
				success: true,
				data: researchLab,
			},
			{ status: 200 }
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching research lab detail:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
