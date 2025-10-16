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

	// Initialize wishlist hook with parameters
	const wishlistParams: WishlistQueryParams = useMemo(
		() => ({
			page: 1,
			limit: 50,
			status: 1, // Only active items
			search: searchQuery || undefined,
			sortBy:
				sortBy === 'newest'
					? 'newest'
					: sortBy === 'oldest'
						? 'oldest'
						: 'newest',
			postType:
				activeTab === 'programmes'
					? 'program'
					: activeTab === 'scholarships'
						? 'scholarship'
						: activeTab === 'research'
							? 'job'
							: undefined,
		}),
		[activeTab, sortBy, searchQuery]
	)

	const {
		items: wishlistItems,
		loading,
		error,
		meta,
		refresh,
	} = useWishlist({
		autoFetch: true,
		initialParams: wishlistParams,
	})

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

	// Transform wishlist items to the expected format for each tab
	const transformToPrograms = useCallback(
		(items: WishlistItem[]): Program[] => {
			return items
				.filter((item) => item.post.program)
				.map((item) => ({
					id: parseInt(item.id),
					postId: item.postId,
					title: item.post.title,
					description: item.post.content || '',
					university: item.post.institution?.name || 'Unknown University',
					logo: item.post.institution?.logo || '',
					field: item.post.program?.degreeLevel || 'Unknown Field',
					country: item.post.institution?.country || 'Unknown Country',
					date: item.post.createdAt,
					daysLeft: Math.max(
						0,
						Math.ceil(
							(new Date(item.post.createdAt).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					),
					price: item.post.program?.tuition_fee || 'Contact for details',
					match: '95%', // This would need to be calculated based on user profile
					funding: item.post.program?.scholarship_info
						? 'Available'
						: 'Not specified',
					attendance: 'Contact for details',
				}))
		},
		[]
	)

	const transformToScholarships = useCallback(
		(items: WishlistItem[]): Scholarship[] => {
			return items
				.filter((item) => item.post.scholarship)
				.map((item) => ({
					id: parseInt(item.id),
					postId: item.postId,
					title: item.post.title,
					description: item.post.content || '',
					provider: item.post.institution?.name || 'Unknown Provider',
					university: item.post.institution?.name || 'Various Universities',
					essayRequired: item.post.scholarship?.essay_required ? 'Yes' : 'No',
					country: item.post.institution?.country || 'Unknown Country',
					date: item.post.createdAt,
					daysLeft: Math.max(
						0,
						Math.ceil(
							(new Date(item.post.createdAt).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					),
					amount: item.post.scholarship?.grant || 'Contact for details',
					match: '90%', // This would need to be calculated based on user profile
				}))
		},
		[]
	)

	const transformToResearchLabs = useCallback(
		(items: WishlistItem[]): ResearchLab[] => {
			return items
				.filter((item) => item.post.job)
				.map((item) => ({
					id: parseInt(item.id),
					postId: item.postId,
					title: item.post.title,
					description: item.post.content || '',
					professor: item.post.program?.professor_name || 'Contact for details',
					field: item.post.job?.job_type || 'Research',
					country: item.post.institution?.country || 'Unknown Country',
					position: item.post.job?.job_type || 'Research Position',
					date: item.post.createdAt,
					daysLeft: Math.max(
						0,
						Math.ceil(
							(new Date(item.post.createdAt).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					),
					match: '88%', // This would need to be calculated based on user profile
				}))
		},
		[]
	)

	// Get transformed data for current tab
	const wishlistPrograms = useMemo(
		() => transformToPrograms(wishlistItems),
		[wishlistItems, transformToPrograms]
	)
	const wishlistScholarships = useMemo(
		() => transformToScholarships(wishlistItems),
		[wishlistItems, transformToScholarships]
	)
	const wishlistResearchLabs = useMemo(
		() => transformToResearchLabs(wishlistItems),
		[wishlistItems, transformToResearchLabs]
	)

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
					data: wishlistPrograms,
					totalItems: meta?.total || wishlistPrograms.length,
				}
			case 'scholarships':
				return {
					data: wishlistScholarships,
					totalItems: meta?.total || wishlistScholarships.length,
				}
			case 'research':
				return {
					data: wishlistResearchLabs,
					totalItems: meta?.total || wishlistResearchLabs.length,
				}
			default:
				return {
					data: wishlistPrograms,
					totalItems: meta?.total || wishlistPrograms.length,
				}
		}
	}

	const currentTabData = getCurrentTabData()

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return <ProgramsTab programs={wishlistPrograms} sortBy={sortBy} />
			case 'scholarships':
				return <ScholarshipsTab scholarships={wishlistScholarships} />
			case 'research':
				return <ResearchLabsTab researchLabs={wishlistResearchLabs} />
			default:
				return <ProgramsTab programs={wishlistPrograms} sortBy={sortBy} />
		}
	}

	// Show loading state
	if (loading) {
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
					<Button onClick={refresh} variant="outline">
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
