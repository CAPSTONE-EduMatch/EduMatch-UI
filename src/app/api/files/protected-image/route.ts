import { requireAuth } from "@/utils/auth/auth-utils";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";
import { checkMessagingRelationshipInAppSync } from "@/utils/files/checkMessagingRelationship";

const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-file-12";

// In-memory cache for permission checks
// Key: `${userId}:${s3Key}`, Value: { allowed: boolean, timestamp: number }
const permissionCache = new Map<
	string,
	{ allowed: boolean; timestamp: number }
>();
const PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if permission is cached and still valid
 */
function getCachedPermission(userId: string, s3Key: string): boolean | null {
	const cacheKey = `${userId}:${s3Key}`;
	const cached = permissionCache.get(cacheKey);
	if (cached) {
		const now = Date.now();
		if (now - cached.timestamp < PERMISSION_CACHE_TTL) {
			return cached.allowed;
		}
		// Cache expired, remove it
		permissionCache.delete(cacheKey);
	}
	return null;
}

/**
 * Cache permission result
 */
function setCachedPermission(
	userId: string,
	s3Key: string,
	allowed: boolean
): void {
	const cacheKey = `${userId}:${s3Key}`;
	permissionCache.set(cacheKey, {
		allowed,
		timestamp: Date.now(),
	});
}

/**
 * Extract S3 key from various URL formats
 */
function extractS3Key(url: string): string | null {
	try {
		// Handle s3:// protocol
		if (url.startsWith("s3://")) {
			const parts = url.replace("s3://", "").split("/");
			parts.shift(); // Remove bucket name
			return parts.join("/");
		}

		// Handle https://bucket.s3.region.amazonaws.com/key format
		if (url.includes(".s3.") && url.includes(".amazonaws.com/")) {
			const urlObj = new URL(url);
			// Remove query parameters (pre-signed URL params) for ownership check
			return urlObj.pathname.substring(1); // Remove leading slash
		}

		// Handle direct key (assume it's already a key)
		if (!url.startsWith("http")) {
			return url;
		}

		// Handle https://bucket.s3.amazonaws.com/key format (without region)
		if (url.includes(".s3.amazonaws.com/")) {
			const urlObj = new URL(url);
			return urlObj.pathname.substring(1);
		}

		return null;
	} catch (error) {
		return null;
	}
}

