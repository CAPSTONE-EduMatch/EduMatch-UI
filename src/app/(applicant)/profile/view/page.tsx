'use client'

import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { ProfileWrapper } from '@/components/auth/ProfileWrapper'
import { Button, Card, CardContent } from '@/components/ui'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'
import { motion } from 'framer-motion'
import { User, Loader2 } from 'lucide-react'
import { useApplicantProfileContext } from '@/contexts/ApplicantProfileContext'

// Import applicant layout and section components
import { AcademicSection } from '@/components/profile/applicant/sections/AcademicSection'
import { ApplicationSection } from '@/components/profile/applicant/sections/ApplicationSection'
import { PaymentSection } from '@/components/profile/applicant/sections/PaymentSection'
import { ProfileInfoSection } from '@/components/profile/applicant/sections/ProfileInfoSection'
import { SettingsSection } from '@/components/profile/applicant/sections/SettingsSection'
import { WishlistSection } from '@/components/profile/applicant/sections/WishlistSection'
import {
	ApplicantProfileLayout,
	ApplicantProfileSection,
} from '@/components/profile/layouts/ApplicantProfileLayout'

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
	const t = useTranslations('profile_view')
	const searchParams = useSearchParams()
	const router = useRouter()
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])

	// Use the authentication check hook
	const { isLoading: authLoading } = useAuthCheck()

	// Use shared profile context instead of fetching separately
	const {
		profile,
		isLoading: profileLoading,
		error: profileError,
		refreshProfile,
	} = useApplicantProfileContext()

	const loading = profileLoading
	const error = profileError

	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const { subdisciplines: contextSubdisciplines = [] } = useDisciplinesContext()

	// Update local state when context data is available
	useEffect(() => {
		if (contextSubdisciplines.length > 0) {
			setSubdisciplines(contextSubdisciplines)
		}
	}, [contextSubdisciplines])

	// refreshProfile is now provided by the context

	// Redirect institutions to their dashboard immediately after profile loads
	useEffect(() => {
		if (profile && profile.role !== 'applicant') {
			router.replace('/institution/dashboard')
		}
	}, [profile, router])

	// Show loading state if auth is loading OR profile is loading
	// This prevents the flash of multiple loading screens
	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-[#F5F7FB] via-white to-[#F5F7FB] flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3 }}
					className="text-center"
				>
					{/* Logo/Icon with animation */}
					<motion.div
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.1, duration: 0.5 }}
						className="mb-6 flex justify-center"
					>
						<div className="relative">
							<div className="absolute inset-0 bg-[#126E64]/20 rounded-full blur-xl animate-pulse"></div>
							<div className="relative bg-white rounded-full p-6 shadow-xl border-4 border-[#126E64]/10">
								<User className="w-12 h-12 text-[#126E64]" />
							</div>
						</div>
					</motion.div>

					{/* Spinner */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="mb-6 flex justify-center"
					>
						<Loader2 className="w-8 h-8 text-[#126E64] animate-spin" />
					</motion.div>

					{/* Text with animation */}
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3, duration: 0.5 }}
					>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Loading Profile
						</h2>
						<p className="text-gray-600 text-sm">Preparing your profile...</p>
					</motion.div>

					{/* Progress bar */}
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: '100%' }}
						transition={{
							delay: 0.4,
							duration: 1.5,
							repeat: Infinity,
							repeatType: 'reverse',
						}}
						className="mt-8 mx-auto max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden"
					>
						<div
							className="h-full bg-gradient-to-r from-[#126E64] via-[#0D504A] to-[#126E64] rounded-full"
							style={{
								backgroundSize: '200% 100%',
								animation: 'shimmer 1.5s ease-in-out infinite',
							}}
						/>
					</motion.div>

					<style jsx>{`
						@keyframes shimmer {
							0% {
								background-position: -200% 0;
							}
							100% {
								background-position: 200% 0;
							}
						}
					`}</style>
				</motion.div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="text-red-500 text-6xl mb-4">⚠️</div>
						<h2 className="text-xl font-semibold mb-2">{t('error_title')}</h2>
						<p className="text-muted-foreground mb-4">{error}</p>
						<Button onClick={refreshProfile}>{t('try_again')}</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// If profile loaded and it's not an applicant, show loading while redirecting
	// (router.replace will handle the redirect, but show loading during transition)
	if (profile && profile.role !== 'applicant') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-[#F5F7FB] via-white to-[#F5F7FB] flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3 }}
					className="text-center"
				>
					{/* Logo/Icon with animation */}
					<motion.div
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.1, duration: 0.5 }}
						className="mb-6 flex justify-center"
					>
						<div className="relative">
							<div className="absolute inset-0 bg-[#126E64]/20 rounded-full blur-xl animate-pulse"></div>
							<div className="relative bg-white rounded-full p-6 shadow-xl border-4 border-[#126E64]/10">
								<User className="w-12 h-12 text-[#126E64]" />
							</div>
						</div>
					</motion.div>

					{/* Spinner */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="mb-6 flex justify-center"
					>
						<Loader2 className="w-8 h-8 text-[#126E64] animate-spin" />
					</motion.div>

					{/* Text with animation */}
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3, duration: 0.5 }}
					>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Redirecting...
						</h2>
						<p className="text-gray-600 text-sm">
							This page is for applicants only. Redirecting you to your
							dashboard.
						</p>
					</motion.div>

					{/* Progress bar */}
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: '100%' }}
						transition={{
							delay: 0.4,
							duration: 1.5,
							repeat: Infinity,
							repeatType: 'reverse',
						}}
						className="mt-8 mx-auto max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden"
					>
						<div
							className="h-full bg-gradient-to-r from-[#126E64] via-[#0D504A] to-[#126E64] rounded-full"
							style={{
								backgroundSize: '200% 100%',
								animation: 'shimmer 1.5s ease-in-out infinite',
							}}
						/>
					</motion.div>

					<style jsx>{`
						@keyframes shimmer {
							0% {
								background-position: -200% 0;
							}
							100% {
								background-position: 200% 0;
							}
						}
					`}</style>
				</motion.div>
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
	const t = useTranslations('profile_view')
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
				return <PaymentSection profile={profile} />
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
