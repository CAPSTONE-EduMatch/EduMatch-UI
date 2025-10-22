'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
	PostsStatisticsCards,
	PostsSearchAndFilter,
	PostsTable,
	Pagination,
	type Post,
} from './components'
import { CreateProgramPage } from './CreateProgramPage'
import { CreateScholarshipPage } from './CreateScholarshipPage'
import { CreateResearchLabPage } from './CreateResearchLabPage'

interface ProgramsSectionProps {
	profile: any
	onProfileUpdate?: () => Promise<void>
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
	profile,
}) => {
	const [searchQuery, setSearchQuery] = useState('')
	const [typeFilter, setTypeFilter] = useState<string[]>([])
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [createFormType, setCreateFormType] = useState<
		'Program' | 'Scholarship' | 'Research Lab' | null
	>(null)
	const [posts, setPosts] = useState<Post[]>([])
	const [stats, setStats] = useState({
		total: 0,
		published: 0,
		closed: 0,
		draft: 0,
		submitted: 0,
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
			} else {
				throw new Error(result.error || 'Failed to fetch posts')
			}
		} catch (err) {
			console.error('Error fetching posts:', err)
			setError(err instanceof Error ? err.message : 'Failed to fetch posts')
		} finally {
			setLoading(false)
		}
	}

	// Fetch posts only when component mounts
	useEffect(() => {
		fetchPosts()
	}, [])

	// Filter and search posts (client-side for immediate feedback)
	const filteredPosts = useMemo(() => {
		let filtered = posts

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(post) =>
					post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.id.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		// Type filter
		if (typeFilter.length > 0) {
			filtered = filtered.filter((post) => typeFilter.includes(post.type))
		}

		// Status filter
		if (statusFilter.length > 0) {
			filtered = filtered.filter((post) => statusFilter.includes(post.status))
		}

		// Sort posts
		filtered.sort((a, b) => {
			if (sortBy === 'newest') {
				return (
					new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
				)
			} else {
				return (
					new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime()
				)
			}
		})

		return filtered
	}, [posts, searchQuery, typeFilter, statusFilter, sortBy])

	// Pagination
	const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedPosts = filteredPosts.slice(
		startIndex,
		startIndex + itemsPerPage
	)

	// Event handlers
	const handleTypeFilterChange = (filter: string[]) => {
		setTypeFilter(filter)
		setCurrentPage(1)
	}

	const handleStatusFilterChange = (filter: string[]) => {
		setStatusFilter(filter)
		setCurrentPage(1)
	}

	const handleMoreDetail = (post: Post) => {
		// TODO: Implement post detail view
		// eslint-disable-next-line no-console
		console.log('View post details:', post.id)
	}

	const handleAddNew = (
		postType: 'Program' | 'Scholarship' | 'Research Lab'
	) => {
		setCreateFormType(postType)
		setShowCreateForm(true)
	}

	const handleBackToList = () => {
		setShowCreateForm(false)
		setCreateFormType(null)
	}

	const handleCreateSubmit = (data: any) => {
		// eslint-disable-next-line no-console
		console.log('Create post:', createFormType, data)
		setShowCreateForm(false)
		setCreateFormType(null)
		// Refresh the posts list after successful creation
		fetchPosts()
	}

	// Show create form if active
	if (showCreateForm && createFormType) {
		if (createFormType === 'Scholarship') {
			return (
				<CreateScholarshipPage
					onBack={handleBackToList}
					onSubmit={handleCreateSubmit}
				/>
			)
		}
		if (createFormType === 'Research Lab') {
			return (
				<CreateResearchLabPage
					onBack={handleBackToList}
					onSubmit={handleCreateSubmit}
				/>
			)
		}
		return (
			<CreateProgramPage
				onBack={handleBackToList}
				onSubmit={handleCreateSubmit}
			/>
		)
	}

	// Show loading state
	if (loading) {
		return (
			<div className="space-y-6">
				<div className="rounded-xl p-6 w-full py-8">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
							<p className="mt-4 text-muted-foreground">Loading posts...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="space-y-6">
				<div className="rounded-xl p-6 w-full py-8">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="text-red-500 text-6xl mb-4">⚠️</div>
							<h2 className="text-xl font-semibold mb-2">Error</h2>
							<p className="text-muted-foreground mb-4">{error}</p>
							<button
								onClick={fetchPosts}
								className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
							>
								Try Again
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="rounded-xl p-6 w-full py-8">
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
				<div className="border bg-white border-gray-200 rounded-xl p-6">
					{/* Search and Filter Bar */}
					<PostsSearchAndFilter
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						typeFilter={typeFilter}
						onTypeFilterChange={handleTypeFilterChange}
						statusFilter={statusFilter}
						onStatusFilterChange={handleStatusFilterChange}
						sortBy={sortBy}
						onSortChange={setSortBy}
						onAddNew={handleAddNew}
						profile={profile}
					/>

					{/* Posts Table */}
					<PostsTable posts={paginatedPosts} onMoreDetail={handleMoreDetail} />

					{/* Pagination */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						itemsPerPage={itemsPerPage}
						totalItems={filteredPosts.length}
						onPageChange={setCurrentPage}
					/>
				</div>
			</div>
		</div>
	)
}
