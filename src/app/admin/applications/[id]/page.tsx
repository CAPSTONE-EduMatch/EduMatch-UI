'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { ApplicationStatus } from '@prisma/client'
import {
	ArrowLeft,
	Calendar,
	FileText,
	GraduationCap,
	Mail,
	Phone,
	User,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ApplicationDetail {
	id: string
	status: ApplicationStatus
	appliedDate: Date
	reapplyCount: number
	applicant: {
		id: string
		userId: string
		name: string | null
		email: string
		image: string | null
	}
	snapshot: {
		firstName: string | null
		lastName: string | null
		userName: string | null
		userEmail: string | null
		birthday: Date | null
		gender: boolean | null
		nationality: string | null
		phoneNumber: string | null
		countryCode: string | null
		profilePhoto: string | null
		graduated: boolean | null
		level: string | null
		gpa: number | null
		university: string | null
		countryOfStudy: string | null
		hasForeignLanguage: boolean | null
		languages: any
		favoriteCountries: string[]
	} | null
	documents: {
		id: string
		name: string
		url: string
		size: number
		documentType: string
		updateAt: Date | null
		isUpdateSubmission: boolean
	}[]
	post: {
		id: string
		title: string
		description: string | null
		startDate: Date
		endDate: Date | null
		location: string | null
		degreeLevel: string
		status: string
		type: string
		institution: {
			id: string
			name: string
			logo: string | null
			country: string
			type: string
			website: string | null
			email: string | null
		}
		subdisciplines: {
			id: string
			name: string
			discipline: {
				id: string
				name: string
			}
		}[]
	}
}

const getStatusColor = (status: ApplicationStatus) => {
	switch (status) {
		case 'SUBMITTED':
			return 'bg-blue-100 text-blue-800 border-blue-200'
		case 'PROGRESSING':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200'
		case 'ACCEPTED':
			return 'bg-green-100 text-green-800 border-green-200'
		case 'REJECTED':
			return 'bg-red-100 text-red-800 border-red-200'
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200'
	}
}

const getStatusLabel = (status: ApplicationStatus) => {
	switch (status) {
		case 'SUBMITTED':
			return 'Submitted'
		case 'PROGRESSING':
			return 'Progressing'
		case 'ACCEPTED':
			return 'Accepted'
		case 'REJECTED':
			return 'Rejected'
		default:
			return status
	}
}

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function AdminApplicationDetailPage() {
	const router = useRouter()
	const params = useParams()
	const { isAdmin, isLoading: authLoading } = useAdminAuth()
	const [application, setApplication] = useState<ApplicationDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const applicationId = params?.id as string

	useEffect(() => {
		if (!isAdmin && !authLoading) {
			router.push('/signin')
		}
	}, [isAdmin, authLoading, router])

	useEffect(() => {
		const fetchApplication = async () => {
			if (!applicationId) {
				setError('Application ID is required')
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				setError(null)

				const response = await fetch(
					`/api/admin/applications/${applicationId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (!response.ok) {
					throw new Error('Failed to fetch application details')
				}

				const result = await response.json()

				if (result.success && result.application) {
					setApplication(result.application)
				} else {
					throw new Error(result.error || 'Failed to fetch application details')
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: 'Failed to fetch application details'
				)
			} finally {
				setLoading(false)
			}
		}

		if (applicationId && isAdmin) {
			fetchApplication()
		}
	}, [applicationId, isAdmin])

	if (authLoading || loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#F5F7FB]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	if (!isAdmin) {
		return null
	}

	if (error || !application) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">
						Error Loading Application
					</h2>
					<p className="text-gray-600 mb-4">
						{error || 'Application not found'}
					</p>
					<button
						onClick={() => router.push('/admin/applications')}
						className="bg-[#126E64] hover:bg-[#0d5449] text-white px-6 py-2 rounded-lg"
					>
						Back to Applications
					</button>
				</div>
			</div>
		)
	}

	const applicantName =
		application.snapshot?.userName ||
		[application.snapshot?.firstName, application.snapshot?.lastName]
			.filter(Boolean)
			.join(' ') ||
		application.applicant.name ||
		'Unknown'

	const parsedLanguages = application.snapshot?.languages
		? (() => {
				const raw = application.snapshot!.languages

				if (Array.isArray(raw)) return raw

				if (typeof raw === 'string') {
					try {
						const parsed = JSON.parse(raw)
						return Array.isArray(parsed) ? parsed : []
					} catch {
						return []
					}
				}

				return []
			})()
		: []

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header */}
			<div className="px-8 pt-[35px] pb-6">
				<button
					onClick={() => router.push('/admin/applications')}
					className="flex items-center gap-2 text-[#126E64] hover:underline mb-4"
				>
					<ArrowLeft className="w-5 h-5" />
					<span>Back to Applications</span>
				</button>
				<h1 className="text-2xl font-bold text-[#126E64]">
					Application Details
				</h1>
			</div>

			{/* Application Overview */}
			<div className="px-8 mb-6">
				<Card className="bg-white rounded-[20px] shadow-sm border-0">
					<CardHeader className="border-b border-gray-200">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-bold text-gray-900">
									{applicantName}
								</CardTitle>
								<p className="text-sm text-gray-600 mt-1">
									Application ID: {application.id}
								</p>
							</div>
							<div
								className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(
									application.status
								)}`}
							>
								{getStatusLabel(application.status)}
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-6">
						<div className="grid grid-cols-3 gap-6">
							<div>
								<p className="text-sm text-gray-600 mb-1">Applied Date</p>
								<p className="text-base font-medium text-gray-900">
									{new Date(application.appliedDate).toLocaleDateString()}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600 mb-1">Reapply Count</p>
								<p className="text-base font-medium text-gray-900">
									{application.reapplyCount}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600 mb-1">Post Title</p>
								<p className="text-base font-medium text-gray-900">
									{application.post.title}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="px-8 grid grid-cols-2 gap-6">
				{/* Left Column - Applicant Information */}
				<div className="space-y-6">
					{/* Applicant Profile */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardHeader className="border-b border-gray-200">
							<CardTitle className="flex items-center gap-2 text-lg font-semibold">
								<User className="w-5 h-5 text-[#126E64]" />
								Applicant Profile
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 space-y-4">
							{application.snapshot && (
								<>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-600">First Name</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.firstName || '-'}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-600">Last Name</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.lastName || '-'}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-600 flex items-center gap-1">
												<Mail className="w-4 h-4" />
												Email
											</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.userEmail ||
													application.applicant.email}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-600 flex items-center gap-1">
												<Phone className="w-4 h-4" />
												Phone
											</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.countryCode &&
												application.snapshot.phoneNumber
													? `${application.snapshot.countryCode} ${application.snapshot.phoneNumber}`
													: '-'}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-600">Nationality</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.nationality || '-'}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-600 flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												Birthday
											</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.birthday
													? new Date(
															application.snapshot.birthday
														).toLocaleDateString()
													: '-'}
											</p>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Academic Information */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardHeader className="border-b border-gray-200">
							<CardTitle className="flex items-center gap-2 text-lg font-semibold">
								<GraduationCap className="w-5 h-5 text-[#126E64]" />
								Academic Information
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 space-y-4">
							{application.snapshot && (
								<>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-600">Education Level</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.level || '-'}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-600">GPA</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.gpa
													? Number(application.snapshot.gpa).toFixed(2)
													: '-'}
											</p>
										</div>
									</div>

									<div>
										<p className="text-sm text-gray-600">University</p>
										<p className="text-base font-medium text-gray-900">
											{application.snapshot.university || '-'}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-gray-600">Country of Study</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.countryOfStudy || '-'}
											</p>
										</div>
										<div>
											<p className="text-sm text-gray-600">Graduated</p>
											<p className="text-base font-medium text-gray-900">
												{application.snapshot.graduated !== null
													? application.snapshot.graduated
														? 'Yes'
														: 'No'
													: '-'}
											</p>
										</div>
									</div>

									{application.snapshot.hasForeignLanguage && (
										<div>
											<p className="text-md text-gray-600 mb-2">Languages</p>

											{parsedLanguages.length === 0 ? (
												<p className="text-base font-medium text-gray-900">-</p>
											) : (
												<div className="space-y-2">
													{parsedLanguages.map((lang: any, index: number) => (
														<div
															key={index}
															className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
														>
															<div>
																<p className="text-md font-medium text-gray-900">
																	{lang.language || 'Unknown language'}
																</p>
																<p className="text-sm text-gray-600">
																	{lang.certificate
																		? `Certificate: ${lang.certificate}`
																		: 'No certificate information'}
																</p>
															</div>
															{lang.score && (
																<span className="px-3 py-1 rounded-full bg-[#126E64]/10 text-[#126E64] text-xs font-semibold">
																	Score: {lang.score}
																</span>
															)}
														</div>
													))}
												</div>
											)}
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Post & Documents */}
				<div className="space-y-6">
					{/* Post Information */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardHeader className="border-b border-gray-200">
							<CardTitle className="flex items-center gap-2 text-lg font-semibold">
								<FileText className="w-5 h-5 text-[#126E64]" />
								Post Information
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 space-y-4">
							<div>
								<p className="text-sm text-gray-600">Post Title</p>
								<p className="text-base font-medium text-gray-900">
									{application.post.title}
								</p>
							</div>

							<div>
								<p className="text-sm text-gray-600">Institution</p>
								<p className="text-base font-medium text-gray-900">
									{application.post.institution.name}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600">Type</p>
									<p className="text-base font-medium text-gray-900">
										{application.post.type === 'Job'
											? 'Research Lab'
											: application.post.type}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Degree Level</p>
									<p className="text-base font-medium text-gray-900">
										{application.post.degreeLevel}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600">Start Date</p>
									<p className="text-base font-medium text-gray-900">
										{new Date(application.post.startDate).toLocaleDateString()}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">End Date</p>
									<p className="text-base font-medium text-gray-900">
										{application.post.endDate
											? new Date(application.post.endDate).toLocaleDateString()
											: 'Ongoing'}
									</p>
								</div>
							</div>

							{application.post.location && (
								<div>
									<p className="text-sm text-gray-600">Location</p>
									<p className="text-base font-medium text-gray-900">
										{application.post.location}
									</p>
								</div>
							)}

							{application.post.subdisciplines.length > 0 && (
								<div>
									<p className="text-sm text-gray-600 mb-2">Subdisciplines</p>
									<div className="flex flex-wrap gap-2">
										{application.post.subdisciplines.map((sub) => (
											<span
												key={sub.id}
												className="px-3 py-1 bg-[#126E64]/10 text-[#126E64] rounded-full text-xs font-medium"
											>
												{sub.name}
											</span>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Documents */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardHeader className="border-b border-gray-200">
							<CardTitle className="flex items-center gap-2 text-lg font-semibold">
								<FileText className="w-5 h-5 text-[#126E64]" />
								Submitted Documents ({application.documents.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6">
							{application.documents.length > 0 ? (
								<div className="space-y-3">
									{application.documents.map((doc) => (
										<div
											key={doc.id}
											className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-gray-900 truncate">
														{doc.name}
													</p>
													<p className="text-xs text-gray-600">
														{formatFileSize(doc.size)}
														{doc.isUpdateSubmission && (
															<span className="ml-2 text-orange-600 font-medium">
																(Updated)
															</span>
														)}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-gray-600 text-center py-8">
									No documents submitted
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
