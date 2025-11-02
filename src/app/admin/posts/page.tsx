'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { Card, CardContent } from '@/components/ui'
import { ChevronRight, Search, Users } from 'lucide-react'
import { useState } from 'react'

interface Post {
	id: string
	title: string
	status: 'Published' | 'Closed' | 'Rejected' | 'Approved'
	postedBy: string
	postedDate: string
	type: 'Program' | 'Scholarship'
}

const mockPosts: Post[] = [
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Approved',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Program',
	},
	{
		id: 'PR001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Rejected',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Scholarship',
	},
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Closed',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Program',
	},
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Published',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Scholarship',
	},
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Published',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Program',
	},
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Published',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Scholarship',
	},
	{
		id: 'SC001',
		title: "Lorem Ipsum is simply dummy text of the industry's....",
		status: 'Published',
		postedBy: 'Bach Khoa Univer...',
		postedDate: '01/01/2022',
		type: 'Scholarship',
	},
]

const getStatusColor = (status: Post['status']) => {
	switch (status) {
		case 'Published':
			return 'bg-[#126E64] text-white'
		case 'Closed':
			return 'bg-[#6EB6FF] text-black'
		case 'Rejected':
			return 'bg-[#D5D5D5] text-black'
		case 'Approved':
			return 'bg-[#126E64] text-white'
		default:
			return 'bg-gray-200 text-black'
	}
}

export default function AdminPostsPage() {
	const [searchQuery, setSearchQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [typeFilter, setTypeFilter] = useState<
		'all' | 'Program' | 'Scholarship'
	>('all')
	const [statusFilter, setStatusFilter] = useState<
		'all' | 'Published' | 'Closed' | 'Rejected' | 'Approved'
	>('all')

	// Filter posts based on search and filters
	const filteredPosts = mockPosts.filter((post) => {
		const matchesSearch =
			searchQuery === '' ||
			post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.postedBy.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesType = typeFilter === 'all' || post.type === typeFilter
		const matchesStatus = statusFilter === 'all' || post.status === statusFilter
		return matchesSearch && matchesType && matchesStatus
	})

	const totalPages = Math.ceil(filteredPosts.length / 10)
	const paginatedPosts = filteredPosts.slice(
		(currentPage - 1) * 10,
		currentPage * 10
	)

	// Define table columns
	const columns = [
		{
			header: 'ID',
			accessor: 'id' as keyof Post,
			className: '70px',
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
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
						post.status
					)}`}
				>
					{post.status}
				</span>
			)) as (post: Post) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Posted by',
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center group relative">
					<div className="truncate">{post.postedBy}</div>
					<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap pointer-events-none">
						{post.postedBy}
					</div>
				</div>
			)) as (post: Post) => React.ReactNode,
			className: 'minmax(130px, 1fr)',
		},
		{
			header: 'Posted date',
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center">
					{post.postedDate}
				</div>
			)) as (post: Post) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Type',
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<div className="text-gray-700 text-sm text-center">{post.type}</div>
			)) as (post: Post) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Actions',
			// eslint-disable-next-line no-unused-vars
			accessor: ((post: Post) => (
				<button className="flex items-center justify-center gap-1 text-[#126E64] hover:underline text-sm mx-auto">
					<span>View Details</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			)) as (post: Post) => React.ReactNode,
			className: '130px',
		},
	]

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header Section */}
			<div className="px-8 pt-[135px] pb-6">
				<h1 className="text-2xl font-bold text-[#126E64]">Administrator</h1>
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
								<p className="text-2xl font-semibold text-[#989898]">100</p>
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
								<p className="text-2xl font-semibold text-[#989898]">100</p>
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
								<p className="text-2xl font-semibold text-[#989898]">100</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Search and Filters */}
				<div className="mb-6 flex items-center gap-4">
					<div className="flex-1 relative">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by title or institution..."
							className="w-full px-6 py-3 pr-16 rounded-full border-2 border-[#126E64] text-base outline-none focus:ring-2 focus:ring-[#126E64]/30"
						/>
						<div className="absolute right-0 top-0 bottom-0 bg-[#126E64] rounded-r-full px-5 flex items-center">
							<Search className="w-5 h-5 text-white" />
						</div>
					</div>
					<div className="bg-white border-2 border-gray-300 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
						<select
							value={typeFilter}
							onChange={(e) =>
								setTypeFilter(
									e.target.value as 'all' | 'Program' | 'Scholarship'
								)
							}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm min-w-[90px]"
						>
							<option value="all">All Types</option>
							<option value="Program">Program</option>
							<option value="Scholarship">Scholarship</option>
						</select>
					</div>
					<div className="bg-white border-2 border-gray-300 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
						<select
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(
									e.target.value as
										| 'all'
										| 'Published'
										| 'Closed'
										| 'Rejected'
										| 'Approved'
								)
							}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm min-w-[90px]"
						>
							<option value="all">All Status</option>
							<option value="Published">Published</option>
							<option value="Closed">Closed</option>
							<option value="Rejected">Rejected</option>
							<option value="Approved">Approved</option>
						</select>
					</div>
				</div>

				{/* Posts Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6">
						Posts ({filteredPosts.length} total)
					</h2>

					<AdminTable
						data={paginatedPosts}
						columns={columns}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredPosts.length}
						itemsPerPage={10}
						onPageChange={setCurrentPage}
						emptyMessage="No posts found matching your criteria."
					/>
				</div>
			</div>
		</div>
	)
}
