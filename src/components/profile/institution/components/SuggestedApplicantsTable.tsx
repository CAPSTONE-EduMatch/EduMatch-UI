'use client'

import React from 'react'
import type { Applicant } from './ApplicantsTable'

interface SuggestedApplicantsTableProps {
	applicants: Applicant[]
	onMoreDetail: (applicant: Applicant) => void
}

export const SuggestedApplicantsTable: React.FC<
	SuggestedApplicantsTableProps
> = ({ applicants, onMoreDetail }) => {
	const getScoreColor = (score: number) => {
		if (score >= 80) return 'bg-green-500'
		if (score >= 60) return 'bg-yellow-500'
		if (score >= 40) return 'bg-orange-500'
		return 'bg-red-500'
	}

	return (
		<div className="overflow-x-auto">
			<div className="w-full min-w-full">
				<div className="bg-[#126E64] text-white grid grid-cols-6 px-8 py-5 text-center font-bold text-base">
					<div className="text-left">Name</div>
					<div>Degree Level</div>
					<div>Sub-discipline</div>
					<div>GPA</div>
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
								className={`${rowBg} grid grid-cols-6 px-8 py-5 items-center`}
							>
								{/* Name */}
								<div className="font-semibold text-base text-black text-left group relative">
									<div className="truncate">{applicant.name}</div>
									{applicant.name.length > 20 && (
										<div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
											{applicant.name}
										</div>
									)}
								</div>

								{/* Degree Level */}
								<div className="text-gray-700 text-sm text-center">
									{applicant.degreeLevel}
								</div>

								{/* Sub-discipline */}
								<div className="text-gray-700 text-sm text-center group relative">
									<div className="truncate">{applicant.subDiscipline}</div>
									{applicant.subDiscipline.length > 15 && (
										<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap">
											{applicant.subDiscipline}
										</div>
									)}
								</div>

								{/* GPA */}
								<div className="text-gray-700 text-sm text-center">
									{applicant.gpa !== undefined && applicant.gpa !== null
										? typeof applicant.gpa === 'number'
											? applicant.gpa.toFixed(1)
											: applicant.gpa
										: 'N/A'}
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
						No suggested applicants found.
					</div>
				)}
			</div>
		</div>
	)
}
