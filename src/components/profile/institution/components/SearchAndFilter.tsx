'use client'

import React from 'react'
import { Button, CheckboxSelect, CustomSelect } from '@/components/ui'
import { Search, Filter, ArrowUpDown } from 'lucide-react'

interface SearchAndFilterProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	statusFilter: string[]
	onStatusFilterChange: (filter: string[]) => void
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
					{/* Status Filter Checkbox Select */}
					<div className="w-48">
						<CheckboxSelect
							value={statusFilter.map((status) => ({
								value: status,
								label: status.charAt(0).toUpperCase() + status.slice(1),
							}))}
							onChange={(selected) =>
								onStatusFilterChange(selected.map((item: any) => item.value))
							}
							placeholder="All Status"
							options={[
								{ value: 'submitted', label: 'Submitted' },
								{ value: 'under_review', label: 'Under Review' },
								{ value: 'accepted', label: 'Accepted' },
								{ value: 'rejected', label: 'Rejected' },
								{ value: 'new_request', label: 'New Request' },
							]}
							variant="default"
							isClearable
							className="w-full"
						/>
					</div>

					{/* Sort Dropdown */}
					<div className="w-48">
						<CustomSelect
							value={{
								value: sortBy,
								label: sortBy === 'newest' ? 'Newest First' : 'Oldest First',
							}}
							onChange={(selected) => onSortChange(selected?.value || 'newest')}
							placeholder="Sort by"
							options={[
								{ value: 'newest', label: 'Newest First' },
								{ value: 'oldest', label: 'Oldest First' },
							]}
							variant="default"
							isClearable={false}
							className="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
