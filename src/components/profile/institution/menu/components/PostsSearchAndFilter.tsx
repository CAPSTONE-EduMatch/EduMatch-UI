'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import {
	Search,
	Filter,
	ArrowUpDown,
	Plus,
	Bell,
	ChevronDown,
} from 'lucide-react'

interface PostsSearchAndFilterProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	typeFilter: string
	onTypeFilterChange: (filter: string) => void
	statusFilter: string
	onStatusFilterChange: (filter: string) => void
	sortBy: string
	onSortChange: (sort: string) => void
	onAddNew: (postType: 'Program' | 'Scholarship' | 'Research Lab') => void
	profile: any
}

export const PostsSearchAndFilter: React.FC<PostsSearchAndFilterProps> = ({
	searchQuery,
	onSearchChange,
	typeFilter,
	onTypeFilterChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	onSortChange,
	onAddNew,
	profile,
}) => {
	const [showDropdown, setShowDropdown] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Check if profile is university type
	const isUniversity =
		profile?.institutionType === 'university' || profile?.type === 'university'

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])
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
							onTypeFilterChange(typeFilter === 'all' ? 'Program' : 'all')
						}
						className="flex items-center gap-2"
					>
						<Filter className="w-4 h-4" />
						Type
					</Button>

					<Button
						variant="outline"
						onClick={() =>
							onStatusFilterChange(statusFilter === 'all' ? 'Published' : 'all')
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

					{isUniversity && (
						<div className="relative" ref={dropdownRef}>
							<Button
								onClick={() => setShowDropdown(!showDropdown)}
								className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 relative"
							>
								<Plus className="w-4 h-4" />
								Add new post
								<ChevronDown className="w-4 h-4" />
								<div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
									<Bell className="w-2 h-2 text-white" />
								</div>
							</Button>

							{showDropdown && (
								<div className="absolute right-0 top-full w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
									<div className="py-2">
										<button
											onClick={() => {
												onAddNew('Program')
												setShowDropdown(false)
											}}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
										>
											<Plus className="w-4 h-4" />
											Add Program
										</button>
										<button
											onClick={() => {
												onAddNew('Scholarship')
												setShowDropdown(false)
											}}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
										>
											<Plus className="w-4 h-4" />
											Add Scholarship
										</button>
										<button
											onClick={() => {
												onAddNew('Research Lab')
												setShowDropdown(false)
											}}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
										>
											<Plus className="w-4 h-4" />
											Add Research Lab
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
