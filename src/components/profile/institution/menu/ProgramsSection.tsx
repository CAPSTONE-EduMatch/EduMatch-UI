'use client'

import React, { useState, useMemo } from 'react'
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
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [createFormType, setCreateFormType] = useState<
		'Program' | 'Scholarship' | 'Research Lab' | null
	>(null)
	const itemsPerPage = 10

	// Mock data - replace with actual API calls
	const posts: Post[] = useMemo(
		() => [
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Program',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'Published',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Scholarship',
				postedDate: '01/01/2022',
				applications: 0,
				status: 'Draft',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Program',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'Closed',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Scholarship',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'Submitted',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Program',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'New request',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Program',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'Published',
				endDate: '01/01/2025',
			},
			{
				id: 'SC001',
				title: "Lorem Ipsum is simply dummy text of the industry's....",
				type: 'Program',
				postedDate: '01/01/2022',
				applications: 120,
				status: 'Published',
				endDate: '01/01/2025',
			},
		],
		[]
	)

	// Calculate statistics
	const stats = useMemo(() => {
		const total = posts.length
		const published = posts.filter((post) => post.status === 'Published').length
		const closed = posts.filter((post) => post.status === 'Closed').length
		return { total, published, closed }
	}, [posts])

	// Filter and search posts
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
		if (typeFilter !== 'all') {
			filtered = filtered.filter((post) => post.type === typeFilter)
		}

		// Status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter((post) => post.status === statusFilter)
		}

		return filtered
	}, [posts, searchQuery, typeFilter, statusFilter])

	// Pagination
	const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedPosts = filteredPosts.slice(
		startIndex,
		startIndex + itemsPerPage
	)

	// Event handlers
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
		// TODO: Implement create post functionality
		// eslint-disable-next-line no-console
		console.log('Create post:', createFormType, data)
		setShowCreateForm(false)
		setCreateFormType(null)
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

	return (
		<div className="space-y-6">
			<div className="rounded-xl p-6 w-full py-8">
				{/* Page Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{profile?.institutionName || 'Institution'}&apos;s name
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
						onTypeFilterChange={setTypeFilter}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
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
