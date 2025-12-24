'use client'

import { UserManagementTable } from '@/components/admin/UserManagementTable'
import PasswordCriteriaChecker, {
	PasswordCriteriaType,
} from '@/components/auth/PasswordCriteriaChecker'
import { Button, Card, CardContent, Input } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { authClient } from '@/config/auth-client'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminUserManagement() {
	const [activeTab, setActiveTab] = useState<
		'applicants' | 'institutions' | 'admins'
	>('applicants')
	const [isClient, setIsClient] = useState(false)
	const router = useRouter()

	// Create Admin Modal State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		role: 'admin' as 'user' | 'admin',
	})
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [passwordCriteria, setPasswordCriteria] =
		useState<PasswordCriteriaType>({
			length: false,
			uppercase: false,
			lowercase: false,
			number: false,
			special: false,
		})
	const [passwordIsValid, setPasswordIsValid] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	useEffect(() => {
		const password = formData.password
		const criteria = {
			length: password.length >= 12,
			uppercase: /[A-Z]/.test(password),
			lowercase: /[a-z]/.test(password),
			number: /\d/.test(password),
			special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
		}
		setPasswordCriteria(criteria)
		setPasswordIsValid(Object.values(criteria).every(Boolean))
	}, [formData.password])

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

	const handleCreateAdmin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setSuccess('')
		setIsLoading(true)

		try {
			const { data: newUser, error } = await authClient.admin.createUser({
				email: formData.email,
				password: formData.password,
				name: formData.name,
				role: 'admin',
			})

			if (error) {
				setError(error.message || 'Failed to create admin user')
				return
			}

			setSuccess(
				`Admin user ${newUser?.user?.name || formData.name} created successfully!`
			)
			setFormData({
				name: '',
				email: '',
				password: '',
				role: 'admin',
			})

			// Close modal after 2 seconds
			setTimeout(() => {
				setIsCreateModalOpen(false)
				setSuccess('')
			}, 2000)
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Unknown error occurred'
			)
		} finally {
			setIsLoading(false)
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
				<div className="px-8 pt-20 flex justify-between items-center">
					<div className="flex-1 text-center">
						<h1 className="text-4xl font-bold text-[#126E64]">
							User Management
						</h1>
					</div>
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
										onAddAdmin={() => setIsCreateModalOpen(true)}
									/>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>

			{/* Create Admin Modal */}
			{isCreateModalOpen && (
				<Modal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					title="Create New Admin"
				>
					<form onSubmit={handleCreateAdmin} className="space-y-6">
						{/* Success Message */}
						{success && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-center">
									<svg
										className="w-5 h-5 text-green-500 mr-2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path d="M5 13l4 4L19 7"></path>
									</svg>
									<p className="text-green-700">{success}</p>
								</div>
							</div>
						)}

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-center">
									<svg
										className="w-5 h-5 text-red-500 mr-2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
									<p className="text-red-700">{error}</p>
								</div>
							</div>
						)}

						{/* Form Fields */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Full Name <span className="text-red-500">*</span>
							</label>
							<Input
								type="text"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Enter admin's full name"
								required
								className="w-full"
								disabled={isLoading}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Email Address <span className="text-red-500">*</span>
							</label>
							<Input
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="Enter admin's email"
								required
								className="w-full"
								disabled={isLoading}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Password <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<Input
									type={showPassword ? 'text' : 'password'}
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									placeholder="Enter secure password"
									required
									minLength={8}
									className="w-full pr-12"
									disabled={isLoading}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
									disabled={isLoading}
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
							<div className="mt-2">
								<PasswordCriteriaChecker
									criteria={passwordCriteria}
									hasInput={formData.password.length > 0}
								/>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 pt-4">
							<Button
								type="button"
								onClick={() => setIsCreateModalOpen(false)}
								className="flex-1 bg-gray-400 hover:bg-gray-500 text-white border-0"
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="flex-1 bg-[#126E64] hover:bg-[#0f5a52] text-white"
								disabled={
									isLoading ||
									!formData.name ||
									!formData.email ||
									!formData.password ||
									!passwordIsValid
								}
							>
								{isLoading ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Creating...
									</div>
								) : (
									'Create Admin'
								)}
							</Button>
						</div>
					</form>
				</Modal>
			)}
		</div>
	)
}
