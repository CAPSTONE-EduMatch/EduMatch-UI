'use client'

import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { ApiService, cacheUtils } from '@/lib/axios-config'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthRequiredModal } from '@/components/auth'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
	InstitutionProfileLayout,
	InstitutionProfileSection,
} from '@/components/profile/InstitutionProfileLayout'
import { InstitutionOverviewSection } from '@/components/profile/institution/menu/InstitutionOverviewSection'
import { ProgramsSection } from '@/components/profile/institution/menu/ProgramsSection'
import { InstitutionApplicationSection } from '@/components/profile/institution/menu/InstitutionApplicationSection'
import { AnalyticsReportsSection } from '@/components/profile/institution/menu/AnalyticsReportsSection'
import { InstitutionPaymentSection } from '@/components/profile/institution/menu/InstitutionPaymentSection'
import { InstitutionSettingsSection } from '@/components/profile/institution/menu/InstitutionSettingsSection'
import { InstitutionProfileSection as InstitutionProfileComponent } from '@/components/profile/institution/menu/InstitutionProfileSection'

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

export default function ViewProfile() {
	const searchParams = useSearchParams()
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Initialize active section from URL parameter or default to 'profile'
	const getInitialSection = useCallback((): InstitutionProfileSection => {
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
		return validSections.includes(tab as InstitutionProfileSection)
			? (tab as InstitutionProfileSection)
			: 'overview'
	}, [searchParams])

	const [activeSection, setActiveSection] =
		useState<InstitutionProfileSection>(getInitialSection())

	// Update active section when URL parameters change
	useEffect(() => {
		const newSection = getInitialSection()
		setActiveSection(newSection)
	}, [searchParams, getInitialSection])

	// Use the authentication check hook
	const {
		isAuthenticated,
		showAuthModal,
		handleCloseModal: closeAuthModal,
		isLoading: authLoading,
		user,
	} = useAuthCheck()

	// Get current user ID and fetch profile
	useEffect(() => {
		const getCurrentUserAndProfile = async () => {
			// Only proceed if authentication is fully loaded and user is authenticated
			if (authLoading) {
				return // Still loading auth, don't proceed
			}

			if (!isAuthenticated) {
				setLoading(false)
				return
			}

			// Only fetch profile if we haven't already loaded it
			if (profile) {
				return
			}

			setLoading(true)
			setError(null)

			try {
				// Fetch profile data using cached API service
				const data = await ApiService.getProfile()

				// Verify user role is institution
				if (data.profile.role !== 'institution') {
					setError('This profile page is for institutions only')
					return
				}

				setProfile(data.profile)
			} catch (error) {
				setError('Failed to load profile')
			} finally {
				setLoading(false)
			}
		}
		getCurrentUserAndProfile()
	}, [isAuthenticated, authLoading, profile])

	const refreshProfile = async () => {
		setLoading(true)
		try {
			// Clear cache before fetching
			await cacheUtils.clearProfileCache(user?.id || '')
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error) {
			setError('Failed to refresh profile')
		} finally {
			setLoading(false)
		}
	}

	// Show loading state while checking auth or profile
	if (authLoading || (isAuthenticated && loading && !profile)) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		)
	}

	// Show authentication modal if user is not authenticated
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary mb-4">Profile View</h1>
					<p className="text-muted-foreground">
						Please sign in to view your profile
					</p>
				</div>
				<AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
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

	if (!profile) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="text-6xl mb-4">👤</div>
						<h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
						<p className="text-muted-foreground mb-4">
							You haven&apos;t created a profile yet.
						</p>
						<div className="space-y-3">
							<Button
								onClick={() =>
									(window.location.href = '/institution-profile/create')
								}
								className="w-full"
							>
								Create Profile
							</Button>
							<Button
								onClick={refreshProfile}
								variant="outline"
								className="w-full"
							>
								🔄 Refresh Profile Data
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Render section content based on active section
	const renderSectionContent = () => {
		const navigationHandler = (_targetSection: string) => {
			// This will be handled by the ProfileLayout
			return true
		}

		switch (activeSection) {
			case 'overview':
				return (
					<InstitutionOverviewSection
						profile={profile}
						onNavigationAttempt={navigationHandler}
					/>
				)
			case 'programs':
				return (
					<ProgramsSection
						profile={profile}
						onProfileUpdate={refreshProfile}
						onNavigationAttempt={navigationHandler}
					/>
				)
			case 'profile':
				return <InstitutionProfileComponent profile={profile} />
			case 'application':
				return <InstitutionApplicationSection profile={profile} />
			case 'analytics':
				return <AnalyticsReportsSection profile={profile} />
			case 'payment':
				return <InstitutionPaymentSection profile={profile} />
			case 'settings':
				return <InstitutionSettingsSection profile={profile} />
			default:
				return (
					<InstitutionOverviewSection
						profile={profile}
						onNavigationAttempt={navigationHandler}
					/>
				)
		}
	}

	// const handleEditProfile = () => {
	// 	window.location.href = '/institution-profile/create'
	// }

	return (
		<InstitutionProfileLayout
			activeSection={activeSection}
			onSectionChange={setActiveSection}
			profile={profile}
			// onEditProfile={handleEditProfile}
		>
			{renderSectionContent()}
		</InstitutionProfileLayout>
	)
}
