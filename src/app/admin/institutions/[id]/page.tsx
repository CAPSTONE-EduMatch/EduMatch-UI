'use client'

import { BanUnbanModal } from '@/components/admin/BanUnbanModal'
import { InstitutionDocumentSection } from '@/components/admin/InstitutionDocumentComponents'
import { InstitutionOverviewTab } from '@/components/admin/InstitutionOverviewTab'
import { RequireAdditionalInfoModal } from '@/components/admin/RequireAdditionalInfoModal'
import { ProfileSidebar } from '@/components/profile/layouts/ProfileSidebar'
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
	GraduationCap,
	LogOut,
	Mail,
	MessageCircle,
	Phone,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const sidebarItems = [
	{ id: 'dashboard', icon: Users, label: 'Dashboard' },
	{ id: 'certifications', icon: GraduationCap, label: 'Certifications' },
	{ id: 'posts', icon: Building2, label: 'Posts' },
	{ id: 'discipline', icon: Building2, label: 'Discipline' },
	{ id: 'user', icon: Users, label: 'User' },
	{ id: 'institution', icon: Building2, label: 'Institution', active: true },
	{ id: 'plan', icon: Building2, label: 'Plan' },
	{ id: 'transaction', icon: Building2, label: 'Transaction' },
	{ id: 'supports', icon: Building2, label: 'Supports' },
	{ id: 'track-user-log', icon: Building2, label: 'Track user log' },
	{ id: 'logout', icon: Building2, label: 'Log out' },
]

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

