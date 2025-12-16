/**
 * Admin-only file access utilities
 * These functions use the /api/admin/files/proxy route which requires
 * authentication and admin role on EVERY request (not shareable URLs)
 */

/**
 * Get a session-protected proxy URL for admin file access
 * This URL requires authentication on each request and cannot be shared
 * @param fileUrl - The S3 URL or key of the file
 * @returns Session-protected proxy URL (requires auth on each access)
 */
export function getAdminFileUrl(
	fileUrl: string | null | undefined
): string | null {
	if (!fileUrl) {
		return null;
	}

	// Return proxy URL that requires authentication on each request
	return `/api/admin/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

/**
 * Open a file in a new tab using admin file access
 * Uses session-protected proxy URL that requires authentication on each request
 * @param fileUrl - The S3 URL or key of the file
 */
export function openAdminFile(fileUrl: string | null | undefined): void {
	if (!fileUrl) {
		// eslint-disable-next-line no-console
		console.error("File URL is required");
		return;
	}

	try {
		const proxyUrl = getAdminFileUrl(fileUrl);
		if (proxyUrl) {
			// Add disposition=inline for preview
			const previewUrl = `${proxyUrl}&disposition=inline`;
			window.open(previewUrl, "_blank");
		} else {
			alert("Failed to open file. Please check your admin permissions.");
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error opening admin file:", error);
		alert("Failed to open file. Please try again.");
	}
}

/**
 * Download a file using admin file access
 * Uses session-protected proxy URL that requires authentication on each request
 * @param fileUrl - The S3 URL or key of the file
 * @param fileName - The name to use for the downloaded file
 */
export async function downloadAdminFile(
	fileUrl: string | null | undefined,
	fileName: string = "download"
): Promise<void> {
	if (!fileUrl) {
		// eslint-disable-next-line no-console
		console.error("File URL is required");
		return;
	}

	try {
		const proxyUrl = getAdminFileUrl(fileUrl);
		if (!proxyUrl) {
			alert(
				"Failed to get download URL. Please check your admin permissions."
			);
			return;
		}

		// Fetch the file using the session-protected proxy URL
		const fileResponse = await fetch(`${proxyUrl}&disposition=attachment`, {
			method: "GET",
			credentials: "include", // Important: include session cookies
		});

		if (!fileResponse.ok) {
			if (fileResponse.status === 401) {
				alert("Please log in to download this file.");
			} else if (fileResponse.status === 403) {
				alert("You don't have permission to download this file.");
			} else {
				throw new Error(
					`Failed to fetch file: ${fileResponse.statusText}`
				);
			}
			return;
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
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error downloading admin file:", error);
		alert("Failed to download file. Please try again.");
	}
}
