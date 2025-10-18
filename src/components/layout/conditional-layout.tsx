'use client'

import { usePathname } from 'next/navigation'
import { EduMatchHeader } from './header'
import { Footer } from './footer'

interface ConditionalLayoutProps {
	children: React.ReactNode
}

const hideFooterPaths = ['/applicant-profile/', '/admin/']

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
	const pathname = usePathname()

	// Hide header and footer on create profile page
	const hideLayout = pathname === '/applicant-profile/create'

	// Hide only footer on profile pages and messages page
	const hideFooter = hideFooterPaths.some((path) => pathname.startsWith(path))

	if (hideLayout) {
		return <>{children}</>
	}

	return (
		<>
			{/* <EduMatchHeader /> */}
			{children}
			{!hideFooter && <Footer />}
		</>
	)
}
