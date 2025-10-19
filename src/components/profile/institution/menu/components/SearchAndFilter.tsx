'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { Search, Filter, ArrowUpDown } from 'lucide-react'

interface SearchAndFilterProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	statusFilter: string
	onStatusFilterChange: (filter: string) => void
	sortBy: string
	onSortChange: (sort: string) => void
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	onSortChange,
}) => {
	return (
		<div className="pb-6 mb-6">
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<input
							type="text"
							placeholder="Enter name, sub-discipline, degree level you want to find...."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
						/>
						<button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
							<Search className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() =>
							onStatusFilterChange(statusFilter === 'all' ? 'submitted' : 'all')
						}
						className="flex items-center gap-2"
					>
						<Filter className="w-4 h-4" />
						Status
					</Button>

					<Button
						variant="outline"
						onClick={() =>
							onSortChange(sortBy === 'newest' ? 'oldest' : 'newest')
						}
						className="flex items-center gap-2"
					>
						<ArrowUpDown className="w-4 h-4" />
						Sort
					</Button>
				</div>
			</div>
		</div>
	)
}
