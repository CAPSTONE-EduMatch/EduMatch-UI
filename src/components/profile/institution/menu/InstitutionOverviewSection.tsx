'use client'

import React from 'react'

interface InstitutionOverviewSectionProps {
	profile: any
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const InstitutionOverviewSection: React.FC<
	InstitutionOverviewSectionProps
> = ({ profile, onNavigationAttempt }) => {
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Institution Overview
				</h2>
				<p className="text-gray-600">
					Overview content for {profile?.institutionName || 'Institution'}
				</p>
				{/* Add your overview content here */}
			</div>
		</div>
	)
}
