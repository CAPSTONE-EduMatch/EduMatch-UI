import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
	try {
		const { to, subject, html, from } = await request.json();

		// Validate required fields
		if (!to || !subject || !html) {
			return NextResponse.json(
				{ error: "Missing required fields: to, subject, html" },
				{ status: 400 }
			);
		}

		// Create transporter using the same configuration as your auth.ts
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT) || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		const mailOptions = {
			from: from || process.env.SMTP_FROM || "noreply@edumatch.com",
			to,
			subject,
			html,
		};

		// Send email
		const info = await transporter.sendMail(mailOptions);

		return NextResponse.json({
			success: true,
			messageId: info.messageId,
			message: "Email sent successfully",
		});
	} catch (error) {
		console.error("Error sending email:", error);
		return NextResponse.json(
			{
				error: "Failed to send email",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
