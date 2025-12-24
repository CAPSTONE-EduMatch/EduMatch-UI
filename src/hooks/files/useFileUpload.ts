import { useState, useCallback } from "react";
import { FileItem, createFileItemFromSaved } from "@/utils/file/file-utils";
import { usePresignedUpload } from "./usePresignedUpload";

interface UploadProgress {
	fileIndex: number;
	progress: number;
	status: "pending" | "uploading" | "confirming" | "completed" | "error";
	error?: string;
}

interface UseFileUploadOptions {
	onSuccess?: (files: FileItem[]) => void;
	onError?: (error: string) => void;
	onProgress?: (progress: UploadProgress[]) => void;
	category?: string;
	folderId?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
	const { uploadFile } = usePresignedUpload();

	const uploadFiles = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return;

			setIsUploading(true);

			// Initialize progress for all files
			const initialProgress: UploadProgress[] = files.map((_, index) => ({
				fileIndex: index,
				progress: 0,
				status: "pending",
			}));
			setUploadProgress(initialProgress);

			try {
				// Upload all files in parallel
				const uploadPromises = files.map(async (file, index) => {
					try {
						// Update progress to uploading
						setUploadProgress((prev) =>
							prev.map((p) =>
								p.fileIndex === index
									? { ...p, status: "uploading" as const }
									: p
							)
						);

						// Use pre-signed URL upload
						const result = await uploadFile(file, {
							maxSize: 10 * 1024 * 1024, // 10MB
						});

						// Update progress to completed
						setUploadProgress((prev) =>
							prev.map((p) =>
								p.fileIndex === index
									? {
											...p,
											status: "completed" as const,
											progress: 100,
										}
									: p
							)
						);

						// Return file metadata for form state (no database save)
						return {
							id: `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_")}-${index}`, // Generate unique ID with filename
							name: file.name,
							originalName: file.name,
							size: file.size,
							type: file.type,
							category: options.category || "uploads",
							url: result.url,
							createdAt: new Date(),
						};
					} catch (error) {
						const errorMessage =
							error instanceof Error
								? error.message
								: "Upload failed";

						// Update progress to error
						setUploadProgress((prev) =>
							prev.map((p) =>
								p.fileIndex === index
									? {
											...p,
											status: "error" as const,
											error: errorMessage,
										}
									: p
							)
						);

						// Re-throw to be handled by Promise.allSettled
						throw error;
					}
				});

				// Wait for all uploads to complete (including failed ones)
				const uploadResults = await Promise.allSettled(uploadPromises);

				// Extract successful uploads
				const successfulUploads = uploadResults
					.filter(
						(result): result is PromiseFulfilledResult<FileItem> =>
							result.status === "fulfilled"
					)
					.map((result) => result.value);

				// Check if any uploads failed
				const failedUploads = uploadResults.filter(
					(result) => result.status === "rejected"
				);

				if (failedUploads.length > 0) {
					console.warn(
						`${failedUploads.length} out of ${files.length} uploads failed`
					);
					// Still call onSuccess with successful uploads if any
					if (successfulUploads.length > 0) {
						options.onSuccess?.(successfulUploads);
					}
				} else {
					// All uploads succeeded
					options.onSuccess?.(successfulUploads);
				}

				return successfulUploads;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Upload failed";
				options.onError?.(errorMessage);
				throw error;
			} finally {
				setIsUploading(false);
			}
		},
		[options, uploadFile]
	);

	const resetProgress = useCallback(() => {
		setUploadProgress([]);
	}, []);

	return {
		uploadFiles,
		isUploading,
		uploadProgress,
		resetProgress,
	};
}
