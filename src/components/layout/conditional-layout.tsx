'use client'

import { usePathname } from 'next/navigation'
import { EduMatchHeader } from './header'
import { Footer } from './footer'

interface ConditionalLayoutProps {
	children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
	const pathname = usePathname()

	// Hide header and footer on create profile pages
	const hideLayout =
		pathname === '/applicant-profile/create' ||
		pathname === '/institution-profile/create'

	// Hide only footer on profile pages and messages page
	const hideFooter =
		pathname.startsWith('/applicant-profile/') ||
		pathname.startsWith('/institution-profile/') ||
		pathname.startsWith('/messages')

	if (hideLayout) {
		return <>{children}</>
	}

	return (
		<>
			<EduMatchHeader />
			{children}
			{!hideFooter && <Footer />}
		</>
	)
}
