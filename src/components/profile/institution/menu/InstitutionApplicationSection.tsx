'use client'

import React, { useState, useMemo } from 'react'
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
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortBy, setSortBy] = useState<string>('newest')
	const [currentPage, setCurrentPage] = useState(1)
	const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
		null
	)
	const itemsPerPage = 10

	// Mock data - replace with actual API calls
	const applicants: Applicant[] = [
		{
			id: '1',
			name: 'Adam Smith',
			appliedDate: '01/01/2022',
			degreeLevel: 'Bachelor',
			subDiscipline: 'Information System',
			status: 'submitted',
			matchingScore: 70,
		},
		{
			id: '2',
			name: 'John Doe',
			appliedDate: '02/01/2022',
			degreeLevel: 'Master',
			subDiscipline: 'Computer Science',
			status: 'accepted',
			matchingScore: 85,
		},
		{
			id: '3',
			name: 'Jane Wilson',
			appliedDate: '03/01/2022',
			degreeLevel: 'PhD',
			subDiscipline: 'Data Science',
			status: 'under_review',
			matchingScore: 92,
		},
		{
			id: '4',
			name: 'Mike Johnson',
			appliedDate: '04/01/2022',
			degreeLevel: 'Bachelor',
			subDiscipline: 'Software Engineering',
			status: 'rejected',
			matchingScore: 45,
		},
		{
			id: '5',
			name: 'Sarah Brown',
			appliedDate: '05/01/2022',
			degreeLevel: 'Master',
			subDiscipline: 'Artificial Intelligence',
			status: 'new_request',
			matchingScore: 78,
		},
	]

	// Calculate statistics
	const stats = useMemo(() => {
		const total = applicants.length
		const approved = applicants.filter(
			(app) => app.status === 'accepted'
		).length
		const rejected = applicants.filter(
			(app) => app.status === 'rejected'
		).length
		return { total, approved, rejected }
	}, [applicants])

	// Filter and search applicants
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
		if (statusFilter !== 'all') {
			filtered = filtered.filter((app) => app.status === statusFilter)
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

	// Show list view by default
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm p-6 w-full py-8 border">
				{/* Page Title */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					{profile?.institutionName || 'Institution'}&apos;s name
				</h1>

				{/* Statistics Cards */}
				<StatisticsCards
					total={stats.total}
					approved={stats.approved}
					rejected={stats.rejected}
				/>

				{/* Applicants Section */}
				<div>
					<div className="border-b border-gray-200 pb-4 mb-6">
						<h2 className="text-xl font-bold text-gray-900">Applicants</h2>
					</div>

					{/* Search and Filter Bar */}
					<SearchAndFilter
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
						sortBy={sortBy}
						onSortChange={setSortBy}
					/>

					{/* Applicants Table */}
					<ApplicantsTable
						applicants={paginatedApplicants}
						onMoreDetail={handleMoreDetail}
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
