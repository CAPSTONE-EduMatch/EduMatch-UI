import { auth } from "@/config/auth";
import { prismaClient } from "../../../prisma/index";
import { randomUUID } from "crypto";

export interface UserDetailsFromDB {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	role: string | null;
	status: boolean | null;
	banned: boolean | null;
	banReason: string | null;
	banExpires: Date | null;
	applicant: {
		applicant_id: string;
		first_name: string | null;
		last_name: string | null;
		birthday: Date | null;
		gender: boolean | null;
		nationality: string | null;
		phone_number: string | null;
		graduated: boolean | null;
		level: string | null;
		gpa: any;
		university: string | null;
		documents: {
			document_id: string;
			name: string;
			url: string;
			size: number;
			upload_at: Date;
			documentType: {
				document_type_id: string;
				name: string;
				description: string | null;
			};
		}[];
	} | null;
}

export class AdminUserService {
	/**
	 * Get user details with applicant info and documents
	 */
	static async getUserDetails(
		userId: string
	): Promise<UserDetailsFromDB | null> {
		try {
			const user = await prismaClient.user.findUnique({
				where: {
					id: userId,
				},
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
					status: true,
					banned: true,
					banReason: true,
					banExpires: true,
					applicant: {
						include: {
							documents: {
								include: {
									documentType: true,
								},
								orderBy: {
									upload_at: "desc",
								},
							},
						},
					},
				},
			});

			return user as UserDetailsFromDB;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error(
					"Error fetching user details from database:",
					error
				);
			}
			throw new Error("Failed to fetch user details from database");
		}
	}

	/**
	 * Get applicant documents by user ID
	 */
	static async getApplicantDocuments(userId: string) {
		try {
			const applicant = await prismaClient.applicant.findFirst({
				where: {
					user_id: userId,
				},
				include: {
					documents: {
						include: {
							documentType: true,
						},
						orderBy: {
							upload_at: "desc",
						},
					},
				},
			});

			return applicant?.documents || [];
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error fetching applicant documents:", error);
			}
			throw new Error("Failed to fetch applicant documents");
		}
	}

	/**
	 * Ban a user account - hybrid approach with Better Auth + direct DB
	 */
	static async banUser(
		userId: string,
		banReason: string,
		banDuration?: number // Duration in days, undefined for permanent ban
	): Promise<boolean> {
		try {
			const banExpiresIn = banDuration
				? banDuration * 24 * 60 * 60
				: undefined; // Convert days to seconds

			// First, update database directly to ensure ban is recorded
			const banExpires = banDuration
				? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
				: null;

			await prismaClient.user.update({
				where: { id: userId },
				data: {
					banned: true,
					banReason: banReason,
					banExpires: banExpires,
				},
			});

			// Try to use Better Auth for session management (optional)
			try {
				await auth.api.banUser({
					body: {
						userId: userId,
						banReason: banReason,
						banExpiresIn: banExpiresIn,
					},
				});
			} catch (betterAuthError) {
				// If Better Auth fails, that's okay - the database is updated
				if (process.env.NODE_ENV === "development") {
					// eslint-disable-next-line no-console
					console.warn("Better Auth ban failed:", betterAuthError);
				}
			}

			// Revoke all sessions for the banned user
			try {
				await this.revokeUserSessions(userId);
			} catch (sessionError) {
				// If session revocation fails, log it but don't fail the ban
				if (process.env.NODE_ENV === "development") {
					// eslint-disable-next-line no-console
					console.warn(
						"Failed to revoke sessions for banned user:",
						sessionError
					);
				}
			}

			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error banning user:", error);
			}
			throw new Error("Failed to ban user");
		}
	}

	/**
	 * Unban a user account - hybrid approach with Better Auth + direct DB
	 */
	static async unbanUser(userId: string): Promise<boolean> {
		try {
			// First, update database directly to ensure unban is recorded
			await prismaClient.user.update({
				where: { id: userId },
				data: {
					banned: false,
					banReason: null,
					banExpires: null,
				},
			});

			// Try to use Better Auth for session management (optional)
			try {
				await auth.api.unbanUser({
					body: {
						userId: userId,
					},
				});
			} catch (betterAuthError) {
				// If Better Auth fails, that's okay - the database is updated
				if (process.env.NODE_ENV === "development") {
					// eslint-disable-next-line no-console
					console.warn("Better Auth unban failed:", betterAuthError);
				}
			}

			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error unbanning user:", error);
			}
			throw new Error("Failed to unban user");
		}
	}

	/**
	 * Revoke all sessions for a user - useful for banned users or security incidents
	 */
	static async revokeUserSessions(userId: string): Promise<boolean> {
		try {
			// Use Better Auth to revoke all sessions for the user
			await auth.api.revokeUserSessions({
				body: {
					userId: userId,
				},
			});

			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.log("All sessions revoked for user:", userId);
			}

			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error revoking user sessions:", error);
			}
			throw new Error("Failed to revoke user sessions");
		}
	}

	/**
	 * Check if user is currently banned
	 */
	static async isUserBanned(userId: string): Promise<boolean> {
		try {
			const user = await prismaClient.user.findUnique({
				where: { id: userId },
				select: { banned: true, banExpires: true },
			});

			if (!user) return false;

			// Check if user is banned and ban hasn't expired
			if (user.banned) {
				if (!user.banExpires) return true; // Permanent ban
				return user.banExpires > new Date(); // Temporary ban still active
			}

			return false;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error checking ban status:", error);
			}
			return false;
		}
	}

	/**
	 * Create a contact log (you might want to create a separate table for this)
	 */
	static async logContactAttempt(
		userId: string,
		adminId?: string
	): Promise<boolean> {
		try {
			// For now, we'll create a notification as a contact log
			// You might want to create a separate ContactLog table
			await prismaClient.notification.create({
				data: {
					notification_id: crypto.randomUUID(),
					user_id: userId,
					title: "Contact Attempt",
					body: adminId
						? `Administrator ${adminId} attempted to contact this user`
						: "Administrator attempted to contact this user",
					type: "ADMIN_CONTACT",
					send_at: new Date(),
					create_at: new Date(),
				},
			});

			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error logging contact attempt:", error);
			}
			throw new Error("Failed to log contact attempt");
		}
	}

	/**
	 * Transform database user data to frontend format
	 */
	static transformUserData(dbUser: UserDetailsFromDB) {
		if (!dbUser) return null;

		const applicant = dbUser.applicant;

		// Group documents by type
		const groupedDocuments = {
			researchPapers: [] as any[],
			transcripts: [] as any[],
			degrees: [] as any[],
			languageCertificates: [] as any[],
			cvResume: [] as any[],
		};

		if (applicant?.documents) {
			applicant.documents.forEach((doc) => {
				const transformedDoc = {
					name: doc.name,
					size: this.formatFileSize(doc.size),
					date: doc.upload_at.toISOString(),
					document_id: doc.document_id,
					url: doc.url,
				};

				// Categorize documents based on document type name
				const typeName = doc.documentType.name.toLowerCase();
				if (
					typeName.includes("research") ||
					typeName.includes("paper")
				) {
					groupedDocuments.researchPapers.push(transformedDoc);
				} else if (typeName.includes("transcript")) {
					groupedDocuments.transcripts.push(transformedDoc);
				} else if (
					typeName.includes("degree") ||
					typeName.includes("diploma")
				) {
					groupedDocuments.degrees.push(transformedDoc);
				} else if (
					typeName.includes("language") ||
					typeName.includes("ielts") ||
					typeName.includes("toefl")
				) {
					groupedDocuments.languageCertificates.push(transformedDoc);
				} else if (
					typeName.includes("cv") ||
					typeName.includes("resume")
				) {
					groupedDocuments.cvResume.push(transformedDoc);
				} else {
					// Default to CV/Resume category for unknown types
					groupedDocuments.cvResume.push(transformedDoc);
				}
			});
		}

		return {
			id: dbUser.id,
			name: applicant
				? `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim() ||
					dbUser.name ||
					"Unknown"
				: dbUser.name || "Unknown",
			email: dbUser.email,
			phone: applicant?.phone_number || "Not provided",
			nationality: applicant?.nationality || "Not specified",
			birthDate: applicant?.birthday
				? applicant.birthday.toLocaleDateString()
				: "Not provided",
			gender:
				applicant?.gender === null
					? "Not specified"
					: applicant?.gender
						? "Male"
						: "Female",
			profileImage: dbUser.image || "/profile.svg",
			program: applicant?.level || "Not specified",
			gpa: applicant?.gpa ? applicant.gpa.toString() : "Not provided",
			status: dbUser.status ? "Active" : "Inactive",
			university: applicant?.university || "Not specified",
			role: dbUser.role || "student",
			documents: groupedDocuments,
			banned: dbUser.banned || false,
			banReason: dbUser.banReason || null,
			banExpires: dbUser.banExpires || null,
		};
	}

	/**
	 * Activate a user (set status to true)
	 */
	static async activateUser(userId: string): Promise<boolean> {
		try {
			await prismaClient.user.update({
				where: { id: userId },
				data: { status: true },
			});
			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error activating user:", error);
			}
			throw new Error("Failed to activate user");
		}
	}

	/**
	 * Deactivate a user (set status to false)
	 */
	static async deactivateUser(userId: string): Promise<boolean> {
		try {
			await prismaClient.user.update({
				where: { id: userId },
				data: { status: false },
			});
			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error deactivating user:", error);
			}
			throw new Error("Failed to deactivate user");
		}
	}

	/**
	 * Approve an institution
	 */
	static async approveInstitution(
		userId: string,
		adminUserId?: string
	): Promise<boolean> {
		try {
			// Update institution verification status to approved
			await prismaClient.institution.updateMany({
				where: { user_id: userId },
				data: {
					verification_status: "APPROVED",
					verified_at: new Date(),
					verified_by: adminUserId || null,
					status: true, // Also set general status to active
				},
			});
			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error approving institution:", error);
			}
			throw new Error("Failed to approve institution");
		}
	}

	/**
	 * Deny an institution
	 */
	static async denyInstitution(
		userId: string,
		rejectionReason?: string,
		adminUserId?: string
	): Promise<boolean> {
		try {
			// Update institution verification status to rejected
			await prismaClient.institution.updateMany({
				where: { user_id: userId },
				data: {
					verification_status: "REJECTED",
					rejection_reason: rejectionReason || null,
					verified_at: new Date(),
					verified_by: adminUserId || null,
					status: false, // Also set general status to inactive
				},
			});
			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error denying institution:", error);
			}
			throw new Error("Failed to deny institution");
		}
	}

	/**
	 * Log a request for additional information from an institution
	 */
	static async logAdditionalInfoRequest(
		userId: string,
		note: string,
		adminId?: string
	): Promise<boolean> {
		try {
			await prismaClient.notification.create({
				data: {
					notification_id: randomUUID(),
					user_id: userId,
					title: "Additional Information Required",
					body: `Administrator ${adminId || "Unknown"} requires additional information: ${note}`,
					type: "ADMIN_ADDITIONAL_INFO",
					send_at: new Date(),
					create_at: new Date(),
				},
			});
			return true;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.error("Error logging additional info request:", error);
			}
			throw new Error("Failed to log additional info request");
		}
	}

	/**
	 * Format file size in bytes to human readable format
	 */
	private static formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";

		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
	}
}
