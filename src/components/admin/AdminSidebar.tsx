'use client'

import { ProfileSidebar } from '@/components/profile/layouts/ProfileSidebar'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { useLogout } from '@/hooks/auth/useLogout'
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal'
import {
	Building2,
	CreditCard,
	FileText,
	LayoutDashboard,
	KeyRound,
	Users,
	BookOpen,
	MessageSquare,
	Wallet,
	LogOut,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const sidebarItems = [
	{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
	{ id: 'posts', icon: FileText, label: 'Posts' },
	{ id: 'applications', icon: Building2, label: 'Applications' },
	{ id: 'disciplines', icon: BookOpen, label: 'Disciplines' },
	{ id: 'user', icon: Users, label: 'User' },
	{ id: 'payment', icon: CreditCard, label: 'Payment' },
	{ id: 'plan', icon: Wallet, label: 'Plan' },
	{ id: 'supports', icon: MessageSquare, label: 'Supports' },
	{ id: 'change-password', icon: KeyRound, label: 'Change Password' },
	{ id: 'logout', icon: LogOut, label: 'Log out' },
]

// Logo section for admin sidebar
const AdminLogoSection = () => (
	<div className="flex flex-col items-center justify-center mb-12 pt-8">
		<Image
			src="/edumatch_logo.svg"
			alt="EduMatch Logo"
			className="w-12 h-12 mb-2"
			width={48}
			height={48}
		/>
		<h1 className="text-white text-2xl font-bold text-center">EduMatch</h1>
	</div>
)

interface AdminSidebarProps {
	activeSection?: string
}

export function AdminSidebar({
	activeSection = 'dashboard',
}: AdminSidebarProps) {
	const router = useRouter()
	const { isAdmin, isLoading } = useAdminAuth()

	// Handle logout with confirmation modal
	const {
		handleLogoutClick,
		handleConfirmLogout,
		handleCancelLogout,
		showConfirmModal,
		isLoggingOut,
	} = useLogout({ redirectTo: '/signin' })

	const handleSectionChange = (sectionId: string) => {
		console.log('clicked section:', sectionId)

		if (sectionId === 'logout') {
			handleLogoutClick()
			return
		}

		const routeMap: Record<string, string> = {
			dashboard: '/admin',
			user: '/admin/users',
			posts: '/admin/posts',
			applications: '/admin/applications',
			disciplines: '/admin/disciplines',
			payment: '/admin/payments',
			plan: '/admin/payments/plans',
			supports: '/admin/support',
			'change-password': '/admin/settings',
		}

		const route = routeMap[sectionId]
		console.log('route to push:', route)

		if (route) {
			router.push(route)
		}
	}

	// Show loading state while checking authentication
	if (isLoading) {
		return (
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-50 flex items-center justify-center">
				<div className="text-white">Loading...</div>
			</div>
		)
	}

	// If not admin, don't show sidebar (this will be handled by the auth check in pages)
	if (!isAdmin) {
		return null
	}

	return (
		<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10">
			<ProfileSidebar
				activeSection={activeSection}
				navItems={sidebarItems}
				onSectionChange={handleSectionChange}
				logoSection={<AdminLogoSection />}
				showProfileSection={false}
				containerPaddingTop="pt-0"
				enableNavigationProtection={false}
				sidebarStyle={{
					bgColor: 'bg-[#126E64]',
					activeItemBgColor: 'bg-white/10',
					activeItemTextColor: 'text-white',
					inactiveItemTextColor: 'text-white/80',
					activeItemBorder: 'border border-white/20',
					itemBorderRadius: 'rounded-full',
					itemPadding: 'px-4 py-3',
					itemSpacing: 'mb-2',
				}}
			/>
			{/* Logout Confirmation Modal */}
			<LogoutConfirmModal
				isOpen={showConfirmModal}
				onClose={handleCancelLogout}
				onConfirm={handleConfirmLogout}
				isLoggingOut={isLoggingOut}
			/>
		</div>
	)
}
