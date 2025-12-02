'use client'

import { SearchAndFilter } from '@/components/profile/institution/components/SearchAndFilter'
import { Button, Card, CardContent } from '@/components/ui'
import { useAdminUserManagement } from '@/hooks/admin/useAdminUserManagement'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface UserManagementTableProps {
	userType: 'applicant' | 'institution' | 'admin'
	onViewDetails: (userId: string) => void
}

const UserManagementTable = memo(function UserManagementTable({
	userType,
	onViewDetails,
}: UserManagementTableProps) {
	const {
		users,
		loading,
		error,
		total,
		currentPage,
		filters,
		updateFilters,
		setPage,
		pagination,
	} = useAdminUserManagement()

	// Local state for UI
	const [searchInput, setSearchInput] = useState('')
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>(
		filters.sortBy || 'name'
	)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
		filters.sortDirection || 'desc'
	)
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Set userType filter when component mounts or userType changes
	// Also reset search and other filters when switching tabs
	useEffect(() => {
		// Clear any pending debounced search
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
			searchTimeoutRef.current = null
		}

		// Reset search input when switching tabs
		setSearchInput('')
		setStatusFilter([])
		// Update filters with new userType and reset search
		updateFilters({ userType, search: '', status: 'all', page: 1 })
	}, [userType, updateFilters])

	// Debounced search to prevent excessive API calls
	const debouncedSearch = useCallback(
		(value: string) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}

			searchTimeoutRef.current = setTimeout(() => {
				updateFilters({
					search: value.trim(),
				})
			}, 500) // 500ms delay
		},
		[updateFilters]
	)

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [])

	// Handle status filter with new admin API - supports multiple statuses
	const handleStatusFilter = useCallback(
		(statusArray: string[]) => {
			setStatusFilter(statusArray)
			// Convert array to comma-separated string or "all" if empty
			const statusValue = statusArray.length > 0 ? statusArray.join(',') : 'all'
			updateFilters({
				status: statusValue,
			})
		},
		[updateFilters]
	)

	// Handle sorting with new admin API
	const handleSort = useCallback(
		(field: string) => {
			const validField = field as 'name' | 'email' | 'createdAt'
			setSortBy(validField)
			updateFilters({
				sortBy: validField,
				sortDirection: sortDirection,
			})
		},
		[updateFilters, sortDirection]
	)

	const handleSortDirection = useCallback(
		(direction: 'asc' | 'desc') => {
			setSortDirection(direction)
			updateFilters({
				sortBy: sortBy,
				sortDirection: direction,
			})
		},
		[updateFilters, sortBy]
	)

	// Handle pagination with new admin API
	const handlePageChange = useCallback(
		(page: number) => {
			setPage(page)
		},
		[setPage]
	)

	// Natural sort function for alphanumeric strings
	// const naturalSort = useCallback(
	// 	(a: string, b: string, direction: 'asc' | 'desc') => {
	// 		const collator = new Intl.Collator(undefined, {
	// 			numeric: true,
	// 			sensitivity: 'base',
	// 		})
	// 		const result = collator.compare(a, b)
	// 		return direction === 'asc' ? result : -result
	// 	},
	// 	[]
	// )

	// // Apply client-side natural sorting to the users from API
	// const displayUsers = [...users].sort((a, b) => {
	// 	if (sortBy === 'name') {
	// 		return naturalSort(a.name || '', b.name || '', sortDirection)
	// 	} else if (sortBy === 'email') {
	// 		return naturalSort(a.email || '', b.email || '', sortDirection)
	// 	} else {
	// 		// For createdAt, use standard comparison
	// 		const dateA = new Date(a.createdAt).getTime()
	// 		const dateB = new Date(b.createdAt).getTime()
	// 		return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
	// 	}
	// })

	const totalPages = pagination?.totalPages || 1
	const itemsPerPage = filters.limit || 10

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold text-black capitalize">
					{userType}s {!loading && `(${total} total)`}
				</h2>
			</div>

			{/* Search and Filters */}
			<SearchAndFilter
				searchQuery={searchInput}
				onSearchChange={(query) => {
					setSearchInput(query)
					debouncedSearch(query)
				}}
				statusFilter={statusFilter}
				onStatusFilterChange={handleStatusFilter}
				sortBy={sortBy}
				onSortChange={(sort) => handleSort(sort)}
				sortDirection={sortDirection}
				onSortDirectionChange={(direction) => handleSortDirection(direction)}
				searchPlaceholder="Search by name or email..."
				statusOptions={
					userType === 'institution'
						? [
								{ value: 'active', label: 'Active' },
								{ value: 'pending', label: 'Pending' },
								{ value: 'rejected', label: 'Rejected' },
								{ value: 'banned', label: 'Banned' },
							]
						: [
								{ value: 'active', label: 'Active' },
								{ value: 'inactive', label: 'Inactive' },
								{ value: 'banned', label: 'Banned' },
							]
				}
				sortOptions={[
					{ value: 'name', label: 'Name' },
					{ value: 'createdAt', label: 'Created Date' },
					{ value: 'email', label: 'Email' },
				]}
			/>

			{/* Table with horizontal scroll */}
			<Card className="bg-white rounded-[24px] shadow-xl overflow-hidden border-0">
				<CardContent className="p-0">
					{/* Small Progress Bar at Top of Table */}
					{loading && (
						<div className="w-full bg-gray-200 h-1 overflow-hidden">
							<div
								className="bg-primary h-1"
								style={{
									width: '100%',
									background:
										'linear-gradient(90deg, #126E64 0%, #0D504A 50%, #126E64 100%)',
									backgroundSize: '200% 100%',
									animation: 'shimmer 1.5s ease-in-out infinite',
								}}
							/>
							<style jsx>{`
								@keyframes shimmer {
									0% {
										background-position: -200% 0;
									}
									100% {
										background-position: 200% 0;
									}
								}
							`}</style>
						</div>
					)}
					<div className="w-full">
						<div className="bg-[#126E64] text-white grid grid-cols-6 px-8 py-5 text-center font-bold text-base">
							<div className="text-left">Name</div>
							<div>Email</div>
							<div>Status</div>
							<div>Role</div>
							<div>Created</div>
							<div className="pl-8">Actions</div>
						</div>

						{loading ? (
							<div className="text-center py-12 text-gray-500">
								Loading {userType}s...
							</div>
						) : error ? (
							<div className="text-center py-12">
								<div className="text-red-500 text-4xl mb-2">⚠️</div>
								<p className="text-red-600 mb-1">Error loading {userType}s</p>
								<p className="text-sm text-gray-600">{error}</p>
							</div>
						) : (
							<div className="divide-y divide-gray-100">
								{users.map((user, index) => {
									const isEven = index % 2 === 0
									const rowBg = isEven ? 'bg-[#EAEDF3]' : 'bg-white'

									return (
										<motion.div
											key={user.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className={`${rowBg} grid grid-cols-6 px-8 py-5 items-center`}
										>
											{/* Name with tooltip for long text */}
											<div className="font-semibold text-base text-black text-left group relative">
												<div className="truncate">{user.name}</div>
												{user.name.length > 20 && (
													<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
														{user.name}
													</div>
												)}
											</div>

											{/* Email with tooltip for long text */}
											<div className="text-gray-700 text-sm text-center group relative">
												<div className="truncate">{user.email}</div>
												{user.email.length > 25 && (
													<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
														{user.email}
													</div>
												)}
											</div>

											<div className="text-center">
												<span
													className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
														user.status === 'banned'
															? 'bg-[#E20000] text-white'
															: user.status === 'rejected'
																? 'bg-[#FFA500] text-white'
																: user.status === 'pending'
																	? 'bg-[#FFC107] text-white'
																	: 'bg-[#126E64] text-white'
													}`}
												>
													{user.status === 'banned'
														? 'Banned'
														: user.status === 'rejected'
															? 'Rejected'
															: user.status === 'pending'
																? 'Pending'
																: 'Active'}
												</span>
											</div>

											<div className="text-gray-700 text-sm text-center">
												{user.role || 'User'}
											</div>

											<div className="text-gray-700 text-sm text-center">
												{new Date(user.createdAt).toLocaleDateString()}
											</div>

											<div className="flex justify-center gap-2.5 pl-8">
												<Button
													variant="secondary"
													size="sm"
													onClick={() => onViewDetails(user.id)}
													className="text-[#126E64] hover:bg-[#126E64] hover:text-white text-sm px-2.5 py-1.5 h-auto flex items-center"
												>
													<Eye className="w-3.5 h-3.5 mr-1" />
													<span>Details</span>
												</Button>
											</div>
										</motion.div>
									)
								})}
							</div>
						)}

						{!loading && !error && users.length === 0 && (
							<div className="text-center py-12 text-gray-500">
								No users found matching your criteria.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
			{!loading && (
				<div className="flex justify-between items-center mt-6">
					<div className="text-gray-600 text-xs font-medium">
						Display {Math.min(itemsPerPage, users.length)} results of{' '}
						<span className="font-semibold text-gray-800">{total}</span>
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium text-sm"
						>
							‹
						</button>

						{[...Array(Math.min(6, totalPages))].map((_, i) => {
							const pageNum = i + 1
							return (
								<button
									key={pageNum}
									onClick={() => handlePageChange(pageNum)}
									className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
										currentPage === pageNum
											? 'bg-[#126E64] text-white shadow-md'
											: 'text-gray-700 hover:bg-gray-100 hover:text-[#126E64]'
									}`}
								>
									{pageNum}
								</button>
							)
						})}

						{totalPages > 6 && (
							<>
								<span className="text-gray-400 mx-1 text-xs">...</span>
								<button
									onClick={() => handlePageChange(totalPages)}
									className="w-8 h-8 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#126E64] transition-all"
								>
									{totalPages}
								</button>
							</>
						)}

						<button
							onClick={() =>
								handlePageChange(Math.min(totalPages, currentPage + 1))
							}
							disabled={currentPage === totalPages}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium text-sm"
						>
							›
						</button>
					</div>
				</div>
			)}
		</div>
	)
})

export { UserManagementTable }
