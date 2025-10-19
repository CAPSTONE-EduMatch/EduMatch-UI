import { useState, useCallback } from "react";
import { FileItem, createFileItemFromSaved } from "@/lib/file-utils";
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
			const progress: UploadProgress[] = files.map((_, index) => ({
				fileIndex: index,
				progress: 0,
				status: "pending",
			}));
			setUploadProgress(progress);

			try {
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
							id: `temp-${Date.now()}-${index}`, // Generate temporary ID
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

						throw error;
					}
				});

				const uploadedFiles = await Promise.all(uploadPromises);
				options.onSuccess?.(uploadedFiles);

				return uploadedFiles;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Upload failed";
				options.onError?.(errorMessage);
				throw error;
			} finally {
				setIsUploading(false);
			}
		},
		[options]
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
