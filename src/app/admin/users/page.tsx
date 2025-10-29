'use client'

import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { Card, CardContent } from '@/components/ui'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminUserManagement() {
	const [activeTab, setActiveTab] = useState<
		'applicants' | 'institutions' | 'admins'
	>('applicants')
	const [isClient, setIsClient] = useState(false)
	const router = useRouter()

	useEffect(() => {
		setIsClient(true)
	}, [])

	const tabs = [
		{ id: 'applicants', label: 'Applicants' },
		{ id: 'institutions', label: 'Institutions' },
		{ id: 'admins', label: 'Admins' },
	]

	const handleViewDetails = (userId: string) => {
		if (activeTab === 'institutions') {
			router.push(`/admin/institutions/${userId}`)
		} else if (activeTab === 'admins') {
			router.push(`/admin/users/${userId}`)
		} else {
			router.push(`/admin/users/${userId}`)
		}
	}

	// Show loading while client is hydrating
	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB]">
			{/* Main Content */}
			<div className="flex-1">
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
											setActiveTab(
												tab.id as 'applicants' | 'institutions' | 'admins'
											)
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
								) : activeTab === 'institutions' ? (
									<UserManagementTable
										userType="institution"
										onViewDetails={handleViewDetails}
									/>
								) : (
									<UserManagementTable
										userType="admin"
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
