'use client'

import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { ApiService, cacheUtils } from '@/lib/axios-config'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { ProfileWrapper } from '@/components/auth/ProfileWrapper'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Import applicant layout and section components
import {
	ApplicantProfileLayout,
	ApplicantProfileSection,
} from '@/components/profile/layouts/ApplicantProfileLayout'
import { ProfileInfoSection } from '@/components/profile/applicant/sections/ProfileInfoSection'
import { AcademicSection } from '@/components/profile/applicant/sections/AcademicSection'
import { WishlistSection } from '@/components/profile/applicant/sections/WishlistSection'
import { ApplicationSection } from '@/components/profile/applicant/sections/ApplicationSection'
import { SettingsSection } from '@/components/profile/applicant/sections/SettingsSection'

// Payment components
import { BillingPortalCard } from '@/components/payment/BillingPortalCard'
import { SubscriptionFeaturesCard } from '@/components/payment/SubscriptionFeaturesCard'
import { SubscriptionInfoCard } from '@/components/payment/SubscriptionInfoCard'

interface ProfileData {
	id: string
	role: string
	firstName: string
	lastName: string
	gender: string
	birthday: string
	nationality: string
	phoneNumber: string
	countryCode: string
	interests: string[]
	favoriteCountries: string[]
	profilePhoto?: string
	graduationStatus?: string
	degree?: string
	fieldOfStudy?: string
	university?: string
	graduationYear?: string
	gpa?: string
	countryOfStudy?: string
	scoreType?: string
	scoreValue?: string
	hasForeignLanguage?: string
	languages: Array<{
		id: string
		language: string
		certificate: string
		score: string
	}>
	researchPapers: Array<{
		id: string
		title: string
		discipline: string
		files: Array<{
			id: string
			file: {
				id: string
				name: string
				url: string
				size: number
			}
		}>
	}>
	uploadedFiles: Array<{
		id: string
		file: {
			id: string
			name: string
			url: string
			size: number
		}
		category: string
	}>
	// File categories
	cvFiles?: Array<{
		id: string
		name: string
		originalName: string
		fileName: string
		size: number
		fileSize: number
		url: string
		fileType: string
		category: string
	}>
	languageCertFiles?: Array<{
		id: string
		name: string
		originalName: string
		fileName: string
		size: number
		fileSize: number
		url: string
		fileType: string
		category: string
	}>
	degreeFiles?: Array<{
		id: string
		name: string
		originalName: string
		fileName: string
		size: number
		fileSize: number
		url: string
		fileType: string
		category: string
	}>
	transcriptFiles?: Array<{
		id: string
		name: string
		originalName: string
		fileName: string
		size: number
		fileSize: number
		url: string
		fileType: string
		category: string
	}>
	verificationDocuments?: Array<{
		id: string
		name: string
		originalName: string
		fileName: string
		size: number
		fileSize: number
		url: string
		fileType: string
		category: string
	}>
	user: {
		id: string
		name: string
		email: string
		image?: string
	}
	createdAt: string
	updatedAt: string
}

