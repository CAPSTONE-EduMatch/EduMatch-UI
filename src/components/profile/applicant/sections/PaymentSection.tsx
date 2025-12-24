'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { SubscriptionProgressWidget } from '@/components/ui'
import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { SubscriptionFeaturesCard } from '@/components/payment/SubscriptionFeaturesCard'
import { SubscriptionInfoCard } from '@/components/payment/SubscriptionInfoCard'

interface PaymentSectionProps {
	profile: {
		id: string
	}
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ profile }) => {
	const t = useTranslations('profile_view.payment')

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
				<p className="text-gray-600">{t('description')}</p>
			</div>
			<SubscriptionProgressWidget
				applicantId={profile.id}
				variant="detailed"
				className="mb-8"
			/>
			<SubscriptionInfoCard />
			<SubscriptionFeaturesCard />
			<BillingPortalCard />
		</div>
	)
}
