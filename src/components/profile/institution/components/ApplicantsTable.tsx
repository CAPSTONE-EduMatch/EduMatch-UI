'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ShortIdWithCopy } from '@/components/ui/ShortIdWithCopy'

export interface Applicant {
	id: string
	postId: string
	name: string
	appliedDate: string
	degreeLevel: string
	subDiscipline: string
	status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'new_request'
	matchingScore: number
	userId: string // User ID for thread matching
	gpa?: number | string // GPA for suggested applicants
	postType?: 'Program' | 'Scholarship' | 'Research Lab' // Post type for navigation
}

interface ApplicantsTableProps {
	applicants: Applicant[]
	onMoreDetail: (applicant: Applicant) => void
	hidePostId?: boolean // Hide Post ID column for detail pages
}

export const ApplicantsTable: React.FC<ApplicantsTableProps> = ({
	applicants,
	onMoreDetail,
	hidePostId = false,
}) => {
	const router = useRouter()

	const handlePostIdClick = (postId: string, postType?: string) => {
		// Navigate to the appropriate detail page based on post type
		if (postType === 'Program') {
			router.push(`/institution/dashboard/programmes/${postId}`)
		} else if (postType === 'Scholarship') {
			router.push(`/institution/dashboard/scholarships/${postId}`)
		} else if (postType === 'Research Lab') {
			router.push(`/institution/dashboard/reseach-labs/${postId}`)
		} else {
			// Default to program if type is not specified
			router.push(`/institution/dashboard/programmes/${postId}`)
		}
	}
	const getStatusColor = (status: string) => {
		// Normalize status to lowercase for comparison
		const normalizedStatus = status.toLowerCase()
		switch (normalizedStatus) {
			case 'submitted':
				return 'bg-blue-100 text-blue-800'
			case 'require_update':
			case 'under_review':
				return 'bg-cyan-100 text-cyan-800'
			case 'accepted':
				return 'bg-green-100 text-green-800'
			case 'rejected':
				return 'bg-red-100 text-red-800'
			case 'updated':
			case 'new_request':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusLabel = (status: string) => {
		// Normalize status to lowercase for comparison
		const normalizedStatus = status.toLowerCase()
		switch (normalizedStatus) {
			case 'submitted':
				return 'Submitted'
			case 'require_update':
				return 'Require Update'
			case 'under_review':
				return 'Under review'
			case 'accepted':
				return 'Accepted'
			case 'rejected':
				return 'Reject'
			case 'updated':
				return 'Updated'
			case 'new_request':
				return 'New request'
			default:
				return status
		}
	}

	const getScoreColor = (score: number) => {
		if (score >= 80) return 'bg-green-500'
		if (score >= 60) return 'bg-yellow-500'
		if (score >= 40) return 'bg-orange-500'
		return 'bg-red-500'
	}

	// Use custom grid template columns for better space distribution
	const gridCols = hidePostId
		? 'grid-cols-[minmax(140px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)_80px]'
		: 'grid-cols-[180px_140px_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(140px,1fr)_80px]'

	return (
		<div className="overflow-x-auto">
			<div className="w-full min-w-full">
				<div
					className={`bg-[#126E64] text-white grid ${gridCols} px-4 py-5 text-center font-bold text-base gap-2`}
				>
					{!hidePostId && <div className="text-left">Post ID</div>}
					<div className="text-left">Application ID</div>
					<div className="text-left">Name</div>
					<div>Applied Date</div>
					<div>Degree Level</div>
					<div>Sub-discipline</div>
					<div>Status</div>
					<div>Matching Score</div>
					<div>Actions</div>
				</div>

				<div className="divide-y divide-gray-100">
					{applicants.map((applicant, index) => {
						const isEven = index % 2 === 0
						const rowBg = isEven ? 'bg-[#EAEDF3]' : 'bg-white'

						return (
							<div
								key={applicant.id}
								className={`${rowBg} grid ${gridCols} px-4 py-5 items-center gap-2`}
							>
								{/* Post ID */}
								{!hidePostId && (
									<div className="text-left">
										<ShortIdWithCopy
											id={applicant.postId}
											clickable={true}
											onIdClick={() =>
												handlePostIdClick(applicant.postId, applicant.postType)
											}
										/>
									</div>
								)}

								{/* Application ID */}
								<div className="text-left">
									<ShortIdWithCopy id={applicant.id} />
								</div>

								{/* Name */}
								<div className="font-semibold text-base text-black text-left group relative">
									<div className="truncate" title={applicant.name}>
										{applicant.name}
									</div>
									{applicant.name.length > 15 && (
										<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
											{applicant.name}
										</div>
									)}
								</div>

								{/* Applied Date */}
								<div className="text-gray-700 text-sm text-center">
									{applicant.appliedDate}
								</div>

								{/* Degree Level */}
								<div
									className="text-gray-700 text-sm text-center truncate"
									title={applicant.degreeLevel}
								>
									{applicant.degreeLevel}
								</div>

								{/* Sub-discipline */}
								<div className="text-gray-700 text-sm text-center group relative">
									<div className="truncate" title={applicant.subDiscipline}>
										{applicant.subDiscipline}
									</div>
									{applicant.subDiscipline.length > 20 && (
										<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap max-w-xs">
											{applicant.subDiscipline}
										</div>
									)}
								</div>

								{/* Status */}
								<div className="text-center">
									<span
										className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${getStatusColor(applicant.status)}`}
									>
										{getStatusLabel(applicant.status)}
									</span>
								</div>

								{/* Matching Score */}
								<div className="text-center">
									<div className="flex items-center space-x-3">
										<div className="flex-1">
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`${getScoreColor(applicant.matchingScore)} h-2 rounded-full transition-all duration-300`}
													style={{ width: `${applicant.matchingScore}%` }}
												></div>
											</div>
										</div>
										<span className="text-sm font-medium text-gray-900 min-w-[3rem]">
											{applicant.matchingScore}%
										</span>
									</div>
								</div>

								{/* Actions */}
								<div className="flex justify-center">
									<button
										onClick={() => onMoreDetail(applicant)}
										className="text-[#126E64] hover:text-[#126E64] text-xs underline hover:no-underline transition-all duration-200"
									>
										<span>More detail</span>
									</button>
								</div>
							</div>
						)
					})}
				</div>

				{applicants.length === 0 && (
					<div className="text-center py-12 text-gray-500">
						No applicants found matching your criteria.
					</div>
				)}
			</div>
		</div>
	)
}
