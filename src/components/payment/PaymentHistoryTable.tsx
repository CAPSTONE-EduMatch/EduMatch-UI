'use client'

import { ViewDetailButton } from '@/components/admin/ViewDetailButton'
import { Button, Card, CardContent, CustomSelect } from '@/components/ui'
import { Badge } from '@/components/ui/cards/badge'
import { ShortIdWithCopy } from '@/components/ui/ShortIdWithCopy'
import { useInvoices } from '@/hooks/subscription/useInvoices'
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type SortField = 'date' | 'amount' | 'status' | 'method'
type SortDirection = 'asc' | 'desc'

export function PaymentHistoryTable() {
	const [currentPage, setCurrentPage] = useState(1)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [userTypeFilter, setUserTypeFilter] = useState<string>('')
	const [sortField, setSortField] = useState<SortField>('date')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

	// Track initial load
	const [isInitialLoad, setIsInitialLoad] = useState(true)

	// Reset page when search term changes
	useEffect(() => {
		if (searchTerm) {
			setCurrentPage(1)
		}
	}, [searchTerm])

	// Mark initial load as complete after first data fetch
	useEffect(() => {
		if (!loading && invoices.length >= 0) {
			setIsInitialLoad(false)
		}
	}, [loading, invoices.length])

	// Show full loading state only on initial load
	if (isInitialLoad && loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
				<span className="ml-2">Loading payment history...</span>
			</div>
		)
	}

	// Show error state only if no data and it's not initial load
	if (error && !isInitialLoad && invoices.length === 0) {
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

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200 w-full">
			<CardContent className="p-8 w-full">
				{/* Header */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Payment History
					</h2>
					<p className="text-gray-600 mb-4">View your past invoices</p>
				</div>

				{/* Search and Filter Controls */}
				<div className="pb-6">
					<div className="flex flex-col sm:flex-row gap-4">
						{/* Search Bar */}
						<div className="flex-1">
							<div className="relative">
								<input
									type="text"
									placeholder="Search by invoice ID, email, or receipt number..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
								/>
								<button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
									<Search className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Filter Dropdowns */}
						<div className="flex gap-2">
							{/* Status Filter */}
							<div className="w-48">
								<CustomSelect
									value={
										statusFilter
											? {
													value: statusFilter,
													label:
														statusFilter.charAt(0).toUpperCase() +
														statusFilter.slice(1),
												}
											: null
									}
									onChange={(selected) => {
										setStatusFilter(selected?.value || '')
										setCurrentPage(1)
									}}
									placeholder="All Statuses"
									options={[
										{ value: 'paid', label: 'Paid' },
										{ value: 'open', label: 'Open' },
										{ value: 'void', label: 'Void' },
										{ value: 'draft', label: 'Draft' },
										{ value: 'uncollectible', label: 'Uncollectible' },
									]}
									variant="default"
									isClearable
									className="w-full"
								/>
							</div>

							{/* User Type Filter */}
							<div className="w-48">
								<CustomSelect
									value={
										userTypeFilter
											? {
													value: userTypeFilter,
													label:
														userTypeFilter.charAt(0).toUpperCase() +
														userTypeFilter.slice(1),
												}
											: null
									}
									onChange={(selected) => {
										setUserTypeFilter(selected?.value || '')
										setCurrentPage(1)
									}}
									placeholder="All Users"
									options={[
										{ value: 'applicant', label: 'Applicant' },
										{ value: 'institution', label: 'Institution' },
									]}
									variant="default"
									isClearable
									className="w-full"
								/>
							</div>
						</div>
					</div>
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

				{/* Error Message */}
				{error && invoices.length > 0 && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
						<p className="text-sm text-red-600">Error: {error}</p>
						<Button
							onClick={() => refetch()}
							variant="outline"
							size="sm"
							className="text-red-600 border-red-300 hover:bg-red-50"
						>
							Retry
						</Button>
					</div>
				)}

				{/* Table Container */}
				<div className="bg-gray-50 rounded-[20px] p-6 w-full">
					{/* Table Header */}
					<div className="bg-[#126E64] rounded-t-[20px] px-6 py-4 w-full">
						<div
							className="grid gap-4 text-white font-semibold text-sm w-full"
							style={{
								gridTemplateColumns: '1fr 1.5fr 1.2fr 1fr 1fr 0.8fr 1.2fr',
							}}
						>
							<div
								className="flex items-center gap-2 cursor-pointer hover:text-gray-200 transition-colors"
								onClick={() => handleSort('date')}
							>
								Date
								{getSortIcon('date')}
							</div>
							<div className="flex items-center">Invoice ID</div>
							<div className="flex items-center">User ID</div>
							<div className="flex items-center">Type</div>
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
							<div className="flex items-center">Actions</div>
						</div>
					</div>

					{/* Table Body */}
					<div className="space-y-0">
						{loading && !isInitialLoad ? (
							// Skeleton Loading Rows
							<div className="animate-pulse">
								{[1, 2, 3, 4, 5].map((i) => (
									<div
										key={i}
										className={`px-6 py-4 border-b border-gray-200 last:border-b-0 w-full ${
											i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
										}`}
									>
										<div
											className="grid gap-4 items-center w-full"
											style={{
												gridTemplateColumns:
													'1fr 1.5fr 1.2fr 1fr 1fr 0.8fr 1.2fr',
											}}
										>
											<div className="h-4 bg-gray-200 rounded w-24"></div>
											<div className="h-4 bg-gray-200 rounded w-32"></div>
											<div className="h-4 bg-gray-200 rounded w-28"></div>
											<div className="h-4 bg-gray-200 rounded w-20"></div>
											<div className="h-4 bg-gray-200 rounded w-16"></div>
											<div className="h-6 bg-gray-200 rounded-full w-16"></div>
											<div className="h-4 bg-gray-200 rounded w-20"></div>
										</div>
									</div>
								))}
							</div>
						) : filteredAndSortedInvoices.length === 0 ? (
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
									className={`px-6 py-4 border-b border-gray-200 last:border-b-0 w-full ${
										index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
									}`}
								>
									<div
										className="grid gap-4 items-center w-full"
										style={{
											gridTemplateColumns:
												'1fr 1.5fr 1.2fr 1fr 1fr 0.8fr 1.2fr',
										}}
									>
										{/* Date */}
										<div className="text-sm font-medium text-gray-900">
											{invoice.paidAt
												? new Date(invoice.paidAt).toLocaleDateString('en-GB', {
														day: '2-digit',
														month: '2-digit',
														year: 'numeric',
													})
												: invoice.createdAt
													? new Date(invoice.createdAt).toLocaleDateString(
															'en-GB',
															{
																day: '2-digit',
																month: '2-digit',
																year: 'numeric',
															}
														)
													: 'N/A'}
										</div>

										{/* Invoice ID */}
										<div className="flex items-center">
											<ShortIdWithCopy
												id={invoice.stripeInvoiceId || invoice.id}
											/>
										</div>

										{/* User ID */}
										<div className="flex items-center">
											{invoice.user?.id ? (
												<ShortIdWithCopy id={invoice.user.id} />
											) : (
												<span className="text-sm text-gray-500">N/A</span>
											)}
										</div>

										{/* Type */}
										<div className="text-sm text-gray-900">
											{invoice.userType ? (
												<span className="capitalize">{invoice.userType}</span>
											) : (
												<span className="text-gray-500">N/A</span>
											)}
										</div>

										{/* Amount */}
										<div className="text-sm font-medium text-gray-900">
											$
											{typeof invoice.amount === 'number'
												? (invoice.amount / 100).toFixed(2)
												: typeof invoice.amount === 'string'
													? parseFloat(invoice.amount).toFixed(2)
													: '0.00'}
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
										<div className="flex items-center justify-start">
											{invoice.hostedInvoiceUrl && (
												<ViewDetailButton
													onClick={() => {}}
													type="external"
													href={invoice.hostedInvoiceUrl}
												/>
											)}
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
