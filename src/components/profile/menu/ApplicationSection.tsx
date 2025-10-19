'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui'
import { SortDropdown } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import {
	BookOpen,
	Clock,
	Users,
	X,
	Search,
	Loader2,
	AlertCircle,
} from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'
import { useApplications } from '@/hooks/useApplications'
import { useWishlist } from '@/hooks/useWishlist'
import { Application, ApplicationStatus } from '@/types/application-api'
import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import { ExploreApiService } from '@/lib/explore-api'

interface ApplicationSectionProps {
	profile: any
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState<string>('')

	// Get application IDs only
	const { applications, loading: applicationsLoading } = useApplications({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 1000,
			status:
				selectedFilters.size > 0
					? (Array.from(selectedFilters)[0] as ApplicationStatus)
					: undefined,
		},
	})

	// Explore data state with application status
	const [programs, setPrograms] = useState<
		(Program & { applicationStatus?: ApplicationStatus })[]
	>([])
	const [scholarships, setScholarships] = useState<
		(Scholarship & { applicationStatus?: ApplicationStatus })[]
	>([])
	const [researchLabs, setResearchLabs] = useState<
		(ResearchLab & { applicationStatus?: ApplicationStatus })[]
	>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch explore data and filter by applications
	const fetchApplicationData = useCallback(async () => {
		// Don't fetch if still loading applications
		if (applicationsLoading) {
			return
		}

		// If no applications, clear data but don't show loading
		if (applications.length === 0) {
			setPrograms([])
			setScholarships([])
			setResearchLabs([])
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)

		try {
			// Get application post IDs
			const applicationPostIds = applications.map((app) => app.postId)

			// Fetch all explore data
			const [programsResponse, scholarshipsResponse, researchResponse] =
				await Promise.all([
					ExploreApiService.getPrograms({
						page: 1,
						limit: 1000, // Fetch large number to get all data
						sortBy: sortBy === 'newest' ? 'newest' : 'most-popular',
					}),
					ExploreApiService.getScholarships({
						page: 1,
						limit: 1000,
						sortBy: sortBy === 'newest' ? 'newest' : 'most-popular',
					}),
					ExploreApiService.getResearchLabs({
						page: 1,
						limit: 1000,
						sortBy: sortBy === 'newest' ? 'newest' : 'most-popular',
					}),
				])

			// Create a map of postId to application status
			const applicationStatusMap = new Map<string, ApplicationStatus>()
			applications.forEach((app) => {
				applicationStatusMap.set(app.postId, app.status)
			})

			// Filter by application post IDs and add application status
			const filteredPrograms = programsResponse.data
				.filter((program) => applicationPostIds.includes(program.id))
				.map((program) => ({
					...program,
					applicationStatus: applicationStatusMap.get(program.id),
				}))

			const filteredScholarships = scholarshipsResponse.data
				.filter((scholarship) => applicationPostIds.includes(scholarship.id))
				.map((scholarship) => ({
					...scholarship,
					applicationStatus: applicationStatusMap.get(scholarship.id),
				}))

			const filteredResearchLabs = researchResponse.data
				.filter((researchLab) => applicationPostIds.includes(researchLab.id))
				.map((researchLab) => ({
					...researchLab,
					applicationStatus: applicationStatusMap.get(researchLab.id),
				}))

			setPrograms(filteredPrograms)
			setScholarships(filteredScholarships)
			setResearchLabs(filteredResearchLabs)
		} catch (err) {
			console.error('Error fetching application data:', err)
			setError('Failed to load application data')
		} finally {
			setLoading(false)
		}
	}, [applications, applicationsLoading, sortBy])

	// Fetch data when applications or sort changes
	React.useEffect(() => {
		fetchApplicationData()
	}, [fetchApplicationData])

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: 'Programmes' },
		{ id: 'scholarships', label: 'Scholarships' },
		{ id: 'research', label: 'Research Labs' },
	]

	// Application status filter options
	const filterOptions = [
		{ id: 'PENDING', label: 'Pending', icon: BookOpen },
		{ id: 'REVIEWED', label: 'Under Review', icon: Clock },
		{ id: 'ACCEPTED', label: 'Accepted', icon: Users },
		{ id: 'REJECTED', label: 'Rejected', icon: X },
	]

	// Application functionality for cards
	const { cancelApplication } = useApplications()

	// Wishlist functionality for cards
	const { isInWishlist, toggleWishlistItem } = useWishlist()

	// Get current tab data
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				return {
					data: programs,
					totalItems: programs.length,
				}
			case 'scholarships':
				return {
					data: scholarships,
					totalItems: scholarships.length,
				}
			case 'research':
				return {
					data: researchLabs,
					totalItems: researchLabs.length,
				}
			default:
				return {
					data: programs,
					totalItems: programs.length,
				}
		}
	}

	const currentTabData = getCurrentTabData()

	// Handle filter toggle
	const toggleFilter = (filterId: string) => {
		setSelectedFilters((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(filterId)) {
				newSet.delete(filterId)
			} else {
				newSet.add(filterId)
			}
			return newSet
		})
	}

	// Handle search input
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
		},
		[]
	)

	// Handle tab change
	const handleTabChange = useCallback((tabId: string) => {
		setActiveTab(tabId)
	}, [])

	// Handle sort change
	const handleSortChange = useCallback((sort: SortOption) => {
		setSortBy(sort)
	}, [])

	// Handle cancel application
	const handleCancelApplication = useCallback(
		async (applicationId: string) => {
			try {
				await cancelApplication(applicationId)
			} catch (error) {
				console.error('Failed to cancel application:', error)
			}
		},
		[cancelApplication]
	)

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return (
					<ProgramsTab
						programs={programs}
						sortBy={sortBy}
						isInWishlist={isInWishlist} // Check if each program is wishlisted
						onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
						hasApplied={() => true} // All items in applications are applied
						isApplying={() => false}
						onApply={() => {}} // No-op for applications
					/>
				)
			case 'scholarships':
				return (
					<ScholarshipsTab
						scholarships={scholarships}
						isInWishlist={isInWishlist} // Check if each scholarship is wishlisted
						onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
						hasApplied={() => true} // All items in applications are applied
						isApplying={() => false}
						onApply={() => {}} // No-op for applications
					/>
				)
			case 'research':
				return (
					<ResearchLabsTab
						researchLabs={researchLabs}
						isInWishlist={isInWishlist} // Check if each research lab is wishlisted
						onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
						hasApplied={() => true} // All items in applications are applied
						isApplying={() => false}
						onApply={() => {}} // No-op for applications
					/>
				)
			default:
				return (
					<ProgramsTab
						programs={programs}
						sortBy={sortBy}
						isInWishlist={isInWishlist}
						onWishlistToggle={toggleWishlistItem}
						hasApplied={() => true}
						isApplying={() => false}
						onApply={() => {}}
					/>
				)
		}
	}

	// Show loading state - only show if we're actually loading applications or fetching data
	if (applicationsLoading || loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-teal-500" />
					<p className="text-gray-600">Loading your applications...</p>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
					<p className="text-red-600 mb-4">Failed to load applications</p>
					<p className="text-gray-600 mb-4">{error}</p>
					<Button onClick={fetchApplicationData} variant="outline">
						Try Again
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header Section */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Application</h2>

					{/* Main Category Tabs */}
					<div className="flex justify-between items-center mb-4">
						<TabSelector
							tabs={categories}
							activeTab={activeTab}
							onTabChange={handleTabChange}
						/>

						{/* Search and Sort Controls */}
						<div className="flex gap-4 items-center">
							<div className="flex items-center w-80">
								<div className="relative flex-1">
									<input
										type="text"
										placeholder="Search..."
										value={searchQuery}
										onChange={handleSearchChange}
										className="w-full py-2 pl-4 pr-10 text-sm border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
									/>
									<button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-teal-500">
										<Search className="w-4 h-4" />
									</button>
								</div>
							</div>
							<SortDropdown value={sortBy} onChange={handleSortChange} />
						</div>
					</div>

					{/* Separator Line */}
					<div className="border-b border-gray-200 mb-4"></div>

					{/* Detailed Filter Buttons */}
					<div className="flex flex-wrap gap-2">
						{filterOptions.map((filter) => {
							const IconComponent = filter.icon
							const isActive = selectedFilters.has(filter.id)
							return (
								<Button
									key={filter.id}
									variant={isActive ? 'primary' : 'outline'}
									onClick={() => toggleFilter(filter.id)}
									className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200 ${
										isActive
											? 'bg-orange-400 hover:bg-orange-500 text-white shadow-md'
											: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
									}`}
								>
									<IconComponent className="w-4 h-4" />
									<span>{filter.label}</span>
								</Button>
							)
						})}
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-600 mb-4">
					{currentTabData.totalItems} results
				</div>

				{/* Tab Content */}
				{currentTabData.totalItems === 0 ? (
					<div className="text-center py-12">
						<div className="text-6xl mb-4">📝</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">
							No applications found
						</h3>
						<p className="text-gray-600 mb-6">
							You haven&apos;t applied to any programs, scholarships, or
							research labs yet.
						</p>
						<Button
							onClick={() => (window.location.href = '/explore')}
							className="bg-teal-600 hover:bg-teal-700 text-white"
						>
							Explore Opportunities
						</Button>
					</div>
				) : (
					renderTabContent()
				)}
			</div>
		</div>
	)
}
