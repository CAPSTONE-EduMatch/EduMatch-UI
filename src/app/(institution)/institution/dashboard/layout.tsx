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
import { Building2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
								<Building2 className="w-12 h-12 text-[#126E64]" />
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
							Loading Dashboard
						</h2>
						<p className="text-gray-600 text-sm">
							Preparing your institution dashboard...
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
		const isProfilePage = pathname?.startsWith('/institution/dashboard/profile')

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
