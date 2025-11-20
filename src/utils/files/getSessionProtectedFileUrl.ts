/**
 * Get a session-protected file URL
 * This URL requires the user to be logged in and will NOT work in incognito
 *
 * @param fileUrl - The S3 URL or key of the file
 * @returns The proxy URL that requires authentication
 */
export function getSessionProtectedFileUrl(
	fileUrl: string | null | undefined
): string | null {
	if (!fileUrl) {
		return null;
	}

	// Return proxy URL that requires session
	return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

/**
 * Open a session-protected file in a new tab
 * Requires user to be logged in - won't work in incognito without login
 *
 * @param fileUrl - The S3 URL or key of the file
 */
export function openSessionProtectedFile(
	fileUrl: string | null | undefined
): void {
	if (!fileUrl) {
		console.error("File URL is required");
		return;
	}

	const proxyUrl = getSessionProtectedFileUrl(fileUrl);
	if (proxyUrl) {
		window.open(proxyUrl, "_blank");
	}
}

/**
 * Download a session-protected file
 * Requires user to be logged in - won't work in incognito without login
 *
 * @param fileUrl - The S3 URL or key of the file
 * @param fileName - The name to use for the downloaded file
 */
export async function downloadSessionProtectedFile(
	fileUrl: string | null | undefined,
	fileName: string = "download"
): Promise<void> {
	if (!fileUrl) {
		console.error("File URL is required");
		return;
	}

	try {
		const proxyUrl = getSessionProtectedFileUrl(fileUrl);
		if (!proxyUrl) {
			throw new Error("Failed to generate proxy URL");
		}

		// Fetch through proxy (requires authentication)
		const response = await fetch(proxyUrl, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			if (response.status === 401) {
				alert("Please log in to download this file.");
			} else {
				throw new Error(`Failed to fetch file: ${response.statusText}`);
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
	} catch (error) {
		console.error("Error downloading file:", error);
		alert("Failed to download file. Please try again.");
	}
}
