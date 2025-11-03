'use client'

import { ProfileSidebar } from '@/components/profile/layout/ProfileSidebar'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Building2, CreditCard, GraduationCap, Users } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const sidebarItems = [
	{ id: 'dashboard', icon: Users, label: 'Dashboard' },
	{ id: 'certifications', icon: GraduationCap, label: 'Certifications' },
	{ id: 'posts', icon: Building2, label: 'Posts' },
	{ id: 'disciplines', icon: Building2, label: 'Disciplines' },
	{ id: 'user', icon: Users, label: 'User' },
	{ id: 'payment', icon: CreditCard, label: 'Payment' },
	{ id: 'plan', icon: Building2, label: 'Plan' },
	{ id: 'transaction', icon: Building2, label: 'Transaction' },
	{ id: 'supports', icon: Building2, label: 'Supports' },
	{ id: 'track-user-log', icon: Building2, label: 'Track user log' },
	{ id: 'logout', icon: Building2, label: 'Log out' },
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

	const handleSectionChange = (sectionId: string) => {
		switch (sectionId) {
			case 'dashboard':
				router.push('/admin')
				break
			case 'user':
				router.push('/admin/users')
				break
			case 'certifications':
				router.push('/admin/certifications')
				break
			case 'posts':
				router.push('/admin/posts')
				break
			case 'disciplines':
				router.push('/admin/disciplines')
				break
			case 'payment':
				router.push('/admin/payments')
				break
			case 'plan':
				router.push('/admin/payments/plans')
				break
			case 'institution':
				router.push('/admin/institutions')
				break
			case 'logout':
				// Handle logout logic here
				router.push('/signin')
				break
			default:
				// For other sections, you can add more routes as needed
				break
		}
	}

	// Show loading state while checking authentication
	if (isLoading) {
		return (
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10 flex items-center justify-center">
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
		</div>
	)
}
