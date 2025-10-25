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
import { useEffect, useState, useRef } from 'react'
import { useWishlist } from '@/hooks/useWishlist'
import { applicationService } from '@/lib/application-service'
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

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist()

	// Application functionality
	const [appliedPosts, setAppliedPosts] = useState<Set<string>>(new Set())
	const [applyingPosts, setApplyingPosts] = useState<Set<string>>(new Set())

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

	// Handle application submission
	const handleApply = async (postId: string) => {
		try {
			setApplyingPosts((prev) => new Set(prev).add(postId))

			const response = await applicationService.submitApplication({
				postId,
				documents: [], // Can be enhanced later to include document upload
			})
			if (response.success) {
				setAppliedPosts((prev) => new Set(prev).add(postId))
				// You could add a success toast notification here
				// eslint-disable-next-line no-console
				console.log('Application submitted successfully')
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to submit application:', error)
			// You could add an error toast notification here
		} finally {
			setApplyingPosts((prev) => {
				const newSet = new Set(prev)
				newSet.delete(postId)
				return newSet
			})
		}
	}

	// Check if user has applied to a post
	const hasApplied = (postId: string) => appliedPosts.has(postId)

	// Check if application is in progress
	const isApplying = (postId: string) => applyingPosts.has(postId)

	// Initialize tab from URL parameter
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search)
		const tabFromUrl = urlParams.get('tab')
		if (
			tabFromUrl &&
			['programmes', 'scholarships', 'research'].includes(tabFromUrl)
		) {
			setActiveTab(tabFromUrl as TabType)
		}
	}, [])

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

	// Load data when tab, page, sort, or filters change
	useEffect(() => {
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
	}, [activeTab, currentPage, sortBy, selectedFilters])

	// Reset page to 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [selectedFilters, activeTab])

	// Tab change handler
	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId as TabType)
		setCurrentPage(1)
		// Update URL to include tab parameter
		const url = new URL(window.location.href)
		url.searchParams.set('tab', tabId)
		window.history.pushState({}, '', url.toString())
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
							<SortDropdown value={sortBy} onChange={setSortBy} />
						</motion.div>
						<div className="flex gap-6 h-full">
							<div className=" top-4 self-start  flex flex-col gap-6">
								<FilterSidebar
									activeTab={activeTab}
									onFiltersChange={setSelectedFilters}
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
