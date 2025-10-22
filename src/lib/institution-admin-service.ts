// API function to fetch institution details
export const fetchInstitutionDetails = async (
	institutionId: string
): Promise<import("@/types/institution-details").InstitutionDetails | null> => {
	try {
		const response = await fetch(
			`/api/admin/institutions/${institutionId}`
		);
		const result: import("@/types/institution-details").ApiResponse<
			import("@/types/institution-details").InstitutionDetails
		> = await response.json();

		if (result.success && result.data) {
			return result.data;
		}
		return null;
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching institution details:", error);
		}
		return null;
	}
};

// API function to perform admin actions on institutions
export const performInstitutionAction = async (
	institutionId: string,
	actionData: import("@/types/institution-details").InstitutionActionRequest
): Promise<{ success: boolean; message?: string; error?: string }> => {
	try {
		const response = await fetch(
			`/api/admin/institutions/${institutionId}/actions`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(actionData),
			}
		);

		const result = await response.json();

		if (response.ok) {
			return { success: true, message: result.message };
		} else {
			return { success: false, error: result.error || "Unknown error" };
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error performing institution action:", error);
		}
		return { success: false, error: "An error occurred" };
	}
};

// API function to fetch institutions list
export const fetchInstitutionsList = async (
	filters?: import("@/types/institution-details").InstitutionFilters
): Promise<{
	institutions: import("@/types/institution-details").InstitutionListItem[];
	total: number;
	page: number;
	totalPages: number;
} | null> => {
	try {
		const queryParams = new URLSearchParams();

		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					queryParams.append(key, String(value));
				}
			});
		}

		const response = await fetch(
			`/api/admin/institutions?${queryParams.toString()}`
		);
		const result = await response.json();

		if (result.success && result.data) {
			return result.data;
		}
		return null;
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching institutions list:", error);
		}
		return null;
	}
};

// API function to download institution documents
export const downloadInstitutionDocument = async (
	institutionId: string,
	documentId: string
): Promise<void> => {
	try {
		const response = await fetch(
			`/api/admin/institutions/${institutionId}/documents/${documentId}/download`
		);

		if (response.ok) {
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;

			// Try to get filename from Content-Disposition header
			const contentDisposition = response.headers.get(
				"Content-Disposition"
			);
			const filename = contentDisposition
				? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
				: `institution-document-${documentId}.pdf`;

			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} else {
			throw new Error("Failed to download document");
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error downloading institution document:", error);
		}
		throw error;
	}
};

// API function to download all institution documents as a ZIP
export const downloadAllInstitutionDocuments = async (
	institutionId: string
): Promise<void> => {
	try {
		const response = await fetch(
			`/api/admin/institutions/${institutionId}/documents/download-all`
		);

		if (response.ok) {
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `institution-${institutionId}-documents.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} else {
			throw new Error("Failed to download documents");
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error(
				"Error downloading all institution documents:",
				error
			);
		}
		throw error;
	}
};
