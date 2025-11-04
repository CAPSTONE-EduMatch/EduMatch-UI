'use client'

import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { SubscriptionFeaturesCard } from '@/components/payment/SubscriptionFeaturesCard'
import { motion } from 'framer-motion'

export default function PaymentPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-8"
		>
			<div>
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					My Subscription
				</h1>
				<p className="text-gray-600">
					Manage your subscription plan and billing through Stripe
				</p>
			</div>
			<SubscriptionFeaturesCard />
			<BillingPortalCard />
		</motion.div>
	)
}
