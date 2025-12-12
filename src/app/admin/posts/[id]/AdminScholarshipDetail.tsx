'use client'

import { Button, Tooltip } from '@/components/ui'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import CoverImage from '../../../../../public/EduMatch_Default.png'
import { Trash2 } from 'lucide-react'
import Modal from '@/components/ui/modals/Modal'

const AdminScholarshipDetail = () => {
	const router = useRouter()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('detail')
	const [currentScholarship, setCurrentScholarship] = useState<any>(null)
	const [isLoadingScholarship, setIsLoadingScholarship] = useState(true)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showRejectModal, setShowRejectModal] = useState(false)
	const [rejectReason, setRejectReason] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

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

	// Fetch scholarship details from explore API (same as institution dashboard)
	const fetchScholarshipDetail = async (scholarshipId: string) => {
		try {
			setIsLoadingScholarship(true)
			const response = await fetch(
				`/api/explore/scholarships/scholarship-detail?id=${scholarshipId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				setCurrentScholarship(data.data)

				// Auto-update status to PROGRESSING when admin views a SUBMITTED post
				if (data.data.status === 'SUBMITTED') {
					// Use setTimeout to avoid blocking the initial render
					setTimeout(async () => {
						try {
							const statusResponse = await fetch(
								`/api/admin/posts/${scholarshipId}`,
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
									setCurrentScholarship((prev: any) =>
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
			await fetchScholarshipDetail(scholarshipId)
		}

		loadScholarshipData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id])

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
			case 'REJECTED':
				return 'bg-red-100 text-red-800'
			case 'PROGRESSING':
				return 'bg-purple-100 text-purple-800'
			case 'SUBMITTED':
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

						<div className="flex flex-col items-center gap-3 mb-4 w-full">
							{/* Status Action Buttons based on current status */}
							{currentScholarship?.status === 'PROGRESSING' && (
								<div className="flex items-center justify-center gap-3 w-full">
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
														'Scholarship approved and published successfully'
													)
													await fetchScholarshipDetail(params?.id as string)
													router.push('/admin/posts')
												} else {
													showError(
														'Error',
														data.error || 'Failed to approve scholarship'
													)
												}
											} catch (error) {
												showError(
													'Error',
													'Failed to approve scholarship. Please try again.'
												)
											} finally {
												setIsProcessing(false)
											}
										}}
										className="py-2.5 px-5 text-sm bg-[#126E64] hover:bg-[#0f5a52] text-white"
										disabled={isProcessing}
									>
										{isProcessing ? 'Processing...' : 'Publish'}
									</Button>
									<Button
										onClick={() => setShowRejectModal(true)}
										className="py-2.5 px-5 text-sm bg-[#EF4444] hover:bg-[#dc2626] text-white"
										disabled={isProcessing}
									>
										Reject
									</Button>
								</div>
							)}

							{currentScholarship?.status === 'PUBLISHED' && (
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
														body: JSON.stringify({ status: 'CLOSED' }),
													}
												)
												const data = await response.json()
												if (response.ok && data.success) {
													showSuccess(
														'Success',
														'Scholarship closed successfully'
													)
													await fetchScholarshipDetail(params?.id as string)
													router.push('/admin/posts')
												} else {
													showError(
														'Error',
														data.error || 'Failed to close scholarship'
													)
												}
											} catch (error) {
												showError(
													'Error',
													'Failed to close scholarship. Please try again.'
												)
											} finally {
												setIsProcessing(false)
											}
										}}
										className="flex-1 bg-[#6EB6FF] hover:bg-[#5aa3e6] text-black"
										disabled={isProcessing}
									>
										{isProcessing ? 'Processing...' : 'Close'}
									</Button>
								</div>
							)}

							{(currentScholarship?.status === 'REJECTED' ||
								currentScholarship?.status === 'CLOSED') && (
								<div className="flex items-center justify-center gap-3 w-full">
									<Tooltip
										content={
											currentScholarship?.status === 'REJECTED'
												? 'Change status to Submitted - Post will be resubmitted for review'
												: 'Change status to Progressing - Post will be under review again'
										}
										maxWidth={250}
									>
										<Button
											onClick={async () => {
												try {
													setIsProcessing(true)
													const newStatus =
														currentScholarship?.status === 'REJECTED'
															? 'SUBMITTED'
															: 'PROGRESSING'
													const response = await fetch(
														`/api/admin/posts/${params?.id}`,
														{
															method: 'PATCH',
															headers: {
																'Content-Type': 'application/json',
															},
															body: JSON.stringify({ status: newStatus }),
														}
													)
													const data = await response.json()
													if (response.ok && data.success) {
														showSuccess(
															'Success',
															`Scholarship status updated to ${newStatus}`
														)
														await fetchScholarshipDetail(params?.id as string)
														router.push('/admin/posts')
													} else {
														showError(
															'Error',
															data.error ||
																'Failed to update scholarship status'
														)
													}
												} catch (error) {
													showError(
														'Error',
														'Failed to update scholarship status. Please try again.'
													)
												} finally {
													setIsProcessing(false)
												}
											}}
											className="py-2.5 px-5 text-sm !bg-[#8B5CF6] hover:!bg-[#7c3aed] !text-white"
											style={{ backgroundColor: '#8B5CF6' }}
											disabled={isProcessing}
										>
											{isProcessing
												? 'Processing...'
												: currentScholarship?.status === 'REJECTED'
													? 'Submitted'
													: 'Progressing'}
										</Button>
									</Tooltip>
									<Tooltip
										content="Publish this post - Make it visible to all users immediately"
										maxWidth={250}
									>
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
															'Scholarship published successfully'
														)
														await fetchScholarshipDetail(params?.id as string)
														router.push('/admin/posts')
													} else {
														showError(
															'Error',
															data.error || 'Failed to publish scholarship'
														)
													}
												} catch (error) {
													showError(
														'Error',
														'Failed to publish scholarship. Please try again.'
													)
												} finally {
													setIsProcessing(false)
												}
											}}
											className="py-2.5 px-5 text-sm !bg-[#10B981] hover:!bg-[#059669] !text-white"
											style={{ backgroundColor: '#10B981' }}
											disabled={isProcessing}
										>
											{isProcessing ? 'Processing...' : 'Publish'}
										</Button>
									</Tooltip>
									<span
										className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentScholarship?.status || '')}`}
									>
										{currentScholarship?.status || 'DRAFT'}
									</span>
								</div>
							)}

							{currentScholarship?.status !== 'REJECTED' &&
								currentScholarship?.status !== 'CLOSED' && (
									<div className="flex items-center gap-3 flex-wrap justify-center">
										{currentScholarship?.status === 'DRAFT' && (
											<Button
												onClick={() => setIsDeleteModalOpen(true)}
												variant="outline"
												className="text-red-600 border-red-600 hover:bg-red-50"
											>
												Delete
											</Button>
										)}
										<span
											className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentScholarship?.status || '')}`}
										>
											{currentScholarship?.status || 'DRAFT'}
										</span>
									</div>
								)}
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

			{/* Reject Modal */}
			<Modal
				isOpen={showRejectModal}
				onClose={() => {
					setShowRejectModal(false)
					setRejectReason('')
				}}
				title="Reject Scholarship"
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
							placeholder="Please provide a detailed reason for rejecting this scholarship..."
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

export default AdminScholarshipDetail
