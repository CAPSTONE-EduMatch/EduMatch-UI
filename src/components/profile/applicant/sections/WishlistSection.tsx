'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui'
import { SortDropdown } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import {
	BookOpen,
	Clock,
	GraduationCap,
	Users,
	X,
	Globe,
	DollarSign,
	Search,
	Loader2,
	AlertCircle,
} from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'
import { useWishlist } from '@/hooks/useWishlist'
import { WishlistItem, WishlistQueryParams } from '@/types/wishlist-api'
import { ExploreApiService } from '@/lib/explore-api'

interface WishlistSectionProps {
	profile: any
}

export const WishlistSection: React.FC<WishlistSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [searchQuery, setSearchQuery] = useState<string>('')

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: 'Programmes' },
		{ id: 'scholarships', label: 'Scholarships' },
		{ id: 'research', label: 'Research Labs' },
	]

	// Get wishlist IDs only
	const { items: wishlistItems, loading: wishlistLoading } = useWishlist({
		autoFetch: true,
		initialParams: { page: 1, limit: 1000, status: 1 },
	})

	// Explore data state
	const [programs, setPrograms] = useState<Program[]>([])
	const [scholarships, setScholarships] = useState<Scholarship[]>([])
	const [researchLabs, setResearchLabs] = useState<ResearchLab[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch explore data and filter by wishlist
	const fetchWishlistData = useCallback(async () => {
		// Don't fetch if still loading wishlist
		if (wishlistLoading) {
			return
		}

		// If no wishlist items, clear data but don't show loading
		if (wishlistItems.length === 0) {
			setPrograms([])
			setScholarships([])
			setResearchLabs([])
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)

		try {
			// Get wishlist post IDs
			const wishlistPostIds = wishlistItems.map((item) => item.postId)

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

			// Filter by wishlist post IDs
			const filteredPrograms = programsResponse.data.filter((program) =>
				wishlistPostIds.includes(program.id)
			)
			const filteredScholarships = scholarshipsResponse.data.filter(
				(scholarship) => wishlistPostIds.includes(scholarship.id)
			)
			const filteredResearchLabs = researchResponse.data.filter((researchLab) =>
				wishlistPostIds.includes(researchLab.id)
			)

			setPrograms(filteredPrograms)
			setScholarships(filteredScholarships)
			setResearchLabs(filteredResearchLabs)
		} catch (err) {
			console.error('Error fetching wishlist data:', err)
			setError('Failed to load wishlist data')
		} finally {
			setLoading(false)
		}
	}, [wishlistItems, wishlistLoading, sortBy])

	// Fetch data when wishlist or sort changes
	React.useEffect(() => {
		fetchWishlistData()
	}, [fetchWishlistData])

	// Detailed filter options
	const filterOptions = [
		{ id: 'discipline', label: 'Discipline', icon: BookOpen },
		{ id: 'country', label: 'Country', icon: Globe },
		{ id: 'fee', label: 'Fee', icon: DollarSign },
		{ id: 'funding', label: 'Funding', icon: DollarSign },
		{ id: 'duration', label: 'Duration', icon: Clock },
		{ id: 'degree', label: 'Degree level', icon: GraduationCap },
		{ id: 'attendance', label: 'Attendance', icon: Users },
		{ id: 'expired', label: 'Expired', icon: X },
	]

	// Wishlist functionality for cards
	const { isInWishlist, toggleWishlistItem } = useWishlist()

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

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return (
					<ProgramsTab
						programs={programs}
						sortBy={sortBy}
						isInWishlist={isInWishlist}
						onWishlistToggle={toggleWishlistItem}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			case 'scholarships':
				return (
					<ScholarshipsTab
						scholarships={scholarships}
						isInWishlist={isInWishlist}
						onWishlistToggle={toggleWishlistItem}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			case 'research':
				return (
					<ResearchLabsTab
						researchLabs={researchLabs}
						isInWishlist={isInWishlist}
						onWishlistToggle={toggleWishlistItem}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			default:
				return (
					<ProgramsTab
						programs={programs}
						sortBy={sortBy}
						isInWishlist={isInWishlist}
						onWishlistToggle={toggleWishlistItem}
						hasApplied={() => false}
						isApplying={() => false}
						onApply={() => {}}
					/>
				)
		}
	}

	// Show loading state - only show if we're actually loading wishlist or fetching data
	if (wishlistLoading || loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-teal-500" />
					<p className="text-gray-600">Loading your wishlist...</p>
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
					<p className="text-red-600 mb-4">Failed to load wishlist</p>
					<p className="text-gray-600 mb-4">{error}</p>
					<Button onClick={fetchWishlistData} variant="outline">
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
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Wishlist</h2>

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
							return (
								<Button
									key={filter.id}
									variant="outline"
									className="flex items-center gap-2 rounded-full px-4 py-2 text-sm border-gray-200 hover:border-gray-300"
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
							No items in your wishlist
						</h3>
						<p className="text-gray-600 mb-6">
							Start exploring and add programs, scholarships, or research
							opportunities to your wishlist.
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
