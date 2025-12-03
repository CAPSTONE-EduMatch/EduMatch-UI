'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
	PostsStatisticsCards,
	PostsSearchAndFilter,
	PostsTable,
	Pagination,
	type Post,
} from '../components'
import { CreateProgramPage } from '@/components/profile/institution/create/CreateProgramPage'
import { CreateScholarshipPage } from '@/components/profile/institution/create/CreateScholarshipPage'
import { CreateResearchLabPage } from '@/components/profile/institution/create/CreateResearchLabPage'

interface ProgramsSectionProps {
	profile: any
	onProfileUpdate?: () => Promise<void>
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
	profile,
}) => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [searchQuery, setSearchQuery] = useState('')
	const [typeFilter, setTypeFilter] = useState<string[]>([])
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [createFormType, setCreateFormType] = useState<
		'Program' | 'Scholarship' | 'Research Lab' | null
	>(null)

	// Check if we're in create or edit mode via URL parameter
	const action = searchParams?.get('action')
	const editId = searchParams?.get('id')
	const isCreateMode = action === 'create'
	const isEditMode = action === 'edit' && editId
	const createType =
		isCreateMode || isEditMode
			? (searchParams?.get('type') as
					| 'Program'
					| 'Scholarship'
					| 'Research Lab'
					| null)
			: null
	const [editData, setEditData] = useState<any>(null)
	const [loadingEditData, setLoadingEditData] = useState(false)
	const [posts, setPosts] = useState<Post[]>([])
	const [stats, setStats] = useState({
		total: 0,
		published: 0,
		closed: 0,
		draft: 0,
		submitted: 0,
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

	// Fetch posts from API
	const fetchPosts = async () => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams({
				search: searchQuery,
				status: statusFilter.join(','),
				type: typeFilter.join(','),
				sortBy: sortBy,
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
			})

			const response = await fetch(`/api/posts/institution?${params}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch posts')
			}

			const result = await response.json()

			if (result.success) {
				setPosts(result.data)
				setStats(result.stats)
				if (result.meta) {
					setPaginationMeta(result.meta)
				}
			} else {
				throw new Error(result.error || 'Failed to fetch posts')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch posts')
		} finally {
			setLoading(false)
		}
	}

	// Fetch posts when filters, search, sort, or page changes
	useEffect(() => {
		fetchPosts()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, searchQuery, typeFilter, statusFilter, sortBy])

	// Load edit data when in edit mode
	useEffect(() => {
		const loadEditData = async () => {
			if (isEditMode && editId && createType) {
				setLoadingEditData(true)
				try {
					let apiUrl = ''
					if (createType === 'Program') {
						apiUrl = `/api/explore/programs/program-detail?id=${editId}`
					} else if (createType === 'Scholarship') {
						apiUrl = `/api/explore/scholarships/scholarship-detail?id=${editId}`
					} else if (createType === 'Research Lab') {
						apiUrl = `/api/explore/research/research-detail?id=${editId}`
					}

					if (apiUrl) {
						const response = await fetch(apiUrl)
						const result = await response.json()
						if (result.success && result.data) {
							setEditData(result.data)
						}
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error('Failed to load edit data:', error)
				} finally {
					setLoadingEditData(false)
				}
			} else {
				setEditData(null)
			}
		}

		loadEditData()
	}, [isEditMode, editId, createType])

	// Sync URL parameters with component state
	useEffect(() => {
		if ((isCreateMode || isEditMode) && createType) {
			setCreateFormType(createType)
			setShowCreateForm(true)
		} else {
			setShowCreateForm(false)
			setCreateFormType(null)
		}
	}, [isCreateMode, isEditMode, createType])

	// Listen for browser back/forward navigation
	useEffect(() => {
		const handlePopState = () => {
			// Force re-evaluation of URL parameters when browser navigation occurs
			const currentAction = searchParams?.get('action')
			const currentType = searchParams?.get('type')

			if (currentAction === 'create' && currentType) {
				setCreateFormType(
					currentType as 'Program' | 'Scholarship' | 'Research Lab'
				)
				setShowCreateForm(true)
			} else {
				setShowCreateForm(false)
				setCreateFormType(null)
			}
		}

		window.addEventListener('popstate', handlePopState)
		return () => window.removeEventListener('popstate', handlePopState)
	}, [searchParams])

	// Note: Filtering, searching, and sorting are now handled server-side
	// The API returns the filtered and paginated results

	// Event handlers
	const handleTypeFilterChange = (filter: string[]) => {
		setTypeFilter(filter)
		setCurrentPage(1) // Reset to page 1 when filter changes
	}

	const handleStatusFilterChange = (filter: string[]) => {
		setStatusFilter(filter)
		setCurrentPage(1) // Reset to page 1 when filter changes
	}

	const handleSearchChange = (query: string) => {
		setSearchQuery(query)
		setCurrentPage(1) // Reset to page 1 when search changes
	}

	const handleSortChange = (sort: string) => {
		setSortBy(sort)
		setCurrentPage(1) // Reset to page 1 when sort changes
	}

	const handleMoreDetail = (post: Post) => {
		// Navigate to the appropriate detail page based on post type
		if (post.type === 'Program') {
			router.push(`/institution/dashboard/programmes/${post.id}`)
		} else if (post.type === 'Scholarship') {
			router.push(`/institution/dashboard/scholarships/${post.id}`)
		} else if (post.type === 'Research Lab') {
			router.push(`/institution/dashboard/reseach-labs/${post.id}`)
		}
	}

	const handleApplicationClick = (post: Post) => {
		// Navigate to applications section with filter for this post
		router.push(`/institution/dashboard/applications?postId=${post.id}`)
	}

	const handleAddNew = (
		postType: 'Program' | 'Scholarship' | 'Research Lab'
	) => {
		// Update URL to show create form using Next.js router
		const url = new URL(window.location.href)
		url.searchParams.set('action', 'create')
		url.searchParams.set('type', postType)

		// Use router.push to update URL without full page reload
		router.push(url.pathname + url.search)

		// Update local state for immediate UI update
		setCreateFormType(postType)
		setShowCreateForm(true)
	}

	const handleBackToList = () => {
		// Remove create/edit parameters from URL using Next.js router
		const url = new URL(window.location.href)
		url.searchParams.delete('action')
		url.searchParams.delete('type')
		url.searchParams.delete('id')
		// Use router.push to update URL without full page reload
		router.push(url.pathname)
		// Update local state
		setShowCreateForm(false)
		setCreateFormType(null)
		setEditData(null)
	}

	const handleCreateSubmit = () => {
		setShowCreateForm(false)
		setCreateFormType(null)
		// Refresh the posts list after successful creation
		fetchPosts()
	}

	// Show loading state when loading edit data
	if (loadingEditData) {
		return (
			<div className="space-y-6">
				<div className="rounded-xl p-6 w-full">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
							<p className="mt-4 text-muted-foreground">Loading data...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Show create/edit form if active (for all types including Program)
	if (showCreateForm && createFormType) {
		if (createFormType === 'Program') {
			return (
				<CreateProgramPage
					onBack={handleBackToList}
					onSubmit={handleCreateSubmit}
					initialData={isEditMode ? editData : undefined}
					editId={isEditMode ? editId : undefined}
				/>
			)
		}
		if (createFormType === 'Scholarship') {
			return (
				<CreateScholarshipPage
					onBack={handleBackToList}
					onSubmit={handleCreateSubmit}
					initialData={isEditMode ? editData : undefined}
					editId={isEditMode ? editId : undefined}
				/>
			)
		}
		if (createFormType === 'Research Lab') {
			return (
				<CreateResearchLabPage
					onBack={handleBackToList}
					onSubmit={handleCreateSubmit}
					initialData={isEditMode ? editData : undefined}
					editId={isEditMode ? editId : undefined}
				/>
			)
		}
	}

	return (
		<div className="space-y-6">
			<div className="rounded-xl p-6 w-full">
				{/* Page Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{profile?.institutionName || 'Institution'}&apos;s Posts
				</h1>

				{/* Statistics Cards */}
				<PostsStatisticsCards
					total={stats.total}
					published={stats.published}
					closed={stats.closed}
				/>

				{/* Posts Section */}
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
								onClick={fetchPosts}
								className="text-xs text-red-600 hover:text-red-800 underline"
							>
								Retry
							</button>
						</div>
					)}

					{/* Search and Filter Bar */}
					<PostsSearchAndFilter
						searchQuery={searchQuery}
						onSearchChange={handleSearchChange}
						typeFilter={typeFilter}
						onTypeFilterChange={handleTypeFilterChange}
						statusFilter={statusFilter}
						onStatusFilterChange={handleStatusFilterChange}
						sortBy={sortBy}
						onSortChange={handleSortChange}
						onAddNew={handleAddNew}
						profile={profile}
					/>

					{/* Posts Table */}
					{loading && posts.length === 0 ? (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
								<p className="mt-4 text-muted-foreground">Loading posts...</p>
							</div>
						</div>
					) : (
						<div className={loading ? 'opacity-60 pointer-events-none' : ''}>
							<PostsTable
								posts={posts}
								onMoreDetail={handleMoreDetail}
								onApplicationClick={handleApplicationClick}
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
