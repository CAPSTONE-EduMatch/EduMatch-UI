import { useState } from "react";

interface UploadOptions {
	onSuccess?: (url: string) => void;
	onError?: (error: string) => void;
	maxSize?: number; // in bytes
}

export const usePresignedUpload = () => {
	const [isUploading, setIsUploading] = useState(false);

	const uploadFile = async (file: File, options: UploadOptions = {}) => {
		const { onSuccess, onError, maxSize = 10 * 1024 * 1024 } = options; // 10MB default

		// Validate file size
		if (file.size > maxSize) {
			const error = `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
			onError?.(error);
			throw new Error(error);
		}

		setIsUploading(true);

		try {
			// Step 1: Get pre-signed URL from our API
			const presignedResponse = await fetch("/api/files/presigned-url", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
				}),
			});

			if (!presignedResponse.ok) {
				throw new Error("Failed to get upload URL");
			}

			const { presignedUrl, fileName } = await presignedResponse.json();

			// Step 2: Upload directly to S3 using pre-signed URL
			const uploadResponse = await fetch(presignedUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload file to S3");
			}

			// Step 3: Construct the public URL
			const publicUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "edumatch-file-12"}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;

			onSuccess?.(publicUrl);
			return { url: publicUrl, fileName };
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Upload failed";
			onError?.(errorMessage);
			throw error;
		} finally {
			setIsUploading(false);
		}
	};

	return {
		uploadFile,
		isUploading,
	};
};
