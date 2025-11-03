'use client'

import { Button, Card, CardContent } from '@/components/ui'
import { useAdminUserManagement } from '@/hooks/admin/useAdminUserManagement'
import { motion } from 'framer-motion'
import { Eye, Filter, RotateCw, Search } from 'lucide-react'
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

	// Local state for UI - independent of query filters to prevent focus loss
	const [searchInput, setSearchInput] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>(
		'all'
	)
	const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>(
		filters.sortBy || 'name'
	)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
		filters.sortDirection || 'desc'
	)
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const isSearchingRef = useRef(false)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const wasFocusedRef = useRef(false)

	// Set userType filter when component mounts or userType changes
	useEffect(() => {
		updateFilters({ userType })
	}, [userType, updateFilters])

	// Track when search input is focused
	const handleSearchFocus = useCallback(() => {
		wasFocusedRef.current = true
	}, [])

	const handleSearchBlur = useCallback(() => {
		wasFocusedRef.current = false
	}, [])

	// Restore focus after data fetch if input was previously focused
	useEffect(() => {
		if (wasFocusedRef.current && searchInputRef.current && !loading) {
			const timeoutId = setTimeout(() => {
				if (searchInputRef.current && wasFocusedRef.current) {
					searchInputRef.current.focus()
				}
			}, 10)
			return () => clearTimeout(timeoutId)
		}
	}, [loading, users]) // Re-run when loading state changes or users update

	// Debounced search to prevent excessive API calls
	const debouncedSearch = useCallback(
		(value: string) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}

			searchTimeoutRef.current = setTimeout(() => {
				isSearchingRef.current = true
				updateFilters({
					search: value.trim(),
				})
				setTimeout(() => {
					isSearchingRef.current = false
				}, 100)
			}, 500) // 500ms delay
		},
		[updateFilters]
	)

	// Handle search input change - updates local state immediately for UI
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			setSearchInput(value) // Update UI immediately
			debouncedSearch(value) // Trigger API call after delay
		},
		[debouncedSearch]
	)

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [])

	// Handle status filter with new admin API
	const handleStatusFilter = useCallback(
		(status: string) => {
			const validStatus = status as 'all' | 'active' | 'banned'
			setStatusFilter(validStatus)
			updateFilters({
				status: validStatus,
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

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-base text-gray-600">Loading users...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-base text-red-600">Error: {error}</div>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* Header and Search */}
			<div className="flex justify-between items-center gap-6">
				<h2 className="text-2xl font-bold text-black capitalize min-w-fit">
					{userType}s ({total} total)
				</h2>

				{/* Search Bar */}
				<div className="flex-1 max-w-2xl">
					<div className="relative">
						<input
							ref={searchInputRef}
							key="search-input-stable"
							type="text"
							placeholder="Search by name or email..."
							value={searchInput}
							onChange={handleSearchChange}
							onFocus={handleSearchFocus}
							onBlur={handleSearchBlur}
							className="w-full px-6 py-3 pr-16 rounded-full border-2 border-[#126E64] focus:outline-none focus:ring-2 focus:ring-[#126E64]/30 text-gray-700 text-base"
						/>
						<div className="absolute right-0 top-0 bottom-0 bg-[#126E64] rounded-r-full px-5 flex items-center">
							<Search className="w-5 h-5 text-white" />
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="flex gap-4 min-w-fit">
					<div className="bg-white border-2 border-gray-300 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
						<Filter className="w-4 h-4 text-gray-600" />
						<select
							value={statusFilter}
							onChange={(e) => handleStatusFilter(e.target.value)}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm min-w-[80px]"
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="banned">Banned</option>
						</select>
					</div>

					<div className="bg-white border-2 border-gray-300 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
						<RotateCw className="w-4 h-4 text-gray-600" />
						<select
							value={sortBy}
							onChange={(e) => handleSort(e.target.value)}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm min-w-[60px]"
						>
							<option value="name">Name</option>
							<option value="createdAt">Created Date</option>
							<option value="email">Email</option>
						</select>
					</div>

					<div className="bg-white border-2 border-gray-300 rounded-full px-3 py-3 flex items-center shadow-sm hover:shadow-md transition-shadow">
						<select
							value={sortDirection}
							onChange={(e) =>
								handleSortDirection(e.target.value as 'asc' | 'desc')
							}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm"
						>
							<option value="desc">↓ Desc</option>
							<option value="asc">↑ Asc</option>
						</select>
					</div>
				</div>
			</div>

			{/* Table with horizontal scroll */}
			<Card className="bg-white rounded-[24px] shadow-xl overflow-hidden border-0">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<div className="w-full min-w-full">
							<div className="bg-[#126E64] text-white grid grid-cols-6 px-8 py-5 text-center font-bold text-base">
								<div className="text-left">Name</div>
								<div>Email</div>
								<div>Status</div>
								<div>Role</div>
								<div>Created</div>
								<div className="pl-8">Actions</div>
							</div>

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
														!user.banned
															? 'bg-[#126E64] text-white'
															: 'bg-[#E20000] text-white'
													}`}
												>
													{!user.banned ? 'Active' : 'Banned'}
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

							{users.length === 0 && (
								<div className="text-center py-12 text-gray-500">
									No users found matching your criteria.
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
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
		</div>
	)
})

export { UserManagementTable }
