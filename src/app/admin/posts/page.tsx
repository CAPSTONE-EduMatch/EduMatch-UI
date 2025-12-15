'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { ViewDetailButton } from '@/components/admin/ViewDetailButton'
import { SearchAndFilter } from '@/components/profile/institution/components/SearchAndFilter'
import { Card, CardContent } from '@/components/ui'
import { useDebouncedValue } from '@/hooks'
import { useAdminPostManagement } from '@/hooks/admin'
import { PostStatus } from '@prisma/client'
import { Check, Copy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Post {
	id: string
	title: string
	status: PostStatus
	postedBy: string
	postedDate: Date
	type: 'Program' | 'Scholarship' | 'Job'
}

const getStatusColor = (status: PostStatus) => {
	switch (status) {
		case 'PUBLISHED':
			return 'bg-[#126E64] text-white'
		case 'CLOSED':
			return 'bg-[#6EB6FF] text-black'
		case 'DELETED':
			return 'bg-[#EF4444] text-white'
		case 'DRAFT':
			return 'bg-[#F0A227] text-white'
		case 'SUBMITTED':
			return 'bg-[#3B82F6] text-white'
		case 'PROGRESSING':
			return 'bg-[#10B981] text-white'
		case 'REJECTED':
			return 'bg-[#EF4444] text-white'
		default:
			return 'bg-gray-200 text-black'
	}
}

const getStatusLabel = (status: PostStatus) => {
	switch (status) {
		case 'PUBLISHED':
			return 'Published'
		case 'CLOSED':
			return 'Closed'
		case 'DELETED':
			return 'Deleted'
		case 'DRAFT':
			return 'Draft'
		case 'SUBMITTED':
			return 'Submitted'
		case 'PROGRESSING':
			return 'Progressing'
		case 'REJECTED':
			return 'Rejected'
		default:
			return status
	}
}

export default function AdminPostsPage() {
	const router = useRouter()
	const {
		posts,
		stats,
		pagination,
		filters,
		isLoading,
		updateFilters,
		changePage,
	} = useAdminPostManagement()

	// Local state for filters (UI-only, not synced with hook)
	const [localStatusFilter, setLocalStatusFilter] = useState<string[]>([])
	const [localTypeFilter, setLocalTypeFilter] = useState<string[]>([])
	const [localSearchQuery, setLocalSearchQuery] = useState<string>('')

	// Debounce search with 500ms delay
	const debouncedSearchQuery = useDebouncedValue(localSearchQuery, 500)

	// Update filters when debounced search or other filters change
	// Unidirectional flow: UI → debounce → updateFilters (no sync back)
	useEffect(() => {
		updateFilters({
			status:
				localStatusFilter.length > 0
					? localStatusFilter.length === 1
						? (localStatusFilter[0] as PostStatus)
						: (localStatusFilter as PostStatus[])
					: 'all',
			type:
				localTypeFilter.length === 0 ||
				(localTypeFilter.length === 1 && localTypeFilter[0] === 'all')
					? 'all'
					: (localTypeFilter as ('Program' | 'Scholarship' | 'Job')[]),
			search: debouncedSearchQuery || undefined,
		})
	}, [debouncedSearchQuery, localStatusFilter, localTypeFilter, updateFilters])

	// Component for ID cell with copy functionality
	const IdCell = ({ id }: { id: string }) => {
		const [copied, setCopied] = useState(false)

		const shortId = id.length > 8 ? `${id.substring(0, 8)}...` : id

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(id)
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			} catch (err) {
				console.error('Failed to copy:', err)
			}
		}

		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-700 font-mono">{shortId}</span>
				<button
					onClick={handleCopy}
					className="p-1 hover:bg-gray-100 rounded transition-colors"
					title="Copy full ID"
				>
					{copied ? (
						<Check className="w-4 h-4 text-green-600" />
					) : (
						<Copy className="w-4 h-4 text-gray-500 hover:text-gray-700" />
					)}
				</button>
			</div>
		)
	}

	// Define table columns
	const columns = [
		{
			header: 'ID',
			accessor: ((post: Post) => <IdCell id={post.id} />) as (
				post: Post
			) => React.ReactNode,
			className: '150px',
		},
		{
			header: 'Title',
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<div className="text-left font-semibold text-base text-black group relative">
					<div className="truncate">{post.title}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-normal max-w-xs pointer-events-none">
						{post.title}
					</div>
				</div>
			)) as (post: Post) => React.ReactNode,
			className: 'minmax(200px, 1.5fr)',
		},
		{
			header: 'Status',
			accessor: ((post: Post) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
						post.status
					)}`}
				>
					{getStatusLabel(post.status)}
				</span>
			)) as (_post: Post) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Posted by',
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center group relative">
					<div className="truncate">{post.postedBy}</div>
					<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap pointer-events-none">
						{post.postedBy}
					</div>
				</div>
			)) as (_post: Post) => React.ReactNode,
			className: 'minmax(130px, 1fr)',
		},
		{
			header: 'Posted date',
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center">
					{new Date(post.postedDate).toLocaleDateString()}
				</div>
			)) as (_post: Post) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Type',
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center">
					{post.type === 'Job' ? 'Research Lab' : post.type}
				</div>
			)) as (_post: Post) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Actions',
			accessor: ((post: Post) => (
				<ViewDetailButton
					onClick={() => router.push(`/admin/posts/${post.id}`)}
					type="page"
				/>
			)) as (post: Post) => React.ReactNode,
			className: '130px',
		},
	]

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header Section */}
			<div className="px-8 pt-[35px] pb-6">
				<h1 className="text-2xl font-bold text-[#126E64]">Post Management</h1>
			</div>

			{/* Statistics Cards */}
			<div className="px-8 mb-8">
				<div className="flex gap-6">
					{/* Total Posts Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#F0A227]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#F0A227]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Total posts</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{stats.total}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Published Posts Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#126E64]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#126E64]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Published posts</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{stats.published}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Closed Posts Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#6EB6FF]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#6EB6FF]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Closed posts</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{stats.closed}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Search and Filters */}
				<SearchAndFilter
					searchQuery={localSearchQuery}
					onSearchChange={setLocalSearchQuery}
					statusFilter={localStatusFilter}
					onStatusFilterChange={setLocalStatusFilter}
					sortBy={
						filters.sortDirection === 'desc'
							? 'newest'
							: filters.sortDirection === 'asc'
								? 'oldest'
								: 'newest'
					}
					onSortChange={(sort: string) => {
						updateFilters({
							sortBy: 'create_at',
							sortDirection: sort === 'newest' ? 'desc' : 'asc',
						})
					}}
					// Custom props for admin posts filtering
					typeFilter={localTypeFilter}
					onTypeFilterChange={(types: string | string[]) => {
						const typeArray = Array.isArray(types) ? types : [types]
						setLocalTypeFilter(typeArray)
					}}
					statusOptions={[
						{ value: 'PUBLISHED', label: 'Published' },
						{ value: 'CLOSED', label: 'Closed' },
						{ value: 'SUBMITTED', label: 'Submitted' },
						{ value: 'PROGRESSING', label: 'Progressing' },
						{ value: 'REJECTED', label: 'Rejected' },
					]}
					searchPlaceholder="Search by title or institution..."
				/>

				{/* Posts Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6 mt-4">
						Posts ({pagination.totalCount} total)
					</h2>

					<AdminTable
						data={posts}
						columns={columns}
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalCount}
						itemsPerPage={pagination.limit}
						onPageChange={changePage}
						emptyMessage={
							isLoading
								? 'Loading posts...'
								: 'No posts found matching your criteria.'
						}
					/>
				</div>
			</div>
		</div>
	)
}
