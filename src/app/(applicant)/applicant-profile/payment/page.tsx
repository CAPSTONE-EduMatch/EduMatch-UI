'use client'

import { AuthRequiredModal } from '@/components/auth'
import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { SubscriptionFeaturesCard } from '@/components/payment/SubscriptionFeaturesCard'
import { SubscriptionInfoCard } from '@/components/payment/SubscriptionInfoCard'
import { ApplicantProfileLayout } from '@/components/profile/ApplicantProfileLayout'
import { Card, CardContent } from '@/components/ui'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { ApiService } from '@/lib/axios-config'
import { useEffect, useState } from 'react'

interface ProfileData {
	id: string
	firstName: string
	lastName: string
	email: string
	role: string
	profilePhoto?: string
	user?: {
		id: string
		name: string
		email: string
		image?: string
	}
}

export default function ApplicantPaymentPage() {
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Use the authentication check hook
	const {
		isAuthenticated,
		showAuthModal,
		handleCloseModal: closeAuthModal,
		isLoading: authLoading,
	} = useAuthCheck()

	// Fetch profile data
	useEffect(() => {
		const fetchProfile = async () => {
			if (authLoading) {
				return // Still loading auth, don't proceed
			}

			if (!isAuthenticated) {
				setLoading(false)
				return
			}

			setLoading(true)
			setError(null)

			try {
				const data = await ApiService.getProfile()

				// Verify user role is applicant
				if (data.profile.role !== 'applicant') {
					setError('This payment page is for applicants only')
					return
				}

				setProfile(data.profile)
			} catch (err) {
				setError('Failed to load profile data')
			} finally {
				setLoading(false)
			}
		}

		fetchProfile()
	}, [isAuthenticated, authLoading])

	// Show auth modal if not authenticated
	if (!authLoading && !isAuthenticated) {
		return <AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
	}

	// Show loading state
	if (loading || authLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64] mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading payment information...</p>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md w-full mx-4">
					<CardContent className="p-6 text-center">
						<p className="text-red-600 mb-4">{error}</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<ApplicantProfileLayout
			activeSection="payment"
			onSectionChange={() => {}}
			profile={profile}
			onEditProfile={() => {}}
		>
			<div className="space-y-8">
				{/* Page Header */}
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						My Subscription
					</h1>
					<p className="text-gray-600">
						Manage your subscription plan and billing through Stripe
					</p>
				</div>

				{/* Subscription Info Card */}
				<SubscriptionInfoCard />

				{/* Subscription Features */}
				<SubscriptionFeaturesCard />

				{/* Billing Portal */}
				<BillingPortalCard />
			</div>
		</ApplicantProfileLayout>
	)
}
