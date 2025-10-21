'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { Plus, Bell } from 'lucide-react'

export interface Post {
	id: string
	title: string
	type: 'Program' | 'Scholarship'
	postedDate: string
	applications: number
	status: 'Published' | 'Draft' | 'Closed' | 'Submitted' | 'New request'
	endDate: string
}

interface PostsTableProps {
	posts: Post[]
	onMoreDetail: (post: Post) => void
}

export const PostsTable: React.FC<PostsTableProps> = ({
	posts,
	onMoreDetail,
}) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Published':
				return 'bg-green-100 text-green-800'
			case 'Draft':
				return 'bg-gray-100 text-gray-800'
			case 'Closed':
				return 'bg-blue-100 text-blue-800'
			case 'Submitted':
				return 'bg-orange-100 text-orange-800'
			case 'New request':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	return (
		<div>
			{/* Table */}
			<div className="overflow-x-auto">
				<div className="w-full min-w-full">
					<div className="bg-[#126E64] text-white grid grid-cols-8 px-8 py-5 text-center font-bold text-base">
						<div className="text-left">ID</div>
						<div className="text-left">Title</div>
						<div>Type</div>
						<div>Posted date</div>
						<div>Applications</div>
						<div>Status</div>
						<div>End date</div>
						<div className="pl-8">More detail</div>
					</div>

					<div className="divide-y divide-gray-100">
						{posts.map((post, index) => {
							const isEven = index % 2 === 0
							const rowBg = isEven ? 'bg-[#EAEDF3]' : 'bg-white'

							return (
								<div
									key={post.id}
									className={`${rowBg} grid grid-cols-8 px-8 py-5 items-center`}
								>
									{/* ID */}
									<div className="font-semibold text-base text-black text-left">
										{post.id}
									</div>

									{/* Title */}
									<div className="text-gray-700 text-sm text-left group relative">
										<div className="truncate">{post.title}</div>
										{post.title.length > 30 && (
											<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
												{post.title}
											</div>
										)}
									</div>

									{/* Type */}
									<div className="text-gray-700 text-sm text-center">
										{post.type}
									</div>

									{/* Posted Date */}
									<div className="text-gray-700 text-sm text-center">
										{post.postedDate}
									</div>

									{/* Applications */}
									<div className="text-gray-700 text-sm text-center">
										{post.applications > 0 ? (
											<button className="text-[#126E64] hover:text-[#126E64] underline">
												{post.applications}
											</button>
										) : (
											post.applications
										)}
									</div>

									{/* Status */}
									<div className="text-center">
										<span
											className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(post.status)}`}
										>
											{post.status}
										</span>
									</div>

									{/* End Date */}
									<div className="text-gray-700 text-sm text-center">
										{post.endDate}
									</div>

									{/* More Detail */}
									<div className="flex justify-center gap-2.5 pl-8">
										<button
											onClick={() => onMoreDetail(post)}
											className="text-[#126E64] hover:text-[#126E64] text-xs underline hover:no-underline transition-all duration-200"
										>
											<span>More detail</span>
										</button>
									</div>
								</div>
							)
						})}
					</div>

					{posts.length === 0 && (
						<div className="text-center py-12 text-gray-500">
							No posts found matching your criteria.
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
