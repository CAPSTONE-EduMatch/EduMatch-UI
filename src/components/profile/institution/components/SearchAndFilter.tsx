'use client'

import { CheckboxSelect, CustomSelect } from '@/components/ui'
import { Search } from 'lucide-react'
import React from 'react'

interface SearchAndFilterProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	statusFilter: string[]
	onStatusFilterChange: (filter: string[]) => void
	sortBy: string
	onSortChange: (sort: string) => void
	// Optional props for admin posts page
	typeFilter?: string
	onTypeFilterChange?: (type: string) => void
	// Custom status options for different contexts
	statusOptions?: Array<{ value: string; label: string }>
	// Custom placeholder for search
	searchPlaceholder?: string
	// Custom sort options for different contexts
	sortOptions?: Array<{ value: string; label: string }>
	// Optional sort direction for user management
	sortDirection?: 'asc' | 'desc'
	onSortDirectionChange?: (direction: 'asc' | 'desc') => void
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	onSortChange,
	typeFilter,
	onTypeFilterChange,
	statusOptions,
	searchPlaceholder = 'Enter name, sub-discipline, degree level you want to find....',
	sortOptions,
	sortDirection,
	onSortDirectionChange,
}) => {
	// Default status options for applications
	const defaultStatusOptions = [
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'accepted', label: 'Accepted' },
		{ value: 'rejected', label: 'Rejected' },
		{ value: 'updated', label: 'Updated' },
	]

	// Admin posts status options
	// PostStatus enum: DRAFT, PUBLISHED, CLOSED, SUBMITTED, UPDATED, REJECTED, DELETED
	const adminPostStatusOptions = [
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'PUBLISHED', label: 'Published' },
		{ value: 'CLOSED', label: 'Closed' },
		{ value: 'SUBMITTED', label: 'Submitted' },
		{ value: 'UPDATED', label: 'Updated' },
		{ value: 'REJECTED', label: 'Rejected' },
		{ value: 'DELETED', label: 'Deleted' },
	]

	const currentStatusOptions =
		statusOptions ||
		(typeFilter ? adminPostStatusOptions : defaultStatusOptions)

	// Default sort options for applications/posts
	const defaultSortOptions = [
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	]

	const currentSortOptions = sortOptions || defaultSortOptions

	return (
		<div className="">
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<input
							type="text"
							placeholder={searchPlaceholder}
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
					{/* Type Filter (only for admin posts) */}
					{typeFilter !== undefined && onTypeFilterChange && (
						<div className="w-48">
							<CustomSelect
								value={
									typeFilter === 'all'
										? null
										: {
												value: typeFilter,
												label:
													typeFilter === 'Job' ? 'Research Lab' : typeFilter,
											}
								}
								onChange={(selected) =>
									onTypeFilterChange(selected?.value || 'all')
								}
								placeholder="All Types"
								options={[
									{ value: 'Program', label: 'Program' },
									{ value: 'Scholarship', label: 'Scholarship' },
									{ value: 'Job', label: 'Research Lab' },
								]}
								variant="default"
								isClearable
								className="w-full"
							/>
						</div>
					)}

					{/* Status Filter Checkbox Select */}
					<div className="w-48">
						<CheckboxSelect
							value={statusFilter.map((status) => ({
								value: status,
								label:
									currentStatusOptions.find((opt) => opt.value === status)
										?.label ||
									status.charAt(0).toUpperCase() +
										status.slice(1).toLowerCase().replace('_', ' '),
							}))}
							onChange={(selected) =>
								onStatusFilterChange(selected.map((item: any) => item.value))
							}
							placeholder="All Status"
							options={currentStatusOptions}
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
								label:
									currentSortOptions.find((opt) => opt.value === sortBy)
										?.label || sortBy,
							}}
							onChange={(selected) =>
								onSortChange(selected?.value || currentSortOptions[0].value)
							}
							placeholder="Sort by"
							options={currentSortOptions}
							variant="default"
							isClearable={false}
							className="w-full"
						/>
					</div>

					{/* Sort Direction (only for user management) */}
					{sortDirection !== undefined && onSortDirectionChange && (
						<div className="w-40">
							<CustomSelect
								value={{
									value: sortDirection,
									label: sortDirection === 'desc' ? '↓ Desc' : '↑ Asc',
								}}
								onChange={(selected) =>
									onSortDirectionChange(
										(selected?.value as 'asc' | 'desc') || 'desc'
									)
								}
								placeholder="Order"
								options={[
									{ value: 'desc', label: '↓ Descending' },
									{ value: 'asc', label: '↑ Ascending' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
