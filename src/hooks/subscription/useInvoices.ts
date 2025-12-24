import { useEffect, useState } from "react";

interface Invoice {
	id: string;
	stripeInvoiceId: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethod: string | null;
	paymentMethodDetails: any;
	hostedInvoiceUrl: string | null;
	invoicePdf: string | null;
	receiptNumber: string | null;
	periodStart: string | null;
	periodEnd: string | null;
	paidAt: string | null;
	createdAt: string;
	userType: string | null;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface InvoiceResponse {
	success: boolean;
	data: {
		invoices: Invoice[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	};
}

export function useInvoices(
	page: number = 1,
	limit: number = 10,
	status?: string,
	userType?: string
) {
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchInvoices = async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			});

			if (status) params.append("status", status);
			if (userType) params.append("userType", userType);

			const response = await fetch(`/api/admin/invoices?${params}`, {
				credentials: "include",
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Authentication required. Please sign in.");
				}
				if (response.status === 403) {
					throw new Error("Admin access required.");
				}
				throw new Error(
					`Failed to fetch invoices: ${response.statusText}`
				);
			}

			const data: InvoiceResponse = await response.json();

			if (data.success) {
				setInvoices(data.data.invoices);
				setPagination(data.data.pagination);
			} else {
				throw new Error("API returned error");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch invoices"
			);
			setInvoices([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchInvoices();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit, status, userType]);

	return {
		invoices,
		pagination,
		loading,
		error,
		refetch: fetchInvoices,
	};
}
