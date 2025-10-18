'use client'

import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { Card, CardContent } from '@/components/ui'

import { motion } from 'framer-motion'
import { Building2, GraduationCap, Users } from 'lucide-react'
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

export default function AdminUserManagement() {
	const [activeTab, setActiveTab] = useState<'applicants' | 'institutions'>(
		'applicants'
	)
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	const tabs = [
		{ id: 'applicants', label: 'Applicants' },
		{ id: 'institutions', label: 'Institutions' },
	]

	const handleViewDetails = (userId: string) => {
		// TODO: Implement view details functionality
		// Navigate to user detail page or open modal
		alert(`View details for user: ${userId}`)
	}

	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] flex">
			{/* Sidebar */}
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10">
				<div className="p-6">
					{/* Logo */}
					<div className="flex items-center gap-3 mb-12">
						<div className="w-8 h-8 bg-white rounded"></div>
						<h1 className="text-white text-2xl font-bold">EduMatch</h1>
					</div>

					{/* Navigation */}
					<nav className="space-y-2">
						{sidebarItems.map((item) => {
							const Icon = item.icon
							const isActive = item.active || false

							return (
								<button
									key={item.id}
									className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-full transition-all ${
										isActive
											? 'bg-white/10 text-white border border-white/20'
											: 'text-white/80 hover:bg-white/5'
									}`}
								>
									<Icon className="w-5 h-5" />
									<span className="text-sm">{item.label}</span>
								</button>
							)
						})}
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 ml-[289px]">
				<div className=" px-8 pt-16 flex justify-between items-center text-2xl font-bold text-[#126E64]">
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
