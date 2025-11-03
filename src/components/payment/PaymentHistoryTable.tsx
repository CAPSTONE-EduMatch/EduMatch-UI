'use client'

import { Button, Card, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui/cards/badge'
import { useInvoices } from '@/hooks/subscription/useInvoices'
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function PaymentHistoryTable() {
	const [currentPage, setCurrentPage] = useState(1)
	const { invoices, loading, error, pagination, refetch } = useInvoices(
		currentPage,
		10
	)

	// Show loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
				<span className="ml-2">Loading payment history...</span>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-red-600">Error: {error}</p>
				<Button
					onClick={() => refetch()}
					className="ml-4"
					variant="outline"
					size="sm"
				>
					Retry
				</Button>
			</div>
		)
	}

	// Get payment method logo
	const getPaymentMethodLogo = (method: string) => {
		// For now, return a placeholder. In a real app, you'd have actual payment method logos
		return (
			<div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center">
				<span className="text-xs font-medium text-blue-700 uppercase">
					{method}
				</span>
			</div>
		)
	}

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				{/* Header */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Payment History
					</h2>
					<p className="text-gray-600 mb-4">View your past invoices</p>
					{/* <div className="flex justify-between items-center mb-4">
						<p className="text-sm text-gray-500">
							Display {pagination.limit} results of {pagination.total}
						</p>
					</div> */}
				</div>

				{/* Table Container */}
				<div className="bg-gray-50 rounded-[20px] p-6">
					{/* Table Header */}
					<div className="bg-[#126E64] rounded-t-[20px] px-6 py-4">
						<div className="grid grid-cols-6 gap-4 text-white font-semibold">
							<div>Date</div>
							<div>Period</div>
							<div>Payment Method</div>
							<div>Amount</div>
							<div>Status</div>
							<div>Actions</div>
						</div>
					</div>

					{/* Table Body */}
					<div className="space-y-0">
						{invoices.length === 0 ? (
							<div className="px-6 py-12 text-center">
								<p className="text-gray-500">No payment history found</p>
							</div>
						) : (
							invoices.map((invoice, index) => (
								<div
									key={invoice.id}
									className={`px-6 py-4 border-b border-gray-200 last:border-b-0 ${
										index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
									}`}
								>
									<div className="grid grid-cols-6 gap-4 items-center">
										{/* Date */}
										<div className="text-sm font-medium text-gray-900">
											{invoice.paidAt
												? new Date(invoice.paidAt).toLocaleDateString()
												: 'N/A'}
										</div>

										{/* Description/Period */}
										<div className="text-sm text-gray-900">
											{invoice.periodStart && invoice.periodEnd
												? `${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`
												: `Invoice ${invoice.stripeInvoiceId}`}
										</div>

										{/* Payment Method */}
										<div className="flex items-center">
											{getPaymentMethodLogo(invoice.paymentMethod || 'card')}
										</div>

										{/* Amount */}
										<div className="text-sm font-medium text-gray-900">
											{invoice.currency.toUpperCase()}{' '}
											{/* {(invoice.amount / 100).toFixed(2)} */}
											{invoice.amount}
										</div>

										{/* Status */}
										<div>
											<Badge
												variant={
													invoice.status === 'paid'
														? 'default'
														: invoice.status === 'open'
															? 'secondary'
															: 'destructive'
												}
											>
												{invoice.status}
											</Badge>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-2">
											{invoice.hostedInvoiceUrl && (
												<a
													href={invoice.hostedInvoiceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
												>
													<ExternalLink className="w-4 h-4" />
													View Details
												</a>
											)}
											{/* <button
											onClick={() => handleMoreDetail(invoice.id)}
											className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#126E64] transition-colors"
										>
											Details
											<ChevronRight className="w-4 h-4" />
										</button> */}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Pagination */}
				{pagination.totalPages > 1 && (
					<div className="flex items-center justify-center mt-8">
						<div className="flex items-center gap-2">
							{/* Previous Button */}
							<button
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeft className="w-5 h-5" />
							</button>

							{/* Page Numbers - Show actual pages based on totalPages */}
							{Array.from(
								{ length: Math.min(pagination.totalPages, 10) },
								(_, i) => i + 1
							).map((pageNum) => (
								<button
									key={pageNum}
									onClick={() => setCurrentPage(pageNum)}
									className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
										currentPage === pageNum
											? 'bg-[#126E64] text-white'
											: 'text-gray-700 hover:bg-gray-100'
									}`}
								>
									{pageNum}
								</button>
							))}

							{/* Show ellipsis only if there are more than 10 pages */}
							{pagination.totalPages > 10 && (
								<>
									<span className="text-gray-400 px-2">...</span>
									<span className="text-gray-400 px-2">
										{pagination.totalPages}
									</span>
								</>
							)}

							{/* Next Button */}
							<button
								onClick={() =>
									setCurrentPage((prev) =>
										Math.min(prev + 1, pagination.totalPages)
									)
								}
								disabled={currentPage === pagination.totalPages}
								className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						</div>

						{/* Page info */}
						<div className="ml-4 text-sm text-gray-500">
							Page {pagination.page} of {pagination.totalPages}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
