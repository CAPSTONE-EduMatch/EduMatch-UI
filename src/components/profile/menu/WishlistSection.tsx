'use client'

import React, { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'

interface WishlistSectionProps {
	profile: any
}

export const WishlistSection: React.FC<WishlistSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: 'Programmes' },
		{ id: 'scholarships', label: 'Scholarships' },
		{ id: 'research', label: 'Research Labs' },
	]

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

	// Mock data for wishlist - replace with actual API calls
	const wishlistPrograms: Program[] = useMemo(
		() => [
			{
				id: 1,
				title: 'Master of Science in Computer Science',
				description:
					'Advanced program in computer science with focus on AI and machine learning',
				university: 'Harvard University',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/1200px-Harvard_University_logo.svg.png',
				field: 'Computer Science',
				country: 'United States',
				date: '2025-01-15',
				daysLeft: 15,
				price: '234,567 USD / year',
				match: '95%',
				funding: 'Available',
				attendance: 'Hybrid',
			},
			{
				id: 2,
				title: 'Master of Science in Data Science',
				description:
					'Comprehensive data science program covering analytics and big data',
				university: 'Stanford University',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Stanford_University_logo_%28seal%29.svg/1200px-Stanford_University_logo_%28seal%29.svg.png',
				field: 'Data Science',
				country: 'United States',
				date: '2025-01-30',
				daysLeft: 30,
				price: '198,500 USD / year',
				match: '88%',
				funding: 'Available',
				attendance: 'On-campus',
			},
			{
				id: 3,
				title: 'Master of Philosophy in AI',
				description:
					'Research-focused program in artificial intelligence and machine learning',
				university: 'University of Cambridge',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/University_of_Cambridge_coat_of_arms.svg/1200px-University_of_Cambridge_coat_of_arms.svg.png',
				field: 'Artificial Intelligence',
				country: 'United Kingdom',
				date: '2025-02-15',
				daysLeft: 45,
				price: '156,000 GBP / year',
				match: '92%',
				funding: 'Available',
				attendance: 'Online',
			},
		],
		[]
	)

	const wishlistScholarships: Scholarship[] = useMemo(
		() => [
			{
				id: 4,
				title: 'Fulbright Scholarship for International Students',
				description:
					'Full scholarship for international students pursuing graduate studies',
				provider: 'Fulbright Commission',
				university: 'Various Universities',
				essayRequired: 'Yes',
				country: 'United States',
				date: '2025-03-01',
				daysLeft: 60,
				amount: 'Full Tuition + Living',
				match: '85%',
			},
			{
				id: 5,
				title: 'Chevening Scholarship',
				description:
					'UK government scholarship for future leaders and influencers',
				provider: 'UK Government',
				university: 'UK Universities',
				essayRequired: 'Yes',
				country: 'United Kingdom',
				date: '2025-02-28',
				daysLeft: 58,
				amount: 'Full Coverage',
				match: '90%',
			},
		],
		[]
	)

	const wishlistResearchLabs: ResearchLab[] = useMemo(
		() => [
			{
				id: 6,
				title: 'AI Research Lab - MIT',
				description:
					'Cutting-edge research in artificial intelligence and robotics',
				professor: 'Dr. Sarah Johnson',
				field: 'Artificial Intelligence',
				country: 'United States',
				position: 'PhD Research Assistant',
				date: '2025-04-01',
				daysLeft: 90,
				match: '95%',
			},
			{
				id: 7,
				title: 'Machine Learning Lab - Stanford',
				description: 'Research in deep learning and neural networks',
				professor: 'Dr. Michael Chen',
				field: 'Machine Learning',
				country: 'United States',
				position: 'Postdoc Researcher',
				date: '2025-03-15',
				daysLeft: 75,
				match: '88%',
			},
		],
		[]
	)

	// Get current tab data
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				return {
					data: wishlistPrograms,
					totalItems: wishlistPrograms.length,
				}
			case 'scholarships':
				return {
					data: wishlistScholarships,
					totalItems: wishlistScholarships.length,
				}
			case 'research':
				return {
					data: wishlistResearchLabs,
					totalItems: wishlistResearchLabs.length,
				}
			default:
				return {
					data: wishlistPrograms,
					totalItems: wishlistPrograms.length,
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
							onTabChange={setActiveTab}
						/>

						{/* Search and Sort Controls */}
						<div className="flex gap-4 items-center">
							<div className="flex items-center w-80">
								<div className="relative flex-1">
									<input
										type="text"
										placeholder="Search..."
										className="w-full py-2 pl-4 pr-10 text-sm border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
									/>
									<button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-teal-500">
										<Search className="w-4 h-4" />
									</button>
								</div>
							</div>
							<SortDropdown value={sortBy} onChange={setSortBy} />
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
				{renderTabContent()}
			</div>
		</div>
	)
}
