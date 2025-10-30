'use client'
import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import {
	Button,
	Breadcrumb,
	FilterSidebar,
	Pagination,
	SearchBar,
	SortDropdown,
	TabSelector,
	AIAssistantCard,
} from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { ExploreApiService } from '@/lib/explore-api'
import { useTranslations } from 'next-intl'
import { TabType } from '@/types/explore'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useWishlist } from '@/hooks/useWishlist'
import student from '../../../../public/student.png'
const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research', label: 'Research Labs' },
]

const ITEMS_PER_PAGE_PROGRAMS = 15
const ITEMS_PER_PAGE_SCHOLARSHIPS = 5
const ITEMS_PER_PAGE_RESEARCH = 5

const Explore = () => {
	const t = useTranslations('')
	const searchParams = useSearchParams()
	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Explore', href: '/explore' },
	]

	const contentRef = useRef<HTMLDivElement>(null)
	const [activeTab, setActiveTab] = useState<TabType>('programmes')
	const [currentPage, setCurrentPage] = useState(1)
	const [sortBy, setSortBy] = useState<SortOption>('most-popular')
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({})
	const [filtersInitialized, setFiltersInitialized] = useState(false)

	// Initialize state from URL parameters on component mount
	useEffect(() => {
		// Get tab from URL
		const tabFromUrl = searchParams.get('tab')
		if (
			tabFromUrl &&
			['programmes', 'scholarships', 'research'].includes(tabFromUrl)
		) {
			setActiveTab(tabFromUrl as TabType)
		}

		// Get sort from URL
		const sortFromUrl = searchParams.get('sort') as SortOption
		if (
			sortFromUrl &&
			['most-popular', 'newest', 'match-score', 'deadline'].includes(
				sortFromUrl
			)
		) {
			setSortBy(sortFromUrl)
		}

		// Get page from URL
		const pageFromUrl = searchParams.get('page')
		if (pageFromUrl) {
			const pageNumber = parseInt(pageFromUrl)
			if (!isNaN(pageNumber) && pageNumber > 0) {
				setCurrentPage(pageNumber)
			}
		}

		// Initialize filters from URL parameters (for refresh scenarios)
		const initializeFiltersFromURL = () => {
			const filters: Record<string, string[]> = {}
			const currentTab = tabFromUrl || 'programmes' // Don't use activeTab here to avoid dependency

			// Parse filters with tab prefix from URL
			const filterKeys = [
				'discipline',
				'country',
				'duration',
				'degreeLevel',
				'attendance',
				'researchField',
				'essayRequired',
				'contractType',
				'jobType',
			]

			filterKeys.forEach((key) => {
				const value = searchParams.get(`${currentTab}_${key}`)
				if (value) {
					filters[key] = value.split(',')
				}
			})

			// Parse fee range
			const feeMin = searchParams.get(`${currentTab}_feeMin`)
			const feeMax = searchParams.get(`${currentTab}_feeMax`)
			if (feeMin || feeMax) {
				filters.feeRange = [`${feeMin || 0}-${feeMax || 1000000}`]
			}

			// Parse salary range
			const salaryMin = searchParams.get(`${currentTab}_salaryMin`)
			const salaryMax = searchParams.get(`${currentTab}_salaryMax`)
			if (salaryMin || salaryMax) {
				filters.salaryRange = [`${salaryMin || 0}-${salaryMax || 200000}`]
			}

			return filters
		}

		// Initialize filters from URL when searchParams is available
		if (searchParams && searchParams.toString()) {
			const parsedFilters = initializeFiltersFromURL()
			if (Object.keys(parsedFilters).length > 0) {
				setSelectedFilters(parsedFilters)
			}
		}

		// Always mark filters as initialized
		setFiltersInitialized(true)
	}, [searchParams]) // Remove activeTab from dependencies to prevent infinite loop

	// Update URL when tab, sort, or page changes
	useEffect(() => {
		if (!filtersInitialized) return

		const params = new URLSearchParams(searchParams.toString())

		params.set('tab', activeTab)

		if (sortBy !== 'most-popular') {
			params.set('sort', sortBy)
		} else {
			params.delete('sort')
		}

		if (currentPage !== 1) {
			params.set('page', currentPage.toString())
		} else {
			params.delete('page')
		}

		const newURL = `${window.location.pathname}?${params.toString()}`

		// Only update URL if it's different to avoid infinite loops
		if (window.location.search !== `?${params.toString()}`) {
			window.history.replaceState({}, '', newURL)
		}
	}, [activeTab, sortBy, currentPage, searchParams, filtersInitialized])

	// Handle filters change from FilterSidebar
	const handleFiltersChange = useCallback(
		(filters: Record<string, string[]>) => {
			// Only update if filters have been initialized to prevent race conditions
			if (filtersInitialized) {
				setSelectedFilters(filters)
			}
		},
		[filtersInitialized]
	)
	const { isInWishlist, toggleWishlistItem } = useWishlist()

	// Application functionality - track applied/applying posts
	const [appliedPosts] = useState<Set<string>>(new Set())
	const [applyingPosts] = useState<Set<string>>(new Set())

	// Handle wishlist toggle
	const handleWishlistToggle = async (postId: string) => {
		try {
			await toggleWishlistItem(postId)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to toggle wishlist item:', error)
			// You could add a toast notification here
		}
	}

	// Handle application - redirect to detail page for document upload
	const handleApply = async (postId: string) => {
		// Redirect to the appropriate detail page based on the current tab
		let detailPath = ''

		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())

		switch (activeTab) {
			case 'programmes':
				detailPath = `/explore/programmes/${postId}?from=programmes&${currentParams.toString()}`
				break
			case 'scholarships':
				detailPath = `/explore/scholarships/${postId}?from=scholarships&${currentParams.toString()}`
				break
			case 'research':
				detailPath = `/explore/research-labs/${postId}?from=research&${currentParams.toString()}`
				break
			default:
				detailPath = `/explore/programmes/${postId}?from=programmes&${currentParams.toString()}`
		}

		// Navigate to the detail page where users can upload documents and apply
		window.location.href = detailPath
	}

	// Check if user has applied to a post
	const hasApplied = (postId: string) => appliedPosts.has(postId)

	// Check if application is in progress
	const isApplying = (postId: string) => applyingPosts.has(postId)

	// Programs state
	const [programs, setPrograms] = useState<Program[]>([])
	const [programsLoading, setProgramsLoading] = useState(false)
	const [programsTotalPages, setProgramsTotalPages] = useState(0)
	const [programsTotalItems, setProgramsTotalItems] = useState(0)

	// Scholarships state
	const [scholarships, setScholarships] = useState<Scholarship[]>([])
	const [scholarshipsLoading, setScholarshipsLoading] = useState(false)
	const [scholarshipsTotalPages, setScholarshipsTotalPages] = useState(0)
	const [scholarshipsTotalItems, setScholarshipsTotalItems] = useState(0)

	// Research Labs state
	const [researchLabs, setResearchLabs] = useState<ResearchLab[]>([])
	const [researchLabsLoading, setResearchLabsLoading] = useState(false)
	const [researchLabsTotalPages, setResearchLabsTotalPages] = useState(0)
	const [researchLabsTotalItems, setResearchLabsTotalItems] = useState(0)

	// Load data when tab, page, sort, or filters change (but only after filters are initialized)
	useEffect(() => {
		// Don't load data if filters haven't been initialized from URL yet
		if (!filtersInitialized) {
			return
		}

		const loadData = async () => {
			try {
				// Filter out unsupported sort options
				let apiSortBy:
					| 'most-popular'
					| 'newest'
					| 'match-score'
					| 'deadline'
					| undefined = 'newest'
				if (
					sortBy === 'most-popular' ||
					sortBy === 'newest' ||
					sortBy === 'match-score' ||
					sortBy === 'deadline'
				) {
					apiSortBy = sortBy
				}

				if (activeTab === 'programmes') {
					setProgramsLoading(true)

					// Parse fee range if available
					let minFee: number | undefined
					let maxFee: number | undefined
					if (selectedFilters.feeRange && selectedFilters.feeRange.length > 0) {
						const feeRangeStr = selectedFilters.feeRange[0]
						const [min, max] = feeRangeStr.split('-').map(Number)
						minFee = min
						maxFee = max
					}

					const response = await ExploreApiService.getPrograms({
						page: currentPage,
						limit: ITEMS_PER_PAGE_PROGRAMS,
						sortBy: apiSortBy,
						discipline: selectedFilters.discipline,
						country: selectedFilters.country,
						attendance: selectedFilters.attendance,
						degreeLevel: selectedFilters.degreeLevel,
						duration: selectedFilters.duration,
						minFee,
						maxFee,
					})
					setPrograms(response.data)
					setProgramsTotalItems(response.meta.total)
					setProgramsTotalPages(response.meta.totalPages)
					setProgramsLoading(false)
				} else if (activeTab === 'scholarships') {
					setScholarshipsLoading(true)
					const response = await ExploreApiService.getScholarships({
						page: currentPage,
						limit: ITEMS_PER_PAGE_SCHOLARSHIPS,
						sortBy: apiSortBy,
						discipline: selectedFilters.discipline,
						country: selectedFilters.country,
						degreeLevel: selectedFilters.degreeLevel,
						essayRequired: selectedFilters.essayRequired?.includes('Yes')
							? true
							: selectedFilters.essayRequired?.includes('No')
								? false
								: undefined,
					})
					setScholarships(response.data)
					setScholarshipsTotalItems(response.meta.total)
					setScholarshipsTotalPages(response.meta.totalPages)
					setScholarshipsLoading(false)
				} else if (activeTab === 'research') {
					setResearchLabsLoading(true)

					// Parse salary range if available
					let minSalary: number | undefined
					let maxSalary: number | undefined
					if (
						selectedFilters.salaryRange &&
						selectedFilters.salaryRange.length > 0
					) {
						const salaryRangeStr = selectedFilters.salaryRange[0]
						const [min, max] = salaryRangeStr.split('-').map(Number)
						minSalary = min
						maxSalary = max
					}

					const response = await ExploreApiService.getResearchLabs({
						page: currentPage,
						limit: ITEMS_PER_PAGE_RESEARCH,
						sortBy: apiSortBy,
						researchField: selectedFilters.researchField,
						country: selectedFilters.country,
						degreeLevel: selectedFilters.degreeLevel,
						attendance: selectedFilters.attendance,
						contractType: selectedFilters.contractType,
						jobType: selectedFilters.jobType,
						minSalary,
						maxSalary,
					})
					setResearchLabs(response.data)
					setResearchLabsTotalItems(response.meta.total)
					setResearchLabsTotalPages(response.meta.totalPages)
					setResearchLabsLoading(false)
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error(`Error loading ${activeTab}:`, error)

				if (activeTab === 'programmes') {
					setPrograms([])
					setProgramsTotalItems(0)
					setProgramsTotalPages(0)
					setProgramsLoading(false)
				} else if (activeTab === 'scholarships') {
					setScholarships([])
					setScholarshipsTotalItems(0)
					setScholarshipsTotalPages(0)
					setScholarshipsLoading(false)
				} else if (activeTab === 'research') {
					setResearchLabs([])
					setResearchLabsTotalItems(0)
					setResearchLabsTotalPages(0)
					setResearchLabsLoading(false)
				}
			}
		}

		loadData()
	}, [activeTab, currentPage, sortBy, selectedFilters, filtersInitialized])

	// Reset page to 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [selectedFilters, activeTab])

	// Tab change handler
	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId as TabType)
		setCurrentPage(1)
		// URL will be updated automatically via useEffect
		// Scroll to top when switching tabs with delay
		setTimeout(() => {
			// Try scrolling to content area first, fallback to window scroll
			if (contentRef.current) {
				contentRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				})
			} else {
				window.scrollTo({ top: 0, behavior: 'smooth' })
			}
		}, 100)
	}

	// Handle page change with scroll to top
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		// URL will be updated automatically via useEffect
		// Use setTimeout to ensure DOM is updated before scrolling
		setTimeout(() => {
			// Try scrolling to content area first, fallback to window scroll
			if (contentRef.current) {
				contentRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				})
			} else {
				window.scrollTo({ top: 0, behavior: 'smooth' })
			}
		}, 100)
	}

	// Handle sort change
	const handleSortChange = (newSort: SortOption) => {
		setSortBy(newSort)
		setCurrentPage(1) // Reset to first page when sorting changes
		// URL will be updated automatically via useEffect
	}

	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return (
					<ProgramsTab
						programs={programs}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={hasApplied}
						isApplying={isApplying}
						onApply={handleApply}
					/>
				)
			case 'scholarships':
				return (
					<ScholarshipsTab
						scholarships={scholarships}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={hasApplied}
						isApplying={isApplying}
						onApply={handleApply}
					/>
				)
			case 'research':
				return (
					<ResearchLabsTab
						researchLabs={researchLabs}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={hasApplied}
						isApplying={isApplying}
						onApply={handleApply}
					/>
				)
			default:
				return (
					<ProgramsTab
						programs={programs}
						isInWishlist={isInWishlist}
						onWishlistToggle={handleWishlistToggle}
						hasApplied={hasApplied}
						isApplying={isApplying}
						onApply={handleApply}
					/>
				)
		}
	}

	// Get current tab data for UI display
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				return {
					loading: programsLoading,
					totalItems: programsTotalItems,
					totalPages: programsTotalPages,
				}
			case 'scholarships':
				return {
					loading: scholarshipsLoading,
					totalItems: scholarshipsTotalItems,
					totalPages: scholarshipsTotalPages,
				}
			case 'research':
				return {
					loading: researchLabsLoading,
					totalItems: researchLabsTotalItems,
					totalPages: researchLabsTotalPages,
				}
			default:
				return {
					loading: programsLoading,
					totalItems: programsTotalItems,
					totalPages: programsTotalPages,
				}
		}
	}

	const currentTabData = getCurrentTabData()
	return (
		<div className="min-h-screen bg-background">
			{/* ---------------------------------------------------Quote----------------------------------------------- */}
			<div className="relative w-full h-[485px] mt-10">
				<div className="absolute inset-0">
					<Image
						src="https://wallpapers.com/images/featured/cambridge-university-k3uqfq0l7bwrrmpr.jpg"
						alt="University Campus"
						fill
						className="object-cover"
						priority
					/>
				</div>

				<div className="absolute bottom-0 left-0 bg-black bg-opacity-40 max-w-3xl h-[185px] p-8">
					<div className="text-white">
						<h1 className="text-2xl font-bold mb-2">John Dewey:</h1>
						<p className="text-sm max-w-xl">
							&ldquo;Education is not preparation for life; education is life
							itself.&rdquo;
						</p>
					</div>
				</div>
			</div>

			{/* ---------------------------------------------------Explore----------------------------------------------- */}
			<motion.div
				ref={contentRef}
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-5"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
					<motion.h2
						className="text-2xl font-bold text-gray-900 mb-4 text-center"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}
					>
						{t('search.title')}
					</motion.h2>
					<SearchBar />
				</div>
				<div className="border-b-2">
					<TabSelector
						tabs={categories}
						activeTab={activeTab}
						onTabChange={handleTabChange}
					/>
				</div>

				<div className="flex gap-8 items-center justify-center">
					<div className="flex-1">
						<motion.div
							className="flex justify-between items-center mb-4"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<div className="text-sm text-gray-600">
								{currentTabData.totalItems} results
							</div>
							<SortDropdown value={sortBy} onChange={handleSortChange} />
						</motion.div>
						<div className="flex gap-6 h-full">
							<div className=" top-4 self-start  flex flex-col gap-6">
								<FilterSidebar
									activeTab={activeTab}
									onFiltersChange={handleFiltersChange}
								/>
								<AIAssistantCard />
							</div>
							<div className="w-full">
								{currentTabData.loading ? (
									<div className="flex items-center justify-center py-20 w-full h-full">
										<div className="flex flex-col items-center gap-3">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#116E63]"></div>
											<p className="text-gray-600 text-sm">
												Loading{' '}
												{activeTab === 'programmes' ? 'programs' : activeTab}
												...
											</p>
										</div>
									</div>
								) : (
									renderTabContent()
								)}

								{!currentTabData.loading && (
									<Pagination
										currentPage={currentPage}
										totalPages={currentTabData.totalPages}
										onPageChange={handlePageChange}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</motion.div>
			{/* ---------------------------------------------------Subscription----------------------------------------------- */}
			<div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="p-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl px-10">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="flex items-center space-x-2 mb-4">
								<span className="text-[#116E63] text-xl">★</span>
								<span className="text-lg font-medium text-[#116E63]">
									{t('subscription.badge')}
								</span>
							</div>

							<h2 className="text-3xl font-bold text-gray-900 mb-4">
								{t('subscription.title')}
							</h2>

							<p className="text-gray-600 mb-6 max-w-xl">
								{t('subscription.description')}
							</p>

							<Button className="bg-[#116E63] hover:bg-teal-700 text-white mb-6">
								{t('buttons.explore_more')}
							</Button>

							<div className="space-y-4">
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										1
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											{t('subscription.benefit_1.title')}
										</h4>
										<p className="text-sm text-gray-600">
											{t('subscription.benefit_1.desc')}
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										2
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											{t('subscription.benefit_2.title')}
										</h4>
										<p className="text-sm text-gray-600">
											{t('subscription.benefit_2.desc')}
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										3
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											{t('subscription.benefit_3.title')}
										</h4>
										<p className="text-sm text-gray-600">
											{t('subscription.benefit_3.desc')}
										</p>
									</div>
								</div>
							</div>
						</div>

						<div className="pr-20">
							<Image src={student} alt="" width={300} height={400} />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Explore
