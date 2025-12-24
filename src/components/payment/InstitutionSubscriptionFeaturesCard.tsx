'use client'

import { Card, CardContent } from '@/components/ui'
import { Check } from 'lucide-react'

export function InstitutionSubscriptionFeaturesCard() {
	const features = [
		'Organizational Profile Management',
		'Opportunity Posting',
		'Custom Applicant Filters',
		'AI-Generated Shortlists',
		'Applicant Profile Access',
		'Interview Management',
		'Integrated Communication',
		'Analytics Dashboard',
	]

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border border-gray-200">
			<CardContent className="p-8">
				<div>
					<h3 className="text-2xl font-bold text-gray-900 mb-6">
						Your Institution Plan Includes
					</h3>

					<div className="space-y-4">
						{features.map((feature, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="flex-shrink-0 mt-1">
									<div className="w-6 h-6 rounded-full bg-[#126E64]/20 flex items-center justify-center">
										<Check className="w-4 h-4 text-[#116E63]" strokeWidth={2} />
									</div>
								</div>
								<span className="text-gray-900 leading-relaxed text-[18px]">
									{feature}
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
