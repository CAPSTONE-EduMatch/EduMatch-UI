'use client'

import React from 'react'

interface InstitutionSettingsSectionProps {
	profile: any
}

export const InstitutionSettingsSection: React.FC<
	InstitutionSettingsSectionProps
> = ({ profile }) => {
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
				<p className="text-gray-600">
					Manage settings for {profile?.institutionName || 'your institution'}
				</p>
				{/* Add your settings content here */}
			</div>
		</div>
	)
}
