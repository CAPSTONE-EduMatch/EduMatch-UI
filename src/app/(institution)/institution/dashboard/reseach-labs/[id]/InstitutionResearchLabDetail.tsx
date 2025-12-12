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

const InstitutionResearchLabDetail = () => {
	const router = useRouter()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('job-description')
	const [currentResearchLab, setCurrentResearchLab] = useState<any>(null)
	const [isLoadingResearchLab, setIsLoadingResearchLab] = useState(true)
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

	// Dynamic info items based on current research lab data
	const infoItems = [
		{
			label: 'Salary',
			value: currentResearchLab?.salary || 'N/A',
		},
		{
			label: 'Country',
			value: currentResearchLab?.country || 'N/A',
		},
		{
			label: 'Job type',
			value: currentResearchLab?.jobType || 'N/A',
		},
		{
			label: 'Application deadline',
			value: currentResearchLab?.applicationDeadline || 'N/A',
		},
		{
			label: 'Location',
			value: currentResearchLab?.location || 'N/A',
		},
		{
			label: 'Status',
			value: currentResearchLab?.status || 'N/A',
		},
	]

	// Fetch research lab details from API
	const fetchResearchLabDetail = async (researchLabId: string) => {
		try {
			setIsLoadingResearchLab(true)
			const response = await fetch(
				`/api/explore/research/research-detail?id=${researchLabId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				setCurrentResearchLab(data.data)
				return data.data
			} else {
				showError('Error', 'Failed to load research lab details')
				return null
			}
		} catch (error) {
			showError('Error', 'Failed to load research lab details')
			return null
		} finally {
			setIsLoadingResearchLab(false)
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
				postType: app.postType || 'Research Lab', // Preserve postType from API
			}
		})
	}

	// Fetch applications for this research lab
	const fetchApplications = async (researchLabId: string) => {
		try {
			setIsLoadingApplications(true)
			const response = await fetch(
				`/api/applications/institution?postId=${researchLabId}&page=1&limit=100`
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

	// Load research lab data when component mounts
	useEffect(() => {
		const loadResearchLabData = async () => {
			// Get research lab ID from URL params
			const researchLabId = params?.id as string

			if (!researchLabId) {
				showError('Error', 'Research Lab ID is required')
				return
			}

			// Fetch research lab data from API
			const researchLabData = await fetchResearchLabDetail(researchLabId)

			if (researchLabData) {
				// Fetch applications for this research lab
				await fetchApplications(researchLabId)
			}
		}

		loadResearchLabData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id])

	const handleEditResearchLab = () => {
		// Navigate to edit research lab page
		router.push(
			`/institution/dashboard/programs?action=edit&type=Research Lab&id=${params?.id}`
		)
	}

	const handleViewApplications = () => {
		// Navigate to applications section with filter for this post
		router.push(`/institution/dashboard/applications?postId=${params?.id}`)
	}

	const handleApplicantDetail = (applicant: Applicant) => {
		// Navigate to applicant detail view
		router.push(`/institution/dashboard/applications/${applicant.id}`)
	}

	const handleDeleteResearchLab = async () => {
		try {
			setIsDeleting(true)
			const response = await fetch(`/api/posts/research?postId=${params?.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to delete research lab')
			}

			showSuccess('Success', 'Research lab deleted successfully')
			setIsDeleteModalOpen(false)
			// Redirect to programs page
			router.push('/institution/dashboard/programs')
		} catch (error) {
			showError(
				'Error',
				error instanceof Error ? error.message : 'Failed to delete research lab'
			)
		} finally {
			setIsDeleting(false)
		}
	}

	const handleCloseResearchLab = async () => {
		try {
			const response = await fetch(`/api/posts/research`, {
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
				throw new Error('Failed to close research lab')
			}

			const result = await response.json()

			if (result.success) {
				// Refresh research lab data
				const researchLabId = params?.id as string
				await fetchResearchLabDetail(researchLabId)
			} else {
				showError('Error', result.error || 'Failed to close research lab')
			}
		} catch (error) {
			showError('Error', 'Failed to close research lab')
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
		{ id: 'job-description', label: 'Job Description' },
		{ id: 'offer-information', label: 'Offer Information' },
		{ id: 'job-requirements', label: 'Job Requirements' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'job-description':
				return (
					<div className="space-y-4">
						<ol className="space-y-4">
							{currentResearchLab?.researchFields &&
								(currentResearchLab.researchFields.length > 0 ||
									typeof currentResearchLab.researchFields === 'string') && (
									<li className="text-base">
										<span className="font-bold text-gray-900">
											Research Fields:
										</span>
										<div
											className="mt-2 prose prose-content max-w-none"
											dangerouslySetInnerHTML={{
												__html: Array.isArray(currentResearchLab.researchFields)
													? currentResearchLab.researchFields.join(', ')
													: currentResearchLab.researchFields,
											}}
										/>
									</li>
								)}
							<li className="text-base">
								<span className="font-bold text-gray-900">Start Date:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.startDate || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									Application Deadline:
								</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.applicationDeadline || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">Country:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.country || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">Contract Type:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.contractType || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">Attendance:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.attendance || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">Job Type:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.jobType || 'Researcher'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									Detail Description:
								</span>
								<div
									className="mt-2 text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html:
											currentResearchLab?.description ||
											currentResearchLab?.mainResponsibility ||
											'No description available',
									}}
								/>
							</li>
						</ol>
					</div>
				)

			case 'job-requirements':
				return (
					<div className="space-y-6">
						{currentResearchLab?.mainResponsibility && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										Main Responsibilities:
									</span>
								</p>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.mainResponsibility,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.qualificationRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Qualification Requirements:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.qualificationRequirement,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.experienceRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Experience Requirements:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.experienceRequirement,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.assessmentCriteria && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Assessment Criteria:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.assessmentCriteria,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.otherRequirement && (
							<div>
								<p className="text-base">
									<span className="font-bold text-gray-900">
										Other Requirements:
									</span>
								</p>
								<div
									className="mt-2 text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.otherRequirement,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.technicalSkills && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Technical Skills:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{currentResearchLab.technicalSkills}
								</div>
							</div>
						)}

						{currentResearchLab?.academicBackground && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Academic Background:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{currentResearchLab.academicBackground}
								</div>
							</div>
						)}
					</div>
				)

			case 'offer-information':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Salary:</span>{' '}
								<span className="text-gray-700">
									{currentResearchLab?.salary || 'N/A'}
								</span>
							</p>
							{currentResearchLab?.salaryDescription && (
								<p className="text-sm text-gray-600">
									{currentResearchLab.salaryDescription}
								</p>
							)}
						</div>

						{currentResearchLab?.benefit && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Benefits:</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.benefit,
									}}
								/>
							</div>
						)}
					</div>
				)

			default:
				return null
		}
	}

	if (isLoadingResearchLab) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#126E64] mx-auto"></div>
					<p className="mt-4 text-muted-foreground">
						Loading research lab details...
					</p>
				</div>
			</div>
		)
	}

	if (!currentResearchLab) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">Research Lab Not Found</h2>
					<p className="text-muted-foreground mb-4">
						The research lab you&apos;re looking for doesn&apos;t exist or has
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
				{currentResearchLab?.institution?.coverImage ? (
					<ProtectedImage
						src={currentResearchLab.institution.coverImage}
						alt={currentResearchLab?.institution?.name || 'University'}
						fill
						className="object-cover"
						expiresIn={7200}
						autoRefresh={true}
					/>
				) : (
					<Image
						src={CoverImage}
						alt={currentResearchLab?.institution?.name || 'University'}
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
							{currentResearchLab?.title || 'Loading...'}
						</h1>
						<p className="text-gray-600 mb-6">
							{currentResearchLab?.institution?.name || 'Loading...'}
						</p>

						<div className="flex items-center gap-3 mb-4">
							{currentResearchLab?.status === 'DRAFT' && (
								<>
									<Button
										onClick={handleEditResearchLab}
										variant="outline"
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
									>
										Edit Research Lab
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
							{currentResearchLab?.status?.toUpperCase() === 'PUBLISHED' && (
								<Button
									onClick={handleCloseResearchLab}
									variant="outline"
									className="text-orange-600 border-orange-600 hover:bg-orange-50"
								>
									Close Research Lab
								</Button>
							)}
							<span
								className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentResearchLab?.status || '')}`}
							>
								{currentResearchLab?.status || 'DRAFT'}
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
					className="bg-white py-6 shadow-xl border mt-6"
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
						{currentResearchLab?.institution?.about ? (
							<div
								dangerouslySetInnerHTML={{
									__html: currentResearchLab.institution.about,
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
				{(currentResearchLab?.status?.toUpperCase() === 'CLOSED' ||
					currentResearchLab?.status?.toUpperCase() === 'PUBLISHED') && (
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
				{currentResearchLab?.status?.toUpperCase() === 'PUBLISHED' && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.7 }}
						className="p-8 bg-white py-6 shadow-xl border"
					>
						<h2 className="text-3xl font-bold mb-6">Suggested Applicants</h2>
						<p className="text-gray-600 mb-6">
							These applicants have high matching scores (80%+) and may be a
							good fit for this research lab.
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
				title="Delete Research Lab"
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
							Are you sure you want to delete this research lab?
						</h3>
						<p className="text-gray-600 mb-4">
							This action cannot be undone. This will permanently delete the
							research lab post and all associated data.
						</p>
						{currentResearchLab?.title && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
								<p className="text-sm text-red-800 font-medium">
									Research Lab: {currentResearchLab.title}
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
							onClick={handleDeleteResearchLab}
							className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<div className="flex items-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									Deleting...
								</div>
							) : (
								'Delete Research Lab'
							)}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default InstitutionResearchLabDetail