export default function ProfileView() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])

	// Use the authentication check hook
	const { isAuthenticated, user } = useAuthCheck()

	// Load full profile data when authenticated
	useEffect(() => {
		const loadFullProfile = async () => {
			if (!isAuthenticated) {
				return
			}

			setLoading(true)
			setError(null)

			try {
				console.log('🔍 Loading full profile data for applicant profile...')
				const data = await ApiService.getProfile()
				console.log('✅ Full profile data loaded:', data.profile)
				setProfile(data.profile)
			} catch (error: any) {
				console.error('❌ Failed to load full profile:', error)
				if (error?.response?.status === 404 || error?.status === 404) {
					// Profile doesn't exist - ProfileWrapper will handle redirect
					setProfile(null)
					return
				}
				setError('Failed to load profile data')
			} finally {
				setLoading(false)
			}
		}

		loadFullProfile()
	}, [isAuthenticated])

	// Load subdisciplines once
	useEffect(() => {
		const loadSubdisciplines = async () => {
			try {
				const response = await ApiService.getSubdisciplines()
				if (response.success) {
					setSubdisciplines(response.subdisciplines)
				}
			} catch (error) {
				// Failed to load subdisciplines - will use empty array
			}
		}
		loadSubdisciplines()
	}, [])

	const refreshProfile = async () => {
		if (!isAuthenticated) return

		setLoading(true)
		setError(null)

		try {
			await cacheUtils.clearProfileCache(user?.id || '')
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error: any) {
			setError('Failed to refresh profile data')
		} finally {
			setLoading(false)
		}
	}

	// Redirect institutions to their dashboard immediately after profile loads
	useEffect(() => {
		if (profile && profile.role !== 'applicant') {
			router.replace('/institution/dashboard')
		}
	}, [profile, router])

	// Show loading state
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="text-red-500 text-6xl mb-4">⚠️</div>
						<h2 className="text-xl font-semibold mb-2">Error</h2>
						<p className="text-muted-foreground mb-4">{error}</p>
						<Button onClick={refreshProfile}>Try Again</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// If profile loaded and it's not an applicant, show loading while redirecting
	// (router.replace will handle the redirect, but show loading during transition)
	if (profile && profile.role !== 'applicant') {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Redirecting...</p>
				</div>
			</div>
		)
	}

	// Only render for applicants (institutions are redirected to /institution)
	if (profile?.role === 'applicant') {
		return (
			<ProfileWrapper
				pageTitle="Profile Required"
				pageDescription="Please create your profile to view your profile page"
				redirectTo="/profile/create"
			>
				<ApplicantProfileView
					profile={profile}
					searchParams={searchParams as unknown as URLSearchParams}
					refreshProfile={refreshProfile}
					subdisciplines={subdisciplines}
				/>
			</ProfileWrapper>
		)
	}

	// If not applicant, redirect to appropriate dashboard
	return (
		<AuthWrapper
			pageTitle="Profile"
			pageDescription="Please sign in to view your profile"
		>
			<ProfileWrapper
				pageTitle="Profile Required"
				pageDescription="Please create your profile to view your profile page"
				redirectTo="/profile/create"
			>
				<div></div>
			</ProfileWrapper>
		</AuthWrapper>
	)
}

// Applicant Profile Component
function ApplicantProfileView({
	profile,
	searchParams,
	refreshProfile,
	subdisciplines,
}: {
	profile: ProfileData
	searchParams: URLSearchParams
	refreshProfile: () => Promise<void>
	subdisciplines: Array<{ value: string; label: string; discipline: string }>
}) {
	const router = useRouter()
	const [activeSection, setActiveSection] =
		useState<ApplicantProfileSection>('profile')

	// Initialize active section from URL parameter
	useEffect(() => {
		const tab = searchParams.get('tab')
		const validSections: ApplicantProfileSection[] = [
			'profile',
			'academic',
			'wishlist',
			'application',
			'payment',
			'settings',
		]
		if (validSections.includes(tab as ApplicantProfileSection)) {
			setActiveSection(tab as ApplicantProfileSection)
		}
	}, [searchParams])

	// Handle section change and update URL
	const handleSectionChange = (section: ApplicantProfileSection) => {
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
			case 'profile':
				return (
					<ProfileInfoSection
						profile={profile}
						subdisciplines={subdisciplines}
					/>
				)
			case 'academic':
				return (
					<AcademicSection
						profile={profile}
						subdisciplines={subdisciplines}
						onProfileUpdate={refreshProfile}
					/>
				)
			case 'wishlist':
				return <WishlistSection profile={profile} />
			case 'application':
				return <ApplicationSection profile={profile} />
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
						<SubscriptionInfoCard />
						<SubscriptionFeaturesCard />
						<BillingPortalCard />
					</div>
				)
			case 'settings':
				return <SettingsSection profile={profile} />
			default:
				return (
					<ProfileInfoSection
						profile={profile}
						subdisciplines={subdisciplines}
					/>
				)
		}
	}

	return (
		<AuthWrapper
			pageTitle="Profile"
			pageDescription="Please sign in to view your profile"
		>
			<ApplicantProfileLayout
				activeSection={activeSection}
				onSectionChange={handleSectionChange}
				profile={profile}
				onEditProfile={() => (window.location.href = '/profile/create')}
			>
				{renderSectionContent()}
			</ApplicantProfileLayout>
		</AuthWrapper>
	)
}
