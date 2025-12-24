'use client'

import { Button, Tooltip } from '@/components/ui'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import CoverImage from '../../../../../public/EduMatch_Default.png'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/modals/Modal'

const AdminProgramDetail = () => {
	const router = useRouter()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('overview')
	const [currentProgram, setCurrentProgram] = useState<any>(null)
	const [isLoadingProgram, setIsLoadingProgram] = useState(true)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showRejectModal, setShowRejectModal] = useState(false)
	const [rejectReason, setRejectReason] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

	// Notification system
	const { showError, showSuccess } = useNotification()

	// Dynamic info items based on current program data
	const infoItems = [
		{
			label: 'Tuition fee',
			value:
				currentProgram?.program?.tuitionFeeFormatted ||
				currentProgram?.program?.tuitionFee
					? `$${currentProgram.program.tuitionFee}/year`
					: 'Contact institution',
		},
		{
			label: 'Duration',
			value: currentProgram?.program?.duration || 'N/A',
		},
		{
			label: 'Application deadline',
			value: currentProgram?.endDateFormatted || 'N/A',
		},
		{
			label: 'Start Date',
			value: currentProgram?.startDateFormatted || 'N/A',
		},
		{
			label: 'Location',
			value: currentProgram?.location || 'N/A',
		},
		{
			label: 'Status',
			value: currentProgram?.status || 'N/A',
		},
	]

	// Fetch program details from explore API (same as institution dashboard)
	const fetchProgramDetail = async (programId: string) => {
		try {
			setIsLoadingProgram(true)
			const response = await fetch(
				`/api/explore/programs/program-detail?id=${programId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				// Map subdiscipline to fields for compatibility with existing UI
				const programData = {
					...data.data,
					fields: data.data.subdisciplines || [],
				}
				setCurrentProgram(programData)

				// Auto-update status to PROGRESSING when admin views a SUBMITTED post
				// Only if not already PROGRESSING (to avoid re-triggering)
				if (programData.status === 'SUBMITTED') {
					// Use setTimeout to avoid blocking the initial render
					setTimeout(async () => {
						try {
							const statusResponse = await fetch(
								`/api/admin/posts/${programId}`,
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
									setCurrentProgram((prev: any) =>
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

				return programData
			} else {
				showError('Error', 'Failed to load program details')
				return null
			}
		} catch (error) {
			showError('Error', 'Failed to load program details')
			return null
		} finally {
			setIsLoadingProgram(false)
		}
	}

	// Load program data when component mounts
	useEffect(() => {
		const loadProgramData = async () => {
			// Get program ID from URL params
			const programId = params?.id as string

			if (!programId) {
				showError('Error', 'Program ID is required')
				return
			}

			// Fetch program data from API
			await fetchProgramDetail(programId)
		}

		loadProgramData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id])
	const handleDeleteProgram = async () => {
		try {
			setIsDeleting(true)
			const response = await fetch(`/api/posts/programs?postId=${params?.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to delete program')
			}

			showSuccess('Success', 'Program deleted successfully')
			setIsDeleteModalOpen(false)
			// Redirect to programs page
			router.push('/institution/dashboard/programs')
		} catch (error) {
			showError(
				'Error',
				error instanceof Error ? error.message : 'Failed to delete program'
			)
		} finally {
			setIsDeleting(false)
		}
	}

	const handleCloseProgram = async () => {
		try {
			const response = await fetch(`/api/posts/programs`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					postId: params?.id,
					status: 'CLOSED',
				}),
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to close program')
			}

			if (result.success) {
				showSuccess('Success', 'Program closed successfully')
				// Refresh program data
				await fetchProgramDetail(params?.id as string)
			} else {
				showError('Error', result.error || 'Failed to close program')
			}
		} catch (error) {
			showError(
				'Error',
				error instanceof Error ? error.message : 'Failed to close program'
			)
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
		{ id: 'overview', label: 'Overview' },
		{ id: 'structure', label: 'Programme structure' },
		{ id: 'admission', label: 'Admission requirements' },
		{ id: 'fee', label: 'Fee and funding' },
		{ id: 'scholarship', label: 'Scholarship' },
		{ id: 'other', label: 'Other information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'overview':
				return (
					<div className="space-y-4">
						<div className="space-y-4">
							{/* Description Section */}
							{currentProgram?.description && (
								<div className="text-base border-b border-gray-200 pb-4 mb-4">
									<span className="font-bold text-gray-900">Description:</span>
									<div
										className="text-gray-700 mt-2 prose max-w-none"
										dangerouslySetInnerHTML={{
											__html: currentProgram.description,
										}}
									/>
								</div>
							)}

							<div className="text-base">
								<span className="font-bold text-gray-900">1. Duration:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.duration || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">2. Start dates:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.startDateFormatted || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadlines:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.endDateFormatted
										? `before ${currentProgram.endDateFormatted}`
										: 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									4. Subdiscipline:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.subdiscipline &&
									currentProgram.subdiscipline.length > 0
										? currentProgram.subdiscipline
												.map((s: any) => s.name || s.subdisciplineName)
												.join(', ')
										: 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">5. Attendance:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.attendance || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">6. Location:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.location || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									7. Degree level:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.degreeLevel || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">8. Days left:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.daysLeft !== undefined
										? `${currentProgram.daysLeft} days`
										: 'N/A'}
								</span>
							</div>
						</div>
					</div>
				)

			case 'structure':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Subdiscipline:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.subdiscipline &&
									currentProgram.subdiscipline.length > 0
										? currentProgram.subdiscipline
												.map((s: any) => s.name || s.subdisciplineName)
												.join(', ')
										: 'N/A'}
								</span>
							</p>
						</div>

						{currentProgram?.program?.courseInclude && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Courses include:</p>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.courseInclude,
									}}
								/>
							</div>
						)}

						{currentProgram?.subdiscipline &&
							currentProgram.subdiscipline.length > 0 && (
								<div>
									<p className="text-base">
										<span className="font-bold text-gray-900">
											Discipline area:
										</span>{' '}
										<span className="text-gray-700">
											{currentProgram.subdiscipline
												.map(
													(s: any) =>
														s.disciplineName || s.discipline?.name || 'N/A'
												)
												.filter(
													(value: string, index: number, self: string[]) =>
														self.indexOf(value) === index
												)
												.join(', ')}
										</span>
									</p>
								</div>
							)}
					</div>
				)

			case 'admission':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-3">
								Academic requirements:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								{currentProgram?.program?.gpa && (
									<li>GPA: {currentProgram.program.gpa}</li>
								)}
								{currentProgram?.program?.gre && (
									<li>GRE: {currentProgram.program.gre}</li>
								)}
								{currentProgram?.program?.gmat && (
									<li>GMAT: {currentProgram.program.gmat}</li>
								)}
								{!currentProgram?.program?.gpa &&
									!currentProgram?.program?.gre &&
									!currentProgram?.program?.gmat && (
										<li>Please contact institution for requirements</li>
									)}
							</ul>
						</div>

						{currentProgram?.program?.certificates &&
							currentProgram.program.certificates.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Language requirements:
									</p>
									<ul className="list-disc pl-5 space-y-1 text-gray-700">
										{currentProgram.program.certificates.map((cert: any) => (
											<li key={cert.id}>
												{cert.name}: {cert.score}
											</li>
										))}
									</ul>
								</div>
							)}

						{currentProgram?.documents &&
							currentProgram.documents.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Required documents:
									</p>
									<ul className="list-disc pl-5 space-y-1 text-gray-700">
										{currentProgram.documents.map((doc: any) => (
											<li key={doc.document_type_id || doc.id}>
												{doc.name}
												{doc.description && `: ${doc.description}`}
											</li>
										))}
									</ul>
								</div>
							)}
					</div>
				)

			case 'fee':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-2">Tuition Fee:</p>
							<ul className="list-disc pl-5 text-gray-700">
								<li>
									{currentProgram?.program?.tuitionFeeFormatted ||
										(currentProgram?.program?.tuitionFee
											? `$${currentProgram.program.tuitionFee}/year`
											: 'Contact institution for tuition fee information')}
								</li>
							</ul>
						</div>

						{currentProgram?.program?.feeDescription && (
							<div>
								<p className="font-bold text-gray-900 mb-2">Fee description:</p>
								<div
									className="text-gray-700 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.feeDescription,
									}}
								/>
							</div>
						)}
					</div>
				)

			case 'scholarship':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Scholarships Information:
							</h3>
							{currentProgram?.program?.scholarshipInfo ? (
								<div
									className="text-gray-700 mb-6 prose max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.scholarshipInfo,
									}}
								/>
							) : (
								<p className="text-gray-700 mb-6">
									No scholarship information available.
								</p>
							)}
						</div>
					</div>
				)

			case 'other':
				return (
					<div className="space-y-6">
						{currentProgram?.otherInfo && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Other Information:
								</h3>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.otherInfo,
									}}
								/>
							</div>
						)}

						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Contact Information:
							</h3>
							{currentProgram?.institution && (
								<div className="space-y-3 text-gray-700">
									{currentProgram.institution.email && (
										<p>
											<span className="font-semibold">Email:</span>{' '}
											<a
												href={`mailto:${currentProgram.institution.email}`}
												className="text-[#126E64] hover:underline"
											>
												{currentProgram.institution.email}
											</a>
										</p>
									)}
									{currentProgram.institution.hotline && (
										<p>
											<span className="font-semibold">Hotline:</span>{' '}
											{currentProgram.institution.hotlineCode && (
												<span>{currentProgram.institution.hotlineCode} </span>
											)}
											{currentProgram.institution.hotline}
										</p>
									)}
									{currentProgram.institution.website && (
										<p>
											<span className="font-semibold">Website:</span>{' '}
											<a
												href={currentProgram.institution.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[#126E64] hover:underline"
											>
												{currentProgram.institution.website}
											</a>
										</p>
									)}
									{currentProgram.institution.address && (
										<p>
											<span className="font-semibold">Address:</span>{' '}
											{currentProgram.institution.address}
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				)

			default:
				return null
		}
	}

	if (isLoadingProgram) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#126E64] mx-auto"></div>
					<p className="mt-4 text-muted-foreground">
						Loading program details...
					</p>
				</div>
			</div>
		)
	}

	if (!currentProgram) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
					<p className="text-muted-foreground mb-4">
						The program you&apos;re looking for doesn&apos;t exist or has been
						removed.
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
			{/* Back Button */}
			<div className="max-w-[1200px] my-auto mx-10 px-4 pt-5 ">
				<button
					onClick={() => router.push('/admin/posts')}
					className="flex items-center gap-2 text-[#126E64] hover:underline mb-4"
				>
					<ArrowLeft className="w-5 h-5" />
					<span>Back to Posts</span>
				</button>
			</div>
			{/* Header Section with Cover Image */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative h-[500px] w-full"
			>
				{currentProgram?.institution?.coverImage ? (
					<ProtectedImage
						src={currentProgram.institution.coverImage}
						alt={currentProgram?.institution?.name || 'University'}
						fill
						className="object-cover"
						expiresIn={7200}
						autoRefresh={true}
					/>
				) : (
					<Image
						src={CoverImage}
						alt={currentProgram?.institution?.name || 'University'}
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
							{currentProgram?.title || 'Loading...'}
						</h1>
						<p className="text-gray-600 mb-6">
							{currentProgram?.institution?.name || 'Loading...'}
						</p>

						<div className="flex flex-col items-center gap-3 mb-4 w-full">
							{/* Status Action Buttons based on current status */}
							{currentProgram?.status === 'PROGRESSING' && (
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
														'Program approved and published successfully'
													)
													router.push('/admin/posts')
												} else {
													showError(
														'Error',
														data.error || 'Failed to approve program'
													)
												}
											} catch (error) {
												showError(
													'Error',
													'Failed to approve program. Please try again.'
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
									<span
										className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentProgram?.status || '')}`}
									>
										{currentProgram?.status || 'PROGRESSING'}
									</span>
								</div>
							)}

							{currentProgram?.status === 'PUBLISHED' && (
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
														body: JSON.stringify({ status: 'CLOSED' }),
													}
												)
												const data = await response.json()
												if (response.ok && data.success) {
													showSuccess('Success', 'Program closed successfully')
													await fetchProgramDetail(params?.id as string)
													router.push('/admin/posts')
												} else {
													showError(
														'Error',
														data.error || 'Failed to close program'
													)
												}
											} catch (error) {
												showError(
													'Error',
													'Failed to close program. Please try again.'
												)
											} finally {
												setIsProcessing(false)
											}
										}}
										className="py-2.5 px-5 text-sm bg-[#6EB6FF] hover:bg-[#5aa3e6] text-black"
										disabled={isProcessing}
									>
										{isProcessing ? 'Processing...' : 'Close'}
									</Button>
									<span
										className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentProgram?.status || '')}`}
									>
										{currentProgram?.status || 'PUBLISHED'}
									</span>
								</div>
							)}

							{(currentProgram?.status === 'REJECTED' ||
								currentProgram?.status === 'CLOSED') && (
								<div className="flex items-center justify-center gap-3 w-full">
									<Tooltip
										content={
											currentProgram?.status === 'REJECTED'
												? 'Change status to Submitted - Post will be resubmitted for review'
												: 'Change status to Submitted - Post will be resubmitted for review'
										}
										maxWidth={250}
									>
										<Button
											onClick={async () => {
												try {
													setIsProcessing(true)
													const newStatus = 'SUBMITTED'
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
															'Program status updated to Submitted'
														)
														router.push('/admin/posts')
													} else {
														showError(
															'Error',
															data.error || 'Failed to update program status'
														)
													}
												} catch (error) {
													showError(
														'Error',
														'Failed to update program status. Please try again.'
													)
												} finally {
													setIsProcessing(false)
												}
											}}
											className="py-2.5 px-5 text-sm !bg-[#8B5CF6] hover:!bg-[#7c3aed] !text-white"
											style={{ backgroundColor: '#8B5CF6' }}
											disabled={isProcessing}
										>
											{isProcessing ? 'Processing...' : 'Submitted'}
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
															'Program published successfully'
														)
														router.push('/admin/posts')
													} else {
														showError(
															'Error',
															data.error || 'Failed to publish program'
														)
													}
												} catch (error) {
													showError(
														'Error',
														'Failed to publish program. Please try again.'
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
										className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentProgram?.status || '')}`}
									>
										{currentProgram?.status || 'DRAFT'}
									</span>
								</div>
							)}

							{currentProgram?.status !== 'REJECTED' &&
								currentProgram?.status !== 'CLOSED' &&
								currentProgram?.status !== 'PUBLISHED' &&
								currentProgram?.status !== 'PROGRESSING' && (
									<div className="flex items-center gap-3 flex-wrap justify-center">
										{currentProgram?.status === 'DRAFT' && (
											<Button
												onClick={() => setIsDeleteModalOpen(true)}
												variant="outline"
												className="text-red-600 border-red-600 hover:bg-red-50"
											>
												Delete
											</Button>
										)}
										<span
											className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(currentProgram?.status || '')}`}
										>
											{currentProgram?.status || 'DRAFT'}
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
						{currentProgram?.institution?.about ? (
							<div
								dangerouslySetInnerHTML={{
									__html: currentProgram.institution.about,
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
				title="Delete Program"
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
							Are you sure you want to delete this program?
						</h3>
						<p className="text-gray-600 mb-4">
							This action cannot be undone. This will permanently delete the
							program post and all associated data.
						</p>
						{currentProgram?.title && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
								<p className="text-sm text-red-800 font-medium">
									Program: {currentProgram.title}
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
							onClick={handleDeleteProgram}
							className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<div className="flex items-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									Deleting...
								</div>
							) : (
								'Delete Program'
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
				title="Reject Program"
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
							placeholder="Please provide a detailed reason for rejecting this program..."
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

export default AdminProgramDetail
