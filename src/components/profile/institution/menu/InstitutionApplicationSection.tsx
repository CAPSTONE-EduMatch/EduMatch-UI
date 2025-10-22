'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
	StatisticsCards,
	SearchAndFilter,
	ApplicantsTable,
	Pagination,
	ApplicantDetailView,
	type Applicant,
} from './components'

interface InstitutionApplicationSectionProps {
	profile: any
}

export const InstitutionApplicationSection: React.FC<
	InstitutionApplicationSectionProps
> = ({ profile }) => {
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
		null
	)
	const [applicants, setApplicants] = useState<Applicant[]>([])
	const [stats, setStats] = useState({
		total: 0,
		approved: 0,
		rejected: 0,
		pending: 0,
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const itemsPerPage = 10

	// Fetch applications from API
	const fetchApplications = async () => {
		setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams({
				search: searchQuery,
				status: statusFilter.join(','),
				sortBy: sortBy,
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
			})

			const response = await fetch(`/api/applications/institution?${params}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch applications')
			}

			const result = await response.json()

			if (result.success) {
				setApplicants(result.data)
				setStats(result.stats)
			} else {
				throw new Error(result.error || 'Failed to fetch applications')
			}
		} catch (err) {
			console.error('Error fetching applications:', err)
			setError(
				err instanceof Error ? err.message : 'Failed to fetch applications'
			)
		} finally {
			setLoading(false)
		}
	}

	// Fetch applications when component mounts or filters change
	useEffect(() => {
		fetchApplications()
	}, [searchQuery, statusFilter, sortBy, currentPage])

	// Filter and search applicants (client-side for immediate feedback)
	const filteredApplicants = useMemo(() => {
		let filtered = applicants

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(app) =>
					app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					app.subDiscipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
					app.degreeLevel.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		// Status filter
		if (statusFilter.length > 0) {
			filtered = filtered.filter((app) => statusFilter.includes(app.status))
		}

		return filtered
	}, [applicants, searchQuery, statusFilter])

	// Pagination
	const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedApplicants = filteredApplicants.slice(
		startIndex,
		startIndex + itemsPerPage
	)

	// Event handlers
	const handleStatusFilterChange = (filter: string[]) => {
		setStatusFilter(filter)
		setCurrentPage(1)
	}

	const handleMoreDetail = (applicant: Applicant) => {
		setSelectedApplicant(applicant)
	}

	const handleBackToList = () => {
		setSelectedApplicant(null)
	}

	const handleContact = (applicant: Applicant) => {
		console.log('Contact applicant:', applicant.name)
		// TODO: Implement contact functionality
	}

	const handleApprove = (applicant: Applicant) => {
		console.log('Approve applicant:', applicant.name)
		// TODO: Implement approval functionality
	}

	const handleReject = (applicant: Applicant) => {
		console.log('Reject applicant:', applicant.name)
		// TODO: Implement rejection functionality
	}

	const handleRequireUpdate = (applicant: Applicant) => {
		console.log('Require update for applicant:', applicant.name)
		// TODO: Implement require update functionality
	}

	const handleStatusChange = (applicantId: string, newStatus: string) => {
		console.log(
			'Status change for applicant:',
			applicantId,
			'to status:',
			newStatus
		)
		// TODO: Implement status update functionality
		// This would typically update the applicant's status in the database
	}

	// Show detail view if an applicant is selected
	if (selectedApplicant) {
		return (
			<ApplicantDetailView
				applicant={selectedApplicant}
				onBack={handleBackToList}
				onContact={handleContact}
				onApprove={handleApprove}
				onReject={handleReject}
				onRequireUpdate={handleRequireUpdate}
			/>
		)
	}

	// Show loading state
	if (loading) {
		return (
			<div className="space-y-6">
				<div className="rounded-xl p-6 w-full py-8">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
							<p className="mt-4 text-muted-foreground">
								Loading applications...
							</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="space-y-6">
				<div className="rounded-xl p-6 w-full py-8">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="text-red-500 text-6xl mb-4">⚠️</div>
							<h2 className="text-xl font-semibold mb-2">Error</h2>
							<p className="text-muted-foreground mb-4">{error}</p>
							<button
								onClick={fetchApplications}
								className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
							>
								Try Again
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Show list view by default
	return (
		<div className="space-y-6">
			<div className="rounded-xl p-6 w-full py-8">
				{/* Page Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{profile?.institutionName || 'Institution'}&apos;s Applications
				</h1>

				{/* Statistics Cards */}
				<StatisticsCards
					total={stats.total}
					approved={stats.approved}
					rejected={stats.rejected}
				/>

				{/* Applicants Section */}
				<div className="border bg-white border-gray-200 rounded-xl p-6">
					{/* Search and Filter Bar */}
					<SearchAndFilter
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						statusFilter={statusFilter}
						onStatusFilterChange={handleStatusFilterChange}
						sortBy={sortBy}
						onSortChange={setSortBy}
					/>

					{/* Applicants Table */}
					<ApplicantsTable
						applicants={paginatedApplicants}
						onMoreDetail={handleMoreDetail}
						onStatusChange={handleStatusChange}
					/>

					{/* Pagination */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						itemsPerPage={itemsPerPage}
						totalItems={filteredApplicants.length}
						onPageChange={setCurrentPage}
					/>
				</div>
			</div>
		</div>
	)
}
