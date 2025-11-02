'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { Download, User, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import {
	InfoSection,
	ProfileCard,
	DocumentPanel,
	TwoPanelLayout,
} from '@/components/shared'
import { UpdateApplicationModal } from './UpdateApplicationModal'
import type { Applicant } from './ApplicantsTable'
import { getCountriesWithSvgFlags } from '@/data/countries'
import JSZip from 'jszip'

interface ApplicantDetailViewProps {
	applicant: Applicant
	onBack: () => void
	onApprove: (applicant: Applicant) => void
	onReject: (applicant: Applicant) => void
	onRequireUpdate: (applicant: Applicant) => void
}

interface Document {
	documentId: string
	name: string
	size: number
	uploadDate: string
	url: string
	title?: string | null
	subdiscipline?: string[]
	updateRequestId?: string
}

interface ApplicationDetails {
	application: {
		applicationId: string
		applicantId: string
		postId: string
		status: string
		applyAt: string
		documents: Document[]
		updateDocuments?: Document[]
		post: {
			id: string
			title: string
			startDate: string
			endDate?: string
			location?: string
			otherInfo?: string
			institution: {
				name: string
				logo?: string
				country?: string
			}
			program?: any
			scholarship?: any
			job?: any
		}
	}
	updateRequests?: Array<{
		updateRequestId: string
		requestMessage: string
		requestedDocuments: string[]
		status: string
		createdAt: string
		responseSubmittedAt?: string
		responseMessage?: string
		requestedBy: {
			userId: string
			name: string
			email: string
		}
		responseDocuments: Array<{
			documentId: string
			name: string
			url: string
			size: number
			documentType: string
			updatedAt?: string
		}>
	}>
	applicant: {
		applicantId: string
		firstName?: string
		lastName?: string
		name: string
		email: string
		image?: string
		birthday?: string
		gender?: string
		nationality?: string
		phoneNumber?: string
		countryCode?: string
		graduated?: boolean
		level?: string
		subdiscipline?:
			| Array<{
					id: string
					name: string
					disciplineName: string
			  }>
			| string
		disciplines?: string[]
		gpa?: any
		university?: string
		countryOfStudy?: string
		hasForeignLanguage?: boolean
		languages?: any
		documents: Document[]
	}
}

