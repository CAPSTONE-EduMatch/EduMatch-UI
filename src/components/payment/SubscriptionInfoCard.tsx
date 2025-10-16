'use client'

import { Button, Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { Calendar, Star, User, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SubscriptionInfoCard() {
	const { subscriptions, currentPlan, isAuthenticated } = useSubscription()
	const router = useRouter()

	// Get active subscription details
	const activeSubscription = subscriptions.find(
		(sub) => sub.status === 'active'
	)

	// Get plan details
	const getPlanDetails = (plan: string) => {
		switch (plan) {
			case 'standard':
				return {
					name: 'Standard Membership',
					price: 99,
					color: 'bg-blue-100 text-blue-700',
				}
			case 'premium':
				return {
					name: 'Premium Membership',
					price: 199,
					color: 'bg-purple-100 text-purple-700',
				}
			default:
				return {
					name: 'Free Plan',
					price: 0,
					color: 'bg-gray-100 text-gray-700',
				}
		}
	}

	const planDetails = getPlanDetails(currentPlan || 'free')

	// Format date
	const formatDate = (date: Date | string) => {
		if (!date) return 'Not available'
		const d = new Date(date)
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	const handleUpgradePlan = () => {
		router.push('/pricing')
	}

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				{/* Header Section */}
				<div className="flex items-start justify-between mb-8">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
							<Star className="w-6 h-6 text-[#126E64]" />
						</div>
						<div>
							<h2 className="text-2xl font-bold text-gray-900 mb-1">
								{planDetails.name}
							</h2>
							<p className="text-gray-600">Your current subscription</p>
						</div>
					</div>
					{isAuthenticated && currentPlan !== 'premium' && (
						<Button
							onClick={handleUpgradePlan}
							className="bg-[#126E64] hover:bg-[#0f5c54] text-white px-6 py-3 rounded-full"
						>
							Upgrade plan
						</Button>
					)}
				</div>

				{/* Subscription Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
					{/* Next Billing Date */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<Calendar className="w-5 h-5 text-[#126E64]" />
							<span className="text-gray-600 font-medium">
								Next Billing Date
							</span>
						</div>
						<p className="text-lg font-semibold text-gray-900">
							{activeSubscription
								? formatDate(activeSubscription.periodEnd)
								: 'January 15, 2025'}
						</p>
					</div>

					{/* Monthly Cost */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<Wallet className="w-5 h-5 text-[#126E64]" />
							<span className="text-gray-600 font-medium">Monthly cost</span>
						</div>
						<p className="text-lg font-semibold text-gray-900">
							${planDetails.price}.00
						</p>
					</div>

					{/* Member Since */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<User className="w-5 h-5 text-[#126E64]" />
							<span className="text-gray-600 font-medium">Member since</span>
						</div>
						<p className="text-lg font-semibold text-gray-900">
							{activeSubscription
								? formatDate(activeSubscription.periodStart)
								: 'September 2025'}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
