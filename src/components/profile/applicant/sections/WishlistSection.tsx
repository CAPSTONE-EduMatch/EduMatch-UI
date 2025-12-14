'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Button } from '@/components/ui'
import { SortDropdown } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import { CheckboxSelect } from '@/components/ui'
import { SuccessModal } from '@/components/ui'
import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import { X, Search } from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/api/explore-api'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { ExploreApiService } from '@/services/explore/explore-api'
import { useTranslations } from 'next-intl'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'

interface WishlistSectionProps {
	profile: any
}

export const WishlistSection: React.FC<WishlistSectionProps> = () => {
	const t = useTranslations('wishlist_section')
	const { isAuthenticated } = useAuthCheck()
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [searchQuery, setSearchQuery] = useState<string>('')

	// Filter states
	const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
	const [selectedCountries, setSelectedCountries] = useState<string[]>([])
	const [selectedFeeRange, setSelectedFeeRange] = useState<string | null>(null)
	const [selectedFunding, setSelectedFunding] = useState<string[]>([])
	const [selectedDuration, setSelectedDuration] = useState<string[]>([])
	const [selectedDegreeLevel, setSelectedDegreeLevel] = useState<string[]>([])
	const [selectedAttendance, setSelectedAttendance] = useState<string[]>([])
	const [showExpired, setShowExpired] = useState<boolean>(false)

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: t('tabs.programmes') },
		{ id: 'scholarships', label: t('tabs.scholarships') },
		{ id: 'research', label: t('tabs.research_labs') },
	]

	// Get wishlist IDs only
	const {
		items: wishlistItems,
		loading: wishlistLoading,
		refresh: refreshWishlist,
		refreshStats,
	} = useWishlist({
		autoFetch: true,
		isAuthenticated: isAuthenticated,
		initialParams: { page: 1, limit: 1000, status: 1 },
	})

	// Explore data state
	const [programs, setPrograms] = useState<Program[]>([])
	const [scholarships, setScholarships] = useState<Scholarship[]>([])
	const [researchLabs, setResearchLabs] = useState<ResearchLab[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Available filter options from API
	const [availableFilters, setAvailableFilters] = useState<{
		disciplines?: string[]
		countries?: string[]
		degreeLevels?: string[]
		attendanceTypes?: string[]
	}>({})

	// Fetch explore data and filter by wishlist
	const fetchWishlistData = useCallback(async () => {
		// Don't fetch if we're in the middle of a removal operation
		if (isRemovingRef.current) {
			return
		}

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

			// Extract available filters from API responses
			// Use the first response that has availableFilters, or combine them
			const filters = programsResponse.availableFilters || {}
			setAvailableFilters({
				disciplines: filters.disciplines || [],
				countries: filters.countries || [],
				degreeLevels: filters.degreeLevels || [],
				attendanceTypes: filters.attendanceTypes || [],
			})

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
			// eslint-disable-next-line no-console
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

	// Wishlist functionality for cards
	const { isInWishlist, toggleWishlistItem } = useWishlist({
		autoFetch: true,
		isAuthenticated: isAuthenticated,
	})

	// Success modal state
	const [showWishlistSuccessModal, setShowWishlistSuccessModal] =
		useState(false)
	const [wishlistSuccessMessage, setWishlistSuccessMessage] = useState('')
	const [wishlistSuccessTitle, setWishlistSuccessTitle] = useState('')
	const [isWishlistProcessing, setIsWishlistProcessing] = useState(false)

	// Ref to track if we're in a removal operation to prevent useEffect from refetching
	const isRemovingRef = useRef(false)

	// Custom wishlist toggle handler with success modal and optimistic updates
	const handleWishlistToggle = useCallback(
		async (postId: string) => {
			// Prevent multiple simultaneous API calls
			if (isWishlistProcessing) {
				return
			}

			const wasInWishlist = isInWishlist(postId)
			setIsWishlistProcessing(true)

			try {
				// If removing, optimistically remove from UI immediately
				if (wasInWishlist) {
					// Set flag to prevent useEffect from refetching during removal
					isRemovingRef.current = true
					// Remove from local state immediately for instant feedback
					setPrograms((prev) => prev.filter((p) => p.id !== postId))
					setScholarships((prev) => prev.filter((s) => s.id !== postId))
					setResearchLabs((prev) => prev.filter((r) => r.id !== postId))
				}

				// Toggle wishlist item
				await toggleWishlistItem(postId)

				// Determine the item type based on active tab
				let itemType = 'item'
				if (activeTab === 'programmes') {
					itemType = t('tabs.programmes').toLowerCase()
				} else if (activeTab === 'scholarships') {
					itemType = t('tabs.scholarships').toLowerCase()
				} else if (activeTab === 'research') {
					itemType = t('tabs.research_labs').toLowerCase()
				}

				// Show success modal for both adding and removing
				if (!wasInWishlist) {
					// Item was added
					setWishlistSuccessTitle(t('success.added_title'))
					setWishlistSuccessMessage(
						t('success.added_message', { type: itemType })
					)
				} else {
					// Item was removed
					setWishlistSuccessTitle(t('success.removed_title'))
					setWishlistSuccessMessage(
						t('success.removed_message', { type: itemType })
					)
				}
				setShowWishlistSuccessModal(true)

				// Refresh wishlist and stats
				await refreshWishlist()
				await refreshStats()

				// Only refetch explore data if item was added (to show the new item)
				// For removal, we've already optimistically removed it from UI, so no need to refetch
				// This prevents the flash where the item briefly reappears
				if (!wasInWishlist) {
					// Item was added - need to fetch to show it in the list
					// Wait a bit for wishlist state to update, then fetch
					await new Promise((resolve) => setTimeout(resolve, 100))
					await fetchWishlistData()
				} else {
					// For removal: clear the flag after a short delay to allow state to settle
					setTimeout(() => {
						isRemovingRef.current = false
					}, 500)
				}
			} catch (error) {
				// If error occurred, revert optimistic update
				if (wasInWishlist) {
					// Clear the removal flag to allow refetch
					isRemovingRef.current = false
					// Re-fetch data to restore the item
					await fetchWishlistData()
				}
				// eslint-disable-next-line no-console
				console.error('Failed to toggle wishlist item:', error)
			} finally {
				setIsWishlistProcessing(false)
			}
		},
		[
			isInWishlist,
			toggleWishlistItem,
			activeTab,
			t,
			isWishlistProcessing,
			refreshWishlist,
			refreshStats,
			fetchWishlistData,
		]
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

	// Available filter options - use from API or fallback to static
	const availableOptions = useMemo(() => {
		const durations = [
			'Less than 1 year',
			'1 year',
			'1.5 years',
			'2 years',
			'More than 2 years',
		]

		const feeRanges = [
			{ value: '0-10000', label: '$0 - $10,000' },
			{ value: '10000-25000', label: '$10,000 - $25,000' },
			{ value: '25000-50000', label: '$25,000 - $50,000' },
			{ value: '50000-100000', label: '$50,000 - $100,000' },
			{ value: '100000-999999', label: '$100,000+' },
		]

		return {
			disciplines: availableFilters.disciplines || [],
			countries: availableFilters.countries || [],
			attendanceTypes: availableFilters.attendanceTypes || [],
			degreeLevels: availableFilters.degreeLevels || [],
			durations,
			feeRanges,
		}
	}, [availableFilters])

	// Apply filters to data
	const filteredData = useMemo(() => {
		let data: (Program | Scholarship | ResearchLab)[] =
			activeTab === 'programmes'
				? programs
				: activeTab === 'scholarships'
					? scholarships
					: researchLabs

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			data = data.filter((item) => {
				// Search in title and description
				const matchesTitle = item.title.toLowerCase().includes(query)
				const matchesDescription = item.description
					.toLowerCase()
					.includes(query)

				// Search in institution/university/provider names
				const matchesInstitution =
					('university' in item &&
						(item as Program).university.toLowerCase().includes(query)) ||
					('provider' in item &&
						(item as Scholarship).provider.toLowerCase().includes(query)) ||
					('institution' in item &&
						(item as ResearchLab).institution.toLowerCase().includes(query))

				// Search in field/discipline/position
				const matchesField =
					('field' in item &&
						(item as Program).field.toLowerCase().includes(query)) ||
					('position' in item &&
						(item as ResearchLab).position.toLowerCase().includes(query))

				// Search in country
				const matchesCountry = item.country.toLowerCase().includes(query)

				return (
					matchesTitle ||
					matchesDescription ||
					matchesInstitution ||
					matchesField ||
					matchesCountry
				)
			})
		}

		// Apply discipline filter
		if (selectedDisciplines.length > 0) {
			data = data.filter((item) => {
				const field =
					'field' in item
						? (item as Program).field
						: 'position' in item
							? (item as unknown as ResearchLab).position
							: ''
				return selectedDisciplines.some((d) =>
					field.toLowerCase().includes(d.toLowerCase())
				)
			})
		}

		// Apply country filter
		if (selectedCountries.length > 0) {
			data = data.filter((item) => selectedCountries.includes(item.country))
		}

		// Apply fee range filter (for programmes)
		if (selectedFeeRange && activeTab === 'programmes') {
			const [min, max] = selectedFeeRange.split('-').map(Number)
			data = data.filter((item) => {
				if ('price' in item && item.price) {
					const priceStr = item.price.replace(/[^0-9]/g, '')
					const price = parseInt(priceStr)
					return price >= min && price <= max
				}
				return false
			})
		}

		// Apply duration filter (for programmes)
		if (selectedDuration.length > 0 && activeTab === 'programmes') {
			// Duration filtering would need additional data from the API
			// For now, we'll skip this as it's not available in the current data structure
		}

		// Apply degree level filter
		if (selectedDegreeLevel.length > 0) {
			data = data.filter((item) => {
				if ('field' in item) {
					const field = (item as Program).field.toLowerCase()
					return selectedDegreeLevel.some((level) => {
						const levelLower = level.toLowerCase()
						if (levelLower === 'master')
							return (
								field.includes('master') ||
								field.includes('msc') ||
								field.includes('ma')
							)
						if (levelLower === 'phd')
							return field.includes('phd') || field.includes('doctorate')
						if (levelLower === 'bachelor')
							return (
								field.includes('bachelor') ||
								field.includes('bsc') ||
								field.includes('ba')
							)
						return false
					})
				}
				return false
			})
		}

		// Apply attendance filter
		if (selectedAttendance.length > 0) {
			data = data.filter(
				(item) =>
					'attendance' in item &&
					selectedAttendance.includes((item as Program).attendance)
			)
		}

		// Apply expired filter
		if (!showExpired) {
			data = data.filter((item) => item.daysLeft >= 0)
		}

		return data
	}, [
		programs,
		scholarships,
		researchLabs,
		activeTab,
		searchQuery,
		selectedDisciplines,
		selectedCountries,
		selectedFeeRange,
		selectedDuration,
		selectedDegreeLevel,
		selectedAttendance,
		showExpired,
	])

	// Get current tab data with filters applied
	const getCurrentTabData = () => {
		return {
			data: filteredData,
			totalItems: filteredData.length,
		}
	}

	const currentTabData = getCurrentTabData()

	// Render tab content based on active tab
	const renderTabContent = () => {
		const filteredPrograms = activeTab === 'programmes' ? filteredData : []
		const filteredScholarships =
			activeTab === 'scholarships' ? filteredData : []
		const filteredResearchLabs = activeTab === 'research' ? filteredData : []

		switch (activeTab) {
			case 'programmes':
				return (
					<ProgramsTab
						programs={filteredPrograms as Program[]}
						sortBy={sortBy}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			case 'scholarships':
				return (
					<ScholarshipsTab
						scholarships={filteredScholarships as Scholarship[]}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			case 'research':
				return (
					<ResearchLabsTab
						researchLabs={filteredResearchLabs as ResearchLab[]}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={() => false} // Wishlist items are not applied
						isApplying={() => false}
						onApply={() => {}} // No-op for wishlist
					/>
				)
			default:
				return (
					<ProgramsTab
						programs={filteredPrograms as Program[]}
						sortBy={sortBy}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={() => false}
						isApplying={() => false}
						onApply={() => {}}
					/>
				)
		}
	}

	// Clear all filters
	const clearAllFilters = () => {
		setSelectedDisciplines([])
		setSelectedCountries([])
		setSelectedFeeRange(null)
		setSelectedFunding([])
		setSelectedDuration([])
		setSelectedDegreeLevel([])
		setSelectedAttendance([])
		setShowExpired(false)
	}

	// Check if any filters are active
	const hasActiveFilters = useMemo(() => {
		return (
			selectedDisciplines.length > 0 ||
			selectedCountries.length > 0 ||
			selectedFeeRange !== null ||
			selectedFunding.length > 0 ||
			selectedDuration.length > 0 ||
			selectedDegreeLevel.length > 0 ||
			selectedAttendance.length > 0 ||
			showExpired
		)
	}, [
		selectedDisciplines,
		selectedCountries,
		selectedFeeRange,
		selectedFunding,
		selectedDuration,
		selectedDegreeLevel,
		selectedAttendance,
		showExpired,
	])

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Error message */}
				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-red-600">⚠️</span>
							<span className="text-sm text-red-700">{error}</span>
						</div>
						<button
							onClick={fetchWishlistData}
							className="text-xs text-red-600 hover:text-red-800 underline"
						>
							{t('error.button')}
						</button>
					</div>
				)}
				{/* Header Section */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						{t('title')}
					</h2>

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
										placeholder={t('search.placeholder')}
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

					{/* Progress loading indicator */}
					{(wishlistLoading || loading) && (
						<div className="mb-4 h-1 bg-gray-100 overflow-hidden rounded-full">
							<div
								className="h-full bg-teal-600 animate-pulse"
								style={{ width: '30%' }}
							></div>
						</div>
					)}

					{/* Detailed Filter Dropdowns */}
					<div className="flex flex-wrap gap-2 items-center">
						{/* Discipline Filter */}
						<div className="w-48">
							<CheckboxSelect
								value={selectedDisciplines.map((d) => ({ value: d, label: d }))}
								onChange={(selected) =>
									setSelectedDisciplines(
										selected.map((item: any) => item.value)
									)
								}
								placeholder={t('filters.all_disciplines')}
								options={availableOptions.disciplines.map((d) => ({
									value: d as string,
									label: d as string,
								}))}
								variant="default"
								isClearable
								className="w-full"
							/>
						</div>

						{/* Country Filter */}
						<div className="w-48">
							<CheckboxSelect
								value={selectedCountries.map((c) => ({ value: c, label: c }))}
								onChange={(selected) =>
									setSelectedCountries(selected.map((item: any) => item.value))
								}
								placeholder={t('filters.all_countries')}
								options={availableOptions.countries.map((c) => ({
									value: c,
									label: c,
								}))}
								variant="default"
								isClearable
								className="w-full"
							/>
						</div>

						{/* Fee Range Filter (Programmes only) */}
						{activeTab === 'programmes' && (
							<div className="w-48">
								<CheckboxSelect
									value={
										selectedFeeRange
											? [
													{
														value: selectedFeeRange,
														label:
															availableOptions.feeRanges.find(
																(fr) => fr.value === selectedFeeRange
															)?.label || selectedFeeRange,
													},
												]
											: []
									}
									onChange={(selected) => {
										setSelectedFeeRange(
											selected && selected.length > 0 ? selected[0].value : null
										)
									}}
									placeholder={t('filters.fee_range')}
									options={availableOptions.feeRanges}
									variant="default"
									isClearable
									className="w-full"
								/>
							</div>
						)}

						{/* Duration Filter (Programmes only) */}
						{activeTab === 'programmes' && (
							<div className="w-48">
								<CheckboxSelect
									value={selectedDuration.map((d) => ({ value: d, label: d }))}
									onChange={(selected) =>
										setSelectedDuration(selected.map((item: any) => item.value))
									}
									placeholder={t('filters.all_durations')}
									options={availableOptions.durations.map((d) => ({
										value: d,
										label: d,
									}))}
									variant="default"
									isClearable
									className="w-full"
								/>
							</div>
						)}

						{/* Degree Level Filter */}
						<div className="w-48">
							<CheckboxSelect
								value={selectedDegreeLevel.map((d) => ({ value: d, label: d }))}
								onChange={(selected) =>
									setSelectedDegreeLevel(
										selected.map((item: any) => item.value)
									)
								}
								placeholder={t('filters.all_degree_levels')}
								options={availableOptions.degreeLevels.map((d) => ({
									value: d,
									label: d,
								}))}
								variant="default"
								isClearable
								className="w-full"
							/>
						</div>

						{/* Attendance Filter */}
						{activeTab !== 'scholarships' && (
							<div className="w-48">
								<CheckboxSelect
									value={selectedAttendance.map((a) => ({
										value: a,
										label: a,
									}))}
									onChange={(selected) =>
										setSelectedAttendance(
											selected.map((item: any) => item.value)
										)
									}
									placeholder={t('filters.all_attendance')}
									options={availableOptions.attendanceTypes.map((a) => ({
										value: a,
										label: a,
									}))}
									variant="default"
									isClearable
									className="w-full"
								/>
							</div>
						)}
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-600 mb-4">
					{t('results.count', { count: currentTabData.totalItems })}
				</div>

				{/* Tab Content */}
				{(wishlistLoading || loading) && currentTabData.totalItems === 0 ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
							<p className="mt-4 text-muted-foreground">{t('loading')}</p>
						</div>
					</div>
				) : (
					<div
						className={
							wishlistLoading || loading ? 'opacity-60 pointer-events-none' : ''
						}
					>
						{currentTabData.totalItems === 0 ? (
							<div className="text-center py-12">
								<div className="text-6xl mb-4">📝</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{t('empty.title')}
								</h3>
								<p className="text-gray-600 mb-6">{t('empty.description')}</p>
								<Button
									onClick={() => (window.location.href = '/explore')}
									className="bg-teal-600 hover:bg-teal-700 text-white"
								>
									{t('empty.button')}
								</Button>
							</div>
						) : (
							renderTabContent()
						)}
					</div>
				)}

				{/* Wishlist Success Modal */}
				<SuccessModal
					isOpen={showWishlistSuccessModal}
					onClose={() => setShowWishlistSuccessModal(false)}
					title={wishlistSuccessTitle || t('success.added_title')}
					message={wishlistSuccessMessage || t('success.added_message_default')}
					buttonText={t('success.button')}
				/>
			</div>
		</div>
	)
}