export const ApplicantDetailView: React.FC<ApplicantDetailViewProps> = ({
	applicant,
	onBack,
	onApprove,
	onReject,
	onRequireUpdate,
}) => {
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<'academic' | 'requirements'>(
		'academic'
	)
	const [requirementsSubTab, setRequirementsSubTab] = useState<
		'application' | 'updates'
	>('application')
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [applicationDetails, setApplicationDetails] =
		useState<ApplicationDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [downloadingZip, setDownloadingZip] = useState<string | null>(null)
	const [processingStatus, setProcessingStatus] = useState<
		'approve' | 'reject' | 'update' | null
	>(null)

	// Fetch application details from API
	useEffect(() => {
		const fetchApplicationDetails = async () => {
			try {
				setLoading(true)
				setError(null)

				// Assuming the applicant object has an applicationId or we can derive it
				// You might need to pass the applicationId as a prop or get it from the applicant object
				const applicationId = applicant.id // or however you get the application ID

				const response = await fetch(
					`/api/applications/institution/${applicationId}`,
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

				if (result.success) {
					// eslint-disable-next-line no-console
					console.log('Application details loaded:', {
						level: result.data?.applicant?.level,
						subdiscipline: result.data?.applicant?.subdiscipline,
						disciplines: result.data?.applicant?.disciplines,
					})
					setApplicationDetails(result.data)
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

		fetchApplicationDetails()
	}, [applicant.id])

	// Get documents from API data - use profile snapshot documents for Academic Profile tab
	const documents: Document[] = applicationDetails?.applicant?.documents || []
	const getDocumentTypeLabel = (documentType: string) => {
		// Map category keys to display labels
		const categoryLabels = {
			cv: 'CV / Resume',
			certificate: 'Language Certificates',
			degree: 'Degree Certificates',
			transcript: 'Academic Transcripts',
			research: 'Research Papers',
			portfolio: 'Portfolio',
			personal: 'Personal Statements',
			recommendation: 'Recommendation Letters',
			passport: 'Passport Copies',
			institution: 'Institution Verification',
			required: 'Required Documents',
			other: 'Other Documents',
		}

		return (
			categoryLabels[documentType as keyof typeof categoryLabels] ||
			documentType
		)
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const createZipFromDocuments = async (docs: Document[], zipName: string) => {
		const zip = new JSZip()

		// Create a folder for the documents
		const folder = zip.folder(zipName) || zip

		// Add each document to the zip
		for (const doc of docs) {
			try {
				// Fetch the document content
				const response = await fetch(doc.url)
				if (!response.ok) {
					// eslint-disable-next-line no-console
					console.warn(`Failed to fetch document: ${doc.name}`)
					continue
				}

				const blob = await response.blob()
				const arrayBuffer = await blob.arrayBuffer()

				// Add to zip with the document name
				folder.file(doc.name, arrayBuffer)
			} catch (error) {
				// eslint-disable-next-line no-console
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
	}

	const handleDownloadAll = async () => {
		if (
			!applicationDetails?.applicant?.documents ||
			applicationDetails.applicant.documents.length === 0
		) {
			// eslint-disable-next-line no-console
			console.log('No documents to download')
			return
		}

		setDownloadingZip('all')
		try {
			const zipName = `${applicant.name.replace(/\s+/g, '_')}_All_Documents`
			await createZipFromDocuments(
				applicationDetails.applicant.documents,
				zipName
			)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error creating zip file:', error)
		} finally {
			setDownloadingZip(null)
		}
	}

	const handleDownloadFolder = async (documentType: string) => {
		if (!documents || documents.length === 0) {
			return
		}

		// Filter documents by type
		const typeDocs = documents.filter((doc) => {
			const docType = (doc as any).documentType || 'OTHER'
			const upperType = docType.toUpperCase()

			// Map category to document type matching
			if (
				documentType === 'cv' &&
				(upperType.includes('CV') || upperType.includes('RESUME'))
			) {
				return true
			} else if (documentType === 'degree' && upperType.includes('DEGREE')) {
				// Check degree first to catch DEGREE_CERTIFICATE
				return true
			} else if (
				documentType === 'certificate' &&
				(upperType.includes('LANGUAGE') ||
					(upperType.includes('CERTIFICATE') && !upperType.includes('DEGREE')))
			) {
				// Certificate category excludes DEGREE_CERTIFICATE
				return true
			} else if (
				documentType === 'transcript' &&
				upperType.includes('TRANSCRIPT')
			) {
				return true
			} else if (
				documentType === 'research' &&
				upperType.includes('RESEARCH')
			) {
				return true
			} else if (
				documentType === 'portfolio' &&
				upperType.includes('PORTFOLIO')
			) {
				return true
			} else if (
				documentType === 'personal' &&
				upperType.includes('PERSONAL')
			) {
				return true
			} else if (
				documentType === 'recommendation' &&
				upperType.includes('RECOMMENDATION')
			) {
				return true
			} else if (
				documentType === 'passport' &&
				upperType.includes('PASSPORT')
			) {
				return true
			} else if (
				documentType === 'institution' &&
				upperType.includes('INSTITUTION')
			) {
				return true
			} else if (
				documentType === 'required' &&
				upperType.includes('REQUIRED')
			) {
				return true
			} else if (documentType === 'other') {
				return true
			}
			return false
		})

		if (typeDocs.length === 0) {
			return
		}

		setDownloadingZip(documentType)
		try {
			const folderName = getDocumentTypeLabel(documentType).replace(/\s+/g, '_')
			const zipName = `${applicant.name.replace(/\s+/g, '_')}_${folderName}`
			await createZipFromDocuments(typeDocs, zipName)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error creating zip file:', error)
		} finally {
			setDownloadingZip(null)
		}
	}

	const handlePreviewFile = (document: Document) => {
		if (document.url) {
			window.open(document.url, '_blank')
		}
	}

	const handleDownloadFile = (doc: Document) => {
		// Download file directly
		if (doc.url) {
			const link = document.createElement('a')
			link.href = doc.url
			link.download = doc.name
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		}
	}

	// Handle approve application
	const handleApprove = async () => {
		if (!applicationDetails?.application?.applicationId) return

		setProcessingStatus('approve')
		try {
			const response = await fetch(
				`/api/applications/institution/${applicationDetails.application.applicationId}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						status: 'ACCEPTED',
					}),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to approve application')
			}

			const result = await response.json()
			if (result.success) {
				// Refresh application details
				const refreshResponse = await fetch(
					`/api/applications/institution/${applicationDetails.application.applicationId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (refreshResponse.ok) {
					const refreshResult = await refreshResponse.json()
					if (refreshResult.success) {
						setApplicationDetails(refreshResult.data)
					}
				}

				// Call parent callback if provided
				if (onApprove) {
					onApprove(applicant)
				}
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error approving application:', err)
			alert(
				err instanceof Error
					? err.message
					: 'Failed to approve application. Please try again.'
			)
		} finally {
			setProcessingStatus(null)
		}
	}

	// Handle reject application
	const handleReject = async () => {
		if (!applicationDetails?.application?.applicationId) return

		setProcessingStatus('reject')
		try {
			const response = await fetch(
				`/api/applications/institution/${applicationDetails.application.applicationId}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						status: 'REJECTED',
					}),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to reject application')
			}

			const result = await response.json()
			if (result.success) {
				// Refresh application details
				const refreshResponse = await fetch(
					`/api/applications/institution/${applicationDetails.application.applicationId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (refreshResponse.ok) {
					const refreshResult = await refreshResponse.json()
					if (refreshResult.success) {
						setApplicationDetails(refreshResult.data)
					}
				}

				// Call parent callback if provided
				if (onReject) {
					onReject(applicant)
				}
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error rejecting application:', err)
			alert(
				err instanceof Error
					? err.message
					: 'Failed to reject application. Please try again.'
			)
		} finally {
			setProcessingStatus(null)
		}
	}

	// Handle update request (with message)
	const handleUpdateRequest = async (message: string) => {
		if (!applicationDetails?.application?.applicationId) return

		try {
			const response = await fetch(
				`/api/applications/institution/${applicationDetails.application.applicationId}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						status: 'REQUIRE_UPDATE',
						message,
					}),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to send update request')
			}

			const result = await response.json()
			if (result.success) {
				// Refresh application details
				const refreshResponse = await fetch(
					`/api/applications/institution/${applicationDetails.application.applicationId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (refreshResponse.ok) {
					const refreshResult = await refreshResponse.json()
					if (refreshResult.success) {
						setApplicationDetails(refreshResult.data)
					}
				}

				// Call parent callback if provided
				if (onRequireUpdate) {
					onRequireUpdate(applicant)
				}
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error sending update request:', err)
			throw err // Re-throw to be handled by modal
		}
	}

	// Prepare data for shared components using real API data
	const academicDetails = [
		{
			label: 'Program',
			value: (() => {
				// Check if we have valid level from API
				const level =
					applicationDetails?.applicant?.level ||
					(applicant?.degreeLevel && applicant.degreeLevel !== 'Unknown'
						? applicant.degreeLevel
						: null)
				const subdisciplines = applicationDetails?.applicant?.subdiscipline

				// If we have level and subdisciplines as array
				if (
					level &&
					Array.isArray(subdisciplines) &&
					subdisciplines.length > 0
				) {
					return (
						<div className="flex flex-col gap-2">
							{level && <span className="text-sm font-medium">{level}</span>}
							<div className="flex flex-wrap gap-2">
								{subdisciplines.map((sub, index) => (
									<span
										key={index}
										className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
									>
										{sub.name}
									</span>
								))}
							</div>
						</div>
					)
				}

				// If we have level and subdisciplines as string
				if (
					level &&
					typeof subdisciplines === 'string' &&
					subdisciplines.trim() !== ''
				) {
					return (
						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium">{level}</span>
							<span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap w-fit">
								{subdisciplines}
							</span>
						</div>
					)
				}

				// If we only have level
				if (level && level.trim() !== '') {
					return <span className="text-sm font-medium">{level}</span>
				}

				// If we only have subdisciplines
				if (Array.isArray(subdisciplines) && subdisciplines.length > 0) {
					return (
						<div className="flex flex-wrap gap-2 w-full">
							{subdisciplines.map((sub, index) => (
								<span
									key={index}
									className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
								>
									{sub.name}
								</span>
							))}
						</div>
					)
				}

				// Final fallback
				return 'Not provided'
			})(),
		},
		{
			label: 'GPA',
			value: applicationDetails?.applicant?.gpa?.toString() || 'Not provided',
		},
		{
			label: 'Status',
			value: applicationDetails?.applicant?.graduated
				? 'Graduated'
				: 'Not graduated',
			className: applicationDetails?.applicant?.graduated
				? 'text-green-600'
				: 'text-yellow-600',
		},
		{
			label: 'University',
			value: applicationDetails?.applicant?.university || 'Not provided',
		},
		{
			label: 'Country of Study',
			value: (() => {
				const countryOfStudy = applicationDetails?.applicant?.countryOfStudy
				if (!countryOfStudy || countryOfStudy === 'Not provided') {
					return 'Not provided'
				}
				const countryData = getCountriesWithSvgFlags().find(
					(c) => c.name.toLowerCase() === countryOfStudy.toLowerCase()
				)
				return (
					<div className="flex items-center gap-2">
						{countryData?.flag && (
							<span className="text-base">{countryData.flag}</span>
						)}
						<span>{countryOfStudy}</span>
					</div>
				)
			})(),
		},
		{
			label: 'Foreign Language',
			value: applicationDetails?.applicant?.hasForeignLanguage ? 'Yes' : 'No',
		},
	]

	const contactInfo = [
		{
			label: 'Email',
			value: applicationDetails?.applicant?.email || 'Not provided',
		},
		{
			label: 'Phone',
			value: (() => {
				const phoneNumber = applicationDetails?.applicant?.phoneNumber
				const countryCode = applicationDetails?.applicant?.countryCode
				if (!phoneNumber) {
					return 'Not provided'
				}
				const countryData = countryCode
					? getCountriesWithSvgFlags().find((c) => c.phoneCode === countryCode)
					: null
				return (
					<div className="flex items-center gap-2">
						{countryData?.flag && (
							<span className="text-base">{countryData.flag}</span>
						)}
						<span>
							{countryCode ? `${countryCode} ` : ''}
							{phoneNumber}
						</span>
					</div>
				)
			})(),
		},
		{
			label: 'Nationality',
			value: (() => {
				const nationality = applicationDetails?.applicant?.nationality
				if (!nationality || nationality === 'Not provided') {
					return 'Not provided'
				}
				const countryData = getCountriesWithSvgFlags().find(
					(c) => c.name.toLowerCase() === nationality.toLowerCase()
				)
				return (
					<div className="flex items-center gap-2">
						{countryData?.flag && (
							<span className="text-base">{countryData.flag}</span>
						)}
						<span>{nationality}</span>
					</div>
				)
			})(),
		},
		{
			label: 'Gender',
			value: applicationDetails?.applicant?.gender || 'Not specified',
		},
		{
			label: 'Birthday',
			value: applicationDetails?.applicant?.birthday
				? new Date(applicationDetails.applicant.birthday).toLocaleDateString()
				: 'Not provided',
		},
	]

	const tabs = [
		{
			id: 'academic',
			label: 'Academic Profile',
			content: (
				<div className="h-full flex flex-col">
					{/* Documents List - Scrollable */}
					<div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-gray-600 text-sm">Loading documents...</p>
								</div>
							</div>
						) : error ? (
							<div className="flex items-center justify-center py-20">
								<div className="text-center">
									<p className="text-red-600 text-sm mb-2">
										Error loading documents
									</p>
									<p className="text-gray-500 text-xs">{error}</p>
								</div>
							</div>
						) : (
							<div className="pt-4 space-y-6">
								{/* Group documents by type */}
								{Object.entries(
									documents.reduce(
										(acc, doc) => {
											// Use document_type from API
											const docType = (doc as any).documentType || 'OTHER'
											let category = 'other'

											// Map document type names to category
											// Check more specific types first to avoid incorrect categorization
											const upperType = docType.toUpperCase()
											if (
												upperType.includes('CV') ||
												upperType.includes('RESUME')
											) {
												category = 'cv'
											} else if (upperType.includes('DEGREE')) {
												// Check DEGREE before CERTIFICATE to catch DEGREE_CERTIFICATE
												category = 'degree'
											} else if (
												upperType.includes('LANGUAGE') ||
												upperType.includes('CERTIFICATE')
											) {
												category = 'certificate'
											} else if (upperType.includes('TRANSCRIPT')) {
												category = 'transcript'
											} else if (upperType.includes('RESEARCH')) {
												category = 'research'
											} else if (upperType.includes('PORTFOLIO')) {
												category = 'portfolio'
											} else if (upperType.includes('PERSONAL')) {
												category = 'personal'
											} else if (upperType.includes('RECOMMENDATION')) {
												category = 'recommendation'
											} else if (upperType.includes('PASSPORT')) {
												category = 'passport'
											} else if (upperType.includes('INSTITUTION')) {
												category = 'institution'
											} else if (upperType.includes('REQUIRED')) {
												category = 'required'
											} else {
												category = 'other'
											}
											if (!acc[category]) acc[category] = []
											acc[category].push(doc)
											return acc
										},
										{} as Record<string, Document[]>
									)
								).map(([category, typeDocs]) => {
									// Special handling for research papers - group by title
									if (category === 'research') {
										// Group research papers by title
										const groupedPapers = typeDocs.reduce(
											(acc, doc) => {
												const title = doc.title || 'Untitled Research Paper'
												if (!acc[title]) {
													acc[title] = []
												}
												acc[title].push(doc)
												return acc
											},
											{} as Record<string, Document[]>
										)

										return (
											<div
												key={category}
												className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
											>
												<div className="flex justify-between items-center mb-4">
													<h3 className="text-lg font-semibold">
														{getDocumentTypeLabel(category)}
													</h3>
													<button
														onClick={() => handleDownloadFolder(category)}
														disabled={downloadingZip === category}
														className="text-primary hover:text-primary/80 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
													>
														{downloadingZip === category && (
															<Loader2 className="h-3 w-3 animate-spin" />
														)}
														Download folder
													</button>
												</div>

												{/* Research Papers List - Grouped by Title */}
												<div className="space-y-6">
													{Object.entries(groupedPapers).map(
														([title, papers]) => (
															<div
																key={title}
																className="border rounded-lg p-4 bg-gray-50"
															>
																{/* Paper Title and Discipline */}
																<div className="mb-4 pb-4 border-b border-gray-200">
																	<h4 className="text-base font-semibold mb-2">
																		{title}
																	</h4>
																	{papers[0]?.subdiscipline &&
																	papers[0].subdiscipline.length > 0 ? (
																		<div className="flex flex-wrap gap-2">
																			{papers[0].subdiscipline.map(
																				(subName, index) => (
																					<span
																						key={index}
																						className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
																					>
																						{subName}
																					</span>
																				)
																			)}
																		</div>
																	) : (
																		<p className="text-sm text-gray-500">
																			No discipline specified
																		</p>
																	)}
																</div>

																{/* Files List for this Paper */}
																<div className="space-y-3">
																	{papers.map((doc) => (
																		<div
																			key={doc.documentId}
																			className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
																		>
																			<div className="flex items-center gap-3">
																				<span className="text-2xl">📄</span>
																				<div>
																					<p className="font-medium text-sm">
																						{doc.name}
																					</p>
																					<p className="text-sm text-muted-foreground">
																						{formatFileSize(doc.size)} •{' '}
																						{formatDate(doc.uploadDate)}
																					</p>
																				</div>
																			</div>
																			<div className="flex items-center gap-2">
																				<button
																					onClick={() => handlePreviewFile(doc)}
																					className="text-primary hover:text-primary/80 text-sm font-medium"
																				>
																					View
																				</button>
																				<button
																					onClick={() =>
																						handleDownloadFile(doc)
																					}
																					className="text-gray-400 hover:text-gray-600 p-1"
																				>
																					<Download className="h-4 w-4" />
																				</button>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														)
													)}
												</div>
											</div>
										)
									}

									// Default display for other document types
									return (
										<div
											key={category}
											className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
										>
											<div className="flex justify-between items-center mb-4">
												<h3 className="text-lg font-semibold">
													{getDocumentTypeLabel(category)}
												</h3>
												<button
													onClick={() => handleDownloadFolder(category)}
													disabled={downloadingZip === category}
													className="text-primary hover:text-primary/80 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
												>
													{downloadingZip === category && (
														<Loader2 className="h-3 w-3 animate-spin" />
													)}
													Download folder
												</button>
											</div>

											{/* Files List */}
											<div className="space-y-3 max-h-64 overflow-y-auto">
												{typeDocs.map((doc) => (
													<div
														key={doc.documentId}
														className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
													>
														<div className="flex items-center gap-3">
															<span className="text-2xl">📄</span>
															<div>
																<p className="font-medium text-sm">
																	{doc.name}
																</p>
																<p className="text-sm text-muted-foreground">
																	{formatFileSize(doc.size)} •{' '}
																	{formatDate(doc.uploadDate)}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() => handlePreviewFile(doc)}
																className="text-primary hover:text-primary/80 text-sm font-medium"
															>
																View
															</button>
															<button
																onClick={() => handleDownloadFile(doc)}
																className="text-gray-400 hover:text-gray-600 p-1"
															>
																<Download className="h-4 w-4" />
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									)
								})}

								{documents.length === 0 && (
									<div className="text-center py-8">
										<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
										<p className="text-gray-500">No documents uploaded</p>
									</div>
								)}
							</div>
						)}

						{/* Download All Button */}
						<div className="mt-6 pt-6 border-t border-gray-200">
							<button
								onClick={handleDownloadAll}
								disabled={downloadingZip === 'all'}
								className="w-full text-primary hover:text-primary/80 text-sm font-medium underline text-center py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{downloadingZip === 'all' && (
									<Loader2 className="h-3 w-3 animate-spin" />
								)}
								Download all documents
							</button>
						</div>
					</div>
				</div>
			),
		},
		{
			id: 'requirements',
			label: 'Program requirements',
			content: (
				<div className="h-full flex flex-col">
					{/* Sub-tabs for Requirements */}
					<div className="border-b border-gray-200 px-4 pt-2">
						<div className="flex gap-2">
							<button
								onClick={() => setRequirementsSubTab('application')}
								className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
									requirementsSubTab === 'application'
										? 'border-primary text-primary'
										: 'border-transparent text-gray-600 hover:text-gray-900'
								}`}
							>
								Application Documents
							</button>
							<button
								onClick={() => setRequirementsSubTab('updates')}
								className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
									requirementsSubTab === 'updates'
										? 'border-primary text-primary'
										: 'border-transparent text-gray-600 hover:text-gray-900'
								}`}
							>
								Update Documents
								{applicationDetails?.application?.updateDocuments &&
								applicationDetails.application.updateDocuments.length > 0
									? ` (${applicationDetails.application.updateDocuments.length})`
									: ''}
							</button>
						</div>
					</div>

					{/* Content based on sub-tab */}
					<div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-gray-600 text-sm">Loading documents...</p>
								</div>
							</div>
						) : error ? (
							<div className="flex items-center justify-center py-20">
								<div className="text-center">
									<p className="text-red-600 text-sm mb-2">
										Error loading documents
									</p>
									<p className="text-gray-500 text-xs">{error}</p>
								</div>
							</div>
						) : requirementsSubTab === 'application' ? (
							<div className="pt-4 space-y-6">
								{/* Application Documents - Flat List (No Grouping) */}
								{applicationDetails?.application?.documents &&
								applicationDetails.application.documents.length > 0 ? (
									<div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
										<div className="flex justify-between items-center mb-4">
											<h3 className="text-lg font-semibold">
												Application Documents
											</h3>
											<button
												onClick={async () => {
													// Download all application documents as zip
													if (
														applicationDetails.application.documents.length ===
														0
													) {
														return
													}

													setDownloadingZip('application')
													try {
														const zipName = `${applicant.name.replace(/\s+/g, '_')}_Application_Documents`
														await createZipFromDocuments(
															applicationDetails.application.documents,
															zipName
														)
													} catch (error) {
														// eslint-disable-next-line no-console
														console.error('Error creating zip file:', error)
													} finally {
														setDownloadingZip(null)
													}
												}}
												disabled={downloadingZip === 'application'}
												className="text-primary hover:text-primary/80 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
											>
												{downloadingZip === 'application' && (
													<Loader2 className="h-3 w-3 animate-spin" />
												)}
												Download all
											</button>
										</div>

										{/* Application Files List - Flat List */}
										<div className="space-y-3 max-h-64 overflow-y-auto">
											{applicationDetails.application.documents.map(
												(doc: Document) => (
													<div
														key={doc.documentId}
														className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
													>
														<div className="flex items-center gap-3">
															<span className="text-2xl">📄</span>
															<div>
																<p className="font-medium text-sm">
																	{doc.name}
																</p>
																<p className="text-xs text-muted-foreground">
																	{formatFileSize(doc.size)} •{' '}
																	{formatDate(doc.uploadDate)}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() => handlePreviewFile(doc)}
																className="text-primary hover:text-primary/80 text-sm font-medium"
															>
																View
															</button>
															<button
																onClick={() => handleDownloadFile(doc)}
																className="text-gray-400 hover:text-gray-600 p-1"
															>
																<Download className="h-4 w-4" />
															</button>
														</div>
													</div>
												)
											)}
										</div>
									</div>
								) : (
									<div className="text-center py-8">
										<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
										<p className="text-gray-500">
											No application documents uploaded
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="pt-4 space-y-6">
								{/* Update Documents - Grouped by Update Request */}
								{applicationDetails?.updateRequests &&
								applicationDetails.updateRequests.length > 0 ? (
									<div className="space-y-6">
										{applicationDetails.updateRequests.map((request) => (
											<div
												key={request.updateRequestId}
												className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
											>
												{/* Update Request Header */}
												<div className="mb-4 pb-4 border-b border-gray-200">
													<div className="flex justify-between items-start mb-2">
														<h3 className="text-lg font-semibold">
															Update Request
														</h3>
														<span
															className={`px-2 py-1 rounded text-xs font-medium ${
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
													</div>
													<p className="text-sm text-gray-700 mb-2">
														<span className="font-medium">Requested on:</span>{' '}
														{new Date(request.createdAt).toLocaleDateString()}
													</p>
													{request.responseSubmittedAt && (
														<p className="text-sm text-gray-700 mb-2">
															<span className="font-medium">
																Response submitted on:
															</span>{' '}
															{new Date(
																request.responseSubmittedAt
															).toLocaleDateString()}
														</p>
													)}
													{request.requestMessage && (
														<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
															<p className="text-sm font-medium text-blue-900 mb-1">
																Request Message:
															</p>
															<p className="text-sm text-blue-800 whitespace-pre-wrap">
																{request.requestMessage}
															</p>
														</div>
													)}
													{request.responseMessage && (
														<div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
															<p className="text-sm font-medium text-green-900 mb-1">
																Applicant Response:
															</p>
															<p className="text-sm text-green-800 whitespace-pre-wrap">
																{request.responseMessage}
															</p>
														</div>
													)}
												</div>

												{/* Response Documents */}
												{request.responseDocuments &&
												request.responseDocuments.length > 0 ? (
													<>
														<div className="flex justify-between items-center mb-4">
															<h4 className="text-base font-medium">
																Submitted Documents (
																{request.responseDocuments.length})
															</h4>
															<button
																onClick={async () => {
																	const docsToDownload =
																		request.responseDocuments.map((doc) => ({
																			documentId: doc.documentId,
																			name: doc.name,
																			url: doc.url,
																			size: doc.size,
																			uploadDate:
																				doc.updatedAt ||
																				new Date().toISOString(),
																		}))
																	setDownloadingZip(
																		`update-${request.updateRequestId}`
																	)
																	try {
																		const zipName = `${applicant.name.replace(/\s+/g, '_')}_Update_${request.updateRequestId.substring(0, 8)}`
																		await createZipFromDocuments(
																			docsToDownload,
																			zipName
																		)
																	} catch (error) {
																		// eslint-disable-next-line no-console
																		console.error(
																			'Error creating zip file:',
																			error
																		)
																	} finally {
																		setDownloadingZip(null)
																	}
																}}
																disabled={
																	downloadingZip ===
																	`update-${request.updateRequestId}`
																}
																className="text-primary hover:text-primary/80 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
															>
																{downloadingZip ===
																	`update-${request.updateRequestId}` && (
																	<Loader2 className="h-3 w-3 animate-spin" />
																)}
																Download all
															</button>
														</div>

														<div className="space-y-3 max-h-64 overflow-y-auto">
															{request.responseDocuments.map((doc) => (
																<div
																	key={doc.documentId}
																	className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-blue-200"
																>
																	<div className="flex items-center gap-3">
																		<span className="text-2xl">📄</span>
																		<div>
																			<p className="font-medium text-sm">
																				{doc.name}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{formatFileSize(doc.size)} •{' '}
																				{doc.updatedAt
																					? formatDate(doc.updatedAt)
																					: 'Date not available'}
																			</p>
																		</div>
																	</div>
																	<div className="flex items-center gap-2">
																		<button
																			onClick={() => {
																				window.open(doc.url, '_blank')
																			}}
																			className="text-primary hover:text-primary/80 text-sm font-medium"
																		>
																			View
																		</button>
																		<button
																			onClick={() => {
																				const link = document.createElement('a')
																				link.href = doc.url
																				link.download = doc.name
																				document.body.appendChild(link)
																				link.click()
																				document.body.removeChild(link)
																			}}
																			className="text-gray-400 hover:text-gray-600 p-1"
																		>
																			<Download className="h-4 w-4" />
																		</button>
																	</div>
																</div>
															))}
														</div>
													</>
												) : (
													<div className="text-center py-4">
														<p className="text-gray-500 text-sm">
															No documents submitted yet for this update request
														</p>
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8">
										<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
										<p className="text-gray-500">
											No update documents submitted yet
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			),
		},
	]

	// Show loading state for the entire component
	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center">
					<Button
						variant="outline"
						onClick={onBack}
						className="flex items-center gap-2"
						size="sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Applications
					</Button>
				</div>
				<div className="flex items-center justify-center py-20">
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-gray-600 text-sm">
							Loading applicant details...
						</p>
					</div>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center">
					<Button
						variant="outline"
						onClick={onBack}
						className="flex items-center gap-2"
						size="sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Applications
					</Button>
				</div>
				<div className="flex items-center justify-center py-20">
					<div className="text-center">
						<p className="text-red-600 text-sm mb-2">
							Error loading applicant details
						</p>
						<p className="text-gray-500 text-xs">{error}</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<div className="flex items-center">
				<Button
					variant="outline"
					onClick={onBack}
					className="flex items-center gap-2"
					size="sm"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Applications
				</Button>
			</div>

			<TwoPanelLayout
				leftPanel={
					<ProfileCard
						header={{
							avatar: applicationDetails?.applicant?.image ? (
								<Image
									src={applicationDetails.applicant.image}
									alt={applicationDetails.applicant.name}
									width={64}
									height={64}
									className="w-16 h-16 rounded-full object-cover"
								/>
							) : (
								<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
									<User className="w-8 h-8 text-gray-400" />
								</div>
							),
							title: applicationDetails?.applicant?.name || applicant.name,
							subtitle:
								applicationDetails?.applicant?.birthday &&
								applicationDetails?.applicant?.gender
									? `${new Date(applicationDetails.applicant.birthday).toLocaleDateString()} - ${applicationDetails.applicant.gender}`
									: 'Details not available',
						}}
						sections={[
							<InfoSection
								key="academic"
								title="Academic Details"
								items={academicDetails}
							/>,
							<InfoSection
								key="contact"
								title="Contact Information"
								items={contactInfo}
							/>,
						]}
						actions={
							<div className="space-y-3 w-full">
								<Button
									onClick={() => {
										// Navigate to messages with contact parameter
										router.push(`/messages?contact=${applicant.userId}`)
									}}
									className="w-full bg-orange-500 hover:bg-orange-600 text-white"
									size="md"
								>
									Contact Applicant
								</Button>

								<div className="grid grid-cols-3 gap-2">
									<Button
										onClick={handleApprove}
										disabled={processingStatus !== null}
										className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
										size="sm"
									>
										{processingStatus === 'approve' ? (
											<>
												<Loader2 className="h-3 w-3 mr-1 animate-spin" />
												Processing...
											</>
										) : (
											'Approve'
										)}
									</Button>

									<Button
										onClick={handleReject}
										disabled={processingStatus !== null}
										variant="outline"
										className="border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
										size="sm"
									>
										{processingStatus === 'reject' ? (
											<>
												<Loader2 className="h-3 w-3 mr-1 animate-spin" />
												Processing...
											</>
										) : (
											'Reject'
										)}
									</Button>

									<Button
										onClick={() => setShowUpdateModal(true)}
										disabled={processingStatus !== null}
										variant="outline"
										className="border-blue-500 text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
										size="sm"
									>
										Update
									</Button>
								</div>
							</div>
						}
					/>
				}
				rightPanel={
					<DocumentPanel
						tabs={tabs}
						activeTab={activeTab}
						onTabChange={(tabId) =>
							setActiveTab(tabId as 'academic' | 'requirements')
						}
					/>
				}
			/>

			{/* Update Application Modal */}
			<UpdateApplicationModal
				isOpen={showUpdateModal}
				onClose={() => setShowUpdateModal(false)}
				onSubmit={handleUpdateRequest}
				applicantName={applicationDetails?.applicant?.name || applicant.name}
			/>
		</div>
	)
}
