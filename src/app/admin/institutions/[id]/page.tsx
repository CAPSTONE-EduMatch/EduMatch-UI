'use client'

import { BanUnbanModal } from '@/components/admin/BanUnbanModal'
import { InstitutionDocumentSection } from '@/components/admin/InstitutionDocumentComponents'
import { InstitutionOverviewTab } from '@/components/admin/InstitutionOverviewTab'
import { RequireAdditionalInfoModal } from '@/components/admin/RequireAdditionalInfoModal'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import {
	ApiResponse,
	InstitutionDetails,
} from '@/types/domain/institution-details'
import { motion } from 'framer-motion'
import {
	Building2,
	Download,
	Globe,
	LogOut,
	Mail,
	MessageCircle,
	Phone,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { getSessionProtectedFileUrl } from '@/utils/files/getSessionProtectedFileUrl'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import SuccessModal from '@/components/ui/modals/SuccessModal'
import ErrorModal from '@/components/ui/modals/ErrorModal'
import Modal from '@/components/ui/modals/Modal'
import { Button, Input } from '@/components/ui'

// API function to fetch institution details
const fetchInstitutionDetails = async (
	institutionId: string
): Promise<InstitutionDetails | null> => {
	try {
		const response = await fetch(`/api/admin/institutions/${institutionId}`)
		const result: ApiResponse<InstitutionDetails> = await response.json()

		if (result.success && result.data) {
			return result.data
		}
		return null
	} catch (error) {
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.error('Error fetching institution details:', error)
		}
		return null
	}
}

