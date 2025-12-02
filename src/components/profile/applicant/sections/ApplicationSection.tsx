'use client'

import { ProgramsTab } from '@/components/explore-tab/ProgramsTab'
import { ResearchLabsTab } from '@/components/explore-tab/ResearchLabsTab'
import { ScholarshipsTab } from '@/components/explore-tab/ScholarshipsTab'
import type { SortOption } from '@/components/ui'
import { Button, SortDropdown, TabSelector } from '@/components/ui'
import { useApplications } from '@/hooks/application/useApplications'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { ApplicationStatus } from '@/types/api/application-api'
import { Program, ResearchLab, Scholarship } from '@/types/api/explore-api'
import { BookOpen, Clock, Search, Users, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { ApplicationUpdateResponseModal } from './ApplicationUpdateResponseModal'

interface ApplicationSectionProps {
	profile: any
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = () => {
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [activeTab, setActiveTab] = useState<string>('programmes')
	const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState<string>('')

	// Get application IDs only
	const { applications, loading: applicationsLoading } = useApplications({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 1000,
			status:
				selectedFilters.size > 0
					? (Array.from(selectedFilters)[0] as ApplicationStatus)
					: undefined,
		},
	})

	// Explore data state with application status, ID, and institution status
	const [programs, setPrograms] = useState<
		(Program & {
			applicationStatus?: ApplicationStatus
			applicationId?: string
			institutionStatus?: {
				isActive: boolean
			}
		})[]
	>([])
	const [scholarships, setScholarships] = useState<
		(Scholarship & {
			applicationStatus?: ApplicationStatus
			applicationId?: string
			institutionStatus?: {
				isActive: boolean
			}
		})[]
	>([])
	const [researchLabs, setResearchLabs] = useState<
		(ResearchLab & {
			applicationStatus?: ApplicationStatus
			applicationId?: string
			institutionStatus?: {
				isActive: boolean
			}
		})[]
	>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedApplicationForUpdate, setSelectedApplicationForUpdate] =
		useState<string | null>(null)
	const [showUpdateModal, setShowUpdateModal] = useState(false)

	// Fetch and transform application data
	const fetchApplicationData = useCallback(async () => {
		// Don't fetch if still loading applications
		if (applicationsLoading) {
			return
		}

		// If no applications, clear data but don't show loading
		if (applications.length === 0) {
			setPrograms([])
			setScholarships([])
			setResearchLabs([])
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)

		try {
			// Transform application data directly to explore format
			const programsData: (Program & {
				applicationStatus?: ApplicationStatus
				applicationId?: string
				institutionStatus?: {
					isActive: boolean
				}
			})[] = []
			const scholarshipsData: (Scholarship & {
				applicationStatus?: ApplicationStatus
				applicationId?: string
				institutionStatus?: {
					isActive: boolean
				}
			})[] = []
			const researchLabsData: (ResearchLab & {
				applicationStatus?: ApplicationStatus
				applicationId?: string
				institutionStatus?: {
					isActive: boolean
				}
			})[] = []

			applications.forEach((app) => {
				// Convert institution status enum to isActive boolean
				// APPROVED = active (true), PENDING/REJECTED = not active (false)
				// The API returns verification_status as 'status' field
				// Pass both status and isActive so cards can show detailed badges
				const institutionStatus = {
					status: app.post.institution.status, // Pass raw status for detailed badges
					isActive:
						app.post.institution.status === 'APPROVED' ||
						app.post.institution.status === true ||
						app.post.institution.status === 'ACTIVE', // Legacy support
				}

				// Convert application post to explore format based on post type
				if (app.post.program) {
					// Program application
					const program: Program = {
						id: app.post.id,
						title: app.post.title,
						description: app.post.otherInfo || 'No description available',
						university: app.post.institution.name,
						logo: app.post.institution.logo || '',
						field: 'Academic Program', // Default field
						country: app.post.institution.country || '',
						price: app.post.program.tuition_fee
							? `$${app.post.program.tuition_fee}`
							: 'Not specified',
						funding: 'Available', // Default
						attendance: app.post.program.attendance,
						date: app.post.endDate || app.post.startDate,
						daysLeft: Math.max(
							0,
							Math.ceil(
								(new Date(app.post.endDate || app.post.startDate).getTime() -
									new Date().getTime()) /
									(1000 * 60 * 60 * 24)
							)
						),
						match: '85%', // Default match
						applicationCount: 0, // Not available in application data
					}

					programsData.push({
						...program,
						applicationStatus: app.status,
						applicationId: app.applicationId,
						institutionStatus,
					})
				} else if (app.post.scholarship) {
					// Scholarship application
					const scholarship: Scholarship = {
						id: app.post.id,
						title: app.post.title,
						description: app.post.scholarship.description,
						provider: app.post.institution.name,
						university: app.post.institution.name,
						essayRequired: app.post.scholarship.essay_required ? 'Yes' : 'No',
						country: app.post.institution.country || '',
						amount: app.post.scholarship.grant || 'Not specified',
						date: app.post.endDate || app.post.startDate,
						daysLeft: Math.max(
							0,
							Math.ceil(
								(new Date(app.post.endDate || app.post.startDate).getTime() -
									new Date().getTime()) /
									(1000 * 60 * 60 * 24)
							)
						),
						match: '85%', // Default match
						applicationCount: 0, // Not available in application data
					}

					scholarshipsData.push({
						...scholarship,
						applicationStatus: app.status,
						applicationId: app.applicationId,
						institutionStatus,
					})
				} else if (app.post.job) {
					// Research lab/job application
					const researchLab: ResearchLab = {
						id: app.post.id,
						title: app.post.title,
						description: app.post.otherInfo || 'No description available',
						professor: 'Prof. Researcher', // Default
						field: 'Research', // Default field
						country: app.post.institution.country || '',
						position: app.post.job.job_type,
						institution: app.post.institution.name,
						date: app.post.endDate || app.post.startDate,
						daysLeft: Math.max(
							0,
							Math.ceil(
								(new Date(app.post.endDate || app.post.startDate).getTime() -
									new Date().getTime()) /
									(1000 * 60 * 60 * 24)
							)
						),
						match: '85%', // Default match
						applicationCount: 0, // Not available in application data
					}

					researchLabsData.push({
						...researchLab,
						applicationStatus: app.status,
						applicationId: app.applicationId,
						institutionStatus,
					})
				}
			})

			setPrograms(programsData)
			setScholarships(scholarshipsData)
			setResearchLabs(researchLabsData)
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error processing application data:', err)
			setError('Failed to process application data')
		} finally {
			setLoading(false)
		}
	}, [applications, applicationsLoading])

	// Fetch data when applications or sort changes
	React.useEffect(() => {
		fetchApplicationData()
	}, [fetchApplicationData])

	// Main category tabs
	const categories = [
		{ id: 'programmes', label: 'Programmes' },
		{ id: 'scholarships', label: 'Scholarships' },
		{ id: 'research', label: 'Research Labs' },
	]

	// Application status filter options
	const applicationStatusFilters = [
		{ id: 'SUBMITTED', label: 'Submitted', icon: BookOpen },
		{ id: 'REQUIRE_UPDATE', label: 'Update Required', icon: Clock },
		{ id: 'ACCEPTED', label: 'Accepted', icon: Users },
		{ id: 'REJECTED', label: 'Rejected', icon: X },
	]

	// Institution status filter options - removed Account Deactivated filter
	const institutionStatusFilters: never[] = []

	// All filter options combined
	const filterOptions = [
		...applicationStatusFilters,
		...institutionStatusFilters,
	]

	// Application functionality for cards - currently not used but may be needed in future
	// const { cancelApplication } = useApplications()

	// Wishlist functionality for cards
	const { isInWishlist, toggleWishlistItem } = useWishlist()

	// Filter function for applications
	const filterApplications = <
		T extends {
			title?: string
			description?: string
			university?: string
			provider?: string
			institution?: string
			applicationStatus?: ApplicationStatus
			institutionStatus?: {
				isActive: boolean
			}
		},
	>(
		items: T[]
	): T[] => {
		let filteredItems = items

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filteredItems = filteredItems.filter((item) => {
				const searchableText = [
					item.title || '',
					item.description || '',
					item.university || '',
					item.provider || '',
					item.institution || '',
				]
					.join(' ')
					.toLowerCase()

				return searchableText.includes(query)
			})
		}

		// Status filters
		if (selectedFilters.size === 0) {
			return filteredItems
		}

		return filteredItems.filter((item) => {
			// Check application status filters
			const applicationStatusFilters = [
				'SUBMITTED',
				'REQUIRE_UPDATE',
				'ACCEPTED',
				'REJECTED',
			]
			const selectedAppStatuses = Array.from(selectedFilters).filter((f) =>
				applicationStatusFilters.includes(f)
			)

			let matchesAppStatus = true

			// Filter by application status
			if (selectedAppStatuses.length > 0) {
				matchesAppStatus = selectedAppStatuses.includes(
					item.applicationStatus || ''
				)
			}

			return matchesAppStatus
		})
	}

	// Get current tab data with filtering
	const getCurrentTabData = () => {
		switch (activeTab) {
			case 'programmes':
				const filteredPrograms = filterApplications(programs)
				return {
					data: filteredPrograms,
					totalItems: filteredPrograms.length,
				}
			case 'scholarships':
				const filteredScholarships = filterApplications(scholarships)
				return {
					data: filteredScholarships,
					totalItems: filteredScholarships.length,
				}
			case 'research':
				const filteredResearchLabs = filterApplications(researchLabs)
				return {
					data: filteredResearchLabs,
					totalItems: filteredResearchLabs.length,
				}
			default:
				const defaultFilteredPrograms = filterApplications(programs)
				return {
					data: defaultFilteredPrograms,
					totalItems: defaultFilteredPrograms.length,
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

	// Handle update request click
	const handleUpdateRequest = useCallback((applicationId: string) => {
		setSelectedApplicationForUpdate(applicationId)
		setShowUpdateModal(true)
	}, [])

	// Handle modal close
	const handleCloseModal = useCallback(() => {
		setShowUpdateModal(false)
		setSelectedApplicationForUpdate(null)
	}, [])

	// Handle successful update submission
	const handleUpdateSuccess = useCallback(async () => {
		// Refresh applications to get updated status
		await fetchApplicationData()
		handleCloseModal()
	}, [fetchApplicationData, handleCloseModal])
	// Render tab content based on active tab
	const renderTabContent = () => {
		const currentData = getCurrentTabData()

		switch (activeTab) {
			case 'programmes':
				return (
					<div className="space-y-4">
						<ProgramsTab
							programs={currentData.data as typeof programs}
							sortBy={sortBy}
							isInWishlist={isInWishlist} // Check if each program is wishlisted
							onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
							hasApplied={() => true} // All items in applications are applied
							isApplying={() => false}
							onApply={() => {}} // No-op for applications
							onUpdateRequest={handleUpdateRequest} // Handle update requests
							fromApplicationSection={true} // Indicate we're coming from application section
						/>
					</div>
				)
			case 'scholarships':
				return (
					<div className="space-y-4">
						<ScholarshipsTab
							scholarships={currentData.data as typeof scholarships}
							isInWishlist={isInWishlist} // Check if each scholarship is wishlisted
							onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
							hasApplied={() => true} // All items in applications are applied
							isApplying={() => false}
							onApply={() => {}} // No-op for applications
							onUpdateRequest={handleUpdateRequest} // Handle update requests
							fromApplicationSection={true} // Indicate we're coming from application section
						/>
					</div>
				)
			case 'research':
				return (
					<div className="space-y-4">
						<ResearchLabsTab
							researchLabs={currentData.data as typeof researchLabs}
							isInWishlist={isInWishlist} // Check if each research lab is wishlisted
							onWishlistToggle={toggleWishlistItem} // Allow wishlist toggle
							hasApplied={() => true} // All items in applications are applied
							isApplying={() => false}
							onApply={() => {}} // No-op for applications
							onUpdateRequest={handleUpdateRequest} // Handle update requests
							fromApplicationSection={true} // Indicate we're coming from application section
						/>
					</div>
				)
			default:
				return (
					<div className="space-y-4">
						<ProgramsTab
							programs={currentData.data as typeof programs}
							sortBy={sortBy}
							isInWishlist={isInWishlist}
							onWishlistToggle={toggleWishlistItem}
							hasApplied={() => true}
							isApplying={() => false}
							onApply={() => {}}
							onUpdateRequest={handleUpdateRequest} // Handle update requests
							fromApplicationSection={true} // Indicate we're coming from application section
						/>
					</div>
				)
		}
	}

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
							onClick={fetchApplicationData}
							className="text-xs text-red-600 hover:text-red-800 underline"
						>
							Retry
						</button>
					</div>
				)}
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

					{/* Progress loading indicator */}
					{(applicationsLoading || loading) && (
						<div className="mb-4 h-1 bg-gray-100 overflow-hidden rounded-full">
							<div
								className="h-full bg-teal-600 animate-pulse"
								style={{ width: '30%' }}
							></div>
						</div>
					)}

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
				<div
					className={
						applicationsLoading || loading
							? 'opacity-60 pointer-events-none'
							: ''
					}
				>
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

				{/* Update Response Modal */}
				{selectedApplicationForUpdate && (
					<ApplicationUpdateResponseModal
						isOpen={showUpdateModal}
						onClose={handleCloseModal}
						applicationId={selectedApplicationForUpdate}
						onSuccess={handleUpdateSuccess}
					/>
				)}
			</div>
		</div>
	)
}
