'use client'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TabType } from '@/types/explore'
import { SortDropdown, SortOption } from '@/components/ui/Sort'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SearchBar } from '@/components/ui/SearchBar'
import { TabSelector } from '@/components/ui/TabSelector'
import { FilterSidebar } from '@/components/ui/FilterSidebar'
import { Pagination } from '@/components/ui/Pagination'
import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import { Button } from '@/components/ui'
import { mockPrograms, mockScholarships, mockResearchLabs } from '@/data/utils'
import student from '../../../public/student.png'
const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research', label: 'Research Labs' },
]

const ITEMS_PER_PAGE = 15

const Explore = () => {
	const [activeTab, setActiveTab] = useState<TabType>('programmes')
	const [currentPage, setCurrentPage] = useState(1)
	const [sortBy, setSortBy] = useState<SortOption>('most-popular')

	// Get current tab data and calculate pagination
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				return mockPrograms
			case 'scholarships':
				return mockScholarships
			case 'research':
				return mockResearchLabs
			default:
				return mockPrograms
		}
	}

	const currentTabData = getCurrentTabData()
	const totalItems = currentTabData.length
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

	// Reset to page 1 when switching tabs
	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId as TabType)
		setCurrentPage(1)
	}

	const breadcrumbItems = [{ label: 'Explore', href: '/explore' }]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return (
					<ProgramsTab
						currentPage={currentPage}
						itemsPerPage={ITEMS_PER_PAGE}
					/>
				)
			case 'scholarships':
				return (
					<ScholarshipsTab
						currentPage={currentPage}
						itemsPerPage={ITEMS_PER_PAGE}
					/>
				)
			case 'research':
				return (
					<ResearchLabsTab
						currentPage={currentPage}
						itemsPerPage={ITEMS_PER_PAGE}
					/>
				)
			default:
				return (
					<ProgramsTab
						currentPage={currentPage}
						itemsPerPage={ITEMS_PER_PAGE}
					/>
				)
		}
	}
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
							itself. It is the continuous reconstruction of experience, where
							each lesson learned becomes the foundation for new growth, and
							every challenge faced an opportunity for deeper wisdom.&rdquo;
						</p>
					</div>
				</div>
			</div>

			{/* ---------------------------------------------------Explore----------------------------------------------- */}
			<motion.div
				className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-5"
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
						Search your needs here
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
							<div className="text-sm text-gray-600">{totalItems} results</div>
							<SortDropdown value={sortBy} onChange={setSortBy} />
						</motion.div>
						<div className="flex gap-6 h-full">
							<div className="sticky top-4 self-start ">
								<FilterSidebar activeTab={activeTab} />
							</div>
							<div className="">
								{renderTabContent()}

								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={setCurrentPage}
								/>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
			{/* ---------------------------------------------------Subscription----------------------------------------------- */}
			<div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="p-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl px-10">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="flex items-center space-x-2 mb-4">
								<span className="text-[#116E63] text-xl">★</span>
								<span className="text-lg font-medium text-[#116E63]">
									Subscription Plans
								</span>
							</div>

							<h2 className="text-3xl font-bold text-gray-900 mb-4">
								Find Your Perfect Learning Path
							</h2>

							<p className="text-gray-600 mb-6 max-w-xl">
								From basic scholarship search to AI-powered matching, choose the
								plan that fits your academic goals. Get personalized
								recommendations and connect with opportunities worldwide.
							</p>

							<Button className="bg-[#116E63] hover:bg-teal-700 text-white mb-6">
								Explore more
							</Button>

							<div className="space-y-4">
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										1
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											Save Time & Stay Organized
										</h4>
										<p className="text-sm text-gray-600">
											Easily find and track scholarships with deadline
											reminders.
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										2
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											Connect Directly
										</h4>
										<p className="text-sm text-gray-600">
											Message professors & scholarship officers to boost your
											chances.
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 w-6 h-6 bg-[#116E63] text-white rounded-full flex items-center justify-center text-sm font-medium">
										3
									</span>
									<div>
										<h4 className="font-medium text-gray-900 mb-1">
											Get Smart Matches
										</h4>
										<p className="text-sm text-gray-600">
											Use AI to find the best-fit scholarships and research
											groups.
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
