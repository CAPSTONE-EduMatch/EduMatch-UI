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

	const handleContactInstitution = async () => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'contact' }),
				}
			)

			if (response.ok) {
				setSuccessMessage('Contact request sent successfully!')
				setShowSuccessModal(true)
			} else {
				setErrorMessage('Failed to send contact request')
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('An error occurred while sending contact request')
			setShowErrorModal(true)
		} finally {
			setActionLoading(false)
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
		try {
			const response = await fetch(
				`/api/admin/institutions/${params.id}/actions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'require-info', note }),
				}
			)

			if (response.ok) {
				alert('Additional information request sent successfully!')
				setShowRequireInfoModal(false)
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
			} else {
				const errorData = await response.json()
				alert(`Failed to send request: ${errorData.error || 'Unknown error'}`)
			}
		} catch (error) {
			alert('An error occurred')
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
									className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
										institutionData.status === 'Active'
											? 'bg-green-100 text-green-700'
											: institutionData.status === 'Suspended'
												? 'bg-red-100 text-red-700'
												: institutionData.status === 'Pending'
													? 'bg-yellow-100 text-yellow-700'
													: institutionData.status === 'Rejected'
														? 'bg-orange-100 text-orange-700'
														: 'bg-gray-100 text-gray-700'
									}`}
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
								disabled={actionLoading}
								className="w-full bg-[#F0A227] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#e6921f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<MessageCircle className="w-4 h-4" />
								{actionLoading ? 'Sending...' : 'Contact Institution'}
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
										? 'Unban Institution'
										: 'Ban Institution'}
							</button>
							<button
								onClick={handleRevokeSessions}
								disabled={actionLoading}
								className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<LogOut className="w-4 h-4" />
								{actionLoading ? 'Processing...' : 'Revoke All Sessions'}
							</button>
							{institutionData.verification_status === 'PENDING' && (
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
								</>
							)}
							{institutionData.verification_status === 'REJECTED' && (
								<button
									onClick={handleApprove}
									disabled={actionLoading}
									className="w-full bg-[#22C55E] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{actionLoading ? 'Processing...' : 'Re-approve Institution'}
								</button>
							)}
							<button
								onClick={handleRequireInfo}
								disabled={actionLoading}
								className="w-full bg-[#F59E0B] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{actionLoading ? 'Processing...' : 'Require Additional Info'}
							</button>
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
								<button
									onClick={() => setActiveTab('posts')}
									className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
										activeTab === 'posts'
											? 'bg-white text-[#126E64] shadow-sm'
											: 'text-gray-600 hover:text-[#126E64]'
									}`}
								>
									Posts
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
							{activeTab === 'posts' && (
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
		</>
	)
}
