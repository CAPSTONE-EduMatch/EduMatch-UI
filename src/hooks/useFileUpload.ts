import { useState, useCallback } from "react";
import { FileItem, createFileItemFromSaved } from "@/lib/file-utils";

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

						// Use S3-only upload (no database save)
						const formData = new FormData();
						formData.append("file", file);
						formData.append(
							"category",
							options.category || "uploads"
						);

						const response = await fetch("/api/files/s3-upload", {
							method: "POST",
							body: formData,
						});

						if (!response.ok) {
							throw new Error("Upload failed");
						}

						const result = await response.json();

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
							id: result.id,
							name: result.originalName,
							originalName: result.originalName,
							size: result.fileSize,
							type: result.fileType,
							category: result.category,
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
