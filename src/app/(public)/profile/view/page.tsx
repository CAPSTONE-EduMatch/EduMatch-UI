'use client'

import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { ApiService, cacheUtils } from '@/lib/axios-config'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { ProfileWrapper } from '@/components/auth/ProfileWrapper'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

// Import both layout components
import {
	ApplicantProfileLayout,
	ApplicantProfileSection,
} from '@/components/profile/menu/ApplicantProfileLayout'
import {
	InstitutionProfileLayout,
	InstitutionProfileSection,
} from '@/components/profile/InstitutionProfileLayout'

// Import all section components
import { ProfileInfoSection } from '@/components/profile/menu/ProfileInfoSection'
import { AcademicSection } from '@/components/profile/menu/AcademicSection'
import { WishlistSection } from '@/components/profile/menu/WishlistSection'
import { ApplicationSection } from '@/components/profile/menu/ApplicationSection'
import { SettingsSection } from '@/components/profile/menu/SettingsSection'
import { InstitutionOverviewSection } from '@/components/profile/institution/menu/InstitutionOverviewSection'
import { ProgramsSection } from '@/components/profile/institution/menu/ProgramsSection'
import { InstitutionApplicationSection } from '@/components/profile/institution/menu/InstitutionApplicationSection'
import { AnalyticsReportsSection } from '@/components/profile/institution/menu/AnalyticsReportsSection'
import { InstitutionSettingsSection } from '@/components/profile/institution/menu/InstitutionSettingsSection'
import { InstitutionProfileSection as InstitutionProfileComponent } from '@/components/profile/institution/menu/InstitutionProfileSection'

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
	// Institution fields
	institutionName?: string
	institutionAbbreviation?: string
	institutionHotline?: string
	institutionHotlineCode?: string
	institutionType?: string
	institutionWebsite?: string
	institutionEmail?: string
	institutionCountry?: string
	institutionAddress?: string
	representativeName?: string
	representativeAppellation?: string
	representativePosition?: string
	representativeEmail?: string
	representativePhone?: string
	representativePhoneCode?: string
	aboutInstitution?: string
	institutionDisciplines?: string[]
	institutionCoverImage?: string
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
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])
	const hasAttemptedLoad = useRef(false)

	// Use the authentication check hook
	const { isAuthenticated, user } = useAuthCheck()

	// Get current user ID and fetch basic profile - only when authenticated
	useEffect(() => {
		const getCurrentUserAndProfile = async () => {
			if (!isAuthenticated || hasAttemptedLoad.current) {
				return
			}

			hasAttemptedLoad.current = true
			setLoading(true)
			setError(null)

			try {
				// Only load basic profile info, not full profile with all sections
				const data = await ApiService.getProfile()
				// Extract only basic info needed for navigation
				const basicProfile = {
					id: data.profile.id,
					role: data.profile.role,
					firstName: data.profile.firstName,
					lastName: data.profile.lastName,
					user: data.profile.user,
					// Add empty arrays for sections that will be loaded separately
					cvFiles: [],
					languageCertFiles: [],
					degreeFiles: [],
					transcriptFiles: [],
					researchPapers: [],
					interests: [],
					favoriteCountries: [],
					// Add other basic fields as needed
					...data.profile,
				}
				setProfile(basicProfile)
			} catch (error: any) {
				if (error?.response?.status === 404 || error?.status === 404) {
					// Don't redirect - let ProfileWrapper handle this with a modal
					setProfile(null)
					return
				}
				setError('Failed to load profile')
			} finally {
				setLoading(false)
			}
		}
		getCurrentUserAndProfile()
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
		setLoading(true)
		try {
			await cacheUtils.clearProfileCache(user?.id || '')
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error) {
			setError('Failed to refresh profile')
		} finally {
			setLoading(false)
		}
	}

	// Show loading state
	if (isAuthenticated && loading && !profile) {
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

	// Render based on user role
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
	} else if (profile?.role === 'institution') {
		return (
			<ProfileWrapper
				pageTitle="Profile Required"
				pageDescription="Please create your profile to view your profile page"
				redirectTo="/profile/create"
			>
				<InstitutionProfileView
					profile={profile}
					searchParams={searchParams as unknown as URLSearchParams}
					refreshProfile={refreshProfile}
				/>
			</ProfileWrapper>
		)
	}

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
		// Update URL without page reload
		const url = new URL(window.location.href)
		url.searchParams.set('tab', section)
		window.history.pushState({}, '', url.toString())
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

// Institution Profile Component
function InstitutionProfileView({
	profile,
	searchParams,
	refreshProfile,
}: {
	profile: ProfileData
	searchParams: URLSearchParams
	refreshProfile: () => Promise<void>
}) {
	const [activeSection, setActiveSection] =
		useState<InstitutionProfileSection>('overview')

	// Initialize active section from URL parameter
	useEffect(() => {
		const tab = searchParams.get('tab')
		const validSections: InstitutionProfileSection[] = [
			'overview',
			'profile',
			'programs',
			'application',
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
		// Update URL without page reload
		const url = new URL(window.location.href)
		url.searchParams.set('tab', section)
		window.history.pushState({}, '', url.toString())
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
						onProfileUpdate={refreshProfile}
						onNavigationAttempt={() => true}
					/>
				)
			case 'profile':
				return <InstitutionProfileComponent profile={profile} />
			case 'application':
				return <InstitutionApplicationSection profile={profile} />
			case 'analytics':
				return <AnalyticsReportsSection profile={profile} />
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

	return (
		<AuthWrapper
			pageTitle="Institution Profile"
			pageDescription="Please sign in to view your profile"
		>
			<InstitutionProfileLayout
				activeSection={activeSection}
				onSectionChange={handleSectionChange}
				profile={profile}
			>
				{renderSectionContent()}
			</InstitutionProfileLayout>
		</AuthWrapper>
	)
}