// Logo section for admin sidebar
const AdminLogoSection = () => (
	<div className="flex flex-col items-center justify-center mb-12 pt-8">
		<Image
			src="/edumatch_logo.svg"
			alt="EduMatch Logo"
			className="w-12 h-12 mb-2"
			width={48}
			height={48}
		/>
		<h1 className="text-white text-2xl font-bold text-center">EduMatch</h1>
	</div>
)

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
				alert('Contact request sent successfully!')
			} else {
				alert('Failed to send contact request')
			}
		} catch (error) {
			alert('An error occurred')
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
				alert('All institution sessions revoked successfully!')
			} else {
				const errorData = await response.json()
				alert(
					`Failed to revoke sessions: ${errorData.error || 'Unknown error'}`
				)
			}
		} catch (error) {
			alert('An error occurred while revoking sessions')
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
				alert(message)

				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
				setShowBanModal(false)
			} else {
				const errorData = await response.json()
				alert(
					`Failed to ${institutionData?.banned ? 'unban' : 'ban'} institution: ${errorData.error || 'Unknown error'}`
				)
			}
		} catch (error) {
			alert('An error occurred')
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

			if (response.ok) {
				alert('Institution approved successfully!')
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
			} else {
				const errorData = await response.json()
				alert(
					`Failed to approve institution: ${errorData.error || 'Unknown error'}`
				)
			}
		} catch (error) {
			alert('An error occurred')
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

			if (response.ok) {
				alert('Institution denied successfully!')
				// Reload institution data to reflect changes
				await loadInstitutionData(params.id as string)
			} else {
				const errorData = await response.json()
				alert(
					`Failed to deny institution: ${errorData.error || 'Unknown error'}`
				)
			}
		} catch (error) {
			alert('An error occurred')
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

	const handleBack = () => {
		router.back()
	}

	const handleSectionChange = (section: string) => {
		switch (section) {
			case 'user':
				router.push('/admin/users')
				break
			case 'institution':
				router.push('/admin/institutions')
				break
			case 'dashboard':
				router.push('/admin/dashboard')
				break
			case 'certifications':
				router.push('/admin/certifications')
				break
			case 'posts':
				router.push('/admin/posts')
				break
			case 'discipline':
				router.push('/admin/discipline')
				break
			case 'plan':
				router.push('/admin/plan')
				break
			case 'transaction':
				router.push('/admin/transaction')
				break
			case 'supports':
				router.push('/admin/supports')
				break
			case 'track-user-log':
				router.push('/admin/track-user-log')
				break
			case 'logout':
				// Handle logout logic here
				if (confirm('Are you sure you want to log out?')) {
					router.push('/auth/login')
				}
				break
			default:
				// Stay on current page for unknown sections
				break
		}
	}

	if (!isClient || loading || adminLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	if (error || !institutionData) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
					<p className="text-gray-600">{error || 'Institution not found'}</p>
					<button
						onClick={handleBack}
						className="mt-4 px-4 py-2 bg-[#126E64] text-white rounded hover:bg-[#0f5a52] transition-colors"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] flex">
			{/* Sidebar */}
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10">
				<ProfileSidebar
					activeSection="institution"
					onSectionChange={handleSectionChange}
					navItems={sidebarItems}
					showProfileSection={false}
					logoSection={<AdminLogoSection />}
					enableNavigationProtection={false}
					sidebarStyle={{
						activeItemBgColor: 'bg-white/10',
						activeItemTextColor: 'text-white',
						activeItemBorder: 'border border-white/20',
						inactiveItemTextColor: 'text-white/80',
						itemBorderRadius: 'rounded-full',
						itemPadding: 'px-4 py-3',
						itemSpacing: 'mb-2',
					}}
					containerPaddingTop="pt-0"
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1">
				{/* Header */}
				{/* <div className="bg-white shadow-sm p-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={handleBack}
							className="flex items-center gap-2 text-[#126E64] hover:text-[#0f5a52] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							<span className="text-sm font-medium">
								Back to Institution Management
							</span>
						</button>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-lg font-bold text-[#126E64]">EduMatch</span>
						<span className="text-sm text-[#126E64]">Administrator</span>
					</div>
				</div> */}

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
										<Image
											src={institutionData.logo}
											alt={institutionData.name}
											width={128}
											height={128}
											className="w-full h-full object-cover"
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

								{/* Ban Status */}
								{institutionData.banned && (
									<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<span className="w-2 h-2 bg-red-500 rounded-full"></span>
											<span className="text-sm font-semibold text-red-700">
												Institution is Banned
											</span>
										</div>
										{institutionData.banReason && (
											<div className="text-xs text-red-600 mb-1">
												<strong>Reason:</strong> {institutionData.banReason}
											</div>
										)}
										{institutionData.banExpires && (
											<div className="text-xs text-red-600">
												<strong>Expires:</strong>{' '}
												{new Date(
													institutionData.banExpires
												).toLocaleDateString('en-US', {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
												})}
											</div>
										)}
										{!institutionData.banExpires && (
											<div className="text-xs text-red-600">
												<strong>Status:</strong> Permanent ban
											</div>
										)}
									</div>
								)}
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
										<InstitutionDocumentSection
											title="Accreditation Certificates"
											files={
												institutionData.documents.accreditationCertificates
											}
											institutionId={params.id as string}
										/>

										<InstitutionDocumentSection
											title="Operating Licenses"
											files={institutionData.documents.operatingLicenses}
											institutionId={params.id as string}
										/>

										<InstitutionDocumentSection
											title="Tax Documents"
											files={institutionData.documents.taxDocuments}
											institutionId={params.id as string}
										/>

										<InstitutionDocumentSection
											title="Representative Documents"
											files={institutionData.documents.representativeDocuments}
											institutionId={params.id as string}
										/>

										<InstitutionDocumentSection
											title="Other Documents"
											files={institutionData.documents.otherDocuments}
											institutionId={params.id as string}
										/>

										{/* Download All Button */}
										<div className="flex justify-center mt-6">
											{(() => {
												const hasDocuments =
													institutionData.documents.accreditationCertificates
														.length > 0 ||
													institutionData.documents.operatingLicenses.length >
														0 ||
													institutionData.documents.taxDocuments.length > 0 ||
													institutionData.documents.representativeDocuments
														.length > 0 ||
													institutionData.documents.otherDocuments.length > 0

												return (
													<button
														disabled={!hasDocuments}
														className={`px-6 py-2.5 rounded-[20px] flex items-center gap-2 text-sm font-semibold transition-colors ${
															!hasDocuments
																? 'bg-gray-300 text-gray-500 cursor-not-allowed'
																: 'bg-[#126E64] text-white hover:bg-[#0f5a52]'
														}`}
													>
														<Download className="w-4 h-4" />
														Download all
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
		</div>
	)
}