export default function InstitutionDetailPage() {
	const [isClient, setIsClient] = useState(false)
	const [institutionData, setInstitutionData] =
		useState<InstitutionDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState(false)
	const [showBanModal, setShowBanModal] = useState(false)
	const [showRequireInfoModal, setShowRequireInfoModal] = useState(false)
	const [activeTab, setActiveTab] = useState('overview')
	const [downloadingZip, setDownloadingZip] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [infoRequests, setInfoRequests] = useState<any[]>([])
	const [loadingInfoRequests, setLoadingInfoRequests] = useState(false)
	const [showContactModal, setShowContactModal] = useState(false)
	const [emailSubject, setEmailSubject] = useState('')
	const [emailMessage, setEmailMessage] = useState('')
	const [emailSending, setEmailSending] = useState(false)
	const [emailError, setEmailError] = useState('')
	const [emailSuccess, setEmailSuccess] = useState('')
	const router = useRouter()
	const params = useParams()
	const { isAdmin, isLoading: adminLoading } = useAdminAuth()

	useEffect(() => {
		setIsClient(true)
		if (params?.id) {
			loadInstitutionData(params.id as string)
		}
	}, [params])

	const loadInstitutionData = async (institutionId: string) => {
		setLoading(true)
		setError(null)
		try {
			const data = await fetchInstitutionDetails(institutionId)
			if (data) {
				setInstitutionData(data)
			} else {
				setError('Institution not found')
			}
		} catch (err) {
			setError('Failed to load institution data')
		} finally {
			setLoading(false)
		}
	}

	const loadInfoRequests = async (institutionId: string) => {
		setLoadingInfoRequests(true)
		try {
			const response = await fetch(
				`/api/admin/institutions/${institutionId}/info-requests`
			)
			const result = await response.json()
			if (result.success && result.data) {
				setInfoRequests(result.data)
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to load info requests:', error)
		} finally {
			setLoadingInfoRequests(false)
		}
	}

	// Load info requests when update history tab is active
	useEffect(() => {
		if (activeTab === 'update-history' && params?.id) {
			loadInfoRequests(params.id as string)
		}
	}, [activeTab, params?.id])

	const handleContactInstitution = () => {
		if (!institutionData?.email && !institutionData?.userEmail) {
			alert('Institution email not available')
			return
		}
		// Set default subject and message
		const institutionEmail = institutionData.email || institutionData.userEmail
		setEmailSubject(`Contact from EduMatch Admin`)
		setEmailMessage(
			`Hello ${institutionData.name},\n\nI am contacting you from EduMatch administration.\n\nBest regards,\nEduMatch Admin Team`
		)
		setShowContactModal(true)
		setEmailError('')
		setEmailSuccess('')
	}

	const handleSendEmail = async (e: React.FormEvent) => {
		e.preventDefault()
		const institutionEmail =
			institutionData?.email || institutionData?.userEmail
		if (!institutionEmail) {
			setEmailError('Institution email not available')
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
					to: institutionEmail,
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

	const handleDeactivateInstitution = async () => {
		setShowBanModal(true)
	}

	const handleRevokeSessions = async () => {
		if (!params?.id) return

		const confirmed = confirm(
			'Are you sure you want to revoke all sessions for this institution? This will immediately log them out from all devices and browsers.'
		)

		if (!confirmed) return

		setActionLoading(true)
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'revoke-sessions' }),
				}
			)

			if (response.ok) {
				setSuccessMessage('All institution sessions revoked successfully!')
				setShowSuccessModal(true)
			} else {
				const errorData = await response.json()
				setErrorMessage(
					`Failed to revoke sessions: ${errorData.error || 'Unknown error'}`
				)
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('An error occurred while revoking sessions')
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleBanUnban = async (banReason: string, banDuration?: number) => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const action = institutionData?.banned ? 'unban' : 'ban'
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action,
						banReason,
						banDuration,
					}),
				}
			)

			if (response.ok) {
				const message = institutionData?.banned
					? 'Institution unbanned successfully!'
					: 'Institution banned successfully!'
				setSuccessMessage(message)

				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
				setShowBanModal(false)
				setShowSuccessModal(true)
			} else {
				const errorData = await response.json()
				setErrorMessage(
					`Failed to ${institutionData?.banned ? 'unban' : 'ban'} institution: ${errorData.error || 'Unknown error'}`
				)
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('An error occurred')
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleApprove = async () => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'approve' }),
				}
			)

			const result = await response.json()
			if (response.ok && result.success) {
				setSuccessMessage('Institution approved successfully!')
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
				setShowSuccessModal(true)
			} else {
				setErrorMessage(
					`Failed to approve institution: ${result.error || 'Unknown error'}`
				)
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('An error occurred while approving institution')
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleDeny = async () => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'deny' }),
				}
			)

			const result = await response.json()
			if (response.ok && result.success) {
				setSuccessMessage('Institution denied successfully!')
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
				setShowSuccessModal(true)
			} else {
				setErrorMessage(
					`Failed to deny institution: ${result.error || 'Unknown error'}`
				)
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('An error occurred while denying institution')
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleRequireInfo = () => {
		setShowRequireInfoModal(true)
	}

	const handleRequireInfoConfirm = async (note: string) => {
		if (!params?.id) return

		setActionLoading(true)
		setErrorMessage('')
		setSuccessMessage('')
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'require-info', note }),
				}
			)

			const data = await response.json()

			if (response.ok && data.success) {
				setSuccessMessage(
					'Additional information request sent successfully! The institution has been notified.'
				)
				setShowSuccessModal(true)
				setShowRequireInfoModal(false)
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
			} else {
				setErrorMessage(
					data.error ||
						'Failed to send additional information request. Please try again.'
				)
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage(
				'An error occurred while sending the request. Please try again.'
			)
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
		}
	}

	const handleDownloadAll = async () => {
		if (
			!institutionData?.documents?.verificationDocuments ||
			institutionData.documents.verificationDocuments.length === 0
		) {
			return
		}

		setDownloadingZip(true)
		try {
			const zip = new JSZip()
			const institutionName = institutionData.name.replace(/\s+/g, '_')
			const zipName = `${institutionName}_Verification_Documents`

			// Add all verification documents to the zip
			for (const doc of institutionData.documents.verificationDocuments) {
				try {
					// Use the proxy URL to fetch the file (requires authentication)
					const proxyUrl = getSessionProtectedFileUrl(doc.url)
					if (!proxyUrl) {
						console.warn(
							`Failed to generate proxy URL for document: ${doc.name}`
						)
						continue
					}

					const response = await fetch(proxyUrl, {
						method: 'GET',
						credentials: 'include',
					})

					if (!response.ok) {
						console.warn(
							`Failed to fetch document: ${doc.name} - Status: ${response.status}`
						)
						continue
					}

					const blob = await response.blob()
					const arrayBuffer = await blob.arrayBuffer()
					zip.file(doc.name, arrayBuffer)
				} catch (error) {
					console.warn(`Error adding document ${doc.name} to zip:`, error)
				}
			}

			// Generate the zip file
			const zipBlob = await zip.generateAsync({ type: 'blob' })

			// Create download link
			const url = window.URL.createObjectURL(zipBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `${zipName}.zip`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Error creating zip file:', error)
			setErrorMessage('Failed to download all documents. Please try again.')
			setShowErrorModal(true)
		} finally {
			setDownloadingZip(false)
		}
	}

	const handleBack = () => {
		router.back()
	}

	if (!isClient || loading || adminLoading) {
		return (
			<div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64] mx-auto mb-4"></div>
					<p className="text-gray-600">Loading institution details...</p>
				</div>
			</div>
		)
	}

	if (error || !institutionData) {
		return (
			<div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-8">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
					<p className="text-gray-600 mb-4">
						{error || 'Institution not found'}
					</p>
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
				{/* Left Column - Institution Profile */}
				<div className="w-[350px] flex-shrink-0">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-white rounded-lg p-6 shadow-sm"
					>
						{/* Institution Logo and Basic Info */}
						<div className="text-center mb-6">
							<div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
								{institutionData.logo ? (
									<ProtectedImage
										src={institutionData.logo}
										alt={institutionData.name}
										width={128}
										height={128}
										className="w-full h-full object-cover"
										expiresIn={7200}
										autoRefresh={true}
										errorFallback={
											<div className="w-full h-full flex items-center justify-center bg-[#126E64]/10">
												<Building2 className="w-12 h-12 text-[#126E64]" />
											</div>
										}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-[#126E64]/10">
										<Building2 className="w-12 h-12 text-[#126E64]" />
									</div>
								)}
							</div>
							<h2 className="text-xl font-semibold text-black mb-1">
								{institutionData.name}
							</h2>
							{institutionData.abbreviation && (
								<p className="text-sm text-[#A2A2A2]">
									{institutionData.abbreviation}
								</p>
							)}
							<p className="text-sm text-[#A2A2A2]">
								{institutionData.type} • {institutionData.country}
							</p>

							{/* Status indicator */}
							<div className="mt-3">
								<span
									className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${(() => {
										const status = institutionData.status
										switch (status) {
											case 'Active':
												return 'bg-green-100 text-green-700'
											case 'Suspended':
												return 'bg-red-100 text-red-700'
											case 'Pending':
												return 'bg-yellow-100 text-yellow-700'
											case 'Rejected':
												return 'bg-orange-100 text-orange-700'
											case 'Require Update':
												return 'bg-orange-100 text-orange-700'
											case 'Updated':
												return 'bg-blue-100 text-blue-700'
											case 'Inactive':
												return 'bg-gray-100 text-gray-700'
											default:
												return 'bg-gray-100 text-gray-700'
										}
									})()}`}
								>
									{institutionData.status}
								</span>
							</div>
						</div>

						{/* Contact Information */}
						<div className="mb-6">
							<div className="border-b border-[#DEDEDE] mb-4"></div>
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<Mail className="w-4 h-4 text-[#A2A2A2]" />
									<span className="text-sm text-black">
										{institutionData.email || institutionData.userEmail}
									</span>
								</div>
								{institutionData.website && (
									<div className="flex items-center gap-3">
										<Globe className="w-4 h-4 text-[#A2A2A2]" />
										<a
											href={institutionData.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 hover:underline"
										>
											{institutionData.website}
										</a>
									</div>
								)}
								<div className="flex items-center gap-3">
									<Phone className="w-4 h-4 text-[#A2A2A2]" />
									<span className="text-sm text-black">
										{institutionData.hotlineCode &&
											`+${institutionData.hotlineCode} `}
										{institutionData.hotline}
									</span>
								</div>
								<div>
									<span className="text-sm text-black">
										<strong>Address:</strong> {institutionData.address}
									</span>
								</div>
							</div>
						</div>

						{/* Representative Information */}
						<div className="mb-6">
							<div className="border-b border-[#DEDEDE] mb-4"></div>
							<div className="text-sm font-bold text-black mb-3">
								Representative Information:
							</div>
							<div className="space-y-2">
								<div>
									<span className="text-sm text-black">
										<strong>Name:</strong>{' '}
										{institutionData.repAppellation &&
											`${institutionData.repAppellation} `}
										{institutionData.repName}
									</span>
								</div>
								<div>
									<span className="text-sm text-black">
										<strong>Position:</strong> {institutionData.repPosition}
									</span>
								</div>
								<div>
									<span className="text-sm text-black">
										<strong>Email:</strong> {institutionData.repEmail}
									</span>
								</div>
								<div>
									<span className="text-sm text-black">
										<strong>Phone:</strong>{' '}
										{institutionData.repPhoneCode &&
											`+${institutionData.repPhoneCode} `}
										{institutionData.repPhone}
									</span>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							<button
								onClick={handleContactInstitution}
								disabled={
									(!institutionData?.email && !institutionData?.userEmail) ||
									actionLoading
								}
								className="w-full bg-[#F0A227] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#e6921f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<MessageCircle className="w-4 h-4" />
								Contact Institution
							</button>
							<button
								onClick={handleDeactivateInstitution}
								disabled={actionLoading}
								className={`w-full py-2.5 px-4 rounded-[30px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
									institutionData?.banned
										? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
										: 'bg-[#E20000] text-white hover:bg-[#cc0000]'
								}`}
							>
								{actionLoading
									? 'Processing...'
									: institutionData?.banned
										? 'Deactivate Institution'
										: 'Activate Institution'}
							</button>
							{/* <button
								onClick={handleRevokeSessions}
								disabled={actionLoading}
								className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<LogOut className="w-4 h-4" />
								{actionLoading ? 'Processing...' : 'Revoke All Sessions'}
							</button> */}

							{/* Only show approve/deny buttons when status is PENDING, UPDATED, or REJECTED */}
							{(institutionData.verification_status === 'PENDING' ||
								institutionData.verification_status === 'UPDATED') && (
								<>
									<button
										onClick={handleApprove}
										disabled={actionLoading}
										className="w-full bg-[#22C55E] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{actionLoading ? 'Processing...' : 'Approve Institution'}
									</button>
									<button
										onClick={handleDeny}
										disabled={actionLoading}
										className="w-full bg-[#E20000] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{actionLoading ? 'Processing...' : 'Deny Institution'}
									</button>
									<button
										onClick={handleRequireInfo}
										disabled={actionLoading}
										className="w-full bg-[#F59E0B] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{actionLoading
											? 'Processing...'
											: 'Require Additional Info'}
									</button>
								</>
							)}
							{institutionData.verification_status === 'REJECTED' && (
								<>
									<button
										onClick={handleApprove}
										disabled={actionLoading}
										className="w-full bg-[#22C55E] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{actionLoading ? 'Processing...' : 'Re-approve Institution'}
									</button>
									<button
										onClick={handleRequireInfo}
										disabled={actionLoading}
										className="w-full bg-[#F59E0B] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{actionLoading
											? 'Processing...'
											: 'Require Additional Info'}
									</button>
								</>
							)}
							{/* Show message when status is UPDATED */}
							{institutionData.verification_status === 'UPDATED' && (
								<div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center mb-3">
									<p className="text-sm text-blue-800 font-medium">
										Institution has updated their profile. Please review the
										changes.
									</p>
								</div>
							)}
							{/* Hide all action buttons when status is REQUIRE_UPDATE */}
							{(institutionData.verification_status as string) ===
								'REQUIRE_UPDATE' && (
								<div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
									<p className="text-sm text-orange-800 font-medium">
										Waiting for institution to update their profile
									</p>
								</div>
							)}
						</div>
					</motion.div>
				</div>

				{/* Right Column - Tabbed Content */}
				<div className="flex-1 min-w-0">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						{/* Tab Navigation */}
						<div className="mb-6">
							<h1 className="text-2xl font-bold text-[#116E63] mb-4">
								Institution Details
							</h1>
							<div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
								<button
									onClick={() => setActiveTab('overview')}
									className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
										activeTab === 'overview'
											? 'bg-white text-[#126E64] shadow-sm'
											: 'text-gray-600 hover:text-[#126E64]'
									}`}
								>
									Overview
								</button>
								<button
									onClick={() => setActiveTab('documents')}
									className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
										activeTab === 'documents'
											? 'bg-white text-[#126E64] shadow-sm'
											: 'text-gray-600 hover:text-[#126E64]'
									}`}
								>
									Documents
								</button>
								{/* <button
									onClick={() => setActiveTab('posts')}
									className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
										activeTab === 'posts'
											? 'bg-white text-[#126E64] shadow-sm'
											: 'text-gray-600 hover:text-[#126E64]'
									}`}
								>
									Posts
								</button> */}
								<button
									onClick={() => setActiveTab('update-history')}
									className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
										activeTab === 'update-history'
											? 'bg-white text-[#126E64] shadow-sm'
											: 'text-gray-600 hover:text-[#126E64]'
									}`}
								>
									Update History
								</button>
							</div>
						</div>

						{/* Tab Content */}
						<div className="min-h-[400px]">
							{/* Overview Tab */}
							{activeTab === 'overview' && (
								<InstitutionOverviewTab
									institutionData={institutionData}
									onContactInstitution={handleContactInstitution}
									onDeactivateInstitution={handleDeactivateInstitution}
									actionLoading={actionLoading}
								/>
							)}

							{/* Documents Tab */}
							{activeTab === 'documents' && (
								<div className="space-y-6">
									{/* Verification Documents */}
									<InstitutionDocumentSection
										title="Verification Documents"
										files={
											institutionData.documents.verificationDocuments || []
										}
										institutionId={params?.id as string}
									/>

									{/* Download All Button */}
									<div className="flex justify-center mt-6">
										{(() => {
											const hasDocuments =
												(institutionData.documents.verificationDocuments
													?.length || 0) > 0

											return (
												<button
													onClick={handleDownloadAll}
													disabled={!hasDocuments || downloadingZip}
													className={`px-6 py-2.5 rounded-[20px] flex items-center gap-2 text-sm font-semibold transition-colors ${
														!hasDocuments || downloadingZip
															? 'bg-gray-300 text-gray-500 cursor-not-allowed'
															: 'bg-[#126E64] text-white hover:bg-[#0f5a52]'
													}`}
												>
													{downloadingZip ? (
														<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
													) : (
														<Download className="w-4 h-4" />
													)}
													{downloadingZip ? 'Creating ZIP...' : 'Download all'}
												</button>
											)
										})()}
									</div>
								</div>
							)}

							{/* Posts Tab */}
							{/* {activeTab === 'posts' && (
								<div className="bg-white rounded-lg p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-black mb-4">
										Institution Posts
									</h3>
									<div className="text-center py-12 text-gray-500">
										<Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
										<p className="text-lg mb-2">Posts feature coming soon</p>
										<p className="text-sm">
											This section will display all posts published by this
											institution.
										</p>
									</div>
								</div>
							)} */}

							{/* Update History Tab */}
							{activeTab === 'update-history' && (
								<div className="bg-white rounded-lg p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-black mb-6">
										Information Request History
									</h3>
									{loadingInfoRequests ? (
										<div className="flex items-center justify-center py-12">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#126E64]"></div>
										</div>
									) : infoRequests.length === 0 ? (
										<div className="text-center py-12 text-gray-500">
											<MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
											<p className="text-lg mb-2">No information requests</p>
											<p className="text-sm">
												No additional information requests have been made for
												this institution.
											</p>
										</div>
									) : (
										<div className="space-y-3">
											{infoRequests.map((request) => (
												<div
													key={request.infoRequestId}
													className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
												>
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-3">
															<span
																className={`px-2.5 py-1 rounded-full text-xs font-medium ${
																	request.status === 'PENDING'
																		? 'bg-yellow-100 text-yellow-800'
																		: request.status === 'RESPONDED'
																			? 'bg-blue-100 text-blue-800'
																			: request.status === 'REVIEWED'
																				? 'bg-green-100 text-green-800'
																				: 'bg-gray-100 text-gray-800'
																}`}
															>
																{request.status}
															</span>
															<span className="text-sm text-gray-500">
																{new Date(request.createdAt).toLocaleDateString(
																	'en-US',
																	{
																		year: 'numeric',
																		month: 'short',
																		day: 'numeric',
																		hour: '2-digit',
																		minute: '2-digit',
																	}
																)}
															</span>
														</div>
														<span className="text-xs text-gray-400">
															{request.requestedBy.name}
														</span>
													</div>
													<div className="bg-gray-50 rounded-md p-3">
														<p className="text-sm text-gray-700 whitespace-pre-wrap">
															{request.requestMessage}
														</p>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</motion.div>
				</div>
			</div>

			{/* Ban/Unban Modal */}
			<BanUnbanModal
				isOpen={showBanModal}
				onClose={() => setShowBanModal(false)}
				onConfirm={handleBanUnban}
				userName={institutionData?.name || 'Unknown Institution'}
				userEmail={
					institutionData?.email ||
					institutionData?.userEmail ||
					'Unknown Email'
				}
				currentBanStatus={institutionData?.banned || false}
				currentBanReason={institutionData?.banReason}
				currentBanExpires={
					institutionData?.banExpires
						? new Date(institutionData.banExpires)
						: null
				}
				isLoading={actionLoading}
			/>

			{/* Require Additional Info Modal */}
			<RequireAdditionalInfoModal
				isOpen={showRequireInfoModal}
				onClose={() => setShowRequireInfoModal(false)}
				onConfirm={handleRequireInfoConfirm}
				userName={institutionData?.name || 'Unknown Institution'}
				userEmail={
					institutionData?.email ||
					institutionData?.userEmail ||
					'Unknown Email'
				}
				isLoading={actionLoading}
			/>

			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				title="Success"
				message={successMessage}
			/>

			{/* Error Modal */}
			<ErrorModal
				isOpen={showErrorModal}
				onClose={() => setShowErrorModal(false)}
				title="Error"
				message={errorMessage}
			/>

			{/* Contact Institution Modal */}
			<Modal
				isOpen={showContactModal}
				onClose={() => {
					setShowContactModal(false)
					setEmailSubject('')
					setEmailMessage('')
					setEmailError('')
					setEmailSuccess('')
				}}
				title="Contact Institution"
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
							{institutionData?.name} (
							{institutionData?.email || institutionData?.userEmail})
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
