'use client'

import { InstitutionProfileLayout } from '@/components/profile/layouts/InstitutionProfileLayout'
import { InstitutionOverviewSection } from '@/components/profile/institution/sections/InstitutionOverviewSection'
import { ProgramsSection } from '@/components/profile/institution/sections/ProgramsSection'
import { InstitutionProfileSection } from '@/components/profile/institution/sections/InstitutionProfileSection'
import { InstitutionApplicationSection } from '@/components/profile/institution/sections/InstitutionApplicationSection'
import { InstitutionSettingsSection } from '@/components/profile/institution/sections/InstitutionSettingsSection'
import { useUserProfile } from '@/hooks/useUserProfile'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { ProfileWrapper } from '@/components/auth/ProfileWrapper'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ApiService } from '@/lib/axios-config'

// Payment components
import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { SubscriptionFeaturesCard } from '@/components/payment/SubscriptionFeaturesCard'

// Use the same type as InstitutionProfileLayout
type InstitutionProfileSection =
	| 'overview'
	| 'profile'
	| 'programs'
	| 'application'
	| 'students'
	| 'analytics'
	| 'payment'
	| 'settings'

export default function InstitutionDashboard() {
	const {
		profile: userProfile,
		isLoading: userProfileLoading,
		refreshProfile,
	} = useUserProfile()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [activeSection, setActiveSection] =
		useState<InstitutionProfileSection>('overview')

	// State for full profile data
	const [profile, setProfile] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Load full profile data when userProfile is available
	useEffect(() => {
		const loadFullProfile = async () => {
			if (!userProfile || userProfileLoading) {
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				console.log('🔍 Loading full profile data for institution dashboard...')
				const data = await ApiService.getProfile()
				console.log('✅ Full profile data loaded:', data.profile)
				setProfile(data.profile)
			} catch (error: any) {
				console.error('❌ Failed to load full profile:', error)
				setError('Failed to load profile data')
			} finally {
				setIsLoading(false)
			}
		}

		loadFullProfile()
	}, [userProfile, userProfileLoading])

	// Redirect applicants to their profile page
	useEffect(() => {
		if (profile && profile.role !== 'institution') {
			router.push('/profile/view')
		}
	}, [profile, router])

	// Refresh profile function
	const refreshFullProfile = async () => {
		if (!userProfile) return

		setIsLoading(true)
		setError(null)

		try {
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error: any) {
			setError('Failed to refresh profile data')
		} finally {
			setIsLoading(false)
		}
	}

	// Initialize active section from URL parameter
	useEffect(() => {
		const tab = searchParams.get('tab')
		const validSections: InstitutionProfileSection[] = [
			'overview',
			'profile',
			'programs',
			'application',
			'students',
			'analytics',
			'payment',
			'settings',
		]
		if (validSections.includes(tab as InstitutionProfileSection)) {
			setActiveSection(tab as InstitutionProfileSection)
		}
	}, [searchParams])

	// Handle section change and update URL
	const handleSectionChange = (section: InstitutionProfileSection) => {
		setActiveSection(section)
		// Update URL using Next.js router for better browser navigation support
		const url = new URL(window.location.href)
		url.searchParams.set('tab', section)
		// Clear create form parameters when switching tabs
		url.searchParams.delete('action')
		url.searchParams.delete('type')

		router.push(url.pathname + url.search)
	}

	const renderSectionContent = () => {
		switch (activeSection) {
			case 'overview':
				return (
					<InstitutionOverviewSection
						profile={profile}
						onNavigationAttempt={() => true}
					/>
				)
			case 'programs':
				return (
					<ProgramsSection
						profile={profile}
						onProfileUpdate={refreshFullProfile}
						onNavigationAttempt={() => true}
					/>
				)
			case 'profile':
				return (
					<InstitutionProfileSection
						profile={profile}
						onProfileUpdate={refreshFullProfile}
					/>
				)
			case 'application':
				return <InstitutionApplicationSection profile={profile} />
			case 'students':
				return (
					<div className="space-y-6">
						<h1 className="text-3xl font-bold text-gray-900">Students</h1>
						<p className="text-gray-600">
							Manage your students and applications.
						</p>
						{/* Students content will be loaded here */}
					</div>
				)
			case 'payment':
				return (
					<div className="space-y-8">
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
					</div>
				)
			case 'settings':
				return <InstitutionSettingsSection profile={profile} />
			default:
				return (
					<InstitutionOverviewSection
						profile={profile}
						onNavigationAttempt={() => true}
					/>
				)
		}
	}

	if (isLoading || userProfileLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">
						Loading institution dashboard...
					</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">Error</h2>
					<p className="text-muted-foreground mb-4">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
					>
						Try Again
					</button>
				</div>
			</div>
		)
	}

	// Check if user is an institution - redirect applicants to their profile
	if (profile && profile.role !== 'institution') {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-blue-500 text-6xl mb-4">🔄</div>
					<h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
					<p className="text-muted-foreground mb-4">
						This page is for institutions only. Redirecting you to your profile.
					</p>
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
				</div>
			</div>
		)
	}

	return (
		<AuthWrapper
			pageTitle="Institution Dashboard"
			pageDescription="Please sign in to access your institution dashboard"
		>
			<ProfileWrapper
				pageTitle="Profile Required"
				pageDescription="Please create your profile to access institution features"
				redirectTo="/profile/create"
			>
				<InstitutionProfileLayout
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
					profile={profile}
				>
					{renderSectionContent()}
				</InstitutionProfileLayout>
			</ProfileWrapper>
		</AuthWrapper>
	)
}
