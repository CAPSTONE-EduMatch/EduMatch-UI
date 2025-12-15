'use client'

import { ViewDetailButton } from '@/components/admin/ViewDetailButton'
import { SearchAndFilter } from '@/components/profile/institution/components/SearchAndFilter'
import { Card, CardContent } from '@/components/ui'
import { useDebouncedValue } from '@/hooks'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SupportRequest {
	id: string
	name: string
	email: string
	contact: string
	sendDate: string
	status: 'Replied' | 'Pending'
	subject?: string
	message?: string
}

interface SupportTableProps {
	data: SupportRequest[]
	// eslint-disable-next-line no-unused-vars
	onViewSupport: (request: SupportRequest) => void
	// eslint-disable-next-line no-unused-vars
	onReplySupport: (request: SupportRequest) => void
	pagination?: {
		currentPage: number
		totalPages: number
		totalCount: number
		limit: number
	} | null
	// eslint-disable-next-line no-unused-vars
	onPageChange?: (page: number) => void
	// eslint-disable-next-line no-unused-vars
	onFiltersChange?: (filters: {
		search?: string
		status?: string
		sortBy?: string
	}) => void
}

const SupportTable = ({
	data,
	onViewSupport,
	onReplySupport,
	pagination,
	onPageChange,
	onFiltersChange,
}: SupportTableProps) => {
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState('newest')

	// Debounce search with 500ms delay
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 500)

	// Use server-side pagination data
	const currentPage = pagination?.currentPage || 1
	const totalPages = pagination?.totalPages || 1
	const paginatedData = data // Data is already paginated from the server

	const handlePageChange = (page: number) => {
		onPageChange?.(page)
	}

	// Update filters when debounced search or other filters change
	useEffect(() => {
		onFiltersChange?.({
			search: debouncedSearchQuery || undefined,
			status: statusFilter.length === 1 ? statusFilter[0].toLowerCase() : 'all',
			sortBy: sortBy,
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearchQuery, statusFilter, sortBy])

	const getStatusBadge = (status: string) => {
		const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'

		switch (status) {
			case 'Replied':
				return `${baseClasses} bg-[#126E64] text-white`
			case 'Pending':
				return `${baseClasses} bg-orange-500 text-white`
			default:
				return `${baseClasses} bg-gray-500 text-white`
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">Support</h2>
			</div>

			{/* Search and Filter */}
			<SearchAndFilter
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				sortBy={sortBy}
				onSortChange={setSortBy}
				searchPlaceholder="Enter name, email..."
				statusOptions={[
					{ value: 'Pending', label: 'Pending' },
					{ value: 'Replied', label: 'Replied' },
				]}
				sortOptions={[
					{ value: 'newest', label: 'Newest First' },
					{ value: 'oldest', label: 'Oldest First' },
				]}
			/>

			{/* Table */}
			<Card className="bg-white rounded-[24px] shadow-xl overflow-hidden border-0">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<div className="w-full min-w-full">
							{/* Table Header */}
							<div className="bg-[#126E64] text-white grid grid-cols-6 px-8 py-5 text-center font-bold text-base">
								<div className="text-left">Name</div>
								<div>Email</div>
								<div>Contact</div>
								<div>Send date</div>
								<div>Status</div>
								<div className="text-right">Actions</div>
							</div>

							{/* Table Body */}
							<div className="divide-y divide-gray-100">
								{paginatedData.map((request, index) => (
									<motion.div
										key={request.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className={`grid grid-cols-6 px-8 py-4 items-center text-sm ${
											index % 2 === 0 ? 'bg-[#EAEDF3]' : 'bg-white'
										} hover:bg-gray-50 transition-colors duration-200`}
									>
										{/* Name with tooltip */}
										<div className="font-medium text-gray-900 text-left group relative min-w-0">
											<div className="truncate pr-2">{request.name}</div>
											{request.name.length > 30 && (
												<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap max-w-xs pointer-events-none">
													{request.name}
												</div>
											)}
										</div>

										{/* Email with tooltip */}
										<div className="text-gray-700 text-center group relative min-w-0">
											<div className="truncate px-2">{request.email}</div>
											{request.email.length > 25 && (
												<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap max-w-md pointer-events-none">
													{request.email}
												</div>
											)}
										</div>

										{/* Contact with tooltip */}
										<div className="text-gray-700 text-center group relative min-w-0">
											<div className="truncate px-2">{request.contact}</div>
											{request.contact.length > 20 && (
												<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap max-w-xs pointer-events-none">
													{request.contact}
												</div>
											)}
										</div>

										<div className="text-gray-700 text-center">
											{request.sendDate}
										</div>
										<div className="text-center">
											<span className={getStatusBadge(request.status)}>
												{request.status}
											</span>
										</div>
										<div className="text-right">
											{request.status === 'Pending' ? (
												<ViewDetailButton
													onClick={() => onReplySupport(request)}
													type="modal"
												/>
											) : (
												<ViewDetailButton
													onClick={() => onViewSupport(request)}
													type="modal"
												/>
											)}
										</div>
									</motion.div>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-between items-center mt-6">
					<div className="text-gray-600 text-xs font-medium">
						Display {Math.min(pagination?.limit || 10, data.length)} results of{' '}
						<span className="font-semibold text-gray-800">
							{pagination?.totalCount || 0}
						</span>
					</div>{' '}
					<div className="flex items-center space-x-1">
						{/* Previous Button */}
						{currentPage > 1 && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handlePageChange(currentPage - 1)}
								className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
							>
								‹
							</motion.button>
						)}

						{/* Page Numbers */}
						{Array.from({ length: Math.min(totalPages, 6) }, (_, i) => {
							let pageNum: number
							if (totalPages <= 6) {
								pageNum = i + 1
							} else if (currentPage <= 3) {
								pageNum = i + 1
							} else if (currentPage >= totalPages - 2) {
								pageNum = totalPages - 5 + i
							} else {
								pageNum = currentPage - 2 + i
							}

							return (
								<motion.button
									key={pageNum}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => handlePageChange(pageNum)}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
										currentPage === pageNum
											? 'bg-[#126E64] text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									{pageNum}
								</motion.button>
							)
						})}

						{totalPages > 6 && currentPage < totalPages - 2 && (
							<>
								<span className="text-gray-500 px-2">...</span>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => handlePageChange(totalPages)}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
										currentPage === totalPages
											? 'bg-[#126E64] text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									{totalPages}
								</motion.button>
							</>
						)}

						{/* Next Button */}
						{currentPage < totalPages && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handlePageChange(currentPage + 1)}
								className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
							>
								›
							</motion.button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export { SupportTable }
export default SupportTable
