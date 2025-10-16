'use client'

import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { ApiService, cacheUtils } from '@/lib/axios-config'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthRequiredModal } from '@/components/auth'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
	ApplicantProfileLayout,
	ApplicantProfileSection,
} from '@/components/profile/menu/ApplicantProfileLayout'
import { ProfileInfoSection } from '@/components/profile/menu/ProfileInfoSection'
import { AcademicSection } from '@/components/profile/menu/AcademicSection'
import { WishlistSection } from '@/components/profile/menu/WishlistSection'
import { ApplicationSection } from '@/components/profile/menu/ApplicationSection'
import { PaymentSection } from '@/components/profile/menu/PaymentSection'
import { SettingsSection } from '@/components/profile/menu/SettingsSection'

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
	user: {
		id: string
		name: string
		email: string
		image?: string
	}
	createdAt: string
	updatedAt: string
}

export default function ApplicantViewProfile() {
	const searchParams = useSearchParams()
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Initialize active section from URL parameter or default to 'profile'
	const getInitialSection = useCallback((): ApplicantProfileSection => {
		const tab = searchParams.get('tab')
		const validSections: ApplicantProfileSection[] = [
			'profile',
			'academic',
			'wishlist',
			'application',
			'payment',
			'settings',
		]
		return validSections.includes(tab as ApplicantProfileSection)
			? (tab as ApplicantProfileSection)
			: 'profile'
	}, [searchParams])

	const [activeSection, setActiveSection] =
		useState<ApplicantProfileSection>(getInitialSection())

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

				// Verify user role is applicant
				if (data.profile.role !== 'applicant') {
					setError('This profile page is for applicants only')
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
					<h1 className="text-3xl font-bold text-primary mb-4">
						Applicant Profile
					</h1>
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
						<div className="text-6xl mb-4">🎓</div>
						<h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
						<p className="text-muted-foreground mb-4">
							You haven&apos;t created a profile yet.
						</p>
						<div className="space-y-3">
							<Button
								onClick={() =>
									(window.location.href = '/profile/create-profile')
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
			case 'profile':
				return (
					<ProfileInfoSection
						profile={profile}
						onNavigationAttempt={navigationHandler}
					/>
				)
			case 'academic':
				return (
					<AcademicSection
						profile={profile}
						onProfileUpdate={refreshProfile}
						onNavigationAttempt={navigationHandler}
					/>
				)
			case 'wishlist':
				return <WishlistSection profile={profile} />
			case 'application':
				return <ApplicationSection profile={profile} />
			case 'payment':
				return <PaymentSection profile={profile} />
			case 'settings':
				return <SettingsSection profile={profile} />
			default:
				return (
					<ProfileInfoSection
						profile={profile}
						onNavigationAttempt={navigationHandler}
					/>
				)
		}
	}

	const handleEditProfile = () => {
		window.location.href = '/profile/create-profile'
	}

	return (
		<ApplicantProfileLayout
			activeSection={activeSection}
			onSectionChange={setActiveSection}
			profile={profile}
			onEditProfile={handleEditProfile}
		>
			{renderSectionContent()}
		</ApplicantProfileLayout>
	)
}
