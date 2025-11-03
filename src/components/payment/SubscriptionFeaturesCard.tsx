'use client'

import { Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { Check } from 'lucide-react'

export function SubscriptionFeaturesCard() {
	const { currentPlan } = useSubscription()

	// Get plan features based on current plan
	const getPlanFeatures = (plan: string) => {
		switch (plan) {
			case 'standard':
				return [
					'Send messages to scholarship officers / professors (limited number of initiated messages)',
					'View scholarship/research match level',
					'Basic opportunity recommendations (rule-based)',
					'Advanced scholarship matching algorithms',
					'Priority application tracking',
					'Extended program database access',
					'Email notifications & reminders',
					'Direct messaging with admissions staff',
				]
			case 'premium':
				return [
					'All Standard Plan features',
					'AI-powered essay review & suggestions',
					'One-on-one consultation calls',
					'Custom scholarship recommendations',
					'Application document templates',
					'Interview preparation resources',
					'Exclusive webinars & workshops',
					'Priority customer support',
				]
			default:
				return [
					'Send messages to scholarship officers / professors (limited number of initiated messages)',
					'View scholarship/research match level',
					'Basic opportunity recommendations (rule-based)',
				]
		}
	}

	const features = getPlanFeatures(currentPlan || 'free')

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				<div>
					<h3 className="text-xl font-semibold text-gray-900 mb-6">
						Current plan include
					</h3>

					<div className="space-y-4">
						{features.map((feature, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="flex-shrink-0 mt-1">
									<div className="w-6 h-6 rounded-full bg-[#126E64]/10 flex items-center justify-center">
										<Check className="w-4 h-4 text-[#126E64]" strokeWidth={2} />
									</div>
								</div>
								<span className="text-gray-700 leading-relaxed">{feature}</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
