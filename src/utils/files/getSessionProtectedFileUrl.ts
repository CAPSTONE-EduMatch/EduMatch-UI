/**
 * Get a session-protected file URL
 * This URL requires the user to be logged in and will NOT work in incognito
 *
 * @param fileUrl - The S3 URL or key of the file
 * @param isApplicationDocument - Whether this is an application document (default: false, uses proxy for messaging)
 * @returns The proxy/document URL that requires authentication
 */
export function getSessionProtectedFileUrl(
	fileUrl: string | null | undefined,
	isApplicationDocument: boolean = false
): string | null {
	if (!fileUrl) {
		return null;
	}

	// Use document route for application documents, proxy route for messaging files
	if (isApplicationDocument) {
		return `/api/files/document?url=${encodeURIComponent(fileUrl)}`;
	}
	// Return proxy URL that requires session (for messaging files)
	return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

/**
 * Open a session-protected file in a new tab
 * Requires user to be logged in - won't work in incognito without login
 * Uses document route for application documents, proxy route for messaging files
 *
 * @param fileUrl - The S3 URL or key of the file
 * @param isApplicationDocument - Whether this is an application document (default: false, uses proxy for messaging)
 */
export function openSessionProtectedFile(
	fileUrl: string | null | undefined,
	isApplicationDocument: boolean = false
): void {
	if (!fileUrl) {
		// eslint-disable-next-line no-console
		console.error("File URL is required");
		return;
	}

	// Use document route for application documents, proxy route for messaging files
	if (isApplicationDocument) {
		const documentUrl = `/api/files/document?url=${encodeURIComponent(fileUrl)}&disposition=inline`;
		window.open(documentUrl, "_blank");
	} else {
		// Use proxy route with disposition=inline to display file instead of downloading
		// The proxy route requires authentication, so it won't work in different browsers
		const proxyUrl = `/api/files/proxy?url=${encodeURIComponent(fileUrl)}&disposition=inline`;
		window.open(proxyUrl, "_blank");
	}
}

/**
 * Download a session-protected file
 * Requires user to be logged in - won't work in incognito without login
 *
 * @param fileUrl - The S3 URL or key of the file
 * @param fileName - The name to use for the downloaded file
 * @param isApplicationDocument - Whether this is an application document (default: false, uses proxy for messaging)
 */
export async function downloadSessionProtectedFile(
	fileUrl: string | null | undefined,
	fileName: string = "download",
	isApplicationDocument: boolean = false
): Promise<void> {
	if (!fileUrl) {
		console.error("File URL is required");
		return;
	}

	try {
		// Use document route for application documents, protected-image for messaging files
		if (isApplicationDocument) {
			// For application documents, use the document route
			const documentUrl = `/api/files/document?url=${encodeURIComponent(fileUrl)}&disposition=attachment`;

			const response = await fetch(documentUrl, {
				method: "GET",
				credentials: "include",
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				if (response.status === 401) {
					alert("Please log in to download this file.");
				} else if (response.status === 403) {
					alert("You don't have permission to download this file.");
				} else {
					throw new Error(
						errorData.error ||
							`Failed to download file: ${response.statusText}`
					);
				}
				return;
			}

			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);

			// Create download link
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = fileName;
			link.style.display = "none";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up
			window.URL.revokeObjectURL(blobUrl);
		} else {
			// For messaging files, use protected-image API to get a pre-signed URL
			// This works better than proxy for downloads and avoids S3 permission issues
			const protectedUrl = `/api/files/protected-image?url=${encodeURIComponent(fileUrl)}&expiresIn=3600`;

			const response = await fetch(protectedUrl, {
				method: "GET",
				credentials: "include",
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				if (response.status === 401) {
					alert("Please log in to download this file.");
				} else if (response.status === 403) {
					alert("You don't have permission to download this file.");
				} else {
					throw new Error(
						errorData.error ||
							`Failed to get download URL: ${response.statusText}`
					);
				}
				return;
			}

			const data = await response.json();
			const presignedUrl = data.url;

			if (!presignedUrl) {
				throw new Error("Failed to get pre-signed URL");
			}

			// Fetch the file using the pre-signed URL
			const fileResponse = await fetch(presignedUrl, {
				method: "GET",
			});

			if (!fileResponse.ok) {
				throw new Error(
					`Failed to fetch file: ${fileResponse.statusText}`
				);
			}

			const blob = await fileResponse.blob();
			const blobUrl = window.URL.createObjectURL(blob);

			// Create download link
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = fileName;
			link.style.display = "none";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up
			window.URL.revokeObjectURL(blobUrl);
		}
	} catch (error) {
		console.error("Error downloading file:", error);
		alert("Failed to download file. Please try again.");
	}
}
