'use client'

import { InstitutionProfileLayout } from '@/components/profile/layouts/InstitutionProfileLayout'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { ProfileWrapper } from '@/components/auth/ProfileWrapper'
import { VerificationWaitingScreen } from '@/components/profile/institution/components/VerificationWaitingScreen'
import { InstitutionInfoRequestBanner } from '@/components/profile/institution/components/InstitutionInfoRequestBanner'
import { useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { InstitutionProfileSection } from '@/components/profile/layouts/InstitutionProfileLayout'
import { ProfileProvider, useProfileContext } from './ProfileContext'

// Map routes to sections (handle both base and sub-routes)
const getActiveSection = (pathname: string): InstitutionProfileSection => {
	if (
		pathname === '/institution/dashboard' ||
		pathname === '/institution/dashboard/overview'
	) {
		return 'overview'
	}
	if (
		pathname.startsWith('/institution/dashboard/programs') ||
		pathname.startsWith('/institution/dashboard/programmes') ||
		pathname.startsWith('/institution/dashboard/scholarships') ||
		pathname.startsWith('/institution/dashboard/reseach-labs')
	) {
		return 'programs'
	}
	if (pathname.startsWith('/institution/dashboard/applications')) {
		return 'application'
	}
	if (pathname.startsWith('/institution/dashboard/profile')) {
		return 'profile'
	}
	if (pathname.startsWith('/institution/dashboard/settings')) {
		return 'settings'
	}
	if (pathname.startsWith('/institution/dashboard/payment')) {
		return 'payment'
	}
	if (pathname.startsWith('/institution/dashboard/messages')) {
		return 'overview' // Messages doesn't have its own section, use overview
	}
	return 'overview'
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const router = useRouter()
	const { profile, isLoading, error } = useProfileContext()

	// Determine active section from pathname
	const activeSection = getActiveSection(pathname ?? '/institution/dashboard')

	// Redirect applicants to their profile page
	useEffect(() => {
		if (profile && profile.role !== 'institution') {
			router.push('/profile/view')
		}
	}, [profile, router])

	// Handle section change with route navigation
	const handleSectionChange = useCallback(
		(section: InstitutionProfileSection) => {
			// Map section to route
			const routeMap: Record<InstitutionProfileSection, string> = {
				overview: '/institution/dashboard',
				programs: '/institution/dashboard/programs',
				application: '/institution/dashboard/applications',
				profile: '/institution/dashboard/profile',
				settings: '/institution/dashboard/settings',
				payment: '/institution/dashboard/payment',
				students: '/institution/dashboard',
				analytics: '/institution/dashboard',
			}

			const targetRoute = routeMap[section] || '/institution/dashboard'

			// Only navigate if we're changing routes
			if (pathname !== targetRoute) {
				router.push(targetRoute)
			}
		},
		[router, pathname]
	)

	if (isLoading) {
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

	// Check verification status - show waiting screen if NOT APPROVED
	if (profile && profile.role === 'institution') {
		const verificationStatus = profile.verification_status || 'PENDING'

		// Allow access to profile page even if not approved so they can update
		const isProfilePage = pathname.startsWith('/institution/dashboard/profile')

		// Show verification screen for all non-approved statuses (PENDING, REJECTED, REQUIRE_UPDATE, UPDATED, etc.)
		if (verificationStatus !== 'APPROVED' && !isProfilePage) {
			return (
				<InstitutionProfileLayout
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
					profile={profile}
				>
					<VerificationWaitingScreen
						verificationStatus={verificationStatus}
						submittedAt={profile.submitted_at}
						rejectionReason={profile.rejection_reason}
					/>
				</InstitutionProfileLayout>
			)
		}
	}

	return (
		<InstitutionProfileLayout
			activeSection={activeSection}
			onSectionChange={handleSectionChange}
			profile={profile}
		>
			{children}
		</InstitutionProfileLayout>
	)
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
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
				<ProfileProvider>
					<DashboardLayoutContent>{children}</DashboardLayoutContent>
				</ProfileProvider>
			</ProfileWrapper>
		</AuthWrapper>
	)
}
