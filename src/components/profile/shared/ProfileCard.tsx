'use client'

import React from 'react'

interface ProfileCardProps {
	header: {
		avatar?: React.ReactNode
		title: string
		subtitle?: string
	}
	sections: React.ReactNode[]
	actions?: React.ReactNode
	className?: string
	status?: string
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

export const ProfileCard: React.FC<ProfileCardProps> = ({
	header,
	sections,
	actions,
	className = '',
	status,
}) => {
	return (
		<div
			className={`bg-white shadow-sm border lg:col-span-1 min-h-[400px] max-h-[150vh] w-1/3 ${className}`}
		>
			<div className="p-6 flex flex-col relative">
				{/* Status Badge - Top Right Corner */}
				{status && (
					<div className="absolute top-6 right-6">
						<span
							className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${getStatusColor(status)}`}
						>
							{getStatusLabel(status)}
						</span>
					</div>
				)}

				<div className="space-y-6 flex-1">
					{/* Header Section */}
					<div className="flex items-center gap-4 flex-shrink-0">
						{header.avatar && <div className="relative">{header.avatar}</div>}
						<div className="flex-1">
							<h2 className="text-lg font-bold text-gray-900">
								{header.title}
							</h2>
							{header.subtitle && (
								<p className="text-sm text-gray-600">{header.subtitle}</p>
							)}
						</div>
					</div>

					{/* Sections - Auto height */}
					<div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
						{sections.map((section, index) => (
							<div key={index}>{section}</div>
						))}
					</div>

					{/* Actions */}
					{actions && (
						<div className="flex justify-end pt-4 flex-shrink-0">{actions}</div>
					)}
				</div>
			</div>
		</div>
	)
}
