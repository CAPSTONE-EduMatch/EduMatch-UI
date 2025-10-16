'use client'

import { Card, CardContent } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface PaymentRecord {
	id: string
	date: string
	description: string
	paymentMethod: 'visa' | 'mastercard' | 'paypal' | 'stripe'
	amount: number
	currency: string
	status: 'completed' | 'pending' | 'failed'
}

export function PaymentHistoryTable() {
	// Mock payment data - replace with real data from API
	const payments: PaymentRecord[] = [
		{
			id: '1',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
		{
			id: '2',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
		{
			id: '3',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
		{
			id: '4',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
		{
			id: '5',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
		{
			id: '6',
			date: '22/01/2025',
			description: 'Premium membership for 22/01/2025 from 22/02/2025',
			paymentMethod: 'visa',
			amount: 100,
			currency: 'USD',
			status: 'completed',
		},
	]

	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 10
	const totalPages = Math.ceil(payments.length / itemsPerPage)
	const totalRecords = 1000 // Mock total - replace with real total

	// Get current page items
	const startIndex = (currentPage - 1) * itemsPerPage
	const currentItems = payments.slice(startIndex, startIndex + itemsPerPage)

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

	const handleMoreDetail = (paymentId: string) => {
		// Handle view more detail action
		// TODO: Implement payment detail modal or navigation
		void paymentId // Avoid unused variable warning
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
					<p className="text-sm text-gray-500">
						Display {itemsPerPage} results of {totalRecords}
					</p>
				</div>

				{/* Table Container */}
				<div className="bg-gray-50 rounded-[20px] p-6">
					{/* Table Header */}
					<div className="bg-[#126E64] rounded-t-[20px] px-6 py-4">
						<div className="grid grid-cols-5 gap-4 text-white font-semibold">
							<div>Date</div>
							<div>Description</div>
							<div>Payment Method</div>
							<div>Total</div>
							<div>Receipt</div>
						</div>
					</div>

					{/* Table Body */}
					<div className="space-y-0">
						{currentItems.map((payment, index) => (
							<div
								key={payment.id}
								className={`px-6 py-4 border-b border-gray-200 last:border-b-0 ${
									index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
								}`}
							>
								<div className="grid grid-cols-5 gap-4 items-center">
									{/* Date */}
									<div className="text-sm font-medium text-gray-900">
										{payment.date}
									</div>

									{/* Description */}
									<div className="text-sm text-gray-900">
										{payment.description}
									</div>

									{/* Payment Method */}
									<div className="flex items-center">
										{getPaymentMethodLogo(payment.paymentMethod)}
									</div>

									{/* Total */}
									<div className="text-sm font-medium text-gray-900">
										$ {payment.amount}
									</div>

									{/* Receipt/More Detail */}
									<div>
										<button
											onClick={() => handleMoreDetail(payment.id)}
											className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#126E64] transition-colors"
										>
											More detail
											<ChevronRight className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Pagination */}
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

						{/* Page Numbers */}
						{[1, 2, 3, 4, 5, 6].map((pageNum) => (
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

						{/* Ellipsis */}
						<span className="text-gray-400 px-2">....20</span>

						{/* Next Button */}
						<button
							onClick={() =>
								setCurrentPage((prev) => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
