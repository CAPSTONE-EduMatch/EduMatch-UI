'use client'
import {
	Breadcrumb,
	Button,
	FilterSidebar,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
	ErrorModal,
} from '@/components/ui'
import {
	DocumentSelector,
	SelectedDocument,
} from '@/components/ui/DocumentSelector'

import { mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Trash2, Check } from 'lucide-react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { applicationService } from '@/services/application/application-service'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useNotification } from '@/contexts/NotificationContext'
import { ApplicationUpdateResponseModal } from '@/components/profile/applicant/sections/ApplicationUpdateResponseModal'
import { ExploreApiService } from '@/services/explore/explore-api'
import type { ExploreFilters } from '@/types/api/explore-api'

const ScholarshipDetail = () => {
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

	const [activeTab, setActiveTab] = useState('detail')
	const [eligibilityProgramsPage, setEligibilityProgramsPage] = useState(1)
	const [eligibilityPrograms, setEligibilityPrograms] = useState<any[]>([])
	const [eligibilityProgramsLoading, setEligibilityProgramsLoading] =
		useState(false)
	const [eligibilityProgramsTotalPages, setEligibilityProgramsTotalPages] =
		useState(1)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [selectedDocuments, setSelectedDocuments] = useState<
		SelectedDocument[]
	>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [showDocumentSelector, setShowDocumentSelector] = useState(false)
	const [currentScholarship, setCurrentScholarship] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

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

	// Constants for pagination
	const ITEMS_PER_PAGE_PROGRAMS = 6

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

	const [eligibilityFilters, setEligibilityFilters] = useState<
		Record<string, string[]>
	>({})

	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Scholarship Detail' }])

	// Dynamic info items based on current scholarship data
	// const infoItems = [
	// 	{
	// 		label: 'Tuition fee',
	// 		value: currentScholarship?.tuitionFee || 'N/A',
	// 	},
	// 	{ label: 'Duration', value: currentScholarship?.duration || 'N/A' },
	// 	{
	// 		label: 'Application deadline',
	// 		value: currentScholarship?.applicationDeadline || 'N/A',
	// 	},
	// 	{
	// 		label: 'Start Date',
	// 		value: currentScholarship?.startDate || 'N/A',
	// 	},
	// 	{
	// 		label: 'Location',
	// 		value: currentScholarship?.location || 'N/A',
	// 	},
	// ]

	const eligibilityProgramsPerPage = 6

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const fetchScholarshipDetail = async () => {
			setLoading(true)
			setError(null)
			try {
				const scholarshipId = params.id as string
				const response = await fetch(
					`/api/explore/scholarships/scholarship-detail?id=${scholarshipId}`
				)
				if (!response.ok) {
					throw new Error('Failed to fetch scholarship details')
				}
				const data = await response.json()
				if (data.success) {
					setCurrentScholarship(data.data)
				} else {
					throw new Error(data.message || 'Failed to fetch data')
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred')
			} finally {
				setLoading(false)
			}
		}

		fetchScholarshipDetail()
	}, [params.id])

	// Separate useEffect for breadcrumb to avoid triggering scholarship fetch
	useEffect(() => {
		const updateBreadcrumb = () => {
			const fromTab = searchParams.get('from') || 'scholarships'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			const scholarshipName = currentScholarship?.title || 'Scholarship Detail'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'research') {
				items.push({
					label: 'Research Labs',
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: 'Scholarships',
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: scholarshipName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, currentScholarship?.title])

	// Fetch eligibility programs when scholarship data is available
	useEffect(() => {
		const loadEligibilityPrograms = async () => {
			if (!currentScholarship?.id) {
				return
			}

			// Debug log để track khi nào fetch được trigger
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.log('🔄 Loading eligibility programs triggered:', {
					scholarshipId: currentScholarship.id,
					page: eligibilityProgramsPage,
					filters: eligibilityFilters,
					loading,
				})
			}

			setEligibilityProgramsLoading(true)
			try {
				// Parse fee range if available
				let minFee: number | undefined
				let maxFee: number | undefined
				if (
					eligibilityFilters.feeRange &&
					eligibilityFilters.feeRange.length > 0
				) {
					const feeRangeStr = eligibilityFilters.feeRange[0]
					const [min, max] = feeRangeStr.split('-').map(Number)
					minFee = min
					maxFee = max
				}

				const response = await ExploreApiService.getPrograms({
					page: eligibilityProgramsPage,
					limit: ITEMS_PER_PAGE_PROGRAMS,
					sortBy: 'most-popular',
					discipline: eligibilityFilters.discipline,
					country: eligibilityFilters.country,
					attendance: eligibilityFilters.attendance,
					degreeLevel: eligibilityFilters.degreeLevel,
					duration: eligibilityFilters.duration,
					minFee,
					maxFee,
				})

				setEligibilityPrograms(response.data)
				setEligibilityProgramsTotalPages(response.meta.totalPages)
			} catch (err) {
				if (process.env.NODE_ENV === 'development') {
					// eslint-disable-next-line no-console
					console.error('Error fetching eligibility programs:', err)
				}
				setEligibilityPrograms([])
				setEligibilityProgramsTotalPages(1)
			} finally {
				setEligibilityProgramsLoading(false)
			}
		}

		// Only load when scholarship is available and not in main loading state
		if (currentScholarship?.id && !loading) {
			loadEligibilityPrograms()
		}
	}, [
		currentScholarship?.id,
		eligibilityProgramsPage,
		eligibilityFilters,
		loading,
	])

	// Debug effect to track loading states
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			console.log('🐛 Debug - Loading states:', {
				loading,
				eligibilityProgramsLoading,
				currentScholarshipId: currentScholarship?.id,
				paramsId: params.id,
				eligibilityFilters,
				eligibilityProgramsPage,
			})
		}
	}, [
		loading,
		eligibilityProgramsLoading,
		currentScholarship?.id,
		params.id,
		eligibilityFilters,
		eligibilityProgramsPage,
	])

	// Reset pagination when scholarship changes
	useEffect(() => {
		if (currentScholarship?.id) {
			setEligibilityProgramsPage(1)
		}
	}, [currentScholarship?.id])

	// Check for existing application when component loads
	useEffect(() => {
		const scholarshipId = currentScholarship?.id || params.id
		if (scholarshipId && isAuthenticated) {
			checkExistingApplication(scholarshipId as string)
		}
	}, [currentScholarship?.id, params.id, isAuthenticated])

	// Fetch all update requests when application is loaded
	useEffect(() => {
		if (applicationId) {
			fetchUpdateRequests()
		} else {
			setUpdateRequests([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationId])

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
	const checkExistingApplication = async (scholarshipId: string) => {
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
					(app) => app.postId === scholarshipId
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
								size: doc.size,
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

	// Program handling functions (similar to Explore page)
	const handleProgramWishlistToggle = async (id: string) => {
		// Check if user is authenticated before attempting to toggle
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		try {
			await toggleWishlistItem(id)
		} catch (error) {
			// Check if error is due to authentication
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			if (
				errorMessage.includes('Authentication required') ||
				errorMessage.includes('not authenticated') ||
				errorMessage.includes('401')
			) {
				setShowAuthModal(true)
			} else {
				// eslint-disable-next-line no-console
				console.error('Failed to toggle wishlist item:', error)
			}
		}
	}

	const handleScholarshipWishlistToggle = async (id: string) => {
		// Check if user is authenticated before attempting to toggle
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		try {
			await toggleWishlistItem(id)
		} catch (error) {
			// Check if error is due to authentication
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			if (
				errorMessage.includes('Authentication required') ||
				errorMessage.includes('not authenticated') ||
				errorMessage.includes('401')
			) {
				setShowAuthModal(true)
			} else {
				// eslint-disable-next-line no-console
				console.error('Failed to toggle wishlist item:', error)
			}
		}
	}

	// Handle filters change from FilterSidebar (stable callback to avoid re-renders)
	const handleEligibilityFiltersChange = useCallback(
		(filters: Record<string, string[]>) => {
			setEligibilityFilters(filters)
			// Reset to page 1 when filters change
			setEligibilityProgramsPage(1)
		},
		[]
	)

	// Remove the duplicate useEffect for page reset to prevent infinite loop

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

	const handleProgramClick = (programId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to programmes detail page
		router.push(
			`/explore/programmes/${programId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to scholarship detail page
		router.push(
			`/explore/scholarships/${scholarshipId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

	// Handle application submission
	const handleApply = async () => {
		// Use scholarship ID from URL params as fallback
		const scholarshipId = currentScholarship?.id || params.id
		if (!scholarshipId) {
			return
		}

		// Check if already applied
		if (hasApplied) {
			showError(
				'Already Applied',
				'You have already applied to this scholarship. You cannot submit multiple applications.',
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
					typeof scholarshipId === 'string'
						? scholarshipId
						: String(scholarshipId),
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
			console.error('Failed to submit application:', error)

			// Handle specific "already applied" error
			if (error.message && error.message.includes('already applied')) {
				setHasApplied(true)
				showError(
					'Already Applied',
					'You have already applied to this scholarship. You cannot submit multiple applications.',
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

	const menuItems = [
		{ id: 'detail', label: 'Detail' },
		{ id: 'eligibility', label: 'Eligibility' },
		{ id: 'other', label: 'Other information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'detail':
				return (
					<div className="space-y-4">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Description
							</h3>
							<p
								className="text-gray-700 mb-6 prose prose-content"
								dangerouslySetInnerHTML={{
									__html:
										currentScholarship?.description ||
										'No description available for this scholarship.',
								}}
							/>
						</div>

						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Scholarship Details
							</h3>
							<ol className="space-y-4">
								<li className="text-base">
									<span className="font-bold text-gray-900">1. Amount:</span>{' '}
									<span
										className="text-gray-700 prose prose-content"
										dangerouslySetInnerHTML={{
											__html: currentScholarship?.amount || 'N/A',
										}}
									/>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">2. Type:</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.type || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">3. Coverage:</span>{' '}
									<span
										className="text-gray-700 prose prose-content"
										dangerouslySetInnerHTML={{
											__html: currentScholarship?.scholarshipCoverage || 'N/A',
										}}
									/>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										4. Essay Required:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.essayRequired || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										5. Number Available:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.number || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">6. Days Left:</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.daysLeft || 0} days
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										7. Match Percentage:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.match || 'N/A'}
									</span>
								</li>
							</ol>
						</div>
					</div>
				)

			case 'eligibility':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Eligibility Requirements
							</h3>
							<p className="text-gray-700 mb-6">
								{currentScholarship?.eligibility ||
									'No specific eligibility requirements listed.'}
							</p>
						</div>

						{currentScholarship?.subdisciplines &&
							currentScholarship.subdisciplines.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Related Subdisciplines:
									</p>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentScholarship.subdisciplines.map(
											(subdiscipline: any) => (
												<li key={subdiscipline.id}>{subdiscipline.name}</li>
											)
										)}
									</ul>
								</div>
							)}

						{currentScholarship?.requiredDocuments &&
							currentScholarship.requiredDocuments.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Required Documents:
									</p>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentScholarship.requiredDocuments.map((doc: any) => (
											<li key={doc.id}>
												<strong>{doc.name}</strong>
												{doc.description && ` - ${doc.description}`}
											</li>
										))}
									</ul>
								</div>
							)}

						{/* Eligibility Programs Section */}
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Eligibility Programmes
							</h3>
							<p className="text-gray-700 mb-6">
								Programmes you may be eligible for based on this
								scholarship&apos;s requirements.
							</p>

							{/* Debug Panel */}
							{process.env.NODE_ENV === 'development' && (
								<div className="bg-gray-100 p-4 rounded-lg mb-4">
									<h4 className="font-bold text-sm mb-2">🐛 Debug Info:</h4>
									<div className="text-xs space-y-1">
										<p>Main Loading: {loading ? 'Yes' : 'No'}</p>
										<p>
											Eligibility Loading:{' '}
											{eligibilityProgramsLoading ? 'Yes' : 'No'}
										</p>
										<p>Scholarship ID: {currentScholarship?.id || 'None'}</p>
										<p>Programs Found: {eligibilityPrograms.length}</p>
										<p>Current Page: {eligibilityProgramsPage}</p>
										<p>Total Pages: {eligibilityProgramsTotalPages}</p>
										<p>API Endpoint: /api/explore/programs</p>
										<button
											onClick={async () => {
												setEligibilityProgramsLoading(true)
												try {
													const filters: ExploreFilters = {
														page: 1,
														limit: eligibilityProgramsPerPage,
													}
													const response =
														await ExploreApiService.getPrograms(filters)
													if (response.data) {
														setEligibilityPrograms(response.data)
														setEligibilityProgramsTotalPages(
															response.meta?.totalPages || 1
														)
													}
													// eslint-disable-next-line no-console
													console.log('✅ Debug fetch success:', response)
												} catch (error) {
													// eslint-disable-next-line no-console
													console.error('❌ Debug fetch failed:', error)
												} finally {
													setEligibilityProgramsLoading(false)
												}
											}}
											className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-2"
										>
											Test Fetch
										</button>
									</div>
								</div>
							)}

							{eligibilityProgramsLoading ? (
								<div className="flex justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								</div>
							) : eligibilityPrograms.length > 0 ? (
								<>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
										{eligibilityPrograms.map((program, index) => (
											<ProgramCard
												key={program.id}
												program={program}
												index={index}
												onWishlistToggle={() =>
													handleProgramWishlistToggle(program.id)
												}
												isWishlisted={isInWishlist(program.id)}
												onClick={() => handleProgramClick(program.id)}
											/>
										))}
									</div>

									{eligibilityProgramsTotalPages > 1 && (
										<div className="flex justify-center">
											<Pagination
												currentPage={eligibilityProgramsPage}
												totalPages={eligibilityProgramsTotalPages}
												onPageChange={setEligibilityProgramsPage}
											/>
										</div>
									)}
								</>
							) : (
								<div className="text-center py-8 text-gray-500">
									No eligible programmes found for this scholarship.
								</div>
							)}
						</div>
					</div>
				)

			case 'other':
				return (
					<div className="space-y-6">
						{currentScholarship?.institution && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Institution Information
								</h3>
								<div className="space-y-2">
									<p className="text-gray-700">
										<strong>Name:</strong> {currentScholarship.institution.name}
									</p>
									{currentScholarship.institution.abbreviation && (
										<p className="text-gray-700">
											<strong>Abbreviation:</strong>{' '}
											{currentScholarship.institution.abbreviation}
										</p>
									)}
									<p className="text-gray-700">
										<strong>Country:</strong>{' '}
										{currentScholarship.institution.country}
									</p>
									{currentScholarship.institution.website && (
										<p className="text-gray-700">
											<strong>Website:</strong>{' '}
											<a
												href={currentScholarship.institution.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{currentScholarship.institution.website}
											</a>
										</p>
									)}
									{/* {currentScholarship.institution.about && (
										<div className="mt-4">
											<strong>About:</strong>
											<p
												className="text-gray-700 mt-2"
												dangerouslySetInnerHTML={{
													__html: currentScholarship.institution.about,
												}}
											/>
										</div>
									)} */}
								</div>
							</div>
						)}

						{/* <div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Application Statistics
							</h3>
							<p className="text-gray-700">
								<strong>Current Applications:</strong>{' '}
								{currentScholarship?.applicationCount || 0}
							</p>
						</div> */}
					</div>
				)

			default:
				return null
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading scholarship details...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 text-lg">Error: {error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
					>
						Retry
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen  bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative  w-full"
			>
				<div className="mt-28 w-[1500px] mx-auto px-5 sm:px-7 lg:px-9 ">
					<Breadcrumb items={breadcrumbItems} />
				</div>
				{/* <Image
					src="https://vcdn1-vnexpress.vnecdn.net/2023/07/28/hoc-vien3-1690476448-4686-1690477817.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=T1naMvwNebHJRgrlo54Jbw"
					alt="Army West University"
					fill
					className="object-cover"
					priority
				/> */}

				{/* <div className="container mx-auto px-4 h-full relative"> */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-full bg-[#F5F7FB]  mt-5 px-10 py-5 flex justify-center"
				>
					<div className="w-[1500px] flex justify-center items-center gap-10 mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
						<div className=" flex flex-col justify-center items-center w-1/2">
							<h1 className="text-3xl font-bold mb-2">
								{currentScholarship?.title || 'Information Technology'}
							</h1>
							<p className="text-gray-600 mb-6">
								{currentScholarship?.university || 'Army West University (AWU)'}
							</p>

							<div className="flex items-center gap-3 mb-4">
								{currentScholarship?.institution?.website && (
									<Button
										className=""
										onClick={() =>
											window.open(
												currentScholarship.institution.website,
												'_blank'
											)
										}
									>
										Visit website
									</Button>
								)}
								{currentScholarship?.institution?.userId && (
									<Button
										onClick={() => {
											const contactUrl = `/messages?contact=${(currentScholarship.institution as any).userId}`
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
										const scholarshipId = currentScholarship?.id || params.id
										if (scholarshipId) {
											handleScholarshipWishlistToggle(scholarshipId as string)
										}
									}}
									className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Heart
										className={`w-6 h-6 transition-all duration-200 ${
											isInWishlist(currentScholarship?.id || params.id)
												? 'fill-red-500 text-red-500'
												: 'text-gray-400 hover:text-red-500'
										}`}
									/>
								</motion.button>
							</div>

							<p className="text-sm text-gray-500">
								Number of applications:{' '}
								{currentScholarship?.applicationCount || 0}
							</p>
						</div>
						<div className="  w-1/2 grid grid-cols-2 gap-4">
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Grant</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.amount || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Country</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.country || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Insitutuion Type</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.institution.type || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">
									Application deadline
								</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.applicationDeadline || 'N/A'}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
				{/* </div> */}
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* <div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
				</div> */}
				{/* <motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border "
				>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-5 gap-6">
							{infoItems.map((item, index) => (
								<div key={index} className="text-center md:text-left">
									<p className="text-sm text-gray-500 mb-1">{item.label}</p>
									<p className="font-semibold text-gray-900">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</motion.div> */}
				{/* -----------------------------------------------About Content---------------------------------------------- */}

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
						{currentScholarship?.institution?.about && (
							<p
								dangerouslySetInnerHTML={{
									__html: currentScholarship.institution.about,
								}}
							/>
						)}
					</div>
				</motion.div>
				{/* -----------------------------------------------Overview Content---------------------------------------------- */}

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8  bg-white py-6 shadow-xl border">
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

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Eligibility programmes</h2>

					<div className="flex gap-8">
						{/* Filter Sidebar */}
						<div className="w-80">
							<FilterSidebar
								activeTab="programmes"
								onFiltersChange={handleEligibilityFiltersChange}
							/>
						</div>

						{/* Programs Content */}
						<div className="flex-1">
							{/* Results Count and Status */}
							<div className="mb-4">
								<div className="text-sm text-gray-600">
									{eligibilityProgramsLoading
										? 'Loading eligibility programmes...'
										: `${eligibilityPrograms.length} results`}
									{eligibilityProgramsTotalPages > 1 &&
										!eligibilityProgramsLoading && (
											<span className="ml-2">
												(Page {eligibilityProgramsPage} of{' '}
												{eligibilityProgramsTotalPages})
											</span>
										)}
								</div>
							</div>

							{eligibilityProgramsLoading ? (
								<div className="flex items-center justify-center py-20 w-full h-full">
									<div className="flex flex-col items-center gap-3">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#116E63]"></div>
										<p className="text-gray-600 text-sm">
											Loading eligibility programmes...
										</p>
									</div>
								</div>
							) : (
								<>
									{eligibilityPrograms.length > 0 ? (
										<>
											{/* Programs Grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
												{eligibilityPrograms.map((program, index) => (
													<ProgramCard
														key={program.id}
														program={program}
														index={index}
														isWishlisted={isInWishlist(program.id)}
														onWishlistToggle={handleProgramWishlistToggle}
														onClick={handleProgramClick}
													/>
												))}
											</div>

											{/* Pagination */}
											{eligibilityProgramsTotalPages > 1 && (
												<div className="flex justify-center">
													<Pagination
														currentPage={eligibilityProgramsPage}
														totalPages={eligibilityProgramsTotalPages}
														onPageChange={setEligibilityProgramsPage}
													/>
												</div>
											)}
										</>
									) : (
										<div className="text-center py-12">
											<div className="text-gray-400 text-6xl mb-4">📚</div>
											<h3 className="text-lg font-medium text-gray-900 mb-2">
												No programmes found
											</h3>
											<p className="text-gray-500">
												Try adjusting your filters to find more programmes
											</p>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</motion.div>
				{/* -----------------------------------------------Apply Content---------------------------------------------- */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Apply here !</h2>

					{!hasApplied && (
						<>
							<div className="text-gray-600 mb-6">
								{currentScholarship?.requiredDocuments &&
								currentScholarship.requiredDocuments.length > 0 ? (
									<div className="space-y-3">
										{currentScholarship.requiredDocuments.map((doc: any) => (
											<p key={doc.id}>
												<span className="font-medium">{doc.name}:</span>{' '}
												{doc.description}
											</p>
										))}
									</div>
								) : (
									<p>
										Not have any specific document requirement. You can upload
										any
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
								{currentScholarship?.requiredDocuments &&
								currentScholarship.requiredDocuments.length > 0 ? (
									<div className="space-y-3">
										{currentScholarship.requiredDocuments.map(
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
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Recommend for you</h2>

					{mockScholarships.length > 0 ? (
						<div className="relative h-[800px] overflow-y-auto overflow-x-hidden">
							{/* Navigation Buttons */}
							{/* Programs Grid */}{' '}
							{mockScholarships.slice(0, 9).map((scholarship, index) => (
								<div key={scholarship.id} className="">
									<div className="mb-7">
										<ScholarshipCard
											scholarship={scholarship}
											index={index}
											isWishlisted={isInWishlist(scholarship.id)}
											onWishlistToggle={handleScholarshipWishlistToggle}
											onClick={handleScholarshipClick}
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-gray-600">No recommendations available</p>
						</div>
					)}
				</motion.div>
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
													{file.url ? (
														<>
															<button
																onClick={() => {
																	// Open S3 file URL in new tab
																	window.open(file.url, '_blank')
																}}
																className="text-primary hover:text-primary/80 text-sm font-medium"
															>
																View
															</button>
														</>
													) : null}
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
						const scholarshipId = currentScholarship?.id || params.id
						if (scholarshipId) {
							await checkExistingApplication(scholarshipId as string)
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
							currentScholarship?.requiredDocuments?.map((doc: any) => ({
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

export default ScholarshipDetail
