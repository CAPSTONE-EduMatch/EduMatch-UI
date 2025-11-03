'use client'

import { authClient } from '@/config/auth-client'
import { Button, Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { CreditCard, ExternalLink, Settings } from 'lucide-react'
import { useState } from 'react'

export function BillingPortalCard() {
	const { subscriptions, isAuthenticated } = useSubscription()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Get active subscription details
	const activeSubscription = subscriptions.find(
		(sub) => sub.status === 'active'
	)

	const handleOpenBillingPortal = async () => {
		if (!isAuthenticated || !activeSubscription) {
			setError('No active subscription found')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const { data, error: billingError } =
				await authClient.subscription.billingPortal({
					locale: 'en',
					returnUrl: `${window.location.origin}/profile/view?tab=payment`,
				})

			if (billingError) {
				throw new Error(billingError.message || 'Failed to open billing portal')
			}

			if (data && (data as any).url) {
				// Redirect to Stripe billing portal
				window.location.href = (data as any).url
			} else {
				throw new Error('No billing portal URL received')
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to open billing portal'
			setError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="bg-white rounded-[40px] shadow-sm border-gray-200">
			<CardContent className="p-8">
				{/* Header Section */}
				<div className="flex items-start justify-between mb-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
							<CreditCard className="w-6 h-6 text-[#126E64]" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-gray-900 mb-1">
								Billing & Payments
							</h3>
							<p className="text-gray-600">
								Manage your subscription, payment methods, and billing history
							</p>
						</div>
					</div>
				</div>

				{/* Billing Portal Section */}
				<div className="bg-gray-50 rounded-3xl p-6">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-3">
								<Settings className="w-5 h-5 text-[#126E64]" />
								<h4 className="text-lg font-semibold text-gray-900">
									Subscription Management
								</h4>
							</div>
							<p className="text-gray-600 mb-4">
								Access your Stripe billing portal to:
							</p>
							<ul className="space-y-2 text-sm text-gray-600 mb-6">
								<li className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-[#126E64] rounded-full"></div>
									Update payment methods and billing information
								</li>
								<li className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-[#126E64] rounded-full"></div>
									Download invoices and payment receipts
								</li>
								<li className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-[#126E64] rounded-full"></div>
									View complete billing history
								</li>
								<li className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-[#126E64] rounded-full"></div>
									Update subscription settings
								</li>
							</ul>

							{error && (
								<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-sm text-red-600">{error}</p>
								</div>
							)}

							<Button
								onClick={handleOpenBillingPortal}
								disabled={isLoading || !isAuthenticated || !activeSubscription}
								className="bg-[#126E64] hover:bg-[#0f5c54] text-white px-6 py-3 rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Opening Portal...
									</>
								) : (
									<>
										<ExternalLink className="w-4 h-4" />
										Open Billing Portal
									</>
								)}
							</Button>

							{!activeSubscription && isAuthenticated && (
								<p className="text-sm text-gray-500 mt-2">
									No active subscription found. Subscribe to a plan to access
									billing management.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="text-center p-4 bg-blue-50 rounded-2xl">
						<CreditCard className="w-6 h-6 text-blue-600 mx-auto mb-2" />
						<h5 className="font-medium text-gray-900 mb-1">Payment Methods</h5>
						<p className="text-xs text-gray-600">
							Add or update your payment methods
						</p>
					</div>
					<div className="text-center p-4 bg-green-50 rounded-2xl">
						<Settings className="w-6 h-6 text-green-600 mx-auto mb-2" />
						<h5 className="font-medium text-gray-900 mb-1">Billing Settings</h5>
						<p className="text-xs text-gray-600">
							Configure billing preferences
						</p>
					</div>
					<div className="text-center p-4 bg-purple-50 rounded-2xl">
						<ExternalLink className="w-6 h-6 text-purple-600 mx-auto mb-2" />
						<h5 className="font-medium text-gray-900 mb-1">
							Download Invoices
						</h5>
						<p className="text-xs text-gray-600">Access your billing history</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