/**
 * GET /api/files/protected-image
 * Generate a pre-signed URL for protected image access
 *
 * Query parameters:
 * - url: The S3 URL or key of the image
 * - expiresIn: Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const imageUrl = searchParams.get("url");
		const expiresInParam = searchParams.get("expiresIn");

		if (!imageUrl) {
			return NextResponse.json(
				{ error: "Image URL is required" },
				{ status: 400 }
			);
		}

		// Extract S3 key from URL
		const s3Key = extractS3Key(imageUrl);

		if (!s3Key) {
			return NextResponse.json(
				{ error: "Invalid image URL format" },
				{ status: 400 }
			);
		}

		// Check if this is a public institution image (cover image or logo)
		// Institution images should be publicly accessible for unauthenticated users
		const keyParts = s3Key.split("/");

		// Check if path starts with "institutions"
		const isInInstitutionsFolder = keyParts[0] === "institutions";

		// Check if this S3 key matches any institution's logo or cover_image in the database
		// This allows public access to institution images without authentication
		let isInstitutionImage = isInInstitutionsFolder;

		if (!isInstitutionImage) {
			// Check database to see if this URL is used as an institution logo or cover image
			try {
				// Strategy 1: Check if file is in a user's uploads folder and that user is an institution
				if (
					keyParts.length >= 3 &&
					keyParts[0] === "users" &&
					keyParts[2] === "uploads"
				) {
					const userId = keyParts[1];
					const user = await prismaClient.user.findUnique({
						where: { id: userId },
						select: {
							role_id: true,
							institution: {
								select: {
									institution_id: true,
									logo: true,
									cover_image: true,
								},
							},
						},
					});

					// If user is an institution, check if this file matches their logo or cover_image
					if (user?.institution) {
						const inst = user.institution;
						// Check if the S3 key or URL matches the institution's logo or cover_image
						const logoMatches =
							inst.logo &&
							(inst.logo === imageUrl ||
								inst.logo.includes(s3Key) ||
								s3Key.includes(extractS3Key(inst.logo) || ""));
						const coverMatches =
							inst.cover_image &&
							(inst.cover_image === imageUrl ||
								inst.cover_image.includes(s3Key) ||
								s3Key.includes(
									extractS3Key(inst.cover_image) || ""
								));

						if (logoMatches || coverMatches) {
							isInstitutionImage = true;
						}
					}
				}

				// Strategy 2: Direct database query for exact or partial URL matches
				if (!isInstitutionImage) {
					const institution =
						await prismaClient.institution.findFirst({
							where: {
								OR: [
									{ logo: imageUrl },
									{ cover_image: imageUrl },
									{ logo: { contains: s3Key } },
									{ cover_image: { contains: s3Key } },
								],
							},
							select: {
								institution_id: true,
							},
						});

					if (institution) {
						isInstitutionImage = true;
					}
				}
			} catch (error) {
				// If database check fails, continue with other checks
				// Don't block access, just log the error
			}
		}

		// For institution images, allow public access without authentication
		if (isInstitutionImage) {
			// Parse expiration time (default: 1 hour, max: 7 days)
			let expiresIn = 3600; // 1 hour default
			if (expiresInParam) {
				const parsed = parseInt(expiresInParam, 10);
				if (!isNaN(parsed) && parsed > 0) {
					// Clamp between 1 second and 7 days (604800 seconds)
					expiresIn = Math.min(Math.max(parsed, 1), 604800);
				}
			}

			// Create GetObject command
			const command = new GetObjectCommand({
				Bucket: BUCKET_NAME,
				Key: s3Key,
			});

			// Generate pre-signed URL
			const presignedUrl = await getSignedUrl(s3Client, command, {
				expiresIn,
			});

			return NextResponse.json({
				url: presignedUrl,
				expiresIn,
				expiresAt: new Date(
					Date.now() + expiresIn * 1000
				).toISOString(),
			});
		}

		// For non-institution images, require authentication
		let user;
		try {
			const authResult = await requireAuth();
			user = authResult.user;
		} catch (error) {
			// Authentication failed
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// SECURITY CHECK: Ownership validation for user files
		if (keyParts.length >= 2 && keyParts[0] === "users") {
			const fileOwnerId = keyParts[1];

			// Check cache first
			const cachedPermission = getCachedPermission(user.id, s3Key);
			if (cachedPermission !== null) {
				if (cachedPermission) {
					// Permission granted, continue to generate URL
					// eslint-disable-next-line no-console
					console.log(
						`[Protected Image] ✅ Cached permission: User ${user.id} accessing ${s3Key}`
					);
				} else {
					// Permission denied, return error
					// eslint-disable-next-line no-console
					console.log(
						`[Protected Image] 🚫 Cached denial: User ${user.id} accessing ${s3Key}`
					);
					return NextResponse.json(
						{
							error: "You don't have permission to access this file",
						},
						{ status: 403 }
					);
				}
			} else {
				// No cache, perform full permission check
				// eslint-disable-next-line no-console
				console.log(
					`[Protected Image] Access check: User ${user.id} (${user.role}) accessing file ${s3Key} owned by ${fileOwnerId}`
				);

				// Allow access if:
				// 1. User owns the file, OR
				// 2. Users are messaging each other (for any files in user folder), OR
				// 3. User is admin/institution (can access applicant files) - only if no messaging relationship
				if (fileOwnerId !== user.id) {
					const isAuthorizedRole =
						user.role === "admin" ||
						user.role === "institution" ||
						user.role === "moderator";

					// Always check for messaging relationship first (regardless of role)
					// Check AppSync for thread relationship
					let hasMessagingRelationship = false;
					try {
						hasMessagingRelationship =
							await checkMessagingRelationshipInAppSync(
								user.id,
								fileOwnerId
							);
						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] AppSync Thread check: ${hasMessagingRelationship ? "Found" : "Not found"}`
						);
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error(
							"[Protected Image] Error checking AppSync threads:",
							error
						);
						// Fail closed for messaging check errors
						hasMessagingRelationship = false;
					}

					// If no messaging relationship, check role-based permissions
					if (!hasMessagingRelationship) {
						// For authorized roles, allow access to applicant files
						// But we need to check if the file owner is an applicant
						if (isAuthorizedRole) {
							// Check if file owner is an applicant
							const fileOwner =
								await prismaClient.user.findUnique({
									where: { id: fileOwnerId },
									select: {
										role: true,
										applicant: {
											select: {
												applicant_id: true,
											},
										},
									},
								});

							// eslint-disable-next-line no-console
							console.log(
								`[Protected Image] File owner check: ${fileOwner?.role || "unknown"} - Has applicant: ${!!fileOwner?.applicant}`
							);

							// Only allow if file owner is an applicant (not another institution)
							if (
								fileOwner?.role === "applicant" ||
								fileOwner?.applicant
							) {
								// Allow access - institution/admin can access applicant files
								// eslint-disable-next-line no-console
								console.log(
									`[Protected Image] ✅ Allowed: Authorized role accessing applicant file`
								);
								// Cache the permission result (allowed)
								setCachedPermission(user.id, s3Key, true);
							} else {
								// eslint-disable-next-line no-console
								console.warn(
									`[Protected Image] 🚫 Denied: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId} (${fileOwner?.role}). No messaging relationship and not an applicant file.`
								);
								// Cache the denial
								setCachedPermission(user.id, s3Key, false);
								return NextResponse.json(
									{
										error: "You don't have permission to access this file",
									},
									{ status: 403 }
								);
							}
						} else {
							// No messaging relationship and not an authorized role - deny access
							// eslint-disable-next-line no-console
							console.warn(
								`[Protected Image] 🚫 Denied: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId}. Has messaging relationship: ${hasMessagingRelationship}`
							);
							// Cache the denial
							setCachedPermission(user.id, s3Key, false);
							return NextResponse.json(
								{
									error: "You don't have permission to access this file",
								},
								{ status: 403 }
							);
						}
					} else {
						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] ✅ Allowed: Messaging relationship exists in AppSync`
						);
						// Cache the permission result (allowed)
						setCachedPermission(user.id, s3Key, true);
					}
				} else {
					// eslint-disable-next-line no-console
					console.log(
						`[Protected Image] ✅ Allowed: User owns the file`
					);
					// Cache the permission result (allowed - user owns file)
					setCachedPermission(user.id, s3Key, true);
				}
			}
		} else {
			// eslint-disable-next-line no-console
			console.log(
				`[Protected Image] ⚠️ File not in users/ folder, allowing access: ${s3Key}`
			);
		}

		// Parse expiration time (default: 1 hour, max: 7 days)
		let expiresIn = 3600; // 1 hour default
		if (expiresInParam) {
			const parsed = parseInt(expiresInParam, 10);
			if (!isNaN(parsed) && parsed > 0) {
				// Clamp between 1 second and 7 days (604800 seconds)
				expiresIn = Math.min(Math.max(parsed, 1), 604800);
			}
		}

		// Create GetObject command
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		// Generate pre-signed URL
		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn,
		});

		return NextResponse.json({
			url: presignedUrl,
			expiresIn,
			expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Protected Image URL Error:", error);

		return NextResponse.json(
			{
				error: "Failed to generate protected image URL",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
