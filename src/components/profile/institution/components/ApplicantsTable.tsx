'use client'

import React from 'react'

export interface Applicant {
	id: string
	postId: string
	name: string
	appliedDate: string
	degreeLevel: string
	subDiscipline: string
	status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'new_request'
	matchingScore: number
	userId?: string // User ID for thread matching
	gpa?: number | string // GPA for suggested applicants
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

	const gridCols = hidePostId ? 'grid-cols-7' : 'grid-cols-8'

	return (
		<div className="overflow-x-auto">
			<div className="w-full min-w-full">
				<div
					className={`bg-[#126E64] text-white grid ${gridCols} px-8 py-5 text-center font-bold text-base`}
				>
					{!hidePostId && <div className="text-left">Post ID</div>}
					<div className="text-left">Name</div>
					<div>Applied Date</div>
					<div>Degree Level</div>
					<div>Sub-discipline</div>
					<div>Status</div>
					<div>Matching Score</div>
					<div className="pl-8">Actions</div>
				</div>

				<div className="divide-y divide-gray-100">
					{applicants.map((applicant, index) => {
						const isEven = index % 2 === 0
						const rowBg = isEven ? 'bg-[#EAEDF3]' : 'bg-white'

						return (
							<div
								key={applicant.id}
								className={`${rowBg} grid ${gridCols} px-8 py-5 items-center`}
							>
								{/* Post ID */}
								{!hidePostId && (
									<div className="text-left">
										<button
											onClick={() => {
												// TODO: Navigate to post details
											}}
											className="text-[#126E64] hover:text-[#126E64] text-sm underline hover:no-underline transition-all duration-200 font-medium"
										>
											{applicant.postId}
										</button>
									</div>
								)}

								{/* Name */}
								<div className="font-semibold text-base text-black text-left group relative">
									<div className="truncate">{applicant.name}</div>
									{applicant.name.length > 20 && (
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
								<div className="text-gray-700 text-sm text-center">
									{applicant.degreeLevel}
								</div>

								{/* Sub-discipline */}
								<div className="text-gray-700 text-sm text-center">
									<div className="break-words whitespace-normal">
										{applicant.subDiscipline}
									</div>
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
								<div className="flex justify-center gap-2.5 pl-8">
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
