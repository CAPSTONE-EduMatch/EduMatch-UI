import { useState, useEffect } from "react";
import { useNotification } from "@/contexts/NotificationContext";

export interface ApplicantDocument {
	document_id: string;
	applicant_id: string;
	document_type_id: string;
	name: string;
	url: string;
	size: number;
	upload_at: string;
	subdiscipline: string[];
	title?: string;
	status: boolean;
	documentType?: {
		document_type_id: string;
		name: string;
		description?: string;
	};
}

export interface UseApplicantDocumentsReturn {
	documents: ApplicantDocument[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	deleteDocument: (documentId: string) => Promise<boolean>;
}

export const useApplicantDocuments = (): UseApplicantDocumentsReturn => {
	const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { showError, showSuccess } = useNotification();

	const fetchDocuments = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch("/api/applicant/documents", {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.success) {
				setDocuments(data.documents || []);
			} else {
				throw new Error(data.error || "Failed to fetch documents");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			showError("Error", `Failed to load documents: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	const deleteDocument = async (documentId: string): Promise<boolean> => {
		try {
			const response = await fetch(
				`/api/applicant/documents/${documentId}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.success) {
				setDocuments((prev) =>
					prev.filter((doc) => doc.document_id !== documentId)
				);
				showSuccess(
					"Document Deleted",
					"Document has been successfully deleted"
				);
				return true;
			} else {
				throw new Error(data.error || "Failed to delete document");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error";
			showError(
				"Delete Failed",
				`Failed to delete document: ${errorMessage}`
			);
			return false;
		}
	};

	useEffect(() => {
		fetchDocuments();
	}, []);

	return {
		documents,
		loading,
		error,
		refetch: fetchDocuments,
		deleteDocument,
	};
};
