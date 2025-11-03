import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma/index";
import { EmailService } from "@/services/email/email-service";
import { requireAuth } from "@/utils/auth/auth-utils";

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

type SupportBody = {
	problemType?: string;
	question?: string;
	email?: string; // provided when guest
};

async function resolveManagerUserId(): Promise<string | null> {
	// Prefer admin defined by env
	if (process.env.ADMIN_EMAIL) {
		const adminByEnv = await prismaClient.user.findFirst({
			where: { email: process.env.ADMIN_EMAIL },
			select: { id: true },
		});
		if (adminByEnv?.id) return adminByEnv.id;
	}

	// Fallback to any user with role = "admin"
	const adminUser = await prismaClient.user.findFirst({
		where: { role: "admin" },
		select: { id: true },
	});
	if (adminUser?.id) return adminUser.id;

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const contentType = request.headers.get("content-type") || "";
		let problemType: string;
		let question: string;
		let guestEmail: string;
		let emailAttachments: Array<{
			filename: string;
			content: Buffer;
			contentType?: string;
		}> = [];
		if (contentType.includes("multipart/form-data")) {
			const form = await request.formData();
			problemType = (
				(form.get("problemType") as string) || "other"
			).toString();
			question = ((form.get("question") as string) || "")
				.toString()
				.trim();
			guestEmail = ((form.get("email") as string) || "")
				.toString()
				.trim();
			const files = form.getAll("files");
			for (const f of files) {
				if (f instanceof File) {
					const arrayBuffer = await f.arrayBuffer();
					emailAttachments.push({
						filename: f.name,
						content: Buffer.from(arrayBuffer),
						contentType: f.type || undefined,
					});
				}
			}
		} else {
			const body = (await request.json()) as SupportBody;
			problemType = (body.problemType || "other").toString();
			question = (body.question || "").toString().trim();
			guestEmail = (body.email || "").toString().trim();
		}

		if (!question) {
			return NextResponse.json(
				{ error: "Question is required" },
				{ status: 400 }
			);
		}

		// Try to get session, but allow guests
		let userId: string | null = null;
		let userEmail: string | null = null;
		try {
			const session = await requireAuth();
			userId = session?.user?.id || null;
			userEmail = session?.user?.email || null;
		} catch (_) {
			userId = null;
			userEmail = null;
		}

		// If guest, require email
		const senderEmail = userEmail || guestEmail;
		if (!senderEmail) {
			return NextResponse.json(
				{ error: "Email is required for guests" },
				{ status: 400 }
			);
		}

		// Link to applicant or institution when possible
		let applicantId: string | undefined = undefined;
		let institutionId: string | undefined = undefined;
		if (userId) {
			const [applicant, institution] = await Promise.all([
				prismaClient.applicant.findUnique({
					where: { user_id: userId },
					select: { applicant_id: true },
				}),
				prismaClient.institution.findUnique({
					where: { user_id: userId },
					select: { institution_id: true },
				}),
			]);

			if (applicant?.applicant_id) applicantId = applicant.applicant_id;
			if (institution?.institution_id)
				institutionId = institution.institution_id;
		}

		// Determine manager id (required by schema)
		let managerId = await resolveManagerUserId();
		if (!managerId && userId) {
			// Last resort: assign to the requester
			managerId = userId;
		}

		if (!managerId) {
			await EmailService.sendCompanyEmail(
				process.env.SUPPORT_RECEIVER_EMAIL ||
					"tuantran12032004@gmail.com",
				`Support Request: ${problemType}`,
				{
					title: "New Support Request",
					preheader: `Support request from ${senderEmail}`,
					bodyHtml: `
						<p><strong>Problem type:</strong> ${escapeHtml(problemType)}</p>
						<p><strong>From:</strong> ${escapeHtml(senderEmail)}</p>
						<p><strong>Authenticated:</strong> ${userId ? "Yes" : "No"}</p>
						<pre style=\"white-space:pre-wrap;font-family:inherit;\">${escapeHtml(question)}</pre>
					`,
					helpCenterUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://edumatch.app"}/support`,
				},
				emailAttachments.length ? emailAttachments : undefined
			);

			return NextResponse.json({ success: true, stored: false });
		}

		// Store support in DB
		const supportId = crypto.randomUUID();
		const now = new Date();
		const contentPayload = {
			problemType,
			question,
			senderEmail,
			isAuthenticated: !!userId,
			createdAt: now.toISOString(),
		};

		const created = await prismaClient.supportRequirement.create({
			data: {
				support_id: supportId,
				applicant_id: applicantId,
				institution_id: institutionId,
				content: JSON.stringify({
					...contentPayload,
					attachments: emailAttachments.map((a) => a.filename),
				}),
				create_at: now,
				status: true,
				manager_id: managerId,
			},
		});

		await EmailService.sendCompanyEmail(
			process.env.SUPPORT_RECEIVER_EMAIL || "tuantran12032004@gmail.com",
			`Support Request: ${problemType}`,
			{
				title: "New Support Request",
				preheader: `Support request from ${senderEmail}`,
				bodyHtml: `
					<p><strong>Problem type:</strong> ${escapeHtml(problemType)}</p>
					<p><strong>From:</strong> ${escapeHtml(senderEmail)}</p>
					<p><strong>Authenticated:</strong> ${userId ? "Yes" : "No"}</p>
					${applicantId ? `<p><strong>Applicant ID:</strong> ${escapeHtml(applicantId)}</p>` : ""}
					${institutionId ? `<p><strong>Institution ID:</strong> ${escapeHtml(institutionId)}</p>` : ""}
					<hr style=\"border:none;height:1px;background:#e5e7eb;margin:12px 0;\" />
					<pre style=\"white-space:pre-wrap;font-family:inherit;\">${escapeHtml(question)}</pre>
				`,
				helpCenterUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://edumatch.app"}/support`,
			},
			emailAttachments.length ? emailAttachments : undefined
		);

		return NextResponse.json({
			success: true,
			stored: true,
			id: created.support_id,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error handling support request:", error);
		return NextResponse.json(
			{ error: "Failed to submit support request" },
			{ status: 500 }
		);
	}
}
