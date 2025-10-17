'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui'
import { SortDropdown } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { TabSelector } from '@/components/ui'
// Removed unused tab components since we're using custom application cards
import {
	BookOpen,
	Clock,
	Users,
	X,
	Globe,
	DollarSign,
	Search,
} from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'
import Image from 'next/image'

// Extended interfaces for applications with status
interface ApplicationProgram extends Program {
	status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'cancelled'
}

interface ApplicationScholarship extends Scholarship {
	status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'cancelled'
}

interface ApplicationResearchLab extends ResearchLab {
	status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'cancelled'
}

interface ApplicationSectionProps {
	profile: any
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: 'Programmes' },
		{ id: 'scholarships', label: 'Scholarships' },
		{ id: 'research', label: 'Research Labs' },
	]

	// Application status filter options
	const filterOptions = [
		{ id: 'submitted', label: 'Submitted', icon: BookOpen },
		{ id: 'under-review', label: 'Under Review', icon: Clock },
		{ id: 'accepted', label: 'Accepted', icon: Users },
		{ id: 'rejected', label: 'Rejected', icon: X },
		{ id: 'cancelled', label: 'Cancelled', icon: DollarSign },
	]

	// Mock data for applications - replace with actual API calls
	const applicationPrograms: ApplicationProgram[] = useMemo(
		() => [
			{
				id: 'program_1',
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
				status: 'submitted',
			},
			{
				id: 'program_2',
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
				status: 'under-review',
			},
		],
		[]
	)

	const applicationScholarships: ApplicationScholarship[] = useMemo(
		() => [
			{
				id: 'scholarship_1',
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
				status: 'accepted',
			},
		],
		[]
	)

	const applicationResearchLabs: ApplicationResearchLab[] = useMemo(
		() => [
			{
				id: 'research_1',
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
				status: 'rejected',
			},
		],
		[]
	)

	// Get current tab data
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				return {
					data: applicationPrograms,
					totalItems: applicationPrograms.length,
				}
			case 'scholarships':
				return {
					data: applicationScholarships,
					totalItems: applicationScholarships.length,
				}
			case 'research':
				return {
					data: applicationResearchLabs,
					totalItems: applicationResearchLabs.length,
				}
			default:
				return {
					data: applicationPrograms,
					totalItems: applicationPrograms.length,
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

	// Get status color and label
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'text-blue-600 bg-blue-100'
			case 'under-review':
				return 'text-orange-600 bg-orange-100'
			case 'accepted':
				return 'text-green-600 bg-green-100'
			case 'rejected':
				return 'text-red-600 bg-red-100'
			case 'cancelled':
				return 'text-gray-600 bg-gray-100'
			default:
				return 'text-gray-600 bg-gray-100'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'Submitted'
			case 'under-review':
				return 'Under Review'
			case 'accepted':
				return 'Accepted'
			case 'rejected':
				return 'Rejected'
			case 'cancelled':
				return 'Cancelled'
			default:
				return status
		}
	}

	// Render application cards with status
	const renderApplicationCards = (items: any[]) => {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex flex-col h-full bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
					>
						{/* Header with logo */}
						<div className="flex justify-between items-start mb-4 gap-4">
							<div className="flex-1">
								<Image
									src={item.logo}
									alt={item.university || item.provider}
									width={120}
									height={40}
									className="rounded-lg object-contain"
								/>
							</div>
						</div>

						{/* Title */}
						<h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
							{item.title}
						</h3>

						{/* Description */}
						<p className="text-gray-500 mb-6 line-clamp-3 text-sm leading-relaxed flex-shrink-0">
							{item.description}
						</p>

						{/* Tags */}
						<div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
							<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
								<BookOpen className="w-4 h-4" />
								{item.field}
							</span>
							<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
								<Globe className="w-4 h-4" />
								{item.country}
							</span>
						</div>

						{/* Date */}
						<div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
							<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
								<Clock className="w-4 h-4" />
								{item.date}{' '}
								<span className="text-red-500 font-semibold">
									({item.daysLeft} days left)
								</span>
							</span>
						</div>

						{/* Price/Amount */}
						<div className="text-center mb-6 flex-grow flex items-end justify-center min-h-[60px]">
							<div className="text-2xl font-bold text-gray-900">
								{item.price || item.amount}
							</div>
						</div>

						{/* Status at bottom */}
						<div className="mt-auto">
							<div className="text-sm text-gray-600 mb-2">
								Application Status:
							</div>
							<span
								className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
									item.status
								)}`}
							>
								{getStatusLabel(item.status)}
							</span>
						</div>
					</div>
				))}
			</div>
		)
	}

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return renderApplicationCards(applicationPrograms)
			case 'scholarships':
				return renderApplicationCards(applicationScholarships)
			case 'research':
				return renderApplicationCards(applicationResearchLabs)
			default:
				return renderApplicationCards(applicationPrograms)
		}
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
				{renderTabContent()}
			</div>
		</div>
	)
}
