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
	const hideLayout = pathname.startsWith('/profile/create')

	// Hide only footer on profile pages and messages page
	const hideFooter =
		pathname.startsWith('/messages') ||
		pathname.startsWith('/applicant-profile/') ||
		pathname.startsWith('/institution-profile/')

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
