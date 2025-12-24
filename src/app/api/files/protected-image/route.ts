import { requireAuth } from "@/utils/auth/auth-utils";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";
import { validateMessageFileAccess } from "@/utils/files/validateMessageFileAccess";

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

				// SECURITY: For applicants, ensure they can only access their own documents
				// or documents from their own applications
				if (user.role === "applicant" && fileOwnerId !== user.id) {
					// Applicant trying to access another user's file
					// Check if this document is part of their own application
					const applicant = await prismaClient.applicant.findUnique({
						where: { user_id: user.id },
						select: { applicant_id: true },
					});

					if (applicant) {
						// Check if document is in ApplicationDetail for applicant's applications
						const applicationDetail =
							await prismaClient.applicationDetail.findFirst({
								where: {
									url: imageUrl,
									application: {
										applicant_id: applicant.applicant_id,
									},
								},
								select: {
									application_id: true,
								},
							});

						// Check if document is in ApplicantDocument for this applicant
						const applicantDocument =
							await prismaClient.applicantDocument.findFirst({
								where: {
									url: imageUrl,
									applicant_id: applicant.applicant_id,
								},
								select: {
									document_id: true,
								},
							});

						if (!applicationDetail && !applicantDocument) {
							// Document doesn't belong to this applicant
							// eslint-disable-next-line no-console
							console.warn(
								`[Protected Image] 🚫 Denied: Applicant ${user.id} tried to access document that doesn't belong to them`
							);
							setCachedPermission(user.id, s3Key, false);
							return NextResponse.json(
								{
									error: "You don't have permission to access this file",
								},
								{ status: 403 }
							);
						}
						// Document belongs to applicant - allow access
						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] ✅ Allowed: Applicant accessing their own document`
						);
						setCachedPermission(user.id, s3Key, true);
					} else {
						// No applicant profile found
						setCachedPermission(user.id, s3Key, false);
						return NextResponse.json(
							{
								error: "You don't have permission to access this file",
							},
							{ status: 403 }
						);
					}
				}

				// Allow access if:
				// 1. User owns the file, OR
				// 2. File is part of a message thread between users (for message files), OR
				// 3. User is admin/institution (can access applicant files) - only if no messaging relationship
				if (fileOwnerId !== user.id) {
					const isAuthorizedRole =
						user.role === "admin" ||
						user.role === "institution" ||
						user.role === "moderator";

					// Check if user is admin - admins can access all profile documents
					const isAdmin =
						user.role === "admin" ||
						user.email === process.env.ADMIN_EMAIL;

					// For admins, skip message file check - they can access all profile documents
					// For message files, validate that the file is actually part of a message thread
					// This ensures only sender and receiver can access files sent in messages
					let hasMessageFileAccess = false;
					if (!isAdmin) {
						// Only check message file access for non-admins
						try {
							hasMessageFileAccess =
								await validateMessageFileAccess(
									user.id,
									fileOwnerId,
									imageUrl
								);
							// eslint-disable-next-line no-console
							console.log(
								`[Protected Image] Message file validation: ${hasMessageFileAccess ? "File found in message thread" : "File not in message thread"}`
							);
						} catch (error) {
							// eslint-disable-next-line no-console
							console.error(
								"[Protected Image] Error validating message file access:",
								error
							);
							// Fail closed for validation errors
							hasMessageFileAccess = false;
						}
					} else {
						// Admin accessing - skip message file check, will be handled by admin permission check
						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] Admin access - skipping message file validation`
						);
					}

					// If file is not in a message thread, check role-based permissions
					if (!hasMessageFileAccess) {
						// For authorized roles, allow access to applicant files
						// But we need to check if the file owner is an applicant
						if (isAuthorizedRole) {
							// Check if file owner is an applicant or institution
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
										institution: {
											select: {
												institution_id: true,
											},
										},
									},
								});

							// eslint-disable-next-line no-console
							console.log(
								`[Protected Image] File owner check: ${fileOwner?.role || "unknown"} - Has applicant: ${!!fileOwner?.applicant} - Has institution: ${!!fileOwner?.institution}`
							);

							// Admins can access both applicant and institution documents
							// Institutions can only access applicant documents (with application relationship)
							const isAdmin =
								user.role === "admin" ||
								user.email === process.env.ADMIN_EMAIL;

							// Allow admin access to any user's documents (applicant or institution)
							// Admins have full access to all profile documents
							if (isAdmin) {
								if (fileOwner) {
									// eslint-disable-next-line no-console
									console.log(
										`[Protected Image] ✅ Allowed: Admin accessing ${fileOwner.role || "user"} document`
									);
								} else {
									// eslint-disable-next-line no-console
									console.log(
										`[Protected Image] ✅ Allowed: Admin accessing document (file owner not found in DB, but admin has access)`
									);
								}
								setCachedPermission(user.id, s3Key, true);
								// Continue to generate presigned URL - don't return here
							}
							// For institutions, only allow if file owner is an applicant (not another institution)
							else if (
								!isAdmin &&
								fileOwner &&
								(fileOwner.role === "applicant" ||
									fileOwner.applicant)
							) {
								// For institutions, check if there's an application relationship
								if (
									user.role === "institution" &&
									fileOwner?.applicant
								) {
									// Get the institution for the current user
									const institution =
										await prismaClient.institution.findUnique(
											{
												where: { user_id: user.id },
												select: {
													institution_id: true,
												},
											}
										);

									if (institution) {
										// SECURITY: Check if this specific document is part of an application
										// that belongs to this institution
										// This prevents Institution B from accessing documents from Institution A's applications

										// First, check if this document is in ApplicationDetail (uploaded during application)
										const applicationDetail =
											await prismaClient.applicationDetail.findFirst(
												{
													where: {
														url: imageUrl,
													},
													include: {
														application: {
															include: {
																post: {
																	select: {
																		institution_id: true,
																	},
																},
															},
														},
													},
												}
											);

										// If found in ApplicationDetail, verify it belongs to this institution's application
										if (applicationDetail) {
											if (
												applicationDetail.application
													.post.institution_id !==
												institution.institution_id
											) {
												// Document belongs to another institution's application
												// eslint-disable-next-line no-console
												console.warn(
													`[Protected Image] 🚫 Denied: Institution ${user.id} tried to access document from another institution's application`
												);
												setCachedPermission(
													user.id,
													s3Key,
													false
												);
												return NextResponse.json(
													{
														error: "You don't have permission to access this file",
													},
													{ status: 403 }
												);
											}
											// Document belongs to this institution's application - allow
											// eslint-disable-next-line no-console
											console.log(
												`[Protected Image] ✅ Allowed: Document is part of institution's application`
											);
											setCachedPermission(
												user.id,
												s3Key,
												true
											);
										} else {
											// Document not in ApplicationDetail, check if it's in ApplicantDocument
											// and part of an application snapshot
											const applicantDocument =
												await prismaClient.applicantDocument.findFirst(
													{
														where: {
															url: imageUrl,
															applicant_id:
																fileOwner
																	.applicant
																	.applicant_id,
														},
														select: {
															document_id: true,
														},
													}
												);

											if (applicantDocument) {
												// Check if this document is in any application snapshot
												// for an application that belongs to this institution
												const snapshotWithDocument =
													await prismaClient.applicationProfileSnapshot.findFirst(
														{
															where: {
																document_ids: {
																	has: applicantDocument.document_id,
																},
															},
															include: {
																application: {
																	include: {
																		post: {
																			select: {
																				institution_id: true,
																			},
																		},
																	},
																},
															},
														}
													);

												if (snapshotWithDocument) {
													// Check if the application belongs to this institution
													if (
														snapshotWithDocument
															.application.post
															.institution_id !==
														institution.institution_id
													) {
														// Document is in another institution's application snapshot
														// eslint-disable-next-line no-console
														console.warn(
															`[Protected Image] 🚫 Denied: Institution ${user.id} tried to access document from another institution's application snapshot`
														);
														setCachedPermission(
															user.id,
															s3Key,
															false
														);
														return NextResponse.json(
															{
																error: "You don't have permission to access this file",
															},
															{ status: 403 }
														);
													}
													// Document is in this institution's application snapshot - allow
													// eslint-disable-next-line no-console
													console.log(
														`[Protected Image] ✅ Allowed: Document is in institution's application snapshot`
													);
													setCachedPermission(
														user.id,
														s3Key,
														true
													);
												} else {
													// Document exists but not in any application snapshot
													// Deny access - institution can only see documents that are part of applications
													// eslint-disable-next-line no-console
													console.warn(
														`[Protected Image] 🚫 Denied: Document not part of any application accessible to institution`
													);
													setCachedPermission(
														user.id,
														s3Key,
														false
													);
													return NextResponse.json(
														{
															error: "You don't have permission to access this file",
														},
														{ status: 403 }
													);
												}
											} else {
												// Document not found in ApplicationDetail or ApplicantDocument
												// Fall back to checking if there's ANY application (less secure, but backward compatible)
												const hasApplication =
													await prismaClient.application.findFirst(
														{
															where: {
																applicant_id:
																	fileOwner
																		.applicant
																		.applicant_id,
																post: {
																	institution_id:
																		institution.institution_id,
																},
															},
															select: {
																application_id: true,
															},
														}
													);

												if (hasApplication) {
													// eslint-disable-next-line no-console
													console.log(
														`[Protected Image] ✅ Allowed: Institution has application relationship with applicant (fallback)`
													);
													setCachedPermission(
														user.id,
														s3Key,
														true
													);
												} else {
													// eslint-disable-next-line no-console
													console.warn(
														`[Protected Image] 🚫 Denied: Institution ${user.id} tried to access applicant ${fileOwnerId} file but no application relationship exists`
													);
													setCachedPermission(
														user.id,
														s3Key,
														false
													);
													return NextResponse.json(
														{
															error: "You don't have permission to access this file",
														},
														{ status: 403 }
													);
												}
											}
										}
									} else {
										// User claims to be institution but no institution record found
										// eslint-disable-next-line no-console
										console.warn(
											`[Protected Image] 🚫 Denied: User ${user.id} claims to be institution but no institution record found`
										);
										setCachedPermission(
											user.id,
											s3Key,
											false
										);
										return NextResponse.json(
											{
												error: "You don't have permission to access this file",
											},
											{ status: 403 }
										);
									}
								} else {
									// For admin/moderator, allow access to applicant files
									// eslint-disable-next-line no-console
									console.log(
										`[Protected Image] ✅ Allowed: Admin/Moderator accessing applicant file`
									);
									// Cache the permission result (allowed)
									setCachedPermission(user.id, s3Key, true);
								}
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
							// File not in message thread and not an authorized role - deny access
							// eslint-disable-next-line no-console
							console.warn(
								`[Protected Image] 🚫 Denied: User ${user.id} (${user.role}) tried to access ${s3Key} owned by ${fileOwnerId}. File not in message thread: ${hasMessageFileAccess}`
							);
							// Cache the denial
							setCachedPermission(user.id, s3Key, false);
							return NextResponse.json(
								{
									error: "You don't have permission to access this file. This file can only be accessed by the sender and receiver in the message thread.",
								},
								{ status: 403 }
							);
						}
					} else {
						// eslint-disable-next-line no-console
						console.log(
							`[Protected Image] ✅ Allowed: File is part of a message thread between users`
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
