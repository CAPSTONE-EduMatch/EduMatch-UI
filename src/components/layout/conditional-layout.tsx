'use client'

import { usePathname } from 'next/navigation'
import { EduMatchHeader } from './header'
import { Footer } from './footer'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useEffect } from 'react'

interface ConditionalLayoutProps {
	children: React.ReactNode
}

const hideFooterPaths = ['/profile/', '/admin/', '/messages']
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
	const pathname = usePathname()
	const { user } = useAuthCheck()
	const {
		profile,
		isLoading: profileLoading,
		refreshProfile,
	} = useUserProfile()

	// Listen for profile updates to refresh immediately
	useEffect(() => {
		const handleProfileUpdate = () => {
			refreshProfile()
		}

		window.addEventListener('profileUpdated', handleProfileUpdate)
		return () => {
			window.removeEventListener('profileUpdated', handleProfileUpdate)
		}
	}, [refreshProfile])

	// Hide header and footer on create profile pages
	const hideLayout = pathname.startsWith('/profile/create')

	// Hide header for institution role on profile view pages
	const hideHeader =
		pathname.startsWith('/profile/create') ||
		(pathname.startsWith('/profile/view') &&
			(profile?.role === 'institution' || profileLoading))

	// Hide only footer on profile pages and messages page
	const hideFooter = hideFooterPaths.some((path) => pathname.startsWith(path))

	if (hideLayout) {
		return <>{children}</>
	}

	return (
		<>
			{!hideHeader && <EduMatchHeader />}
			{children}
			{!hideFooter && <Footer />}
		</>
	)
}
