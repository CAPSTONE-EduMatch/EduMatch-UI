'use client'

import React from 'react'

interface InstitutionPaymentSectionProps {
	profile: any
}

export const InstitutionPaymentSection: React.FC<
	InstitutionPaymentSectionProps
> = ({ profile }) => {
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Payments</h2>
				<p className="text-gray-600">
					Manage payment settings for{' '}
					{profile?.institutionName || 'your institution'}
				</p>
				{/* Add your payment management content here */}
			</div>
		</div>
	)
}
