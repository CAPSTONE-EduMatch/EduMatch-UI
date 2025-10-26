'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Download, User, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import {
	InfoSection,
	ProfileCard,
	DocumentPanel,
	TwoPanelLayout,
} from '@/components/shared'
import type { Applicant } from './ApplicantsTable'

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
}

interface ApplicationDetails {
	application: {
		applicationId: string
		applicantId: string
		postId: string
		status: string
		applyAt: string
		documents: Document[]
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
		subdiscipline?: string
		discipline?: string
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
	const [showUpdateBox, setShowUpdateBox] = useState(false)
	const [updateDescription, setUpdateDescription] = useState('')
	const [applicationDetails, setApplicationDetails] =
		useState<ApplicationDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

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
					setApplicationDetails(result.data)
				} else {
					throw new Error(result.error || 'Failed to fetch application details')
				}
			} catch (err) {
				console.error('Error fetching application details:', err)
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

	// Debug: Log documents to see what we're getting
	console.log('📄 Academic Profile Documents:', documents)
	console.log(
		'📄 Document names:',
		documents.map((doc) => doc.name)
	)

	// Document type enumeration based on the new enum
	const DOCUMENT_TYPE_LABELS = {
		RESEARCH_PROPOSAL: 'Research Proposal',
		CV_RESUME: 'CV/Resume',
		PORTFOLIO: 'Portfolio',
		ACADEMIC_TRANSCRIPT: 'Academic Transcript',
		PERSONAL_STATEMENT: 'Personal Statement',
		RECOMMENDATION_LETTER: 'Recommendation Letter',
		LANGUAGE_CERTIFICATE: 'Language Certificate',
		PASSPORT_COPY: 'Passport Copy',
		DEGREE_CERTIFICATE: 'Degree Certificate',
		RESEARCH_PAPER: 'Research Paper',
		INSTITUTION_VERIFICATION: 'Institution Verification',
		REQUIRED_DOCUMENTS: 'Required Documents',
		OTHER: 'Other Documents',
	} as const

	const getDocumentsByType = (documentType: string) => {
		return documents.filter((doc) =>
			doc.name.toLowerCase().includes(documentType.toLowerCase())
		)
	}

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

	const handleDownloadAll = () => {
		console.log('Downloading all documents for:', applicant.name)
		// TODO: Implement download all functionality
		// This could create a zip file with all documents
	}

	const handleDownloadFolder = (documentType: string) => {
		console.log('Downloading folder for type:', documentType)
		// TODO: Implement download folder functionality
		// This could create a zip file with documents of a specific type
	}

	const handlePreviewFile = (document: Document) => {
		console.log('Previewing file:', document.name)
		// Open file in new tab for preview
		if (document.url) {
			window.open(document.url, '_blank')
		}
	}

	const handleDownloadFile = (doc: Document) => {
		console.log('Downloading file:', doc.name)
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

	const handleUpdateToggle = () => {
		setShowUpdateBox(!showUpdateBox)
		if (showUpdateBox) {
			setUpdateDescription('')
		}
	}

	const handleSendUpdate = () => {
		if (updateDescription.trim()) {
			console.log(
				'Sending update to applicant:',
				applicant.name,
				'Message:',
				updateDescription
			)
			// TODO: Implement sending update to applicant
			onRequireUpdate(applicant)
			setUpdateDescription('')
			setShowUpdateBox(false)
		}
	}

	// Prepare data for shared components using real API data
	const academicDetails = [
		{
			label: 'Program',
			value: applicationDetails?.applicant?.level
				? `${applicationDetails.applicant.level} of ${applicationDetails.applicant.subdiscipline || 'Unknown'}`
				: `${applicant.degreeLevel} of ${applicant.subDiscipline}`,
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
			value: applicationDetails?.applicant?.countryOfStudy || 'Not provided',
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
			value: applicationDetails?.applicant?.phoneNumber
				? `${applicationDetails.applicant.countryCode || ''} ${applicationDetails.applicant.phoneNumber}`
				: 'Not provided',
		},
		{
			label: 'Nationality',
			value: applicationDetails?.applicant?.nationality || 'Not provided',
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

											console.log(
												`📄 Categorizing: "${doc.name}" -> docType: "${docType}"`
											)

											// Map document type names to category
											const upperType = docType.toUpperCase()
											if (
												upperType.includes('CV') ||
												upperType.includes('RESUME')
											) {
												category = 'cv'
											} else if (
												upperType.includes('LANGUAGE') ||
												upperType.includes('CERTIFICATE')
											) {
												category = 'certificate'
											} else if (upperType.includes('DEGREE')) {
												category = 'degree'
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

											console.log(`📄 Final category: "${category}"`)

											if (!acc[category]) acc[category] = []
											acc[category].push(doc)
											return acc
										},
										{} as Record<string, Document[]>
									)
								).map(([category, typeDocs]) => (
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
												className="text-primary hover:text-primary/80 text-sm font-medium underline"
											>
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
															<p className="font-medium text-sm">{doc.name}</p>
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
								))}

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
								className="w-full text-primary hover:text-primary/80 text-sm font-medium underline text-center py-2"
							>
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
					{/* Application Documents - Scrollable */}
					<div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-gray-600 text-sm">
										Loading application documents...
									</p>
								</div>
							</div>
						) : error ? (
							<div className="flex items-center justify-center py-20">
								<div className="text-center">
									<p className="text-red-600 text-sm mb-2">
										Error loading application documents
									</p>
									<p className="text-gray-500 text-xs">{error}</p>
								</div>
							</div>
						) : (
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
												onClick={() => {
													// Download all application documents
													applicationDetails.application.documents.forEach(
														(doc: Document) => {
															const link = document.createElement('a')
															link.href = doc.url
															link.download = doc.name
															document.body.appendChild(link)
															link.click()
															document.body.removeChild(link)
														}
													)
												}}
												className="text-primary hover:text-primary/80 text-sm font-medium underline"
											>
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
								<img
									src={applicationDetails.applicant.image}
									alt={applicationDetails.applicant.name}
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
										onClick={() => onApprove(applicant)}
										className="bg-green-500 hover:bg-green-600 text-white"
										size="sm"
									>
										Approve
									</Button>

									<Button
										onClick={() => onReject(applicant)}
										variant="outline"
										className="border-red-500 text-red-500 hover:bg-red-50"
										size="sm"
									>
										Reject
									</Button>

									<Button
										onClick={handleUpdateToggle}
										variant="outline"
										className="border-blue-500 text-blue-500 hover:bg-blue-50"
										size="sm"
									>
										Update
									</Button>
								</div>

								{/* Update Description Box */}
								{showUpdateBox && (
									<div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
										<div className="space-y-3">
											<label className="block text-sm font-medium text-gray-700">
												Message to Applicant
											</label>
											<textarea
												value={updateDescription}
												onChange={(e) => setUpdateDescription(e.target.value)}
												placeholder="Enter the information you need from the applicant..."
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
												rows={3}
											/>
											<div className="flex justify-end gap-2">
												<Button
													onClick={handleUpdateToggle}
													variant="outline"
													size="sm"
												>
													Cancel
												</Button>
												<Button
													onClick={handleSendUpdate}
													disabled={!updateDescription.trim()}
													className="bg-blue-500 hover:bg-blue-600 text-white"
													size="sm"
												>
													Send Update
												</Button>
											</div>
										</div>
									</div>
								)}
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
		</div>
	)
}
