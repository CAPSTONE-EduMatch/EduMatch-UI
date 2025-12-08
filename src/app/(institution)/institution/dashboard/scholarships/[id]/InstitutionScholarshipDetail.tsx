'use client'

import { Button } from '@/components/ui'
import {
	ApplicantsTable,
	SuggestedApplicantsTable,
	type Applicant,
} from '@/components/profile/institution/components'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import CoverImage from '../../../../../../../public/EduMatch_Default.png'
import { Users, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/modals/Modal'

const InstitutionScholarshipDetail = () => {
	const router = useRouter()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('detail')
	const [currentScholarship, setCurrentScholarship] = useState<any>(null)
	const [isLoadingScholarship, setIsLoadingScholarship] = useState(true)
	const [isLoadingApplications, setIsLoadingApplications] = useState(false)
	const [transformedApplicants, setTransformedApplicants] = useState<
		Applicant[]
	>([])
	const [suggestedApplicants, setSuggestedApplicants] = useState<Applicant[]>(
		[]
	)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	// Notification system
	const { showError, showSuccess } = useNotification()

	// Dynamic info items based on current scholarship data
	const infoItems = [
		{
			label: 'Amount',
			value: currentScholarship?.amount || 'N/A',
		},
		{
			label: 'Type',
			value: currentScholarship?.type || 'N/A',
		},
		{
			label: 'Application deadline',
			value:
				currentScholarship?.date ||
				currentScholarship?.applicationDeadline ||
				'N/A',
		},
		{
			label: 'Start Date',
			value: currentScholarship?.startDate || 'N/A',
		},
		{
			label: 'Location',
			value:
				currentScholarship?.location || currentScholarship?.country || 'N/A',
		},
		{
			label: 'Status',
			value: currentScholarship?.status || 'N/A',
		},
	]

	// Fetch scholarship details from API
	const fetchScholarshipDetail = async (scholarshipId: string) => {
		try {
			setIsLoadingScholarship(true)
			const response = await fetch(
				`/api/explore/scholarships/scholarship-detail?id=${scholarshipId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				setCurrentScholarship(data.data)
				return data.data
			} else {
				showError('Error', 'Failed to load scholarship details')
				return null
			}
		} catch (error) {
			showError('Error', 'Failed to load scholarship details')
			return null
		} finally {
			setIsLoadingScholarship(false)
		}
	}

	// Helper function to format date
	const formatDate = (dateString: string | Date) => {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		const day = date.getDate().toString().padStart(2, '0')
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const year = date.getFullYear()
		return `${day}/${month}/${year}`
	}

	// Transform applications to match Applicant interface
	const transformApplications = (apps: any[]): Applicant[] => {
		if (!Array.isArray(apps)) {
			return []
		}

		return apps.map((app) => {
			return {
				id: app.id || app.application_id || '',
				postId: app.postId || app.post_id || (params?.id as string),
				name: app.name || 'Unknown',
				appliedDate:
					app.appliedDate || app.applied_date || formatDate(new Date()),
				degreeLevel: app.degreeLevel || app.degree_level || 'Unknown',
				subDiscipline:
					app.subDiscipline ||
					app.sub_discipline ||
					app.subdiscipline ||
					'Unknown',
				status: (app.status?.toLowerCase() || 'submitted') as
					| 'submitted'
					| 'under_review'
					| 'accepted'
					| 'rejected'
					| 'new_request',
				matchingScore: app.matchingScore || app.matching_score || 0,
				userId: app.userId || app.user_id,
				gpa: app.snapshotData?.gpa || app.gpa || undefined,
				postType: app.postType || 'Scholarship', // Preserve postType from API
			}
		})
	}

	// Fetch applications for this scholarship
	const fetchApplications = async (scholarshipId: string) => {
		try {
			setIsLoadingApplications(true)
			const response = await fetch(
				`/api/applications/institution?postId=${scholarshipId}&page=1&limit=100`
			)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()

			// The API returns applications in data.data, not data.applications
			const applications = data.data || []

			if (
				data.success &&
				Array.isArray(applications) &&
				applications.length > 0
			) {
				const transformed = transformApplications(applications)
				setTransformedApplicants(transformed)
				// For suggested applicants, filter by high matching score (80+)
				const suggested = transformed
					.filter((app) => app.matchingScore >= 80)
					.sort((a, b) => b.matchingScore - a.matchingScore)
					.slice(0, 10)
				setSuggestedApplicants(suggested)
			} else {
				setTransformedApplicants([])
				setSuggestedApplicants([])
			}
		} catch (error) {
			// Failed to fetch applications
			setTransformedApplicants([])
			setSuggestedApplicants([])
		} finally {
			setIsLoadingApplications(false)
		}
	}

	// Load scholarship data when component mounts
	useEffect(() => {
		const loadScholarshipData = async () => {
			// Get scholarship ID from URL params
			const scholarshipId = params?.id as string

			if (!scholarshipId) {
				showError('Error', 'Scholarship ID is required')
				return
			}

			// Fetch scholarship data from API
			const scholarshipData = await fetchScholarshipDetail(scholarshipId)

			if (scholarshipData) {
				// Fetch applications for this scholarship
				await fetchApplications(scholarshipId)
			}
		}

		loadScholarshipData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id])

	const handleEditScholarship = () => {
		// Navigate to edit scholarship page
		router.push(
			`/institution/dashboard/programs?action=edit&type=Scholarship&id=${params?.id}`
		)
	}

	const handleViewApplications = () => {
		// Navigate to applications section
		router.push(`/institution/dashboard/applications?postId=${params?.id}`)
	}

	const handleApplicantDetail = (applicant: Applicant) => {
		// Navigate to applicant detail view
		router.push(`/institution/dashboard/applications/${applicant.id}`)
	}

	const handleDeleteScholarship = async () => {
		try {
			setIsDeleting(true)
			const response = await fetch(
				`/api/posts/scholarships?postId=${params?.id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to delete scholarship')
			}

			showSuccess('Success', 'Scholarship deleted successfully')
			setIsDeleteModalOpen(false)
			// Redirect to programs page
			router.push('/institution/dashboard/programs')
		} catch (error) {
			showError(
				'Error',
				error instanceof Error ? error.message : 'Failed to delete scholarship'
			)
		} finally {
			setIsDeleting(false)
		}
	}

	const handleCloseScholarship = async () => {
		try {
			const response = await fetch(`/api/posts/scholarships`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					postId: params?.id,
					status: 'CLOSED',
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to close scholarship')
			}

			const result = await response.json()

			if (result.success) {
				// Refresh scholarship data
				const scholarshipId = params?.id as string
				await fetchScholarshipDetail(scholarshipId)
			} else {
				showError('Error', result.error || 'Failed to close scholarship')
			}
		} catch (error) {
			showError('Error', 'Failed to close scholarship')
		}
	}

	const getStatusColor = (status: string) => {
		switch (status?.toUpperCase()) {
			case 'PUBLISHED':
				return 'bg-green-100 text-green-800'
			case 'DRAFT':
				return 'bg-gray-100 text-gray-800'
			case 'CLOSED':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const menuItems = [
		{ id: 'detail', label: 'Detail' },
		{ id: 'eligibility', label: 'Eligibility' },
		{ id: 'requirements', label: 'Requirements' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'detail':
				return (
					<div className="space-y-6">
						{currentScholarship?.description && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Description:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentScholarship.description,
									}}
								/>
							</div>
						)}

						{currentScholarship?.scholarshipCoverage && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Scholarship Coverage:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentScholarship.scholarshipCoverage,
									}}
								/>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="font-bold text-gray-900">Amount:</p>
								<p className="text-gray-700">
									{currentScholarship?.amount || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Type:</p>
								<p className="text-gray-700">
									{currentScholarship?.type || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Number Available:</p>
								<p className="text-gray-700">
									{currentScholarship?.number || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Days Left:</p>
								<p className="text-gray-700">
									{currentScholarship?.daysLeft !== undefined
										? `${currentScholarship.daysLeft} days`
										: 'N/A'}
								</p>
							</div>
						</div>
					</div>
				)

			case 'eligibility':
				return (
					<div className="space-y-6">
						{currentScholarship?.eligibility && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Eligibility Requirements:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentScholarship.eligibility,
									}}
								/>
							</div>
						)}

						{currentScholarship?.subdisciplines &&
							currentScholarship.subdisciplines.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-2">
										Subdisciplines:
									</p>
									<div className="flex flex-wrap gap-2">
										{currentScholarship.subdisciplines.map((sub: any) => (
											<span
												key={sub.id}
												className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
											>
												{sub.name}
											</span>
										))}
									</div>
								</div>
							)}
					</div>
				)

			case 'requirements':
				return (
					<div className="space-y-6">
						{currentScholarship?.requiredDocuments &&
							currentScholarship.requiredDocuments.length > 0 && (
								<div>
									<h3 className="text-xl font-bold text-gray-900 mb-4">
										Required Documents:
									</h3>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentScholarship.requiredDocuments.map((doc: any) => (
											<li key={doc.id}>
												<span className="font-semibold">{doc.name}</span>
												{doc.description && <span>: {doc.description}</span>}
											</li>
										))}
									</ul>
								</div>
							)}

						<div>
							<p className="font-bold text-gray-900 mb-2">Essay Required:</p>
							<p className="text-gray-700">
								{currentScholarship?.essayRequired || 'No'}
							</p>
						</div>
					</div>
				)

			default:
				return null
		}
	}

	if (isLoadingScholarship) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#126E64] mx-auto"></div>
					<p className="mt-4 text-muted-foreground">
						Loading scholarship details...
					</p>
				</div>
			</div>
		)
	}

	if (!currentScholarship) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">Scholarship Not Found</h2>
					<p className="text-muted-foreground mb-4">
						The scholarship you&apos;re looking for doesn&apos;t exist or has
						been removed.
					</p>
					<Button
						onClick={() => router.push('/institution/dashboard/programs')}
						className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
					>
						Back to Programs
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header Section with Cover Image */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative h-[500px] w-full"
			>
				{currentScholarship?.institution?.coverImage ? (
					<ProtectedImage
						src={currentScholarship.institution.coverImage}
						alt={currentScholarship?.institution?.name || 'University'}
						fill
						className="object-cover"
						expiresIn={7200}
						autoRefresh={true}
					/>
				) : (
					<Image
						src={CoverImage}
						alt={currentScholarship?.institution?.name || 'University'}
						fill
						className="object-cover"
						priority
					/>
				)}

				<div className="container mx-auto px-4 h-full relative">
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="absolute bottom-0 right-4 translate-y-1/3 bg-white rounded-2xl shadow-xl p-8 max-w-lg flex flex-col justify-center items-center"
					>
						<h1 className="text-3xl font-bold mb-2">
							{currentScholarship?.title || 'Loading...'}
						</h1>
						<p className="text-gray-600 mb-6">
							{currentScholarship?.institution?.name || 'Loading...'}
						</p>

						<div className="flex items-center gap-3 mb-4">
							{currentScholarship?.status === 'DRAFT' && (
								<>
									<Button
										onClick={handleEditScholarship}
										variant="outline"
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
									>
										Edit Scholarship
									</Button>
									<Button
										onClick={() => setIsDeleteModalOpen(true)}
										variant="outline"
										className="text-red-600 border-red-600 hover:bg-red-50"
									>
										Delete
									</Button>
								</>
							)}
							{currentScholarship?.status?.toUpperCase() === 'PUBLISHED' && (
								<Button
									onClick={handleCloseScholarship}
									variant="outline"
									className="text-orange-600 border-orange-600 hover:bg-orange-50"
								>
									Close Scholarship
								</Button>
							)}
							<span
								className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentScholarship?.status || '')}`}
							>
								{currentScholarship?.status || 'DRAFT'}
							</span>
						</div>

						<p className="text-sm text-gray-500">
							Number of applications: {transformedApplicants.length}
						</p>
					</motion.div>
				</div>
			</motion.div>

			{/* Main Content */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Breadcrumb */}
				<div className="mb-6"></div>

				{/* Info Cards */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border"
				>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-6 gap-6">
							{infoItems.map((item, index) => (
								<div key={index} className="text-center md:text-left">
									<p className="text-sm text-gray-500 mb-1">{item.label}</p>
									<p className="font-semibold text-gray-900">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</motion.div>

				{/* About Section */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
						{currentScholarship?.institution?.about ? (
							<div
								dangerouslySetInnerHTML={{
									__html: currentScholarship.institution.about,
								}}
							/>
						) : (
							<p>No description available.</p>
						)}
					</div>
				</motion.div>

				{/* Tab Content Section */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 bg-white py-6 shadow-xl border">
					{/* Left Sidebar Menu */}
					<motion.aside
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="lg:col-span-1"
					>
						<div className="space-y-2 border-r h-full border-gray-200 pr-4">
							{menuItems.map((item) => (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full text-left px-6 py-3 rounded-full transition-all ${
										activeTab === item.id
											? 'bg-teal-100 text-teal-700 font-semibold'
											: 'text-gray-700 hover:bg-gray-100 font-medium'
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
					</motion.aside>

					{/* Right Content - Dynamic Tab Content */}
					<motion.div
						initial={{ x: 20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="lg:col-span-3"
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								{renderTabContent()}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				</div>

				{/* Applications Table Section - Only show for CLOSED or PUBLISHED status */}
				{(currentScholarship?.status?.toUpperCase() === 'CLOSED' ||
					currentScholarship?.status?.toUpperCase() === 'PUBLISHED') && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.6 }}
						className="p-8 bg-white py-6 shadow-xl border"
					>
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold">Applications</h2>
							<Button
								onClick={handleViewApplications}
								className="bg-[#126E64] hover:bg-teal-700 text-white"
								size="sm"
							>
								View All Applications
							</Button>
						</div>

						{/* Applicants Table */}
						{isLoadingApplications ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#126E64] mx-auto"></div>
								<p className="mt-2 text-gray-600">Loading applications...</p>
							</div>
						) : transformedApplicants.length > 0 ? (
							<div className="border bg-white border-gray-200 rounded-xl p-6">
								<ApplicantsTable
									applicants={transformedApplicants}
									onMoreDetail={handleApplicantDetail}
									hidePostId={true}
								/>
							</div>
						) : (
							<div className="text-center py-8 bg-gray-50 rounded-lg">
								<Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
								<p className="text-gray-600">No applications yet</p>
							</div>
						)}
					</motion.div>
				)}

				{/* Suggested Applicants Section - Always show for PUBLISHED status */}
				{currentScholarship?.status?.toUpperCase() === 'PUBLISHED' && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.7 }}
						className="p-8 bg-white py-6 shadow-xl border"
					>
						<h2 className="text-3xl font-bold mb-6">Suggested Applicants</h2>
						<p className="text-gray-600 mb-6">
							These applicants have high matching scores (80%+) and may be a
							good fit for this scholarship.
						</p>
						{suggestedApplicants.length > 0 ? (
							<div className="border bg-white border-gray-200 rounded-xl p-6">
								<SuggestedApplicantsTable
									applicants={suggestedApplicants}
									onMoreDetail={handleApplicantDetail}
								/>
							</div>
						) : (
							<div className="text-center py-8 bg-gray-50 rounded-lg">
								<Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
								<p className="text-gray-600">No suggested applicants yet</p>
							</div>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title="Delete Scholarship"
				maxWidth="md"
			>
				<div className="space-y-6">
					{/* Warning Icon */}
					<div className="flex justify-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
							<Trash2 className="w-8 h-8 text-red-600" />
						</div>
					</div>

					{/* Warning Message */}
					<div className="text-center">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Are you sure you want to delete this scholarship?
						</h3>
						<p className="text-gray-600 mb-4">
							This action cannot be undone. This will permanently delete the
							scholarship post and all associated data.
						</p>
						{currentScholarship?.title && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
								<p className="text-sm text-red-800 font-medium">
									Scholarship: {currentScholarship.title}
								</p>
							</div>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 pt-4">
						<Button
							type="button"
							onClick={() => setIsDeleteModalOpen(false)}
							variant="outline"
							className="flex-1 py-3"
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleDeleteScholarship}
							className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<div className="flex items-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									Deleting...
								</div>
							) : (
								'Delete Scholarship'
							)}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default InstitutionScholarshipDetail
