'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
	const { isAdmin, isLoading } = useAdminAuth()

	// Determine active section based on pathname
	const getActiveSection = () => {
		if (pathname?.includes('/admin/disciplines')) return 'disciplines'
		if (pathname?.includes('/admin/users')) return 'user'
		if (pathname?.includes('/admin/payments/plans')) return 'plan'
		if (pathname?.includes('/admin/payments')) return 'payment'
		if (pathname?.includes('/admin/institutions')) return 'institution'
		if (pathname?.includes('/admin/certifications')) return 'certifications'
		if (pathname?.includes('/admin/applications')) return 'applications'
		if (pathname?.includes('/admin/support')) return 'supports'
		if (pathname?.includes('/admin/posts')) return 'posts'
		if (pathname?.includes('/admin/settings')) return 'change-password'
		return 'dashboard'
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		)
	}

	// Redirect non-admin users (this should also be handled by middleware)
	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-gray-600">Access denied</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] flex">
			{/* Fixed Admin Sidebar */}
			<AdminSidebar activeSection={getActiveSection()} />

			{/* Main Content Area */}
			<div className="flex-1 ml-[289px]">{children}</div>
		</div>
	)
}
