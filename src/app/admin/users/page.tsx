'use client'

import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'
import { Card, CardContent } from '@/components/ui'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, Users } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const sidebarItems = [
	{ id: 'dashboard', icon: Users, label: 'Dashboard' },
	{ id: 'certifications', icon: GraduationCap, label: 'Certifications' },
	{ id: 'posts', icon: Building2, label: 'Posts' },
	{ id: 'discipline', icon: Building2, label: 'Discipline' },
	{ id: 'user', icon: Users, label: 'User', active: true },
	{ id: 'plan', icon: Building2, label: 'Plan' },
	{ id: 'transaction', icon: Building2, label: 'Transaction' },
	{ id: 'supports', icon: Building2, label: 'Supports' },
	{ id: 'track-user-log', icon: Building2, label: 'Track user log' },
	{ id: 'logout', icon: Building2, label: 'Log out' },
]

// Logo section for admin sidebar
const AdminLogoSection = () => (
	<div className="flex flex-col items-center justify-center mb-12 pt-8">
		{/* Use Next.js Image for optimized loading */}
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

export default function AdminUserManagement() {
	const [activeTab, setActiveTab] = useState<'applicants' | 'institutions'>(
		'applicants'
	)
	const [isClient, setIsClient] = useState(false)
	const router = useRouter()
	const { isAdmin, isLoading } = useAdminAuth()

	useEffect(() => {
		setIsClient(true)
	}, [])

	const tabs = [
		{ id: 'applicants', label: 'Applicants' },
		{ id: 'institutions', label: 'Institutions' },
	]

	const handleViewDetails = (userId: string) => {
		if (activeTab === 'institutions') {
			router.push(`/admin/institutions/${userId}`)
		} else {
			router.push(`/admin/users/${userId}`)
		}
	}

	const handleSectionChange = (section: string) => {
		switch (section) {
			case 'user':
				router.push('/admin/users')
				break
			case 'institution':
				router.push('/admin/institutions')
				break
			case 'dashboard':
				router.push('/admin/dashboard')
				break
			case 'certifications':
				router.push('/admin/certifications')
				break
			case 'posts':
				router.push('/admin/posts')
				break
			case 'discipline':
				router.push('/admin/discipline')
				break
			case 'plan':
				router.push('/admin/plan')
				break
			case 'transaction':
				router.push('/admin/transaction')
				break
			case 'supports':
				router.push('/admin/supports')
				break
			case 'track-user-log':
				router.push('/admin/track-user-log')
				break
			case 'logout':
				// Handle logout logic here
				if (confirm('Are you sure you want to log out?')) {
					router.push('/auth/login')
				}
				break
			default:
				// Stay on current page for unknown sections
				break
		}
	}

	// Show loading while checking admin auth or client hydration
	if (!isClient || isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	// Admin auth hook handles redirect if user is not admin
	// If we reach this point, user is authorized

	return (
		<div className="min-h-screen bg-[#F5F7FB] flex">
			{/* Sidebar */}
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10">
				<ProfileSidebar
					activeSection="user"
					onSectionChange={handleSectionChange}
					navItems={sidebarItems}
					showProfileSection={false}
					logoSection={<AdminLogoSection />}
					enableNavigationProtection={false}
					sidebarStyle={{
						activeItemBgColor: 'bg-white/10',
						activeItemTextColor: 'text-white',
						activeItemBorder: 'border border-white/20',
						inactiveItemTextColor: 'text-white/80',
						itemBorderRadius: 'rounded-full',
						itemPadding: 'px-4 py-3',
						itemSpacing: 'mb-2',
					}}
					containerPaddingTop="pt-0"
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1 ml-[289px]">
				<div className=" px-8 pt-20 flex justify-center items-center text-4xl font-bold text-[#126E64]">
					User Management
				</div>

				{/* Page Content */}
				<div className="p-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="space-y-6"
					>
						{/* Tab Navigation */}
						<div className="flex justify-center mb-8">
							<div className="bg-white rounded-full p-1 shadow-lg">
								{tabs.map((tab) => (
									<button
										key={tab.id}
										onClick={() =>
											setActiveTab(tab.id as 'applicants' | 'institutions')
										}
										className={`px-8 py-3 rounded-full text-lg font-semibold transition-all ${
											activeTab === tab.id
												? 'bg-[#126E64] text-white shadow-md'
												: 'text-gray-600 hover:text-[#126E64]'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>
						</div>

						{/* Table Content */}
						<Card className="bg-transparent border-0 shadow-none">
							<CardContent className="p-0">
								{activeTab === 'applicants' ? (
									<UserManagementTable
										userType="applicant"
										onViewDetails={handleViewDetails}
									/>
								) : (
									<UserManagementTable
										userType="institution"
										onViewDetails={handleViewDetails}
									/>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
