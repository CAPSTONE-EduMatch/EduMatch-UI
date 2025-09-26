import {
	GetObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();

export async function generatePresignedPost(
	bucketName: string,
	key: string,
	fileType: string = "image/jpeg"
) {
	try {
		if (!bucketName || !key) {
			throw new Error("Bucket name and key are required");
		}
	} catch (error) {
		console.error("Error generating presigned post:", error);
		throw error;
	}

	const s3Client = new S3Client({
		region: process.env.S3_REGION,
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
		},
	});

	const { url, fields } = await createPresignedPost(s3Client, {
		Bucket: bucketName,
		Key: key,
		Expires: 60 * 5, // Presigned post valid for 5 minutes
		Conditions: [
			["content-length-range", 0, 10485760], // Limit file size to 10 MB
			//   { acl: "public-read" }, // Set ACL to public-read
			["starts-with", "$Content-Type", "image/"], // Allow only image uploads
		],
		Fields: {
			"Content-Type": fileType,
		},
	});

	return { url, fields };
}

// Function to list objects in S3 bucket
export async function listS3Objects(
	bucketName: string,
	prefix: string = "uploads/"
) {
	const s3Client = new S3Client({
		region: process.env.S3_REGION,
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
		},
	});

	try {
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: prefix,
		});

		const response = await s3Client.send(command);

		return (
			response.Contents?.map((object) => ({
				key: object.Key,
				lastModified: object.LastModified,
				size: object.Size,
			})) || []
		);
	} catch (error) {
		console.error("Error listing S3 objects:", error);
		throw error;
	}
}

// Function to generate presigned URL for viewing a file
export async function generatePresignedGetUrl(
	bucketName: string,
	key: string,
	expiresIn: number = 3600
) {
	const s3Client = new S3Client({
		region: process.env.S3_REGION,
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
		},
	});

	try {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
		return signedUrl;
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		throw error;
	}
}
