'use client'

import { Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function SubscriptionFeaturesCard() {
	const t = useTranslations('profile_view.subscription_features')
	const { currentPlan } = useSubscription()

	// Get plan features based on current plan
	const getPlanFeatures = (plan: string) => {
		switch (plan) {
			case 'standard':
				return [
					'messages',
					'match_level',
					'basic_recommendations',
					'advanced_matching',
					'priority_tracking',
					'extended_database',
					'email_notifications',
					'direct_messaging',
				]
			case 'premium':
				return [
					'all_standard',
					'ai_essay_review',
					'consultation_calls',
					'custom_recommendations',
					'document_templates',
					'interview_prep',
					'exclusive_webinars',
					'priority_support',
				]
			default:
				return ['messages', 'match_level', 'basic_recommendations']
		}
	}

	const features = getPlanFeatures(currentPlan || 'free')

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				<div>
					<h3 className="text-xl font-semibold text-gray-900 mb-6">
						{t('title')}
					</h3>

					<div className="space-y-4">
						{features.map((feature, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="flex-shrink-0 mt-1">
									<div className="w-6 h-6 rounded-full bg-[#126E64]/10 flex items-center justify-center">
										<Check className="w-4 h-4 text-[#126E64]" strokeWidth={2} />
									</div>
								</div>
								<span className="text-gray-700 leading-relaxed">
									{t(`features.${feature}`)}
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
