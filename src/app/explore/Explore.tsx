'use client'
import Image from 'next/image'
import { useState } from 'react'
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
import { Check } from 'lucide-react'
import student from '../../../public/student.png'
const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research', label: 'Research Labs' },
]

const Explore = () => {
	const [activeTab, setActiveTab] = useState<TabType>('programmes')
	const [currentPage, setCurrentPage] = useState(1)
	const [sortBy, setSortBy] = useState<SortOption>('most-popular')

	const breadcrumbItems = [{ label: 'Explore', href: '/explore' }]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return <ProgramsTab sortBy={sortBy} />
			case 'scholarships':
				return <ScholarshipsTab sortBy={sortBy} />
			case 'research':
				return <ResearchLabsTab sortBy={sortBy} />
			default:
				return <ProgramsTab sortBy={sortBy} />
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
				<div className="">
					<TabSelector
						tabs={categories}
						activeTab={activeTab}
						onTabChange={(tabId) => setActiveTab(tabId as TabType)}
					/>
				</div>

				<div className="flex gap-8 ">
					<FilterSidebar activeTab={activeTab} />
					<div className="flex-1">
						<motion.div
							className="flex justify-between items-center mb-4"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<div className="text-sm text-gray-600">1000 results</div>
							<SortDropdown value={sortBy} onChange={setSortBy} />
						</motion.div>
						{renderTabContent()}
						<Pagination
							currentPage={currentPage}
							totalPages={20}
							onPageChange={setCurrentPage}
						/>
					</div>
				</div>
			</motion.div>
			{/* ---------------------------------------------------Subscription----------------------------------------------- */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="p-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="flex items-center space-x-2 mb-4">
								<span className="text-[#116E63] text-xl">★</span>
								<span className="text-sm font-medium text-[#116E63]">
									Subscription Plans
								</span>
							</div>

							<h2 className="text-3xl font-bold text-gray-900 mb-4">
								Find Your Perfect Learning Path
							</h2>

							<p className="text-gray-600 mb-6 max-w-md">
								From basic scholarship search to AI-powered matching, choose the
								plan that fits your academic goals. Get personalized
								recommendations and connect with opportunities worldwide.
							</p>

							<Button className="bg-[#116E63] hover:bg-teal-700 text-white mb-6">
								Explore now
							</Button>

							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Check className="w-4 h-4 text-[#116E63]" />
									<span className="text-sm text-gray-600">
										Save Time & Stay Organized
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<Check className="w-4 h-4 text-[#116E63]" />
									<span className="text-sm text-gray-600">
										Connect Directly
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<Check className="w-4 h-4 text-[#116E63]" />
									<span className="text-sm text-gray-600">
										Get Smart Matches
									</span>
								</div>
							</div>
						</div>

						<div className="pr-10">
							<Image src={student} alt="" width={300} height={400} />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Explore
