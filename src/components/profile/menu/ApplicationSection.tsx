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
	Globe,
	DollarSign,
	Search,
	Loader2,
	AlertCircle,
} from 'lucide-react'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'
import { useApplications } from '@/hooks/useApplications'
import { Application, ApplicationStatus } from '@/types/application-api'
import Image from 'next/image'

interface ApplicationSectionProps {
	profile: any
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState<string>('')

	// Initialize applications hook with parameters
	const applicationParams = useMemo(
		() => ({
			page: 1,
			limit: 50,
			status:
				selectedFilters.size > 0
					? (Array.from(selectedFilters)[0] as ApplicationStatus)
					: undefined,
		}),
		[selectedFilters]
	)

	const { applications, loading, error, meta, refresh, cancelApplication } =
		useApplications({
			autoFetch: true,
			initialParams: applicationParams,
		})

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

	// Transform applications to the expected format for each tab
	const transformToPrograms = useCallback((apps: Application[]): Program[] => {
		return apps
			.filter((app) => app.post.program)
			.map((app) => ({
				id: app.postId,
				title: app.post.title,
				description: app.post.otherInfo || '',
				university: app.post.institution.name,
				logo: app.post.institution.logo || '',
				field: app.post.program?.degree_level || 'Unknown Field',
				country: app.post.institution.country || 'Unknown Country',
				date: app.post.startDate,
				daysLeft: Math.max(
					0,
					Math.ceil(
						(new Date(app.post.startDate).getTime() - Date.now()) /
							(1000 * 60 * 60 * 24)
					)
				),
				price: app.post.program?.tuition_fee
					? `${app.post.program.tuition_fee} USD / year`
					: 'Contact for details',
				match: '95%', // This would need to be calculated based on user profile
				funding: app.post.program?.scholarship_info
					? 'Available'
					: 'Not specified',
				attendance: app.post.program?.attendance || 'Contact for details',
			}))
	}, [])

	const transformToScholarships = useCallback(
		(apps: Application[]): Scholarship[] => {
			return apps
				.filter((app) => app.post.scholarship)
				.map((app) => ({
					id: app.postId,
					title: app.post.title,
					description: app.post.scholarship?.description || '',
					provider: app.post.institution.name,
					university: app.post.institution.name,
					essayRequired: app.post.scholarship?.essay_required ? 'Yes' : 'No',
					country: app.post.institution.country || 'Unknown Country',
					date: app.post.startDate,
					daysLeft: Math.max(
						0,
						Math.ceil(
							(new Date(app.post.startDate).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					),
					amount: app.post.scholarship?.grant || 'Contact for details',
					match: '90%', // This would need to be calculated based on user profile
				}))
		},
		[]
	)

	const transformToResearchLabs = useCallback(
		(apps: Application[]): ResearchLab[] => {
			return apps
				.filter((app) => app.post.job)
				.map((app) => ({
					id: app.postId,
					title: app.post.title,
					description: app.post.otherInfo || '',
					professor: 'Contact for details', // This would need to be added to the job model
					field: app.post.job?.job_type || 'Research',
					country: app.post.institution.country || 'Unknown Country',
					position: app.post.job?.job_type || 'Research Position',
					date: app.post.startDate,
					daysLeft: Math.max(
						0,
						Math.ceil(
							(new Date(app.post.startDate).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					),
					match: '88%', // This would need to be calculated based on user profile
				}))
		},
		[]
	)

	// Get transformed data for current tab
	const applicationPrograms = useMemo(
		() => transformToPrograms(applications),
		[applications, transformToPrograms]
	)
	const applicationScholarships = useMemo(
		() => transformToScholarships(applications),
		[applications, transformToScholarships]
	)
	const applicationResearchLabs = useMemo(
		() => transformToResearchLabs(applications),
		[applications, transformToResearchLabs]
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

	// Handle card click to navigate to post details
	const handleCardClick = useCallback((postId: string) => {
		// Navigate to the explore page with the specific post
		window.location.href = `/explore/programmes/postId=${postId}`
	}, [])

	// Get status color and label
	const getStatusColor = (status: ApplicationStatus) => {
		switch (status) {
			case 'PENDING':
				return 'text-blue-600 bg-blue-100'
			case 'REVIEWED':
				return 'text-orange-600 bg-orange-100'
			case 'ACCEPTED':
				return 'text-green-600 bg-green-100'
			case 'REJECTED':
				return 'text-red-600 bg-red-100'
			default:
				return 'text-gray-600 bg-gray-100'
		}
	}

	const getStatusLabel = (status: ApplicationStatus) => {
		switch (status) {
			case 'PENDING':
				return 'Pending'
			case 'REVIEWED':
				return 'Under Review'
			case 'ACCEPTED':
				return 'Accepted'
			case 'REJECTED':
				return 'Rejected'
			default:
				return status
		}
	}

	// Render application cards with status
	const renderApplicationCards = (
		items: any[],
		applications: Application[]
	) => {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{items.map((item) => {
					// Find the corresponding application for status
					const application = applications.find((app) => app.postId === item.id)
					const status = application?.status || 'PENDING'

					return (
						<div
							key={item.id}
							className="flex flex-col h-full bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
							onClick={() => handleCardClick(item.id)}
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
								<div className="flex items-center justify-between">
									<span
										className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
											status
										)}`}
									>
										{getStatusLabel(status)}
									</span>
									{status === 'PENDING' && (
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation()
												handleCancelApplication(
													application?.applicationId || ''
												)
											}}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											Cancel
										</Button>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'programmes':
				return renderApplicationCards(applicationPrograms, applications)
			case 'scholarships':
				return renderApplicationCards(applicationScholarships, applications)
			case 'research':
				return renderApplicationCards(applicationResearchLabs, applications)
			default:
				return renderApplicationCards(applicationPrograms, applications)
		}
	}

	// Show loading state
	if (loading) {
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
