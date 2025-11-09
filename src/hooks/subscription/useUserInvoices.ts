"use client";

import { useEffect, useState } from "react";

interface UserInvoice {
	id: string;
	stripeInvoiceId: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethod: string | null;
	hostedInvoiceUrl: string | null;
	invoicePdf: string | null;
	receiptNumber: string | null;
	periodStart: string | null;
	periodEnd: string | null;
	paidAt: string | null;
	createdAt: string;
}

interface InvoiceResponse {
	success: boolean;
	data: {
		invoices: UserInvoice[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	};
}

export function useUserInvoices(
	page: number = 1,
	limit: number = 10,
	status?: string
) {
	const [invoices, setInvoices] = useState<UserInvoice[]>([]);
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

			const response = await fetch(`/api/profile/invoices?${params}`, {
				credentials: "include",
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Authentication required. Please sign in.");
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
	}, [page, limit, status]);

	return {
		invoices,
		pagination,
		loading,
		error,
		refetch: fetchInvoices,
	};
}
