'use client'

import { usePathname } from 'next/navigation'
import { EduMatchHeader } from './header'
import { Footer } from './footer'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useUserProfile } from '@/hooks/profile/useUserProfile'

interface ConditionalLayoutProps {
	children: React.ReactNode
}

const hideFooterPaths = ['/profile/', '/admin/', '/messages', '/institution/']
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
	const pathname = usePathname()
	const { user } = useAuthCheck()
	const { profile, isLoading: profileLoading } = useUserProfile()

	// Removed profile update listener to prevent excessive API calls
	// Layout decisions can be made with cached profile data

	// Hide header and footer on create profile pages and institution dashboard
	const hideLayout =
		// pathname.startsWith('/profile/create') ||
		pathname?.startsWith('/institution/')

	// Hide header for institution role on profile view pages, institution dashboard, and messages
	// Show header for applicants on messages page
	const hideHeader =
		// pathname.startsWith('/profile/create') ||
		pathname?.startsWith('/institution/') ||
		(pathname?.startsWith('/profile/view') &&
			(profile?.role === 'institution' || profileLoading)) ||
		(pathname?.startsWith('/messages') &&
			profile?.role === 'institution' &&
			!profileLoading)

	// Hide only footer on profile pages and messages page
	const hideFooter = hideFooterPaths.some((path) => pathname?.startsWith(path))

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
