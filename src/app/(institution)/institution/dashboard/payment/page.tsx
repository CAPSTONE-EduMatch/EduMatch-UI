'use client'

import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { InstitutionPaymentSection } from '@/components/payment/InstitutionPaymentSection'
import { InstitutionSubscriptionFeaturesCard } from '@/components/payment/InstitutionSubscriptionFeaturesCard'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { motion } from 'framer-motion'

export default function PaymentPage() {
	const { subscriptions } = useSubscription()

	// Check if user has an active institution subscription
	const hasActiveInstitutionSubscription = subscriptions.some(
		(sub) =>
			sub.status === 'active' &&
			(sub.plan === 'institution_monthly' || sub.plan === 'institution_yearly')
	)

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-8"
		>
			{/* Show payment completion section if no active subscription */}
			{!hasActiveInstitutionSubscription ? (
				<InstitutionPaymentSection />
			) : (
				<>
					{/* Show subscription management if already subscribed */}
					<div>
						<InstitutionPaymentSection />
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							My Subscription
						</h1>
						<p className="text-gray-600">
							Manage your subscription plan and billing through Stripe
						</p>
					</div>
					<InstitutionSubscriptionFeaturesCard />
					<BillingPortalCard />
				</>
			)}
		</motion.div>
	)
}
