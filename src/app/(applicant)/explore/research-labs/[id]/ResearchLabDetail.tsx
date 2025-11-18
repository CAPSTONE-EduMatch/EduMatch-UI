'use client'
import {
	Breadcrumb,
	Button,
	Modal,
	ResearchLabCard,
	ErrorModal,
} from '@/components/ui'
import {
	DocumentSelector,
	SelectedDocument,
} from '@/components/ui/DocumentSelector'

import { useResearchLabDetail } from '@/hooks/explore/useResearchLabDetail'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Trash2, Check, X } from 'lucide-react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { applicationService } from '@/services/application/application-service'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useNotification } from '@/contexts/NotificationContext'
import { ApplicationUpdateResponseModal } from '@/components/profile/applicant/sections/ApplicationUpdateResponseModal'
import { ExploreApiService } from '@/services/explore/explore-api'

const ResearchLabDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const { isAuthenticated } = useAuthCheck()
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 100,
			status: 1,
		},
	})

	const [activeTab, setActiveTab] = useState('job-description')

	// Fetch research lab detail from API
	const labId = params.id as string
	const { researchLab, loading, error } = useResearchLabDetail(labId)

	// S3 File upload functionality
	const { uploadFiles, isUploading, uploadProgress } = useFileUpload({
		category: 'application-documents',
		onProgress: () => {},
	})

	// Application state
	const [hasApplied, setHasApplied] = useState(false)
	const [isApplying, setIsApplying] = useState(false)
	const [isCheckingApplication, setIsCheckingApplication] = useState(false)
	const [applicationStatus, setApplicationStatus] = useState<string | null>(
		null
	)
	const [applicationId, setApplicationId] = useState<string | null>(null)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [selectedUpdateRequestId, setSelectedUpdateRequestId] = useState<
		string | null
	>(null)
	const [updateRequests, setUpdateRequests] = useState<any[]>([])
	const [loadingUpdateRequests, setLoadingUpdateRequests] = useState(false)

	// Notification system
	const { showSuccess, showError } = useNotification()

	// Utility function to get institution status
	const getInstitutionStatus = (institution?: {
		status: boolean
		deletedAt?: string | null
	}) => {
		if (!institution) return null

		// Only show badge if status is explicitly false (boolean)
		if (institution.status === false) {
			return {
				type: 'deactivated' as const,
				label: 'Account Deactivated',
				color: 'bg-orange-100 text-orange-800 border-orange-200',
			}
		}

		return null
	}

	// Institution status badge component
	const InstitutionStatusBadge: React.FC<{
		institution?: {
			status: boolean
			deletedAt?: string | null
		}
	}> = ({ institution }) => {
		const status = getInstitutionStatus(institution)

		if (!status) return null

		return (
			<div className="mb-2">
				<div
					className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}
				>
					<X className="w-4 h-4" />
					{status.label}
				</div>
			</div>
		)
	}

	// Recommended research labs state
	const [recommendedResearchLabs, setRecommendedResearchLabs] = useState<any[]>(
		[]
	)
	const [isLoadingRecommendations, setIsLoadingRecommendations] =
		useState(false)

	// Handle documents selection from DocumentSelector
	const handleDocumentsSelected = (documents: SelectedDocument[]) => {
		setSelectedDocuments(documents)
		// Convert selected documents to uploadedFiles format for compatibility
		const convertedFiles = documents.map((doc) => ({
			id: doc.document_id,
			name: doc.name,
			url: doc.url,
			size: doc.size,
			documentType: doc.documentType,
			source: doc.source,
		}))
		setUploadedFiles(convertedFiles)
	}

	// Dynamic info items based on current lab data
	const infoItems = [
		{ label: 'Salary', value: researchLab?.salary || 'Up to $2000' },
		{ label: 'Country', value: researchLab?.country || 'Italy' },
		{ label: 'Job type', value: researchLab?.jobType || 'Researcher' },
		{
			label: 'Application deadline',
			value: researchLab?.applicationDeadline || '07/07/2026',
		},
	]

	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [selectedDocuments, setSelectedDocuments] = useState<
		SelectedDocument[]
	>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [showDocumentSelector, setShowDocumentSelector] = useState(false)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Research Lab Detail' }])

	// Update breadcrumb when component mounts or research lab data changes
	useEffect(() => {
		const updateBreadcrumb = () => {
			const fromTab = searchParams.get('from') || 'research'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			const labName = researchLab?.title || 'Research Lab Detail'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: 'Research Labs',
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, researchLab?.title])

	// Check for existing application when component loads
	useEffect(() => {
		const researchLabId = researchLab?.id || params.id
		if (researchLabId && !isCheckingApplication) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				checkExistingApplication(researchLabId as string)
			}, 200) // 200ms delay

			return () => clearTimeout(timeoutId)
		}
	}, [researchLab?.id, params.id]) // Removed isCheckingApplication from deps to prevent loops

	// Fetch all update requests when application is loaded
	useEffect(() => {
		if (applicationId) {
			fetchUpdateRequests()
		} else {
			setUpdateRequests([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationId])

	// Fetch recommended research labs when researchLab is loaded
	useEffect(() => {
		if (researchLab) {
			fetchRecommendedResearchLabs(researchLab)
		}
	}, [researchLab])

	// Fetch recommended research labs based on current lab's characteristics
	const fetchRecommendedResearchLabs = async (lab: any) => {
		if (!lab) return

		try {
			setIsLoadingRecommendations(true)

			// Extract research lab characteristics for matching
			const discipline =
				lab.discipline ||
				(lab.subdiscipline && lab.subdiscipline.length > 0
					? lab.subdiscipline[0]
					: null)
			const degreeLevel = lab.degreeLevel
			const country = lab.country || lab.institution?.country

			// **MATCH ALL Logic**: Only proceed if we have ALL 3 criteria
			if (discipline && degreeLevel && country) {
				const response = await ExploreApiService.getResearchLabs({
					limit: 9, // Fetch 9 most relevant research labs
					page: 1,
					// Must match ALL criteria
					discipline: [discipline],
					degreeLevel: [degreeLevel],
					country: [country],
					// sortBy: 'most-popular',
				})

				if (response.data && response.data.length > 0) {
					// Filter out the current research lab from recommendations
					const filtered = response.data.filter((l: any) => l.id !== lab.id)
					setRecommendedResearchLabs(filtered)
				} else {
					// No exact matches found, show empty recommendations
					setRecommendedResearchLabs([])
				}
			} else {
				// If we don't have all 3 criteria, show no recommendations
				setRecommendedResearchLabs([])
			}
		} catch (error) {
			// Silently fail for recommendations, fallback to empty array
			setRecommendedResearchLabs([])
		} finally {
			setIsLoadingRecommendations(false)
		}
	}

	// Fetch all update requests for the application
	const fetchUpdateRequests = async () => {
		if (!applicationId) return

		setLoadingUpdateRequests(true)
		try {
			const response = await fetch(
				`/api/applications/${applicationId}/update-request`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			)

			if (response.ok) {
				const result = await response.json()
				if (result.success && result.updateRequests) {
					setUpdateRequests(result.updateRequests)
				}
			}
		} catch (error) {
			console.error('Failed to fetch update requests:', error)
		} finally {
			setLoadingUpdateRequests(false)
		}
	}

	// Check if user has already applied to this post
	const checkExistingApplication = async (researchLabId: string) => {
		try {
			setIsCheckingApplication(true)
			const response = await applicationService.getApplications({
				page: 1,
				limit: 100, // Get more applications to search through
			})
			if (
				response.success &&
				response.applications &&
				response.applications.length > 0
			) {
				// Check if any application is for this specific post
				const existingApplication = response.applications.find(
					(app) => app.postId === researchLabId
				)

				if (existingApplication) {
					setHasApplied(true)
					setApplicationStatus(existingApplication.status || null)
					setApplicationId(existingApplication.applicationId || null)
					// Load submitted documents from the application
					// Filter out update submission documents - only show initial application documents
					if (
						existingApplication.documents &&
						existingApplication.documents.length > 0
					) {
						const submittedFiles = existingApplication.documents
							.filter(
								(doc: any) =>
									!doc.isUpdateSubmission && !doc.is_update_submission
							)
							.map((doc: any) => ({
								id: doc.documentId || doc.documentTypeId || Math.random(), // Generate ID if not available
								name: doc.name,
								url: doc.url,
								size: doc.size || 0,
								documentType:
									doc.documentType ||
									doc.documentTypeId ||
									'application-document',
								uploadDate:
									doc.uploadDate || doc.applyAt || new Date().toISOString(), // Use upload date or application date
							}))
						setUploadedFiles(submittedFiles)
					}

					return true
				}
			}
			return false
		} catch (error) {
			console.error('Failed to check existing application:', error)
			return false
		} finally {
			setIsCheckingApplication(false)
		}
	}

	// Helper function to determine document type based on file name
	const getDocumentType = (fileName: string): string => {
		const lowerName = fileName.toLowerCase()

		if (lowerName.includes('cv') || lowerName.includes('resume')) {
			return 'cv-resume'
		} else if (
			lowerName.includes('transcript') ||
			lowerName.includes('academic')
		) {
			return 'transcript'
		} else if (
			lowerName.includes('certificate') ||
			lowerName.includes('cert')
		) {
			return 'certificate'
		} else if (
			lowerName.includes('proposal') ||
			lowerName.includes('research')
		) {
			return 'research-proposal'
		} else if (lowerName.includes('portfolio')) {
			return 'portfolio'
		} else if (
			lowerName.includes('letter') ||
			lowerName.includes('recommendation')
		) {
			return 'recommendation-letter'
		} else if (
			lowerName.includes('statement') ||
			lowerName.includes('motivation')
		) {
			return 'personal-statement'
		} else {
			return 'application-document'
		}
	}

	// Handle application submission
	const handleApply = async () => {
		// Check authentication first
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		// Use research lab ID from URL params as fallback
		const researchLabId = researchLab?.id || params.id
		if (!researchLabId) {
			return
		}

		// Check if already applied
		if (hasApplied) {
			showError(
				'Already Applied',
				'You have already applied to this research lab. You cannot submit multiple applications.',
				{
					showRetry: false,
				}
			)
			return
		}

		try {
			setIsApplying(true)

			const response = await applicationService.submitApplication({
				postId:
					typeof researchLabId === 'string'
						? researchLabId
						: String(researchLabId),
				documents: uploadedFiles.map((file) => ({
					documentTypeId: file.documentType || getDocumentType(file.name), // Use stored document type or fallback to filename detection
					name: file.name,
					url: file.url, // S3 URL from upload
					size: file.size,
				})),
			})

			if (response.success) {
				setHasApplied(true)
				showSuccess(
					'Application Submitted!',
					'Your application has been submitted successfully. You will receive updates via email.'
				)
			} else {
				showError(
					'Application Failed',
					response.error || 'Failed to submit application. Please try again.',
					{
						onRetry: handleApply,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			}
		} catch (error: any) {
			// Handle specific "already applied" error
			if (error.message && error.message.includes('already applied')) {
				setHasApplied(true)
				showError(
					'Already Applied',
					'You have already applied to this research lab. You cannot submit multiple applications.',
					{
						showRetry: false,
					}
				)
			} else {
				showError(
					'Application Error',
					'An unexpected error occurred. Please try again.',
					{
						onRetry: handleApply,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			}
		} finally {
			setIsApplying(false)
		}
	}

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams.get('from') || 'research'

			const labName = researchLab?.title || 'AI Research Lab'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: '/explore?tab=programmes',
				})
			} else if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: '/explore?tab=scholarships',
				})
			} else {
				items.push({
					label: 'Research Labs',
					href: '/explore?tab=research',
				})
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, researchLab?.title])

	// Handle sign in navigation
	const handleSignIn = () => {
		setShowAuthModal(false)
		router.push('/signin')
	}

	// Handle sign up navigation
	const handleSignUp = () => {
		setShowAuthModal(false)
		router.push('/signup')
	}

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
		documentType: string
	) => {
		// Check authentication first
		if (!isAuthenticated) {
			setShowAuthModal(true)
			// Clear the input to prevent file selection
			event.target.value = ''
			return
		}

		const files = event.target.files
		if (files && files.length > 0) {
			try {
				// Upload files to S3
				const uploadedFileData = await uploadFiles(Array.from(files))

				// Add uploaded files to state with document type
				if (uploadedFileData) {
					const filesWithType = uploadedFileData.map((file) => ({
						...file,
						documentType: documentType,
					}))
					setUploadedFiles((prev) => [...prev, ...filesWithType])
				}
				showSuccess(
					'Files Uploaded Successfully',
					`${uploadedFileData?.length || 0} file(s) have been uploaded successfully.`
				)
			} catch (error) {
				console.error('❌ Failed to upload files to S3:', error)
				showError(
					'Upload Failed',
					'Failed to upload files. Please try again.',
					{
						onRetry: () => handleFileUpload(event, documentType),
						showRetry: true,
						retryText: 'Retry Upload',
					}
				)
			}
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const removeFile = (fileId: number | string) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
		// Also remove from selectedDocuments
		setSelectedDocuments((prev) =>
			prev.filter((doc) => doc.document_id !== fileId)
		)
	}

	const removeAllFiles = () => {
		setUploadedFiles([])
		setSelectedDocuments([])
		setShowDeleteConfirmModal(false)
	}

	const handleRemoveAllClick = () => {
		setShowDeleteConfirmModal(true)
	}

	const handleCloseModal = () => {
		setIsClosing(true)
		setTimeout(() => {
			setShowManageModal(false)
			setIsClosing(false)
		}, 300)
	}

	const handleOpenModal = () => {
		setShowManageModal(true)
		setIsClosing(false)
	}

	const handleResearchLabClick = (researchLabId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to research lab detail page
		router.push(
			`/explore/research-labs/${researchLabId}?from=research${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const menuItems = [
		{ id: 'job-description', label: 'Job description' },
		{ id: 'offer-information', label: 'Offer information' },
		{ id: 'job-requirements', label: 'Job requirements' },
		{ id: 'other-information', label: 'Other information' },
	]

	const renderTabContent = () => {
		if (loading) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			)
		}

		if (error) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-red-500">Error: {error}</div>
				</div>
			)
		}

		if (!researchLab) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Research lab not found</div>
				</div>
			)
		}

		switch (activeTab) {
			case 'job-description':
				return (
					<div className="space-y-4">
						<ol className="space-y-4">
							<li className="text-base">
								<span className="font-bold text-gray-900">
									1. Research Field:
								</span>
								<div
									className="mt-2 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.researchFields,
									}}
								/>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">2. Start date:</span>{' '}
								<span className="text-gray-700">
									{researchLab.startDate || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadline:
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.applicationDeadline || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">4. Country:</span>{' '}
								<span className="text-gray-700">
									{researchLab.country || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									5. Type of Contract:
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.contractType || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">6. Attendance:</span>{' '}
								<span className="text-gray-700">
									{researchLab.attendance || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">7. Job type:</span>{' '}
								<span className="text-gray-700">
									{researchLab.jobType || 'Researcher'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									8. Detail description:
								</span>
								<div
									className="mt-2 text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html:
											researchLab.description ||
											researchLab.mainResponsibility ||
											'No description available',
									}}
								/>
							</li>
						</ol>
					</div>
				)

			case 'offer-information':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Salary:</span>{' '}
								<span className="text-gray-700">{researchLab.salary}</span>
							</p>
							{researchLab.salaryDescription && (
								<p className="text-sm text-gray-600">
									{researchLab.salaryDescription}
								</p>
							)}
						</div>

						{researchLab.benefit && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Benefit:</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.benefit,
									}}
								/>
							</div>
						)}

						{/* {researchLab.labFacilities && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Lab Facilities:</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.labFacilities,
									}}
								/>
							</div>
						)} */}
					</div>
				)

			case 'job-requirements':
				return (
					<div className="space-y-6">
						{researchLab.mainResponsibility && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										1. Main responsibilities:
									</span>
								</p>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.mainResponsibility,
									}}
								/>
							</div>
						)}

						{researchLab.qualificationRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									2. Qualification requirements:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.qualificationRequirement,
									}}
								/>
							</div>
						)}

						{researchLab.experienceRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									3. Experience requirements:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.experienceRequirement,
									}}
								/>
							</div>
						)}

						{researchLab.assessmentCriteria && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									4. Assessment criteria:
								</p>
								<div
									className="text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.assessmentCriteria,
									}}
								/>
							</div>
						)}

						{researchLab.otherRequirement && (
							<div>
								<p className="text-base">
									<span className="font-bold text-gray-900">
										5. Other requirements:
									</span>
								</p>
								<div
									className="mt-2 text-gray-700 whitespace-pre-line prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.otherRequirement,
									}}
								/>
							</div>
						)}

						{researchLab.technicalSkills && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Technical Skills:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.technicalSkills}
								</div>
							</div>
						)}

						{researchLab.academicBackground && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Academic Background:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.academicBackground}
								</div>
							</div>
						)}
					</div>
				)

			case 'other-information':
				return (
					<div className="space-y-6">
						{/* 2. Work Location */}
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Other Information:
							</h3>
							<div
								className="text-gray-700 prose prose-content max-w-none"
								dangerouslySetInnerHTML={{
									__html: researchLab.otherInfo,
								}}
							/>
						</div>
					</div>
				)

			default:
				return null
		}
	}
	return (
		<div className="min-h-screen bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative w-full"
			>
				<div className="mt-28 w-[1500px] mx-auto px-5 sm:px-7 lg:px-9">
					<Breadcrumb items={breadcrumbItems} />
				</div>

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-full bg-[#F5F7FB] mt-5 px-10 py-5 flex justify-center"
				>
					<div className="w-[1500px] flex justify-center items-center gap-10 mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<div className="flex flex-col justify-center items-center w-1/2">
							<h1 className="text-3xl font-bold mb-2">
								{researchLab?.title || "Job's name"}
							</h1>
							<p className="text-gray-600 mb-4">
								Provided by: {researchLab?.organization || "Lab's name"}
							</p>

							{/* Institution Status Badge */}
							<InstitutionStatusBadge institution={researchLab?.institution} />

							<div className="flex items-center gap-3 mb-4">
								{researchLab?.institution?.website && (
									<Button
										onClick={() =>
											window.open(researchLab.institution.website, '_blank')
										}
										className=""
									>
										Visit website
									</Button>
								)}
								{researchLab?.institution?.userId && (
									<Button
										onClick={() => {
											const contactUrl = `/messages?contact=${(researchLab.institution as any).userId}`
											router.push(contactUrl)
										}}
										variant="outline"
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
									>
										Contact Institution
									</Button>
								)}
								<motion.button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										const labId =
											researchLab?.id ||
											(typeof params.id === 'string'
												? params.id
												: String(params.id))
										if (labId) {
											// Check if user is authenticated before attempting to toggle
											if (!isAuthenticated) {
												setShowAuthModal(true)
												return
											}
											toggleWishlistItem(labId)
										}
									}}
									className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Heart
										className={`w-6 h-6 transition-all duration-200 ${
											isInWishlist(
												researchLab?.id ||
													(typeof params.id === 'string'
														? params.id
														: String(params.id))
											)
												? 'fill-red-500 text-red-500'
												: 'text-gray-400 hover:text-red-500'
										}`}
									/>
								</motion.button>
							</div>

							<p className="text-sm text-gray-500">
								Number of applications: {researchLab?.applicationCount || 0}
							</p>
						</div>
						<div className="w-1/2 grid grid-cols-2 gap-4">
							{infoItems.map((item, index) => (
								<div
									key={index}
									className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start"
								>
									<span className="text-md text-gray-500">{item.label}</span>
									<span className="text-xl text-black font-bold">
										{item.value}
									</span>
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border"
				>
					<div className="container mx-auto px-4">
						<div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-40 text-center lg:text-left">
							{infoItems.map((item, index) => (
								<div key={index}>
									<p className="text-sm text-gray-500 mb-1">{item.label}</p>
									<p className="font-semibold text-gray-900">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</motion.div>

				{/* About Content */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					{loading ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-gray-500">Loading...</div>
						</div>
					) : error ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-red-500">Error: {error}</div>
						</div>
					) : researchLab ? (
						<div className="prose prose-content max-w-none text-gray-700 space-y-4">
							<div
								className="prose prose-content max-w-none"
								dangerouslySetInnerHTML={{
									__html: researchLab.institution.about || 'no description',
								}}
							/>

							{/* {researchLab.researchFocus && (
								<div>
									<p className="font-semibold">Research Focus:</p>
									<div
										className="prose prose-content max-w-none"
										dangerouslySetInnerHTML={{
											__html: researchLab.researchFocus,
										}}
									/>
								</div>
							)}

							{researchLab.researchFields.length > 0 && (
								<div>
									<p className="font-semibold">Research Areas:</p>
									<div
										className="prose prose-content max-w-none"
										dangerouslySetInnerHTML={{
											__html: researchLab.researchFields,
										}}
									/>
								</div>
							)} */}

							{/* {researchLab.institution.website && (
								<div>
									<p className="font-semibold">Institution:</p>
									<p>
										{researchLab.institution.name} -{' '}
										{researchLab.institution.country}
									</p>
									<a
										href={researchLab.institution.website}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-800 underline"
									>
										Visit Institution Website
									</a>
								</div>
							)} */}
						</div>
					) : (
						<div className="text-gray-500">Research lab not found</div>
					)}
				</motion.div>

				{/* Overview Content */}
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
								className=""
							>
								{renderTabContent()}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				</div>

				{/* Apply Content - Always show */}
				{/* -----------------------------------------------Apply Content---------------------------------------------- */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-3xl font-bold">
							{hasApplied ? 'Application Status' : 'Apply here !'}
						</h2>
						{hasApplied && applicationStatus && (
							<span
								className={`px-4 py-2 rounded-full text-sm font-medium ${
									applicationStatus === 'SUBMITTED' ||
									applicationStatus === 'PENDING'
										? 'bg-yellow-100 text-yellow-800'
										: applicationStatus === 'REQUIRE_UPDATE'
											? 'bg-orange-100 text-orange-800'
											: applicationStatus === 'UPDATED'
												? 'bg-blue-100 text-blue-800'
												: applicationStatus === 'ACCEPTED'
													? 'bg-green-100 text-green-800'
													: applicationStatus === 'REJECTED'
														? 'bg-red-100 text-red-800'
														: 'bg-gray-100 text-gray-800'
								}`}
							>
								{applicationStatus === 'PENDING'
									? 'SUBMITTED'
									: applicationStatus === 'REVIEWED'
										? 'REQUIRE_UPDATE'
										: applicationStatus}
							</span>
						)}
					</div>{' '}
					{!hasApplied && (
						<>
							<div className="text-gray-600 mb-6">
								{researchLab?.requiredDocuments &&
								researchLab.requiredDocuments.length > 0 ? (
									<div className="space-y-3">
										{researchLab.requiredDocuments.map((doc: any) => (
											<p key={doc.id}>
												<span className="font-medium">{doc.name}:</span>{' '}
												{doc.description}
											</p>
										))}
									</div>
								) : (
									<p>
										You can upload required documents here. We will send
										documents and your academic information to university.
									</p>
								)}
							</div>

							{/* Application Documents Section */}
							<div className="w-full mb-6">
								<div className="space-y-6">
									{/* Header */}
									<div className="text-center">
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											Application Documents
										</h3>
										<p className="text-gray-600">
											Select documents from your profile or upload new files
										</p>
									</div>

									{/* Show simple note if no documents selected yet */}
									{selectedDocuments.length === 0 ? (
										<div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
											<div className="text-6xl mb-4">📁</div>
											<h4 className="text-lg font-medium text-gray-900 mb-2">
												No documents ready
											</h4>
											<p className="text-gray-600 mb-6">
												Get started by selecting documents from your profile
											</p>
											<Button
												onClick={() => setShowDocumentSelector(true)}
												className="bg-[#126E64] hover:bg-teal-700 text-white px-8 py-3"
											>
												📄 Select Documents
											</Button>
										</div>
									) : (
										<>
											{/* Selected Documents Summary */}
											<div className="bg-[#e1fdeb] border border-green-200 rounded-xl p-6">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 bg-[#126E64] rounded-full flex items-center justify-center">
														<Check className="w-6 h-6 text-white" />
													</div>
													<div className="flex-1">
														<h4 className="text-lg font-semibold text-green-800">
															{selectedDocuments.length} Document
															{selectedDocuments.length !== 1 ? 's' : ''} Ready
														</h4>
														<p className="text-green-600">
															{(() => {
																const profileDocs = selectedDocuments.filter(
																	(d) => d.source === 'existing'
																).length
																const uploadedDocs = selectedDocuments.filter(
																	(d) => d.source === 'new'
																).length

																if (profileDocs > 0 && uploadedDocs > 0) {
																	return `${profileDocs} from profile, ${uploadedDocs} uploaded`
																} else if (profileDocs > 0) {
																	return `${profileDocs} from profile`
																} else if (uploadedDocs > 0) {
																	return `${uploadedDocs} uploaded`
																} else {
																	return 'Ready to submit'
																}
															})()}
														</p>
													</div>
													<div className="flex gap-3">
														<Button
															variant="outline"
															onClick={() => setShowDocumentSelector(true)}
															className="text-green-700 border-green-300 bg-white hover:bg-green-50"
														>
															Edit Selection
														</Button>
													</div>
												</div>
											</div>

											{/* Upload Additional Files */}
											<div className="border-2 border-dashed rounded-xl p-8 text-center">
												<input
													type="file"
													multiple
													onChange={async (e) => {
														const files = e.target.files
														if (files && files.length > 0) {
															try {
																const uploadedFileData = await uploadFiles(
																	Array.from(files)
																)
																if (uploadedFileData) {
																	const newDocuments = uploadedFileData.map(
																		(file) => ({
																			document_id: `temp_${Date.now()}_${Math.random()}`,
																			name: file.name,
																			url: file.url,
																			size: file.size,
																			documentType: 'general',
																			source: 'new' as const,
																		})
																	)
																	const updatedDocs = [
																		...selectedDocuments,
																		...newDocuments,
																	]
																	setSelectedDocuments(updatedDocs)
																	handleDocumentsSelected(updatedDocs)
																	showSuccess(
																		'Files Uploaded',
																		`${uploadedFileData.length} file(s) uploaded successfully`
																	)
																}
															} catch (error) {
																showError(
																	'Upload Failed',
																	'Failed to upload files. Please try again.'
																)
															}
														}
														e.target.value = ''
													}}
													className="hidden"
													id="file-upload-additional"
													accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
												/>
												<label
													htmlFor="file-upload-additional"
													className="cursor-pointer block"
												>
													<div className="text-5xl mb-4">📁</div>
													<h4 className="text-lg font-medium text-orange-800 mb-2">
														Upload Additional Files
													</h4>
													<p className="text-orange-700">
														Click to add more documents from your computer
													</p>
													<p className="text-sm text-gray-500 mt-2">
														PDF, DOC, DOCX, JPG, PNG (max 10MB each)
													</p>
												</label>
											</div>

											{/* Show uploaded additional files if any */}
											{/* {selectedDocuments.filter((doc) => doc.source === 'new')
												.length > 0 && (
												<div className="space-y-3">
													<h5 className="font-medium text-gray-900">
														Newly Uploaded Files:
													</h5>
													{selectedDocuments
														.filter((doc) => doc.source === 'new')
														.map((doc) => (
															<div
																key={doc.document_id}
																className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
															>
																<div className="flex items-center gap-3">
																	<div className="text-2xl">📄</div>
																	<div>
																		<p className="font-medium text-gray-900">
																			{doc.name}
																		</p>
																		<p className="text-sm text-gray-500">
																			{formatFileSize(doc.size)} • Just uploaded
																		</p>
																	</div>
																</div>
																<button
																	onClick={() => {
																		const updatedDocs =
																			selectedDocuments.filter(
																				(d) => d.document_id !== doc.document_id
																			)
																		setSelectedDocuments(updatedDocs)
																		handleDocumentsSelected(updatedDocs)
																	}}
																	className="text-red-500 hover:text-red-700 p-2"
																	title="Remove document"
																>
																	<Trash2 className="h-4 w-4" />
																</button>
															</div>
														))}
												</div>
											)} */}
										</>
									)}
								</div>
							</div>
						</>
					)}
					{/* File Management */}
					{!hasApplied && (uploadedFiles.length > 0 || isUploading) && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center justify-between mb-4">
								<span className="font-medium">
									{isUploading
										? 'Uploading files...'
										: `Manage files: ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`}
								</span>
								{uploadedFiles.length > 0 && (
									<Button
										variant="outline"
										onClick={handleOpenModal}
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
									>
										Manage Files
									</Button>
								)}
							</div>

							{/* Upload Progress */}
							{isUploading && uploadProgress.length > 0 && (
								<div className="space-y-2 mb-4">
									{uploadProgress.map((progress) => (
										<div key={progress.fileIndex} className="space-y-1">
											<div className="flex justify-between text-sm">
												<span>File {progress.fileIndex + 1}</span>
												<span>{progress.progress}%</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="bg-[#126E64] h-2 rounded-full transition-all duration-300"
													style={{ width: `${progress.progress}%` }}
												></div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
					{/* Display update requests as individual alert boxes */}
					{hasApplied &&
						updateRequests.length > 0 &&
						updateRequests.map((request, index) => (
							<div
								key={request.updateRequestId}
								className={`mb-6 rounded-lg p-6 border ${
									request.status === 'PENDING'
										? 'bg-orange-50 border-orange-200'
										: request.status === 'RESPONDED' ||
											  request.status === 'REVIEWED'
											? 'bg-green-50 border-green-200'
											: 'bg-gray-50 border-gray-200'
								}`}
							>
								<div className="flex items-start gap-3">
									<div
										className={`text-2xl ${
											request.status === 'PENDING'
												? 'text-orange-600'
												: request.status === 'RESPONDED' ||
													  request.status === 'REVIEWED'
													? 'text-green-600'
													: 'text-gray-600'
										}`}
									>
										{request.status === 'PENDING'
											? '⚠'
											: request.status === 'RESPONDED' ||
												  request.status === 'REVIEWED'
												? '✓'
												: 'ℹ'}
									</div>
									<div className="flex-1">
										<h3
											className={`text-lg font-semibold ${
												request.status === 'PENDING'
													? 'text-orange-800'
													: request.status === 'RESPONDED' ||
														  request.status === 'REVIEWED'
														? 'text-green-800'
														: 'text-gray-800'
											}`}
										>
											{request.status === 'PENDING'
												? 'Update Required'
												: request.status === 'RESPONDED' ||
													  request.status === 'REVIEWED'
													? 'Update Submitted Successfully'
													: 'Update Request'}
										</h3>
										<p
											className={`mt-1 mb-4 ${
												request.status === 'PENDING'
													? 'text-orange-700'
													: request.status === 'RESPONDED' ||
														  request.status === 'REVIEWED'
														? 'text-green-700'
														: 'text-gray-700'
											}`}
										>
											{request.status === 'PENDING'
												? 'The institution has requested additional information or documents for your application. Please review the request and submit the required updates.'
												: request.status === 'RESPONDED' ||
													  request.status === 'REVIEWED'
													? 'Your update response has been submitted successfully. The institution will review your changes.'
													: `Update request #${updateRequests.length - index}`}
										</p>
										<div className="flex gap-3">
											{request.status === 'PENDING' && applicationId && (
												<Button
													onClick={() => {
														setSelectedUpdateRequestId(request.updateRequestId)
														setShowUpdateModal(true)
													}}
													className="bg-orange-500 hover:bg-orange-600 text-white"
												>
													View Update Request & Submit Response
												</Button>
											)}
											{(request.status === 'RESPONDED' ||
												request.status === 'REVIEWED') &&
												applicationId && (
													<Button
														onClick={() => {
															setSelectedUpdateRequestId(
																request.updateRequestId
															)
															setShowUpdateModal(true)
														}}
														variant="outline"
														className="border-green-600 text-green-600 hover:bg-green-50"
													>
														View Update Details
													</Button>
												)}
										</div>
									</div>
								</div>
							</div>
						))}
					{hasApplied &&
						updateRequests.length === 0 &&
						applicationStatus !== 'REQUIRE_UPDATE' && (
							<div
								className={`border rounded-lg p-6 mb-6 ${
									applicationStatus === 'ACCEPTED'
										? 'bg-green-50 border-green-200'
										: applicationStatus === 'REJECTED'
											? 'bg-red-50 border-red-200'
											: applicationStatus === 'UPDATED'
												? 'bg-blue-50 border-blue-200'
												: 'bg-yellow-50 border-yellow-200'
								}`}
							>
								<div className="flex items-center gap-3">
									<div
										className={`text-2xl ${
											applicationStatus === 'ACCEPTED'
												? 'text-green-600'
												: applicationStatus === 'REJECTED'
													? 'text-red-600'
													: applicationStatus === 'UPDATED'
														? 'text-blue-600'
														: 'text-yellow-600'
										}`}
									>
										{applicationStatus === 'ACCEPTED'
											? '✓'
											: applicationStatus === 'REJECTED'
												? '✗'
												: applicationStatus === 'UPDATED'
													? '↻'
													: '⏳'}
									</div>
									<div>
										<h3
											className={`text-lg font-semibold ${
												applicationStatus === 'ACCEPTED'
													? 'text-green-800'
													: applicationStatus === 'REJECTED'
														? 'text-red-800'
														: applicationStatus === 'UPDATED'
															? 'text-blue-800'
															: 'text-yellow-800'
											}`}
										>
											{applicationStatus === 'ACCEPTED'
												? 'Application Accepted!'
												: applicationStatus === 'REJECTED'
													? 'Application Not Selected'
													: applicationStatus === 'UPDATED'
														? 'Application Updated'
														: 'Application Submitted Successfully!'}
										</h3>
										<p
											className={`mt-1 ${
												applicationStatus === 'ACCEPTED'
													? 'text-green-700'
													: applicationStatus === 'REJECTED'
														? 'text-red-700'
														: applicationStatus === 'UPDATED'
															? 'text-blue-700'
															: 'text-yellow-700'
											}`}
										>
											{applicationStatus === 'ACCEPTED'
												? 'Congratulations! Your application has been accepted. The institution will contact you soon with next steps.'
												: applicationStatus === 'REJECTED'
													? 'We regret to inform you that your application was not selected this time.'
													: applicationStatus === 'UPDATED'
														? 'Your application has been updated. The institution will review your changes.'
														: 'Your application has been submitted. You will receive updates via email.'}
										</p>
									</div>
								</div>
							</div>
						)}
					{/* Show uploaded files in read-only mode when applied */}
					{hasApplied && uploadedFiles.length > 0 && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center justify-between mb-4">
								<span className="font-medium text-gray-700">
									Initial Application Documents ({uploadedFiles.length} file
									{uploadedFiles.length !== 1 ? 's' : ''})
								</span>
							</div>
							<div className="text-gray-600 mb-6">
								{researchLab?.requiredDocuments &&
								researchLab.requiredDocuments.length > 0 ? (
									<div className="space-y-3">
										{researchLab.requiredDocuments.map(
											(doc: any, index: number) => (
												<p key={doc.id || index}>
													<span className="font-medium">{doc.name}:</span>{' '}
													{doc.description}
												</p>
											)
										)}
									</div>
								) : (
									<p>
										These are the documents you submitted with your application.
										They cannot be modified or deleted.
									</p>
								)}
							</div>
							<div className="space-y-3">
								{uploadedFiles.map((file) => (
									<div
										key={file.id}
										className="flex items-center gap-3 p-3 bg-white rounded-lg border"
									>
										<div className="text-2xl">📄</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{file.name}
											</p>
											<div className="flex items-center gap-2 text-xs text-gray-500">
												<span>{(file.size / 1024).toFixed(1)} KB</span>
												{file.uploadDate && (
													<>
														<span>•</span>
														<span>
															Uploaded:{' '}
															{new Date(file.uploadDate).toLocaleDateString()}
														</span>
													</>
												)}
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													// Open S3 file URL in new tab
													window.open(file.url, '_blank')
												}}
												className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
											>
												View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													// Download the file
													const link = document.createElement('a')
													link.href = file.url
													link.download = file.name
													document.body.appendChild(link)
													link.click()
													document.body.removeChild(link)
												}}
												className="text-blue-600 border-blue-600 hover:bg-blue-50"
											>
												Download
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{/* Show helpful message when no files uploaded */}
					{!hasApplied && uploadedFiles.length === 0 && (
						<div className="text-center mb-4">
							<p className="text-amber-600 text-sm font-medium">
								📁 Please upload at least one document to submit your
								application
							</p>
						</div>
					)}
					<div className="flex gap-3 justify-center">
						{!hasApplied && selectedDocuments.length > 0 && (
							<Button
								variant="outline"
								onClick={handleRemoveAllClick}
								className="text-red-500 border-red-500 hover:bg-red-50"
							>
								Remove all
							</Button>
						)}
						<Button
							className={
								hasApplied
									? 'bg-green-600 hover:bg-green-700 text-white'
									: uploadedFiles.length === 0 &&
										  !isApplying &&
										  !isUploading &&
										  !isCheckingApplication
										? 'bg-gray-400 text-white cursor-not-allowed hover:bg-gray-400'
										: 'bg-[#126E64] hover:bg-teal-700 text-white'
							}
							onClick={handleApply}
							disabled={
								hasApplied ||
								isApplying ||
								isUploading ||
								isCheckingApplication ||
								uploadedFiles.length === 0
							}
							style={{
								cursor:
									uploadedFiles.length === 0 &&
									!hasApplied &&
									!isApplying &&
									!isUploading &&
									!isCheckingApplication
										? 'not-allowed'
										: 'pointer',
							}}
						>
							{hasApplied ? (
								'✓ Application Submitted'
							) : isApplying ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Submitting...
								</div>
							) : isUploading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Uploading Files...
								</div>
							) : isCheckingApplication ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Checking...
								</div>
							) : uploadedFiles.length === 0 ? (
								'Upload Files to Continue'
							) : (
								'Submit Application'
							)}
						</Button>
					</div>
				</motion.div>

				{/* Recommended Research Labs - Only show when data is loaded */}
				{!loading && !error && researchLab && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="p-8 bg-white py-6 shadow-xl border"
					>
						<h2 className="text-3xl font-bold mb-6">Related Research Labs</h2>

						{/* Show loading state */}
						{isLoadingRecommendations ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
							</div>
						) : recommendedResearchLabs.length === 0 ? (
							<div className="flex justify-center items-center py-12">
								<p className="text-gray-500">
									No recommendations available at this time.
								</p>
							</div>
						) : (
							<div className="relative h-[900px] overflow-y-auto overflow-x-hidden">
								{recommendedResearchLabs.slice(0, 9).map((lab, index) => (
									<div key={lab.id} className="">
										<div className="mb-7">
											<ResearchLabCard
												lab={lab}
												index={index}
												isWishlisted={isInWishlist(lab.id)}
												onWishlistToggle={() => toggleWishlistItem(lab.id)}
												onClick={handleResearchLabClick}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Manage Files Side Panel */}
			{showManageModal && (
				<div
					className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ease-out ${
						isClosing ? 'translate-x-full' : 'translate-x-0'
					}`}
					style={{
						animation:
							showManageModal && !isClosing
								? 'slideInFromRight 0.3s ease-out'
								: 'none',
					}}
				>
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">Manage Documents</h2>
							<Button
								variant="outline"
								onClick={handleCloseModal}
								className="rounded-full"
							>
								✕
							</Button>
						</div>
					</div>

					<div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
						<div className="space-y-8">
							{/* Uploaded Files Section */}
							{uploadedFiles.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										Uploaded Files ({uploadedFiles.length})
									</h3>
									<div className="space-y-3">
										{uploadedFiles.map((file) => (
											<div
												key={file.id}
												className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
											>
												<div className="flex items-center gap-3">
													<span className="text-2xl">📄</span>
													<div>
														<p className="font-medium text-sm">
															{file.name || 'Document'}
														</p>
														<p className="text-sm text-muted-foreground">
															{formatFileSize(file.size || 0)}
															{file.fileType ? ` • ${file.fileType}` : ''}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<button
														onClick={() => {
															// Create a download link for the file
															if (file.url) {
																window.open(file.url, '_blank')
															} else if (file.file) {
																const url = URL.createObjectURL(file.file)
																const a = document.createElement('a')
																a.href = url
																a.download = file.name
																a.click()
																URL.revokeObjectURL(url)
															}
														}}
														className="text-primary hover:text-primary/80 text-sm font-medium"
													>
														View
													</button>
													<button
														onClick={() => removeFile(file.id)}
														className="text-gray-400 hover:text-red-600 p-1"
														title="Delete document"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Empty State */}
							{uploadedFiles.length === 0 && (
								<div className="text-center py-8">
									<div className="text-4xl mb-4">📁</div>
									<p className="text-muted-foreground">
										No documents uploaded yet
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showDeleteConfirmModal}
				onClose={() => setShowDeleteConfirmModal(false)}
				title="Delete All Files"
				maxWidth="sm"
			>
				<div className="space-y-6">
					<p className="text-gray-600">
						Do you want to delete all files? This action cannot be undone.
					</p>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirmModal(false)}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Cancel
						</Button>
						<Button
							onClick={removeAllFiles}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Delete All
						</Button>
					</div>
				</div>
			</Modal>

			{/* Authentication Required Modal */}
			<ErrorModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				title="Authentication Required"
				message="You need to sign in to add items to your wishlist. Please sign in to your account or create a new one."
				buttonText="Sign In"
				onButtonClick={handleSignIn}
				showSecondButton={true}
				secondButtonText="Sign Up"
				onSecondButtonClick={handleSignUp}
				showCloseButton={true}
			/>

			{/* Update Response Modal */}
			{applicationId && (
				<ApplicationUpdateResponseModal
					isOpen={showUpdateModal}
					onClose={() => {
						setShowUpdateModal(false)
						setSelectedUpdateRequestId(null)
					}}
					applicationId={applicationId}
					updateRequestId={selectedUpdateRequestId || undefined}
					onSuccess={async () => {
						// Refresh application status and update requests after successful update
						const researchLabId = researchLab?.id || params.id
						if (researchLabId) {
							await checkExistingApplication(researchLabId as string)
						}
						if (applicationId) {
							await fetchUpdateRequests()
						}
						setShowUpdateModal(false)
						setSelectedUpdateRequestId(null)
						showSuccess(
							'Update Submitted',
							'Your update response has been submitted successfully. The institution will review your changes.'
						)
					}}
				/>
			)}

			{/* Document Selector Modal */}
			<Modal
				isOpen={showDocumentSelector}
				onClose={() => setShowDocumentSelector(false)}
				title="Select Documents for Application"
				maxWidth="xl"
			>
				<div className="max-h-[70vh] overflow-y-auto">
					<DocumentSelector
						onDocumentsSelected={handleDocumentsSelected}
						selectedDocuments={selectedDocuments}
						requiredDocumentTypes={
							researchLab?.requiredDocuments?.map((doc: any) => ({
								id: doc.id,
								name: doc.name,
								description: doc.description,
							})) || []
						}
					/>
				</div>
			</Modal>
		</div>
	)
}

export default ResearchLabDetail
