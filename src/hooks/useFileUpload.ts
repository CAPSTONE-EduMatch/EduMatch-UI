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

						// Step 1: Get presigned upload URL
						const uploadResponse = await fetch(
							"/api/files/upload",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									fileName: file.name,
									fileType: file.type,
									fileSize: file.size,
									category: options.category,
								}),
							}
						);

						if (!uploadResponse.ok) {
							throw new Error("Failed to get upload URL");
						}

						const { uploadUrl, fields, key } =
							await uploadResponse.json();

						// Step 2: Upload file to S3
						const formData = new FormData();
						Object.entries(fields).forEach(([key, value]) => {
							formData.append(key, value as string);
						});
						formData.append("file", file);

						const uploadResult = await fetch(uploadUrl, {
							method: "POST",
							body: formData,
						});

						if (!uploadResult.ok) {
							throw new Error("Failed to upload file to S3");
						}

						// Update progress to confirming
						setUploadProgress((prev) =>
							prev.map((p) =>
								p.fileIndex === index
									? {
											...p,
											status: "confirming" as const,
											progress: 90,
										}
									: p
							)
						);

						// Step 3: Confirm upload in database
						const confirmResponse = await fetch(
							"/api/files/confirm",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									key,
									fileName: file.name,
									fileSize: file.size,
									fileType: file.type,
									folderId: options.folderId,
									category: options.category,
								}),
							}
						);

						if (!confirmResponse.ok) {
							throw new Error("Failed to confirm file upload");
						}

						const { file: savedFile } =
							await confirmResponse.json();

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

						return createFileItemFromSaved(savedFile);
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
