'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { Plus, Bell } from 'lucide-react'
import { ShortIdWithCopy } from '@/components/ui/ShortIdWithCopy'

export interface Post {
	id: string
	title: string
	type: 'Program' | 'Scholarship' | 'Research Lab'
	postedDate: string
	applications: number
	applicationCount?: number
	status: 'Published' | 'Draft' | 'Closed' | 'Submitted' | 'New request'
	endDate: string
}

interface PostsTableProps {
	posts: Post[]
	onMoreDetail: (post: Post) => void
	onApplicationClick?: (post: Post) => void
}

export const PostsTable: React.FC<PostsTableProps> = ({
	posts,
	onMoreDetail,
	onApplicationClick,
}) => {
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'published':
				return 'bg-green-100 text-green-800'
			case 'draft':
				return 'bg-gray-100 text-gray-800'
			case 'closed':
				return 'bg-blue-100 text-blue-800'
			case 'submitted':
				return 'bg-orange-100 text-orange-800'
			case 'new request':
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
									<div className="text-left">
										<ShortIdWithCopy id={post.id} />
									</div>

									{/* Title */}
									<div className="text-gray-700 text-sm text-left">
										<div className="line-clamp-2 leading-tight">
											{post.title}
										</div>
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
										{(post.applicationCount || post.applications) > 0 ? (
											<button
												className="text-[#126E64] hover:text-[#126E64] underline"
												onClick={() => onApplicationClick?.(post)}
											>
												{post.applicationCount || post.applications}
											</button>
										) : (
											post.applicationCount || post.applications
										)}
									</div>

									{/* Status */}
									<div className="text-center">
										<span
											className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(post.status)}`}
										>
											{post.status.charAt(0).toUpperCase() +
												post.status.slice(1).toLowerCase()}
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
