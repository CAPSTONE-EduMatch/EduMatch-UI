'use client'

import { Button, Card, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui/cards/badge'
import { Input } from '@/components/ui'
import { useInvoices } from '@/hooks/subscription/useInvoices'
import {
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	Loader2,
	Search,
	Filter,
	ChevronDown,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

type SortField = 'date' | 'amount' | 'status' | 'method'
type SortDirection = 'asc' | 'desc'

export function PaymentHistoryTable() {
	const [currentPage, setCurrentPage] = useState(1)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [userTypeFilter, setUserTypeFilter] = useState<string>('')
	const [sortField, setSortField] = useState<SortField>('date')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
	const [showFilters, setShowFilters] = useState(false)

	const { invoices, loading, error, pagination, refetch } = useInvoices(
		currentPage,
		10,
		statusFilter || undefined,
		userTypeFilter || undefined
	)

	// Handle sorting
	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

	// Get sort icon
	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="w-4 h-4" />
		}
		return sortDirection === 'asc' ? (
			<ArrowUp className="w-4 h-4" />
		) : (
			<ArrowDown className="w-4 h-4" />
		)
	}

	// Filter and sort invoices
	const filteredAndSortedInvoices = useMemo(() => {
		let filtered = [...invoices]

		// Apply search filter
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase()
			filtered = filtered.filter(
				(invoice) =>
					invoice.stripeInvoiceId.toLowerCase().includes(searchLower) ||
					invoice.user.email.toLowerCase().includes(searchLower) ||
					(invoice.receiptNumber &&
						invoice.receiptNumber.toLowerCase().includes(searchLower)) ||
					(invoice.user.name &&
						invoice.user.name.toLowerCase().includes(searchLower))
			)
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aValue: string | number
			let bValue: string | number

			switch (sortField) {
				case 'date':
					aValue = new Date(a.paidAt || a.createdAt).getTime()
					bValue = new Date(b.paidAt || b.createdAt).getTime()
					break
				case 'amount':
					aValue = a.amount
					bValue = b.amount
					break
				case 'status':
					aValue = a.status
					bValue = b.status
					break
				case 'method':
					aValue = a.paymentMethod || ''
					bValue = b.paymentMethod || ''
					break
				default:
					return 0
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
			return 0
		})

		return filtered
	}, [invoices, searchTerm, sortField, sortDirection])

	// Reset page when search term changes
	useEffect(() => {
		if (searchTerm) {
			setCurrentPage(1)
		}
	}, [searchTerm])

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
				</div>

				{/* Search and Filter Controls */}
				<div className="mb-6 space-y-4">
					{/* Search Bar */}
					<div className="flex items-center gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<Input
								placeholder="Search by invoice ID, email, or receipt number..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64]"
							/>
						</div>
						<Button
							onClick={() => setShowFilters(!showFilters)}
							variant="outline"
							className="flex items-center gap-2"
						>
							<Filter className="w-4 h-4" />
							Filters
							<ChevronDown
								className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
							/>
						</Button>
					</div>

					{/* Filter Controls */}
					{showFilters && (
						<div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-700">
									Status:
								</label>
								<select
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value)
										setCurrentPage(1)
									}}
									className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64] bg-white"
								>
									<option value="">All Statuses</option>
									<option value="paid">Paid</option>
									<option value="open">Open</option>
									<option value="void">Void</option>
									<option value="draft">Draft</option>
								</select>
							</div>

							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-700">
									User Type:
								</label>
								<select
									value={userTypeFilter}
									onChange={(e) => {
										setUserTypeFilter(e.target.value)
										setCurrentPage(1)
									}}
									className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64] bg-white"
								>
									<option value="">All Users</option>
									<option value="applicant">Applicant</option>
									<option value="institution">Institution</option>
								</select>
							</div>

							{(statusFilter || userTypeFilter) && (
								<Button
									onClick={() => {
										setStatusFilter('')
										setUserTypeFilter('')
										setCurrentPage(1)
									}}
									variant="outline"
									size="sm"
									className="text-gray-600"
								>
									Clear Filters
								</Button>
							)}
						</div>
					)}
				</div>

				{/* Results Info */}
				<div className="mb-4 flex justify-between items-center">
					<p className="text-sm text-gray-500">
						{searchTerm || statusFilter || userTypeFilter ? (
							<>
								Showing {filteredAndSortedInvoices.length} of {pagination.total}{' '}
								invoices
								{searchTerm && ` matching "${searchTerm}"`}
							</>
						) : (
							`Showing ${pagination.limit} of ${pagination.total} invoices`
						)}
					</p>
				</div>

				{/* Table Container */}
				<div className="bg-gray-50 rounded-[20px] p-6">
					{/* Table Header */}
					<div className="bg-[#126E64] rounded-t-[20px] px-6 py-4">
						<div className="grid grid-cols-6 gap-4 text-white font-semibold">
							<div
								className="flex items-center gap-2 cursor-pointer hover:text-gray-200 transition-colors"
								onClick={() => handleSort('date')}
							>
								Date
								{getSortIcon('date')}
							</div>
							<div>Period</div>
							<div
								className="flex items-center gap-2 cursor-pointer hover:text-gray-200 transition-colors"
								onClick={() => handleSort('method')}
							>
								Payment Method
								{getSortIcon('method')}
							</div>
							<div
								className="flex items-center gap-2 cursor-pointer hover:text-gray-200 transition-colors"
								onClick={() => handleSort('amount')}
							>
								Amount
								{getSortIcon('amount')}
							</div>
							<div
								className="flex items-center gap-2 cursor-pointer hover:text-gray-200 transition-colors"
								onClick={() => handleSort('status')}
							>
								Status
								{getSortIcon('status')}
							</div>
							<div>Actions</div>
						</div>
					</div>

					{/* Table Body */}
					<div className="space-y-0">
						{filteredAndSortedInvoices.length === 0 ? (
							<div className="px-6 py-12 text-center">
								<p className="text-gray-500">
									{searchTerm
										? 'No invoices match your search criteria'
										: 'No payment history found'}
								</p>
							</div>
						) : (
							filteredAndSortedInvoices.map((invoice, index) => (
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
