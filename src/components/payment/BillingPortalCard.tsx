'use client'

import { Card, CardContent } from '@/components/ui'
import { useUserInvoices } from '@/hooks/subscription/useUserInvoices'
import { CreditCard, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { formatUTCDate } from '@/utils/date'
import { useTranslations } from 'next-intl'

export function BillingPortalCard() {
	const t = useTranslations('profile_view.billing_portal')
	const [currentPage, setCurrentPage] = useState(1)
	const { invoices, pagination, loading, error } = useUserInvoices(
		currentPage,
		10
	)

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'N/A'
		// Use timezone-aware formatting with custom format
		return formatUTCDate(dateString, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	const formatAmount = (amount: number, currency: string) => {
		// Stripe stores amounts in cents, so we need to convert to main currency unit
		// For example: 300 cents = $3.00, 30000 cents = $300.00
		const amountInMainUnit = amount / 100
		const currencyUpper = currency.toUpperCase()

		// Special formatting for VND with dots as thousands separators
		if (currencyUpper === 'VND') {
			const rounded = Math.round(amountInMainUnit)
			if (rounded >= 1000) {
				// Format with dots as thousands separators
				const formatted = rounded
					.toString()
					.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
				return `${formatted} ₫`
			}
			return `${rounded} ₫`
		}

		// Standard formatting for other currencies
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currencyUpper,
		}).format(amountInMainUnit)
	}

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'paid':
				return 'bg-green-100 text-green-800'
			case 'open':
				return 'bg-blue-100 text-blue-800'
			case 'void':
			case 'uncollectible':
				return 'bg-gray-100 text-gray-800'
			default:
				return 'bg-yellow-100 text-yellow-800'
		}
	}

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				{/* Header Section */}
				<div className="flex items-start justify-between mb-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
							<CreditCard className="w-6 h-6 text-[#126E64]" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-gray-900 mb-1">
								{t('title')}
							</h3>
							<p className="text-gray-600">{t('description')}</p>
						</div>
					</div>
				</div>

				{/* Payment History Table */}
				<div className="bg-gray-50 rounded-3xl p-6">
					<div className="mb-4">
						<h4 className="text-lg font-semibold text-gray-900 mb-2">
							{t('payment_history')}
						</h4>
						<p className="text-sm text-gray-600">
							{t('payment_history_description')}
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#126E64]"></div>
						</div>
					) : invoices.length === 0 ? (
						<div className="text-center py-12">
							<CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
							<p className="text-gray-600">{t('no_history_found')}</p>
							<p className="text-sm text-gray-500 mt-1">
								{t('transaction_history')}
							</p>
						</div>
					) : (
						<>
							{/* Table for desktop */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
												{t('table.date')}
											</th>
											<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
												{t('table.invoice_id')}
											</th>
											<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
												{t('table.amount')}
											</th>
											<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
												{t('table.status')}
											</th>
											<th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
												{t('table.actions')}
											</th>
										</tr>
									</thead>
									<tbody>
										{invoices.map((invoice) => (
											<tr
												key={invoice.id}
												className="border-b border-gray-100 hover:bg-white transition-colors"
											>
												<td className="py-4 px-4 text-sm text-gray-900">
													{formatDate(invoice.paidAt || invoice.createdAt)}
												</td>
												<td className="py-4 px-4 text-sm text-gray-600 font-mono">
													{invoice.receiptNumber ||
														invoice.stripeInvoiceId.slice(-8)}
												</td>
												<td className="py-4 px-4 text-sm font-medium text-gray-900">
													{formatAmount(invoice.amount, invoice.currency)}
												</td>
												<td className="py-4 px-4">
													<span
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
													>
														{invoice.status.charAt(0).toUpperCase() +
															invoice.status.slice(1)}
													</span>
												</td>
												<td className="py-4 px-4">
													<div className="flex items-center gap-2">
														{invoice.hostedInvoiceUrl && (
															<a
																href={invoice.hostedInvoiceUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="text-[#126E64] hover:text-[#0f5c54] flex items-center gap-1 text-sm"
															>
																<ExternalLink className="w-4 h-4" />
																{t('actions.view')}
															</a>
														)}
														{invoice.invoicePdf && (
															<a
																href={invoice.invoicePdf}
																target="_blank"
																rel="noopener noreferrer"
																className="text-[#126E64] hover:text-[#0f5c54] flex items-center gap-1 text-sm"
															>
																{/* <Download className="w-4 h-4" />
																PDF */}
															</a>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Cards for mobile */}
							<div className="md:hidden space-y-3">
								{invoices.map((invoice) => (
									<div
										key={invoice.id}
										className="bg-white rounded-xl p-4 border border-gray-200"
									>
										<div className="flex items-start justify-between mb-3">
											<div>
												<p className="text-sm font-medium text-gray-900">
													{formatAmount(invoice.amount, invoice.currency)}
												</p>
												<p className="text-xs text-gray-500 mt-0.5">
													{formatDate(invoice.paidAt || invoice.createdAt)}
												</p>
											</div>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
											>
												{invoice.status.charAt(0).toUpperCase() +
													invoice.status.slice(1)}
											</span>
										</div>
										<p className="text-xs text-gray-600 font-mono mb-3">
											{invoice.receiptNumber ||
												invoice.stripeInvoiceId.slice(-8)}
										</p>
										<div className="flex items-center gap-3">
											{invoice.hostedInvoiceUrl && (
												<a
													href={invoice.hostedInvoiceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[#126E64] hover:text-[#0f5c54] flex items-center gap-1 text-sm"
												>
													<ExternalLink className="w-4 h-4" />
													{t('actions.view_invoice')}
												</a>
											)}
											{invoice.invoicePdf && (
												<a
													href={invoice.invoicePdf}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[#126E64] hover:text-[#0f5c54] flex items-center gap-1 text-sm"
												>
													<Download className="w-4 h-4" />
													{t('actions.download_pdf')}
												</a>
											)}
										</div>
									</div>
								))}
							</div>

							{/* Pagination */}
							{pagination.totalPages > 1 && (
								<div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
									<p className="text-sm text-gray-600">
										Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
										{Math.min(
											pagination.page * pagination.limit,
											pagination.total
										)}{' '}
										of {pagination.total} transactions
									</p>
									<div className="flex items-center gap-2">
										<button
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={pagination.page === 1}
											className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
										>
											{t('pagination.previous')}
										</button>
										<span className="text-sm text-gray-600">
											{t('pagination.page_of', {
												current: pagination.page,
												total: pagination.totalPages,
											})}
										</span>
										<button
											onClick={() =>
												setCurrentPage((p) =>
													Math.min(pagination.totalPages, p + 1)
												)
											}
											disabled={pagination.page === pagination.totalPages}
											className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
										>
											{t('pagination.next')}
										</button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
