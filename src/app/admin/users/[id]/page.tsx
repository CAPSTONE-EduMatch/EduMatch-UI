'use client'

import { BanUnbanModal } from '@/components/admin/BanUnbanModal'
import { DocumentSection } from '@/components/admin/DocumentComponents'
import { RevokeSessionsModal } from '@/components/admin/RevokeSessionsModal'
import { ProfileSidebar } from '@/components/profile/layouts/ProfileSidebar'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { ApiResponse, UserDetails } from '@/types/domain/user-details'
import { motion } from 'framer-motion'
import {
	Building2,
	Download,
	GraduationCap,
	LogOut,
	MessageCircle,
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
	{ id: 'user', icon: Users, label: 'User', active: true },
	{ id: 'plan', icon: Building2, label: 'Plan' },
	{ id: 'transaction', icon: Building2, label: 'Transaction' },
	{ id: 'supports', icon: Building2, label: 'Supports' },
	{ id: 'track-user-log', icon: Building2, label: 'Track user log' },
	{ id: 'logout', icon: Building2, label: 'Log out' },
]

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

export default function UserDetailPage() {
	const [isClient, setIsClient] = useState(false)
	const [userData, setUserData] = useState<UserDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState(false)
	const [showBanModal, setShowBanModal] = useState(false)
	const [showRevokeModal, setShowRevokeModal] = useState(false)
	const router = useRouter()
	const params = useParams()
	const { isLoading: adminLoading } = useAdminAuth()

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

	const handleContactUser = async () => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const response = await fetch(`/api/admin/users/${params.id}/actions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'contact' }),
			})

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

	const handleDeactivateUser = async () => {
		setShowBanModal(true)
	}

	const handleRevokeSessions = async () => {
		setShowRevokeModal(true)
	}

	const confirmRevokeSessions = async () => {
		if (!params?.id) return

		setActionLoading(true)
		try {
			const response = await fetch(`/api/admin/users/${params.id}/actions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'revoke-sessions' }),
			})

			if (response.ok) {
				alert('All user sessions revoked successfully!')
				setShowRevokeModal(false)
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
			const action = userData?.banned ? 'unban' : 'ban'
			const response = await fetch(`/api/admin/users/${params.id}/actions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					banReason,
					banDuration,
				}),
			})

			if (response.ok) {
				const message = userData?.banned
					? 'User unbanned successfully!'
					: 'User banned successfully!'
				alert(message)

				// Reload user data to reflect changes
				await loadUserData(params.id as string)
				setShowBanModal(false)
			} else {
				const errorData = await response.json()
				alert(
					`Failed to ${userData?.banned ? 'unban' : 'ban'} user: ${errorData.error || 'Unknown error'}`
				)
			}
		} catch (error) {
			alert('An error occurred')
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
				alert(`User ${action}d successfully!`)
				// Reload user data to reflect changes
				await loadUserData(params.id as string)
			} else {
				const errorData = await response.json()
				alert(`Failed to ${action} user: ${errorData.error || 'Unknown error'}`)
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

	if (error || !userData) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
					<p className="text-gray-600">{error || 'User not found'}</p>
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
					activeSection="user"
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
								Back to User Management
							</span>
						</button>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-lg font-bold text-[#126E64]">EduMatch</span>
						<span className="text-sm text-[#126E64]">Administrator</span>
					</div>
				</div> */}

				<div className="flex gap-12 p-6 max-w-7xl mx-auto">
					{/* Left Column - User Profile */}
					<div className="w-[350px] flex-shrink-0">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="bg-white rounded-lg p-6 shadow-sm"
						>
							{/* Profile Image and Basic Info */}
							<div className="text-center mb-6">
								<div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
									<Image
										src={userData.profileImage}
										alt={userData.name}
										width={128}
										height={128}
										className="w-full h-full object-cover"
									/>
								</div>
								<h2 className="text-xl font-semibold text-black mb-1">
									{userData.name}
								</h2>
								<p className="text-sm text-[#A2A2A2]">
									{userData.birthDate} - {userData.gender}
								</p>
							</div>

							{/* Academic Information */}
							<div className="mb-6">
								<div className="border-b border-[#DEDEDE] mb-4"></div>
								<div className="space-y-3">
									<div>
										<span className="text-sm text-black">Program: </span>
										<span className="text-sm font-medium text-black">
											{userData.program}
										</span>
									</div>
									<div>
										<span className="text-sm text-black">GPA: </span>
										<span className="text-sm font-medium text-black">
											{userData.gpa}
										</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											Status:{' '}
										</span>
										<span className="text-sm font-semibold text-black">
											{userData.status}
										</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											University:{' '}
										</span>
										<span className="text-sm font-semibold text-black">
											{userData.university}
										</span>
									</div>
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
													{new Date(userData.banExpires).toLocaleDateString(
														'en-US',
														{
															year: 'numeric',
															month: 'long',
															day: 'numeric',
														}
													)}
												</div>
											)}
											{!userData.banExpires && (
												<div className="text-xs text-red-600">
													<strong>Status:</strong> Permanent ban
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Contact Information */}
							<div className="mb-6">
								<div className="border-b border-[#DEDEDE] mb-4"></div>
								<div className="space-y-3">
									<div>
										<span className="text-sm text-black">Email: </span>
										<span className="text-sm text-black">{userData.email}</span>
									</div>
									<div>
										<span className="text-sm text-black">Phone number: </span>
										<span className="text-sm text-black">{userData.phone}</span>
									</div>
									<div>
										<span className="text-sm text-black">Nationality: </span>
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
									disabled={actionLoading}
									className="w-full bg-[#F0A227] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#e6921f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<MessageCircle className="w-4 h-4" />
									{actionLoading ? 'Sending...' : 'Contact Applicant'}
								</button>
								<button
									onClick={handleDeactivateUser}
									disabled={actionLoading}
									className={`w-full py-2.5 px-4 rounded-[30px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
										userData?.banned
											? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
											: 'bg-[#E20000] text-white hover:bg-[#cc0000]'
									}`}
								>
									{actionLoading
										? 'Processing...'
										: userData?.banned
											? 'Unban User'
											: 'Ban User'}
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
									onClick={handleChangeStatus}
									disabled={actionLoading}
									className={`w-full py-2.5 px-4 rounded-[30px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
										userData?.status === 'Active'
											? 'bg-[#E20000] text-white hover:bg-[#cc0000]'
											: 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
									}`}
								>
									{actionLoading
										? 'Processing...'
										: userData?.status === 'Active'
											? 'Deactivate User'
											: 'Activate User'}
								</button>
							</div>
						</motion.div>
					</div>

					{/* Right Column - Documents */}
					<div className="flex-1 min-w-0">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<div className="mb-6">
								<h1 className="text-2xl font-bold text-[#116E63] mb-2">
									Academic Profile
								</h1>
								<div className="border-b border-[#DEDEDE] mb-6"></div>
							</div>

							<DocumentSection
								title="Research paper"
								files={userData.documents.researchPapers}
								userId={params.id as string}
							/>

							<DocumentSection
								title="Transcript"
								files={userData.documents.transcripts}
								userId={params.id as string}
							/>

							<DocumentSection
								title="Degrees"
								files={userData.documents.degrees}
								userId={params.id as string}
							/>

							<DocumentSection
								title="Foreign Language Certificate"
								files={userData.documents.languageCertificates}
								userId={params.id as string}
							/>

							<DocumentSection
								title="CV / Resume"
								files={userData.documents.cvResume}
								userId={params.id as string}
							/>

							{/* Download All Button */}
							<div className="flex justify-center mt-6">
								<button
									disabled={
										userData.documents.researchPapers.length === 0 &&
										userData.documents.transcripts.length === 0 &&
										userData.documents.degrees.length === 0 &&
										userData.documents.languageCertificates.length === 0 &&
										userData.documents.cvResume.length === 0
									}
									className={`px-6 py-2.5 rounded-[20px] flex items-center gap-2 text-sm font-semibold transition-colors ${
										userData.documents.researchPapers.length === 0 &&
										userData.documents.transcripts.length === 0 &&
										userData.documents.degrees.length === 0 &&
										userData.documents.languageCertificates.length === 0 &&
										userData.documents.cvResume.length === 0
											? 'bg-gray-300 text-gray-500 cursor-not-allowed'
											: 'bg-[#126E64] text-white hover:bg-[#0f5a52]'
									}`}
								>
									<Download className="w-4 h-4" />
									Download all
								</button>
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
				userName={userData?.name || 'Unknown User'}
				userEmail={userData?.email || 'Unknown Email'}
				currentBanStatus={userData?.banned || false}
				currentBanReason={userData?.banReason}
				currentBanExpires={
					userData?.banExpires ? new Date(userData.banExpires) : null
				}
				isLoading={actionLoading}
			/>

			{/* Revoke Sessions Modal */}
			<RevokeSessionsModal
				isOpen={showRevokeModal}
				onClose={() => setShowRevokeModal(false)}
				onConfirm={confirmRevokeSessions}
				userName={userData?.name || 'Unknown User'}
				userEmail={userData?.email || 'Unknown Email'}
				isLoading={actionLoading}
			/>
		</div>
	)
}
