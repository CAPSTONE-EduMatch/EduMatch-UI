'use client'

import React from 'react'
import { getCountriesWithSvgFlags } from '@/data/countries'

interface InstitutionInformationSectionProps {
	profile: any
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const InstitutionInformationSection: React.FC<
	InstitutionInformationSectionProps
> = ({ profile }) => {
	// Get country data - check both institutionCountry and country fields
	const institutionCountry =
		profile?.institutionCountry || profile?.country || null

	const countryData = React.useMemo(() => {
		if (!institutionCountry) return null

		const normalizedCountry = institutionCountry.toLowerCase().trim()
		return getCountriesWithSvgFlags().find(
			(c) => c.name.toLowerCase().trim() === normalizedCountry
		)
	}, [institutionCountry])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Institution Information
				</h2>
				<div className="space-y-2">
					<p className="text-gray-600">
						Detailed information about{' '}
						{profile?.institutionName || 'your institution'}
					</p>
					{institutionCountry && (
						<div className="flex items-center gap-2">
							{countryData && countryData.flag ? (
								<span className="text-base">{countryData.flag}</span>
							) : null}
							<span className="text-gray-700 font-medium">
								{institutionCountry}
							</span>
						</div>
					)}
				</div>
				{/* Add your institution information content here */}
			</div>
		</div>
	)
}
