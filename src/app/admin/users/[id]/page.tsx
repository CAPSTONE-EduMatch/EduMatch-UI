'use client'

import { DeactivateModal } from '@/components/admin/DeactivateModal'
import { DocumentSection } from '@/components/admin/DocumentComponents'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { ApiResponse, UserDetails } from '@/types/domain/user-details'
import { motion } from 'framer-motion'
import { MessageCircle, User } from 'lucide-react'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Modal from '@/components/ui/modals/Modal'
import { Button, Input } from '@/components/ui'
import Image from 'next/image'

// API function to fetch user details
const fetchUserDetails = async (
	userId: string
): Promise<UserDetails | null> => {
	try {
		const response = await fetch(`/api/admin/users/${userId}`)
		const result: ApiResponse<UserDetails> = await response.json()

		if (result.success && result.data) {
			return result.data
		}
		return null
	} catch (error) {
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.error('Error fetching user details:', error)
		}
		return null
	}
}

export default function UserDetailPage() {
	const [isClient, setIsClient] = useState(false)
	const [userData, setUserData] = useState<UserDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState(false)
	const [showDeactivateModal, setShowDeactivateModal] = useState(false)
	const [showContactModal, setShowContactModal] = useState(false)
	const [showResultModal, setShowResultModal] = useState(false)
	const [resultModalType, setResultModalType] = useState<'success' | 'error'>(
		'success'
	)
	const [resultModalMessage, setResultModalMessage] = useState('')
	const [emailSubject, setEmailSubject] = useState('')
	const [emailMessage, setEmailMessage] = useState('')
	const [emailSending, setEmailSending] = useState(false)
	const [emailError, setEmailError] = useState('')
	const [emailSuccess, setEmailSuccess] = useState('')
	const router = useRouter()
	const params = useParams()
	const { isLoading: adminLoading } = useAdminAuth()

	const handleBack = () => {
		router.back()
	}

	useEffect(() => {
		setIsClient(true)
		if (params?.id) {
			loadUserData(params.id as string)
		}
	}, [params])

	const loadUserData = async (userId: string) => {
		setLoading(true)
		setError(null)
		try {
			const data = await fetchUserDetails(userId)
			if (data) {
				setUserData(data)
			} else {
				setError('User not found')
			}
		} catch (err) {
			setError('Failed to load user data')
		} finally {
			setLoading(false)
		}
	}

	const handleContactUser = () => {
		if (!userData?.email) {
			alert('User email not available')
			return
		}
		// Set default subject and message
		setEmailSubject(`Contact from EduMatch Admin`)
		setEmailMessage(
			`Hello ${userData.name},\n\nI am contacting you from EduMatch administration.\n\nBest regards,\nEduMatch Admin Team`
		)
		setShowContactModal(true)
		setEmailError('')
		setEmailSuccess('')
	}

	const handleSendEmail = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!userData?.email) {
			setEmailError('User email not available')
			return
		}

		if (!emailSubject.trim() || !emailMessage.trim()) {
			setEmailError('Please fill in both subject and message')
			return
		}

		setEmailSending(true)
		setEmailError('')
		setEmailSuccess('')

		try {
			// Convert message to HTML format
			const htmlMessage = emailMessage.replace(/\n/g, '<br>')

			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					to: userData.email,
					subject: emailSubject,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
							<div style="background-color: #126E64; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
								<h2 style="margin: 0;">EduMatch Admin</h2>
							</div>
							<div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
								<p style="color: #333; line-height: 1.6;">${htmlMessage}</p>
								<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
								<p style="color: #666; font-size: 12px; margin: 0;">
									This email was sent from EduMatch administration system.
								</p>
							</div>
						</div>
					`,
				}),
			})

			const result = await response.json()

			if (response.ok && result.success) {
				setEmailSuccess('Email sent successfully!')
				// Clear form after 2 seconds and close modal
				setTimeout(() => {
					setEmailSubject('')
					setEmailMessage('')
					setShowContactModal(false)
					setEmailSuccess('')
				}, 2000)
			} else {
				setEmailError(result.error || 'Failed to send email')
			}
		} catch (error) {
			setEmailError('An error occurred while sending the email')
			console.error('Error sending email:', error)
		} finally {
			setEmailSending(false)
		}
	}

	const handleDeactivateUser = async () => {
		if (!userData || userData.status !== 'Active') return
		setShowDeactivateModal(true)
	}

	const confirmDeactivate = async (reason: string) => {
		if (!params?.id || !userData) return

		setActionLoading(true)
		try {
			const response = await fetch(`/api/admin/users/${params.id}/actions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'deactivate',
					reason: reason,
				}),
			})

			if (response.ok) {
				setShowDeactivateModal(false)
				setResultModalType('success')
				setResultModalMessage(
					'User deactivated successfully! An email has been sent to the user.'
				)
				setShowResultModal(true)
				// Reload user data to reflect changes
				await loadUserData(params.id as string)
			} else {
				const errorData = await response.json()
				setShowDeactivateModal(false)
				setResultModalType('error')
				setResultModalMessage(
					`Failed to deactivate user: ${errorData.error || 'Unknown error'}`
				)
				setShowResultModal(true)
			}
		} catch (error) {
			setShowDeactivateModal(false)
			setResultModalType('error')
			setResultModalMessage('An error occurred while deactivating user')
			setShowResultModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleChangeStatus = async () => {
		if (!params?.id || !userData) return

		const newStatus = userData.status === 'Active' ? false : true
		const action = newStatus ? 'activate' : 'deactivate'

		setActionLoading(true)
		try {
			const response = await fetch(`/api/admin/users/${params.id}/actions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			})

			if (response.ok) {
				setResultModalType('success')
				setResultModalMessage(`User ${action}d successfully!`)
				setShowResultModal(true)
				// Reload user data to reflect changes
				await loadUserData(params.id as string)
			} else {
				const errorData = await response.json()
				setResultModalType('error')
				setResultModalMessage(
					`Failed to ${action} user: ${errorData.error || 'Unknown error'}`
				)
				setShowResultModal(true)
			}
		} catch (error) {
			setResultModalType('error')
			setResultModalMessage('An error occurred')
			setShowResultModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	if (!isClient || loading || adminLoading) {
		return (
			<div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64] mx-auto mb-4"></div>
					<p className="text-gray-600">Loading user details...</p>
				</div>
			</div>
		)
	}

	if (error || !userData) {
		return (
			<div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-8">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
					<p className="text-gray-600 mb-4">{error || 'User not found'}</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-[#126E64] text-white rounded hover:bg-[#0f5a52] transition-colors"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	return (
		<>
			<div className="flex gap-12 p-6 max-w-7xl mx-auto">
				{/* Left Column - User Profile */}
				<div className="w-[350px] flex-shrink-0 ">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-lg p-6 shadow-sm  h-[800px]"
					>
						{/* Profile Image and Basic Info */}
						<div className="text-center mb-6">
							<div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
								{userData.profileImage ? (
									<Image
										src={userData.profileImage}
										alt={userData.name}
										className="w-full h-full object-cover"
										width={128}
										height={128}
									/>
								) : (
									<div className="w-full h-full bg-gray-200 flex items-center justify-center">
										<User className="w-12 h-12 text-gray-400" />
									</div>
								)}
							</div>

							<h2 className="text-xl font-semibold text-black mb-1">
								{userData.name}
							</h2>
							<p className="text-sm text-[#A2A2A2]">
								{userData.birthDate !== 'Not provided'
									? userData.birthDate
									: ''}{' '}
								{userData.birthDate !== 'Not provided' &&
								userData.gender !== 'Not specified'
									? '- '
									: ''}
								{userData.gender !== 'Not specified' ? userData.gender : ''}
							</p>
						</div>

						{/* Academic Information */}
						{userData.role === 'student' && (
							<div className="mb-6">
								<div className="border-b border-[#DEDEDE] mb-4"></div>
								<div className="space-y-3">
									<div>
										<span className="text-sm font-semibold text-black">
											Program:{' '}
										</span>
										<span className="text-sm text-black">
											{userData.program}
										</span>
									</div>
									{userData.subdisciplines &&
										userData.subdisciplines.length > 0 && (
											<div>
												<span className="text-sm font-semibold text-black">
													Subdisciplines:{' '}
												</span>
												<div className="flex flex-wrap gap-2 mt-1">
													{userData.subdisciplines.map((sub, index) => (
														<span
															key={index}
															className="inline-flex items-center gap-1 bg-[#126E64]/10 text-[#126E64] px-2 py-1 rounded-full text-xs font-medium"
														>
															{sub.name}
														</span>
													))}
												</div>
											</div>
										)}
									<div>
										<span className="text-sm font-semibold text-black">
											GPA:{' '}
										</span>
										<span className="text-sm text-black">{userData.gpa}</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											Status:{' '}
										</span>
										<span className="text-sm text-black">
											{userData.status}
										</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											University:{' '}
										</span>
										<span className="text-sm text-black">
											{userData.university}
										</span>
									</div>
								</div>
							</div>
						)}

						{/* Ban Status */}
						{userData.banned && (
							<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<span className="w-2 h-2 bg-red-500 rounded-full"></span>
									<span className="text-sm font-semibold text-red-700">
										User is Banned
									</span>
								</div>
								{userData.banReason && (
									<div className="text-xs text-red-600 mb-1">
										<strong>Reason:</strong> {userData.banReason}
									</div>
								)}
								{userData.banExpires && (
									<div className="text-xs text-red-600">
										<strong>Expires:</strong>{' '}
										{new Date(userData.banExpires).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})}
									</div>
								)}
								{!userData.banExpires && (
									<div className="text-xs text-red-600">
										<strong>Status:</strong> Permanent ban
									</div>
								)}
							</div>
						)}

						{/* Contact Information */}
						<div className="mb-6">
							<div className="border-b border-[#DEDEDE] mb-4"></div>
							<div className="space-y-3">
								<div>
									<span className="text-sm font-semibold text-black">
										Email:{' '}
									</span>
									<span className="text-sm text-black">{userData.email}</span>
								</div>
								<div>
									<span className="text-sm font-semibold text-black">
										Phone:{' '}
									</span>
									<span className="text-sm text-black">{userData.phone}</span>
								</div>
								<div>
									<span className="text-sm font-semibold text-black">
										Nationality:{' '}
									</span>
									<span className="text-sm text-black">
										{userData.nationality}
									</span>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							<button
								onClick={handleContactUser}
								disabled={!userData?.email || actionLoading}
								className="w-full bg-[#F0A227] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#e6921f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<MessageCircle className="w-4 h-4" />
								{userData?.role === 'institution'
									? 'Contact Institution'
									: 'Contact Applicant'}
							</button>
							{userData?.status === 'Active' && (
								<button
									onClick={handleDeactivateUser}
									disabled={actionLoading}
									className="w-full bg-[#E20000] text-white py-2.5 px-4 rounded-[30px] text-sm font-semibold hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{actionLoading ? 'Processing...' : 'Deactivate User'}
								</button>
							)}
							{userData?.status !== 'Active' && (
								<button
									onClick={handleChangeStatus}
									disabled={actionLoading}
									className="w-full bg-[#22C55E] text-white py-2.5 px-4 rounded-[30px] text-sm font-semibold hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{actionLoading ? 'Processing...' : 'Activate User'}
								</button>
							)}
						</div>
					</motion.div>
				</div>

				{/* Right Column - Documents */}
				<div className="flex-1 min-w-0">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className="bg-white rounded-lg shadow-sm flex flex-col sticky top-6 min-h-[400px] max-h-[800px]"
					>
						<div className="p-6 border-b flex-shrink-0">
							<h1 className="text-lg font-semibold text-[#116E63]">
								Academic Profile
							</h1>
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							<div className="space-y-6">
								<DocumentSection
									title="CV / Resume"
									files={userData.documents.cvResume}
									userId={params?.id as string}
								/>
								<DocumentSection
									title="Research paper"
									files={userData.documents.researchPapers}
									userId={params?.id as string}
								/>

								<DocumentSection
									title="Transcript"
									files={userData.documents.transcripts}
									userId={params?.id as string}
								/>

								<DocumentSection
									title="Degrees"
									files={userData.documents.degrees}
									userId={params?.id as string}
								/>

								<DocumentSection
									title="Foreign Language Certificate"
									files={userData.documents.languageCertificates}
									userId={params?.id as string}
								/>
							</div>
						</div>
					</motion.div>
				</div>
			</div>{' '}
			{/* Deactivate Modal */}
			<DeactivateModal
				isOpen={showDeactivateModal}
				onClose={() => setShowDeactivateModal(false)}
				onConfirm={confirmDeactivate}
				userName={userData?.name || 'Unknown User'}
				userEmail={userData?.email || 'Unknown Email'}
				isLoading={actionLoading}
			/>
			{/* Result Modal */}
			<Modal
				isOpen={showResultModal}
				onClose={() => setShowResultModal(false)}
				title={resultModalType === 'success' ? 'Success' : 'Error'}
				maxWidth="md"
			>
				<div className="text-center py-6">
					{resultModalType === 'success' ? (
						<div className="mb-6">
							<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-10 h-10 text-green-500"
									fill="none"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<p className="text-gray-700 text-lg">{resultModalMessage}</p>
						</div>
					) : (
						<div className="mb-6">
							<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-10 h-10 text-red-500"
									fill="none"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<p className="text-gray-700 text-lg">{resultModalMessage}</p>
						</div>
					)}
					<Button
						onClick={() => setShowResultModal(false)}
						className="bg-[#126E64] hover:bg-[#0f5a52] text-white px-8"
					>
						OK
					</Button>
				</div>
			</Modal>
			{/* Contact User Modal */}
			<Modal
				isOpen={showContactModal}
				onClose={() => {
					setShowContactModal(false)
					setEmailSubject('')
					setEmailMessage('')
					setEmailError('')
					setEmailSuccess('')
				}}
				title={
					userData?.role === 'institution'
						? 'Contact Institution'
						: 'Contact Applicant'
				}
				maxWidth="md"
			>
				<form onSubmit={handleSendEmail} className="space-y-6">
					{/* Success Message */}
					{emailSuccess && (
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
								<p className="text-green-700">{emailSuccess}</p>
							</div>
						</div>
					)}

					{/* Error Message */}
					{emailError && (
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
								<p className="text-red-700">{emailError}</p>
							</div>
						</div>
					)}

					{/* Recipient Info */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<p className="text-sm text-gray-600 mb-1">To:</p>
						<p className="text-sm font-medium text-gray-900">
							{userData?.name} ({userData?.email})
						</p>
					</div>

					{/* Subject Field */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Subject <span className="text-red-500">*</span>
						</label>
						<Input
							type="text"
							value={emailSubject}
							onChange={(e) => setEmailSubject(e.target.value)}
							placeholder="Enter email subject"
							required
							className="w-full"
							disabled={emailSending}
						/>
					</div>

					{/* Message Field */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Message <span className="text-red-500">*</span>
						</label>
						<textarea
							value={emailMessage}
							onChange={(e) => setEmailMessage(e.target.value)}
							placeholder="Enter your message..."
							rows={8}
							required
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent resize-none"
							disabled={emailSending}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							onClick={() => {
								setShowContactModal(false)
								setEmailSubject('')
								setEmailMessage('')
								setEmailError('')
								setEmailSuccess('')
							}}
							variant="outline"
							className="flex-1"
							disabled={emailSending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="flex-1 bg-[#126E64] hover:bg-[#0f5a52] text-white"
							disabled={
								emailSending || !emailSubject.trim() || !emailMessage.trim()
							}
						>
							{emailSending ? (
								<div className="flex items-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									Sending...
								</div>
							) : (
								'Send Email'
							)}
						</Button>
					</div>
				</form>
			</Modal>
		</>
	)
}
