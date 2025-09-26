'use client'

import { usePathname } from 'next/navigation'
import { EduMatchHeader } from './header'
import { Footer } from './footer'

interface ConditionalLayoutProps {
	children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
	const pathname = usePathname()

	// Hide header and footer on create profile page
	const hideLayout = pathname === '/profile/create-profile'

	if (hideLayout) {
		return <>{children}</>
	}

	return (
		<>
			<EduMatchHeader />
			{children}
			<Footer />
		</>
	)
}
