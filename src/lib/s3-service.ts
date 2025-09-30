import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { FileItem, createFileItem } from "./file-utils";

// S3 Client configuration
const s3Client = new S3Client({
	region: process.env.REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.ACCESS_KEY_ID || "",
		secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "edumatch-files-12";

export interface S3UploadResult {
	key: string;
	url: string;
	bucket: string;
	size: number;
	contentType: string;
}

export interface S3FileInfo {
	key: string;
	size: number;
	lastModified: Date;
	contentType: string;
	etag: string;
}

// Generate presigned URL for direct upload
export async function generatePresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
	return { uploadUrl, key };
}

// Generate presigned POST for form upload
export async function generatePresignedPost(
	key: string,
	contentType: string,
	maxSize: number = 10 * 1024 * 1024, // 10MB default
	expiresIn: number = 300 // 5 minutes
): Promise<{ url: string; fields: Record<string, string> }> {
	const { url, fields } = await createPresignedPost(s3Client, {
		Bucket: BUCKET_NAME,
		Key: key,
		Expires: expiresIn,
		Conditions: [
			["content-length-range", 0, maxSize],
			["starts-with", "$Content-Type", contentType.split("/")[0] + "/"],
		],
		Fields: {
			"Content-Type": contentType,
		},
	});

	// Ensure the URL uses the correct region
	const region = process.env.REGION || "us-east-1";
	const correctedUrl = url.replace(
		/\.s3\.[^.]+\.amazonaws\.com/,
		`.s3.${region}.amazonaws.com`
	);

	return { url: correctedUrl, fields };
}

// Upload file directly to S3
export async function uploadFileToS3(
	file: File,
	key: string,
	onProgress?: (progress: number) => void
): Promise<S3UploadResult> {
	const contentType = file.type;
	const fileBuffer = await file.arrayBuffer();

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		Body: new Uint8Array(fileBuffer),
		ContentType: contentType,
		Metadata: {
			originalName: file.name,
			uploadedAt: new Date().toISOString(),
		},
	});

	await s3Client.send(command);

	return {
		key,
		url: `https://${BUCKET_NAME}.s3.${process.env.REGION || "us-east-1"}.amazonaws.com/${key}`,
		bucket: BUCKET_NAME,
		size: file.size,
		contentType,
	};
}

// Delete file from S3
export async function deleteFileFromS3(key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});

	await s3Client.send(command);
}

// Get file info from S3
export async function getFileInfo(key: string): Promise<S3FileInfo | null> {
	try {
		const command = new HeadObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});

		const response = await s3Client.send(command);

		return {
			key,
			size: response.ContentLength || 0,
			lastModified: response.LastModified || new Date(),
			contentType: response.ContentType || "application/octet-stream",
			etag: response.ETag || "",
		};
	} catch (error) {
		console.error("Error getting file info:", error);
		return null;
	}
}

// List files in S3 with prefix
export async function listFilesInS3(
	prefix: string = "",
	maxKeys: number = 1000
): Promise<S3FileInfo[]> {
	const command = new ListObjectsV2Command({
		Bucket: BUCKET_NAME,
		Prefix: prefix,
		MaxKeys: maxKeys,
	});

	const response = await s3Client.send(command);

	return (response.Contents || []).map((object) => ({
		key: object.Key || "",
		size: object.Size || 0,
		lastModified: object.LastModified || new Date(),
		contentType: "application/octet-stream", // Will need separate call for content type
		etag: object.ETag || "",
	}));
}

// Generate presigned URL for viewing/downloading
export async function generatePresignedGetUrl(
	key: string,
	expiresIn: number = 3600
): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});

	return await getSignedUrl(s3Client, command, { expiresIn });
}

// Convert S3 file to FileItem
export function s3FileToFileItem(s3File: S3FileInfo): FileItem {
	const fileName = s3File.key.split("/").pop() || s3File.key;
	const extension = fileName.split(".").pop() || "";

	return {
		id: s3File.key,
		name: fileName,
		originalName: fileName,
		type: s3File.contentType.split("/")[0],
		size: s3File.size,
		extension,
		mimeType: s3File.contentType,
		lastModified: s3File.lastModified,
		createdAt: s3File.lastModified,
		category: "unknown",
		url: `https://${BUCKET_NAME}.s3.${process.env.REGION || "us-east-1"}.amazonaws.com/${s3File.key}`,
	};
}

// S3 Folder Structure Configuration
export const S3_FOLDER_STRUCTURE = {
	USERS: "users",
	SHARED: "shared",
	SYSTEM: "system",
	TEMP: "temp",
} as const;

export const USER_FOLDERS = {
	PROFILE: "profile",
	DOCUMENTS: "documents",
	MEDIA: "media",
	TEMP: "temp",
} as const;

export const DOCUMENT_FOLDERS = {
	ACADEMIC: "academic",
	PROJECTS: "projects",
	PORTFOLIOS: "portfolios",
	TRANSCRIPTS: "transcripts",
	CERTIFICATES: "certificates",
	DIPLOMAS: "diplomas",
} as const;

export const MEDIA_FOLDERS = {
	IMAGES: "images",
	VIDEOS: "videos",
	AUDIO: "audio",
} as const;

// Generate organized file key based on user and category
export function generateFileKey(
	userId: string,
	fileType: string,
	originalName: string,
	category?: string,
	subcategory?: string
): string {
	const timestamp = Date.now();
	const randomId = Math.random().toString(36).substring(2, 8);
	const extension = originalName.split(".").pop() || "";
	const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

	// Determine the folder structure based on category
	let folderPath = "";

	if (category) {
		switch (category.toLowerCase()) {
			case "profile":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.PROFILE}`;
				break;
			case "academic":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.DOCUMENTS}/${DOCUMENT_FOLDERS.ACADEMIC}`;
				if (subcategory) {
					folderPath += `/${subcategory}`;
				}
				break;
			case "project":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.DOCUMENTS}/${DOCUMENT_FOLDERS.PROJECTS}`;
				break;
			case "portfolio":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.DOCUMENTS}/${DOCUMENT_FOLDERS.PORTFOLIOS}`;
				break;
			case "image":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.MEDIA}/${MEDIA_FOLDERS.IMAGES}`;
				break;
			case "video":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.MEDIA}/${MEDIA_FOLDERS.VIDEOS}`;
				break;
			case "audio":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.MEDIA}/${MEDIA_FOLDERS.AUDIO}`;
				break;
			case "shared":
				folderPath = `${S3_FOLDER_STRUCTURE.SHARED}`;
				if (subcategory) {
					folderPath += `/${subcategory}`;
				}
				break;
			case "temp":
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/${USER_FOLDERS.TEMP}`;
				break;
			default:
				folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/uploads`;
		}
	} else {
		folderPath = `${S3_FOLDER_STRUCTURE.USERS}/${userId}/uploads`;
	}

	return `${folderPath}/${timestamp}_${randomId}_${sanitizedName}`;
}

// Upload multiple files
export async function uploadMultipleFiles(
	files: File[],
	userId: string,
	category: string = "uploads",
	onProgress?: (fileIndex: number, progress: number) => void
): Promise<S3UploadResult[]> {
	const uploadPromises = files.map(async (file, index) => {
		const key = generateFileKey(userId, file.type, file.name, category);
		const result = await uploadFileToS3(file, key, (progress) => {
			onProgress?.(index, progress);
		});
		return result;
	});

	return Promise.all(uploadPromises);
}
