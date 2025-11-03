'use client'

import React from 'react'
import { Users, UserCheck, UserX } from 'lucide-react'

interface PostsStatisticsCardsProps {
	total: number
	published: number
	closed: number
}

export const PostsStatisticsCards: React.FC<PostsStatisticsCardsProps> = ({
	total,
	published,
	closed,
}) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="flex items-center">
					<div className="p-3 rounded-full bg-orange-100">
						<Users className="w-6 h-6 text-orange-600" />
					</div>
					<div className="ml-4">
						<p className="text-sm font-medium text-gray-600">Total posts</p>
						<p className="text-2xl font-bold text-gray-900">{total}</p>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="flex items-center">
					<div className="p-3 rounded-full bg-teal-100">
						<UserCheck className="w-6 h-6 text-teal-600" />
					</div>
					<div className="ml-4">
						<p className="text-sm font-medium text-gray-600">Published posts</p>
						<p className="text-2xl font-bold text-gray-900">{published}</p>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="flex items-center">
					<div className="p-3 rounded-full bg-blue-100">
						<UserX className="w-6 h-6 text-blue-600" />
					</div>
					<div className="ml-4">
						<p className="text-sm font-medium text-gray-600">Closed posts</p>
						<p className="text-2xl font-bold text-gray-900">{closed}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
