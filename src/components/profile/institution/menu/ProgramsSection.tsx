'use client'

import React from 'react'

interface ProgramsSectionProps {
	profile: any
	onProfileUpdate?: () => Promise<void>
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
	profile,
	onProfileUpdate,
	onNavigationAttempt,
}) => {
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Programs</h2>
				<p className="text-gray-600">
					Programs offered by {profile?.institutionName || 'Institution'}
				</p>
				{/* Add your programs content here */}
			</div>
		</div>
	)
}
