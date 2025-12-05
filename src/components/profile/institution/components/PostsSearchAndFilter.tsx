'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button, CustomSelect, CheckboxSelect } from '@/components/ui'
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
	typeFilter: string[]
	onTypeFilterChange: (filter: string[]) => void
	statusFilter: string[]
	onStatusFilterChange: (filter: string[]) => void
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

	// Get institution type
	const institutionType = profile?.institutionType || profile?.type || ''

	// Determine which post types can be created based on institution type
	const canCreateProgram = institutionType === 'university'
	const canCreateScholarship =
		institutionType === 'scholarship-provider' ||
		institutionType === 'university'
	const canCreateResearchLab = institutionType === 'research-lab'

	// Determine if type filter should be shown
	// Only show for universities (they can create both Program and Scholarship)
	// Hide for scholarship-provider and research-lab (they only create one type)
	const showTypeFilter = institutionType === 'university'

	// Check if any post creation is allowed
	const canCreateAnyPost =
		canCreateProgram || canCreateScholarship || canCreateResearchLab

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
							placeholder="Search by title or post ID..."
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
					{/* Type Filter Checkbox Select - Only show for universities */}
					{showTypeFilter && (
						<div className="w-48">
							<CheckboxSelect
								value={typeFilter.map((type) => ({ value: type, label: type }))}
								onChange={(selected) =>
									onTypeFilterChange(selected.map((item: any) => item.value))
								}
								placeholder="All Types"
								options={[
									{ value: 'Program', label: 'Program' },
									{ value: 'Scholarship', label: 'Scholarship' },
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
								label: status.charAt(0).toUpperCase() + status.slice(1),
							}))}
							onChange={(selected) =>
								onStatusFilterChange(selected.map((item: any) => item.value))
							}
							placeholder="All Status"
							options={[
								{ value: 'published', label: 'Published' },
								{ value: 'draft', label: 'Draft' },
								{ value: 'submitted', label: 'Submitted' },
								{ value: 'closed', label: 'Closed' },
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

					{canCreateAnyPost && (
						<div className="relative" ref={dropdownRef}>
							{/* If only one option, show direct button; otherwise show dropdown */}
							{canCreateProgram &&
							!canCreateScholarship &&
							!canCreateResearchLab ? (
								<Button
									onClick={() => onAddNew('Program')}
									className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add Program
								</Button>
							) : canCreateScholarship &&
							  !canCreateProgram &&
							  !canCreateResearchLab ? (
								<Button
									onClick={() => onAddNew('Scholarship')}
									className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add Scholarship
								</Button>
							) : canCreateResearchLab &&
							  !canCreateProgram &&
							  !canCreateScholarship ? (
								<Button
									onClick={() => onAddNew('Research Lab')}
									className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add Research Lab
								</Button>
							) : (
								<>
									<Button
										onClick={() => setShowDropdown(!showDropdown)}
										className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 relative"
									>
										<Plus className="w-4 h-4" />
										Add new post
										<ChevronDown className="w-4 h-4" />
									</Button>

									{showDropdown && (
										<div className="absolute right-0 top-full w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
											<div className="py-2">
												{canCreateProgram && (
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
												)}
												{canCreateScholarship && (
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
												)}
												{canCreateResearchLab && (
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
												)}
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
