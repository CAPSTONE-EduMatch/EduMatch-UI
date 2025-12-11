'use client'

import { Button } from '@/components/ui'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import CoverImage from '../../../../../public/EduMatch_Default.png'
import { Trash2 } from 'lucide-react'
import Modal from '@/components/ui/modals/Modal'

const AdminResearchLabDetail = () => {
	const router = useRouter()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('job-description')
	const [currentResearchLab, setCurrentResearchLab] = useState<any>(null)
	const [isLoadingResearchLab, setIsLoadingResearchLab] = useState(true)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showRejectModal, setShowRejectModal] = useState(false)
	const [rejectReason, setRejectReason] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

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

	// Fetch research lab details from explore API (same as institution dashboard)
	const fetchResearchLabDetail = async (researchLabId: string) => {
		try {
			setIsLoadingResearchLab(true)
			const response = await fetch(
				`/api/explore/research/research-detail?id=${researchLabId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				// Use the data directly from explore API (same structure as institution dashboard)
				// The explore API already includes status and all other fields
				setCurrentResearchLab(data.data)

				// Auto-update status to PROGRESSING when admin views a SUBMITTED post
				if (data.data.status === 'SUBMITTED') {
					// Use setTimeout to avoid blocking the initial render
					setTimeout(async () => {
						try {
							const statusResponse = await fetch(
								`/api/admin/posts/${researchLabId}`,
								{
									method: 'PATCH',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ status: 'PROGRESSING' }),
								}
							)
							if (statusResponse.ok) {
								const statusData = await statusResponse.json()
								if (statusData.success) {
									// Update local state to reflect the status change
									setCurrentResearchLab((prev: any) =>
										prev ? { ...prev, status: 'PROGRESSING' } : null
									)
								}
							}
						} catch (statusError) {
							// Silently fail - status update is not critical
							console.error(
								'Failed to auto-transition to PROGRESSING:',
								statusError
							)
						}
					}, 500) // Small delay to ensure initial render completes
				}

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
			await fetchResearchLabDetail(researchLabId)
		}

		loadResearchLabData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id])

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

	const handleReject = async () => {
		if (!rejectReason.trim()) {
			showError('Validation Error', 'Please provide a reason for rejection')
			return
		}

		setIsProcessing(true)
		try {
			const response = await fetch(`/api/admin/posts/${params?.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: 'REJECTED',
					rejectionReason: rejectReason,
				}),
			})

			const data = await response.json()

			if (response.ok && data.success) {
				showSuccess('Post Rejected', 'The post has been successfully rejected.')
				setShowRejectModal(false)
				setRejectReason('')
				router.push('/admin/posts')
			} else {
				throw new Error(data.error || 'Failed to reject post')
			}
		} catch (error) {
			showError(
				'Rejection Failed',
				error instanceof Error
					? error.message
					: 'Failed to reject the post. Please try again.'
			)
		} finally {
			setIsProcessing(false)
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
		{ id: 'requirements', label: 'Requirements' },
		{ id: 'offer', label: 'Offer Information' },
		{ id: 'lab-info', label: 'Lab Information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'job-description':
				return (
					<div className="space-y-6">
						{currentResearchLab?.description && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Description:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.description,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.researchFocus && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Research Focus:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.researchFocus,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.researchFields &&
							currentResearchLab.researchFields.length > 0 && (
								<div>
									<h3 className="text-xl font-bold text-gray-900 mb-4">
										Research Fields:
									</h3>
									<div className="flex flex-wrap gap-2">
										{currentResearchLab.researchFields.map((field: string) => (
											<span
												key={field}
												className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
											>
												{field}
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
						{currentResearchLab?.mainResponsibility && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Main Responsibility:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.mainResponsibility,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.qualificationRequirement && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Qualification Requirements:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.qualificationRequirement,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.experienceRequirement && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Experience Requirements:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.experienceRequirement,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.requiredDocuments &&
							currentResearchLab.requiredDocuments.length > 0 && (
								<div>
									<h3 className="text-xl font-bold text-gray-900 mb-4">
										Required Documents:
									</h3>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentResearchLab.requiredDocuments.map((doc: any) => (
											<li key={doc.id}>
												<span className="font-semibold">{doc.name}</span>
												{doc.description && <span>: {doc.description}</span>}
											</li>
										))}
									</ul>
								</div>
							)}
					</div>
				)

			case 'offer':
				return (
					<div className="space-y-6">
						{currentResearchLab?.salaryDescription && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Salary Description:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.salaryDescription,
									}}
								/>
							</div>
						)}

						{currentResearchLab?.benefit && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Benefits:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.benefit,
									}}
								/>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="font-bold text-gray-900">Contract Type:</p>
								<p className="text-gray-700">
									{currentResearchLab?.contractType || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Attendance:</p>
								<p className="text-gray-700">
									{currentResearchLab?.attendance || 'N/A'}
								</p>
							</div>
						</div>
					</div>
				)

			case 'lab-info':
				return (
					<div className="space-y-6">
						{currentResearchLab?.labFacilities && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Lab Facilities:
								</h3>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentResearchLab.labFacilities,
									}}
								/>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="font-bold text-gray-900">Lab Type:</p>
								<p className="text-gray-700">
									{currentResearchLab?.labType || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Lab Director:</p>
								<p className="text-gray-700">
									{currentResearchLab?.labDirector || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Lab Capacity:</p>
								<p className="text-gray-700">
									{currentResearchLab?.labCapacity || 'N/A'}
								</p>
							</div>
							<div>
								<p className="font-bold text-gray-900">Lab Website:</p>
								{currentResearchLab?.labWebsite ? (
									<a
										href={currentResearchLab.labWebsite}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#126E64] hover:underline"
									>
										{currentResearchLab.labWebsite}
									</a>
								) : (
									<p className="text-gray-700">N/A</p>
								)}
							</div>
						</div>

						{currentResearchLab?.labContactEmail && (
							<div>
								<p className="font-bold text-gray-900">Contact Email:</p>
								<a
									href={`mailto:${currentResearchLab.labContactEmail}`}
									className="text-[#126E64] hover:underline"
								>
									{currentResearchLab.labContactEmail}
								</a>
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

						<div className="flex flex-col items-center gap-3 mb-4 w-full">
							{/* Approve/Reject Buttons - Show for SUBMITTED, UPDATED, or PROGRESSING status */}
							{(currentResearchLab?.status === 'SUBMITTED' ||
								currentResearchLab?.status === 'UPDATED' ||
								currentResearchLab?.status === 'PROGRESSING') && (
								<div className="flex gap-3 w-full">
									<Button
										onClick={async () => {
											try {
												setIsProcessing(true)
												const response = await fetch(
													`/api/admin/posts/${params?.id}`,
													{
														method: 'PATCH',
														headers: {
															'Content-Type': 'application/json',
														},
														body: JSON.stringify({ status: 'PUBLISHED' }),
													}
												)
												const data = await response.json()
												if (response.ok && data.success) {
													showSuccess(
														'Success',
														'Research lab approved and published successfully'
													)
													await fetchResearchLabDetail(params?.id as string)
													router.push('/admin/posts')
												} else {
													showError(
														'Error',
														data.error || 'Failed to approve research lab'
													)
												}
											} catch (error) {
												showError(
													'Error',
													'Failed to approve research lab. Please try again.'
												)
											} finally {
												setIsProcessing(false)
											}
										}}
										className="flex-1 bg-[#126E64] hover:bg-[#0f5a52] text-white"
										disabled={isProcessing}
									>
										{isProcessing ? 'Processing...' : 'Approve'}
									</Button>
									<Button
										onClick={() => setShowRejectModal(true)}
										className="flex-1 bg-[#EF4444] hover:bg-[#dc2626] text-white"
										disabled={isProcessing}
									>
										Reject
									</Button>
								</div>
							)}

							<div className="flex items-center gap-3 flex-wrap justify-center">
								{currentResearchLab?.status === 'DRAFT' && (
									<Button
										onClick={() => setIsDeleteModalOpen(true)}
										variant="outline"
										className="text-red-600 border-red-600 hover:bg-red-50"
									>
										Delete
									</Button>
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
						</div>
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

			{/* Reject Modal */}
			<Modal
				isOpen={showRejectModal}
				onClose={() => {
					setShowRejectModal(false)
					setRejectReason('')
				}}
				title="Reject Research Lab"
				maxWidth="md"
			>
				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Reason for Rejection *
						</label>
						<textarea
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Please provide a detailed reason for rejecting this research lab..."
							rows={6}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
						/>
					</div>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => {
								setShowRejectModal(false)
								setRejectReason('')
							}}
							disabled={isProcessing}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Cancel
						</Button>
						<Button
							onClick={handleReject}
							disabled={isProcessing || !rejectReason.trim()}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							{isProcessing ? 'Rejecting...' : 'Confirm Reject'}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default AdminResearchLabDetail
