'use client'

import React from 'react'

interface InstitutionInformationSectionProps {
	profile: any
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const InstitutionInformationSection: React.FC<
	InstitutionInformationSectionProps
> = ({ profile, onNavigationAttempt }) => {
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Institution Information
				</h2>
				<p className="text-gray-600">
					Detailed information about{' '}
					{profile?.institutionName || 'your institution'}
				</p>
				{/* Add your institution information content here */}
			</div>
		</div>
	)
}
