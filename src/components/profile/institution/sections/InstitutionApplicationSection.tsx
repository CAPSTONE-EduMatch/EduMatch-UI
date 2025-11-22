'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
	StatisticsCards,
	SearchAndFilter,
	ApplicantsTable,
	Pagination,
	type Applicant,
} from '../components'

interface InstitutionApplicationSectionProps {
	profile: any
}

export const InstitutionApplicationSection: React.FC<
	InstitutionApplicationSectionProps
> = ({ profile }) => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [searchInput, setSearchInput] = useState('') // What user types
	const [searchQuery, setSearchQuery] = useState('') // Actual search query sent to API
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const postIdFromUrlRef = useRef<boolean>(false) // Track if postId came from URL
	// Note: selectedApplicant is no longer needed as detail view is in separate route
	const [applicants, setApplicants] = useState<Applicant[]>([])
	const [stats, setStats] = useState({
		total: 0,
		approved: 0,
		rejected: 0,
		pending: 0,
	})
	const [paginationMeta, setPaginationMeta] = useState({
		total: 0,
		page: 1,
		limit: 10,
		totalPages: 1,
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const itemsPerPage = 10

	// Populate search bar when postId comes from URL
	useEffect(() => {
		const postIdParam = searchParams.get('postId')
		// When postId comes from URL, populate search bar and use search query
		// This allows the API to search for it, and user can see/edit it
		if (postIdParam && postIdParam !== searchInput) {
			postIdFromUrlRef.current = true
			// Populate search bar with postId when navigating from "View All Applications"
			setSearchInput(postIdParam)
			// Set search query immediately (no debounce needed for URL navigation)
			setSearchQuery(postIdParam)
		} else if (!postIdParam && postIdFromUrlRef.current) {
			// If postId was removed from URL and search bar still shows the postId, clear it
			postIdFromUrlRef.current = false
			// Check if current search input matches a UUID pattern (likely a postId)
			const uuidPattern =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
			if (searchInput && uuidPattern.test(searchInput.trim())) {
				setSearchInput('')
				setSearchQuery('')
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams])

	// Debounced search handler - waits 1 second after user stops typing
	// The API will search in all columns including postId, so we just pass the search query directly
	useEffect(() => {
		// Clear existing timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current)
		}

		// If search input is empty, clear search query immediately
		if (searchInput.trim() === '') {
			setSearchQuery('')
			return
		}

		// Set new timeout for debounced search (1000ms = 1 second)
		searchTimeoutRef.current = setTimeout(() => {
			const trimmedInput = searchInput.trim()
			// Just set the search query - API will search in postId column automatically
			setSearchQuery(trimmedInput)
		}, 1000)

		// Cleanup timeout on unmount or when searchInput changes
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [searchInput])

	// Fetch applications from API
	const fetchApplications = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams({
				search: searchQuery,
				status: statusFilter.join(','),
				sortBy: sortBy,
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
			})

			// Note: We don't add postId as a separate filter parameter anymore
			// The search query now includes postId search, so we just use search parameter

			const response = await fetch(`/api/applications/institution?${params}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch applications')
			}

			const result = await response.json()

			if (result.success) {
				setApplicants(result.data)
				setStats(result.stats)
				if (result.meta) {
					setPaginationMeta(result.meta)
				}
			} else {
				throw new Error(result.error || 'Failed to fetch applications')
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to fetch applications'
			)
		} finally {
			setLoading(false)
		}
	}, [searchQuery, statusFilter, sortBy, currentPage, itemsPerPage])

	// Fetch applications when filters, search, sort, or page changes
	useEffect(() => {
		fetchApplications()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, searchQuery, statusFilter, sortBy])

	// Note: Filtering, searching, and sorting are now handled server-side
	// The API returns the filtered and paginated results

	// Event handlers
	const handleStatusFilterChange = (filter: string[]) => {
		setStatusFilter(filter)
		setCurrentPage(1) // Reset to page 1 when filter changes
	}

	const handleSearchChange = (query: string) => {
		// Update the input immediately (for UI responsiveness)
		setSearchInput(query)
		setCurrentPage(1) // Reset to page 1 when search changes
		// The actual API call will be triggered by the debounced effect after 3 seconds
	}

	const handleSortChange = (sort: string) => {
		setSortBy(sort)
		setCurrentPage(1) // Reset to page 1 when sort changes
	}

	const handleMoreDetail = (applicant: Applicant) => {
		// Navigate to dedicated applicant detail route
		router.push(`/institution/dashboard/applications/${applicant.id}`)
	}

	// Note: These handlers are no longer needed as detail view is in separate route
	// Actions are handled in the detail page component

	// Note: Applicant detail view is now shown in a separate route
	// This component only shows the list view

	// Show list view by default
	return (
		<div className="space-y-6">
			<div className="rounded-xl p-6 w-full">
				{/* Page Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{profile?.institutionName || 'Institution'}&apos;s Applications
				</h1>

				{/* Statistics Cards */}
				<StatisticsCards
					total={stats.total}
					approved={stats.approved}
					rejected={stats.rejected}
				/>

				{/* Applicants Section */}
				<div className="border bg-white border-gray-200 rounded-xl p-6 relative">
					{/* Subtle loading indicator */}
					{loading && (
						<div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-10">
							<div
								className="h-full bg-teal-600 animate-pulse"
								style={{ width: '30%' }}
							></div>
						</div>
					)}

					{/* Error message */}
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-red-600">⚠️</span>
								<span className="text-sm text-red-700">{error}</span>
							</div>
							<button
								onClick={fetchApplications}
								className="text-xs text-red-600 hover:text-red-800 underline"
							>
								Retry
							</button>
						</div>
					)}

					{/* Search and Filter Bar */}
					<SearchAndFilter
						searchQuery={searchInput}
						onSearchChange={handleSearchChange}
						statusFilter={statusFilter}
						onStatusFilterChange={handleStatusFilterChange}
						sortBy={sortBy}
						onSortChange={handleSortChange}
					/>

					{/* Applicants Table */}
					{loading && applicants.length === 0 ? (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
								<p className="mt-4 text-muted-foreground">
									Loading applications...
								</p>
							</div>
						</div>
					) : (
						<div className={loading ? 'opacity-60 pointer-events-none' : ''}>
							<ApplicantsTable
								applicants={applicants}
								onMoreDetail={handleMoreDetail}
							/>
						</div>
					)}

					{/* Pagination */}
					<Pagination
						currentPage={paginationMeta.page}
						totalPages={paginationMeta.totalPages}
						itemsPerPage={paginationMeta.limit}
						totalItems={paginationMeta.total}
						onPageChange={setCurrentPage}
					/>
				</div>
			</div>
		</div>
	)
}
