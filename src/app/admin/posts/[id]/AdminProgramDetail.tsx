'use client'
import {
	Breadcrumb,
	Button,
	ErrorModal,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
} from '@/components/ui'

import PostStatusManager, {
	PostStatus,
} from '@/components/admin/PostStatusManager'
import { ApplicationUpdateResponseModal } from '@/components/profile/applicant/sections/ApplicationUpdateResponseModal'
import { useNotification } from '@/contexts/NotificationContext'
import { mockPrograms } from '@/data/utils'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useApiWrapper } from '@/services/api/api-wrapper'
import { applicationService } from '@/services/application/application-service'
import {
	downloadSessionProtectedFile,
	openSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import CoverImage from '../../../../../public/EduMatch_Default.png'
const AdminProgramDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('overview')
	const [currentPage, setCurrentPage] = useState(1)
	const [carouselIndex, setCarouselIndex] = useState(0)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

	// Document type categories - will be loaded from API
	// const documentTypes = [
	// 	{
	// 		id: 'research-proposal',
	// 		label: 'Research Proposal',
	// 		key: 'research-proposal',
	// 	},
	// 	{ id: 'cv-resume', label: 'CV/Resume', key: 'cv-resume' },
	// 	{ id: 'portfolio', label: 'Portfolio', key: 'portfolio' },
	// ]

	// S3 File upload functionality
	const { uploadFiles, isUploading, uploadProgress } = useFileUpload({
		category: 'application-documents',
		onProgress: () => {},
	})
	const [currentProgram, setCurrentProgram] = useState<any>(null)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Program Detail' }])
	const [isLoadingProgram, setIsLoadingProgram] = useState(true)
	const [scholarships, setScholarships] = useState<any[]>([])
	const [isLoadingScholarships, setIsLoadingScholarships] = useState(false)
	const [scholarshipPagination, setScholarshipPagination] = useState<any>(null)

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

	// Admin functionality
	const [showRejectModal, setShowRejectModal] = useState(false)
	const [showRequirementsModal, setShowRequirementsModal] = useState(false)
	const [rejectReason, setRejectReason] = useState('')
	const [additionalRequirements, setAdditionalRequirements] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

	// Wishlist functionality
	const {
		isInWishlist,
		toggleWishlistItem,
		loading: wishlistLoading,
		items: wishlistItems,
	} = useWishlist({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 100, // Fetch more items to ensure we get all wishlisted items
			status: 1, // Only active wishlist items
		},
	})

	// Notification system
	const { showSuccess, showError } = useNotification()
	const apiWrapper = useApiWrapper()
	const { isAuthenticated } = useAuthCheck()
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Dynamic info items based on current program data
	const infoItems = [
		{
			label: 'Tuition fee',
			value:
				currentProgram?.program?.tuitionFeeFormatted ||
				currentProgram?.program?.tuitionFee
					? `$${currentProgram.program.tuitionFee}/year`
					: 'Contact institution',
		},
		{
			label: 'Duration',
			value: currentProgram?.program?.duration || 'N/A',
		},
		{
			label: 'Application deadline',
			value: currentProgram?.endDateFormatted || 'N/A',
		},
		{
			label: 'Start Date',
			value: currentProgram?.startDateFormatted || 'N/A',
		},
		{
			label: 'Location',
			value: currentProgram?.location || 'N/A',
		},
	]

	const programsPerPage = 3
	const totalPrograms = mockPrograms.length

	// Handle scholarship pagination change
	const handleScholarshipPageChange = (newPage: number) => {
		setCurrentPage(newPage)
		if (currentProgram?.institution?.id) {
			fetchScholarshipsByInstitution(currentProgram.institution.id, newPage)
		}
	}

	// Fetch program details from admin API
	const fetchProgramDetail = async (programId: string) => {
		try {
			setIsLoadingProgram(true)
			const response = await fetch(`/api/admin/posts/${programId}`)
			const data = await response.json()

			if (data.success && data.data) {
				// Map subdiscipline to fields for compatibility with existing UI
				const programData = {
					...data.data,
					fields: data.data.subdiscipline ? [data.data.subdiscipline] : [],
				}
				setCurrentProgram(programData)
				return programData
			} else {
				showError('Error', 'Failed to load program details')
				return null
			}
		} catch (error) {
			showError('Error', 'Failed to load program details')
			return null
		} finally {
			setIsLoadingProgram(false)
		}
	}

	// Fetch scholarships by institution
	const fetchScholarshipsByInstitution = async (
		institutionId: string,
		page: number = 1
	) => {
		try {
			setIsLoadingScholarships(true)
			const response = await fetch(
				`/api/explore/scholarships/by-institution?institutionId=${institutionId}&page=${page}&limit=3`
			)
			const data = await response.json()
			console.log(
				'Scholarships by institution dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:',
				data
			)

			if (data.success && data.data) {
				setScholarships(data.data)
				setScholarshipPagination(data.pagination)
			}
		} catch (error) {
			// Silently fail for scholarships
		} finally {
			setIsLoadingScholarships(false)
		}
	}

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = async () => {
			// Get program ID from URL params
			const programId = params?.id as string

			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams?.get('from') || 'programmes'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams?.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			// Fetch program data from API
			const programData = await fetchProgramDetail(programId)
			console.log(
				'Program data detailllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll:',
				programData
			)

			const programName = programData?.title || 'Information Technology'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'research') {
				items.push({
					label: 'Research Labs',
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: 'Programmes',
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: programName })

			setBreadcrumbItems(items)

			// Fetch scholarships if program has institution
			if (programData?.institution?.id) {
				fetchScholarshipsByInstitution(programData.institution.id)
			}
		}

		updateBreadcrumb()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.id, searchParams])

	// Check for existing application when component loads
	useEffect(() => {
		const programId = currentProgram?.id || params?.id
		if (programId && !isCheckingApplication) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				checkExistingApplication(programId as string)
			}, 200) // 200ms delay

			return () => clearTimeout(timeoutId)
		}
	}, [currentProgram?.id, params?.id]) // Removed isCheckingApplication from deps to prevent loops

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

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
		documentType: string
	) => {
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

	const removeFile = (fileId: number) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
	}

	const removeAllFiles = () => {
		setUploadedFiles([])
		setShowDeleteConfirmModal(false)
	}

	const handleRemoveAllClick = () => {
		setShowDeleteConfirmModal(true)
	}

	const nextSlide = () => {
		setCarouselIndex((prev) =>
			prev + programsPerPage >= totalPrograms ? 0 : prev + programsPerPage
		)
	}

	const prevSlide = () => {
		setCarouselIndex((prev) =>
			prev - programsPerPage < 0
				? Math.max(0, totalPrograms - programsPerPage)
				: prev - programsPerPage
		)
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
		// Get current tab context from referrer or default to programmes
		const referrer = document.referrer
		let fromTab = 'programmes'
		if (referrer.includes('tab=scholarships')) {
			fromTab = 'scholarships'
		} else if (referrer.includes('tab=research')) {
			fromTab = 'research'
		}

		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams?.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		router.push(
			`/explore/${programId}?from=${fromTab}${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams?.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		router.push(
			`/explore/scholarships/${scholarshipId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

	// Check if user has already applied to this post
	const checkExistingApplication = async (programId: string) => {
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
					(app) => app.postId === programId
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

	// Handle application submission
	const handleApply = async () => {
		// Use program ID from URL params as fallback
		const programId = currentProgram?.id || params?.id
		if (!programId) {
			return
		}

		// Check if already applied
		if (hasApplied) {
			showError(
				'Already Applied',
				'You have already applied to this program. You cannot submit multiple applications.',
				{
					showRetry: false,
				}
			)
			return
		}

		try {
			setIsApplying(true)

			const response = await applicationService.submitApplication({
				postId: programId,
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
					'You have already applied to this program. You cannot submit multiple applications.',
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

	// Handle wishlist toggle
	const handleWishlistToggle = async () => {
		const programId = currentProgram?.id || params?.id
		if (!programId) return

		// Check if user is authenticated before attempting to toggle
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		try {
			// Get current state before toggle
			const wasWishlisted = isInWishlist(programId)

			// Toggle the wishlist item
			await toggleWishlistItem(programId)

			// Show success message based on the previous state (opposite of what it was)
			showSuccess(
				wasWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
				wasWishlisted
					? 'This program has been removed from your wishlist.'
					: 'This program has been added to your wishlist.'
			)
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
				console.error('Failed to toggle wishlist item:', error)
				showError(
					'Wishlist Error',
					'Failed to update wishlist. Please try again.',
					{
						onRetry: handleWishlistToggle,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			}
		}
	}

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

	// Admin handler functions
	const handleReject = async () => {
		if (!rejectReason.trim()) {
			showError('Validation Error', 'Please provide a reason for rejection')
			return
		}

		setIsProcessing(true)
		try {
			const response = await axios.patch(`/api/admin/posts/${params?.id}`, {
				status: 'CLOSED',
				rejectReason: rejectReason,
			})

			if (response.data.success) {
				showSuccess('Post Rejected', 'The post has been successfully rejected.')
				setShowRejectModal(false)
				setRejectReason('')
				router.push('/admin/posts')
			} else {
				throw new Error('Failed to reject post')
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error rejecting post:', error)
			showError(
				'Rejection Failed',
				error instanceof Error
					? error.message
					: 'Failed to reject the post. Please try again.'
			)
		} finally {
			setIsProcessing(false)
		}
	}

	const handleRequireUpdate = async () => {
		if (!additionalRequirements.trim()) {
			showError('Validation Error', 'Please provide additional requirements')
			return
		}

		setIsProcessing(true)
		try {
			const response = await axios.patch(`/api/admin/posts/${params?.id}`, {
				status: 'REJECTED',
				additionalRequirements: additionalRequirements,
			})

			if (response.data.success) {
				showSuccess(
					'Requirements Requested',
					'Additional requirements have been requested from the institution.'
				)
				setShowRequirementsModal(false)
				setAdditionalRequirements('')
				router.push('/admin/posts')
			} else {
				throw new Error('Failed to request additional requirements')
			}
		} catch (error) {
			showError(
				'Request Failed',
				error instanceof Error
					? error.message
					: 'Failed to request additional requirements. Please try again.'
			)
		} finally {
			setIsProcessing(false)
		}
	}

	// Publishing is now handled by PostStatusManager

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

	const menuItems = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'structure', label: 'Programme structure' },
		{ id: 'admission', label: 'Admission requirements' },
		{ id: 'fee', label: 'Fee and funding' },
		{ id: 'scholarship', label: 'Scholarship' },
		{ id: 'other', label: 'Other information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'overview':
				return (
					<div className="space-y-4">
						<div className="space-y-4">
							{/* Description Section */}
							{currentProgram?.description && (
								<div className="text-base border-b border-gray-200 pb-4 mb-4">
									<span className="font-bold text-gray-900">Description:</span>
									<div
										className="text-gray-700 mt-2 prose prose-content max-w-none"
										dangerouslySetInnerHTML={{
											__html: currentProgram.description,
										}}
									/>
								</div>
							)}

							<div className="text-base">
								<span className="font-bold text-gray-900">1. Duration:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.duration || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">2. Start dates:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.startDateFormatted || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadlines:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.endDateFormatted
										? `before ${currentProgram.endDateFormatted}`
										: 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									4. Subdiscipline:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.subdiscipline &&
									currentProgram.subdiscipline.length > 0
										? currentProgram.subdiscipline
												.map((s: any) => s.name || s.subdisciplineName)
												.join(', ')
										: 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">5. Attendance:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.attendance || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">6. Location:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.location || 'N/A'}
								</span>
							</div>
							<div className="text-base">
								<span className="font-bold text-gray-900">
									7. Degree level:
								</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.program?.degreeLevel || 'N/A'}
								</span>
							</div>
							{/* <div className="text-base">
								<span className="font-bold text-gray-900">8. Match:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.match || 'N/A'}
								</span>
							</div> */}
							<div className="text-base">
								<span className="font-bold text-gray-900">8. Days left:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.daysLeft !== undefined
										? `${currentProgram.daysLeft} days`
										: 'N/A'}
								</span>
							</div>
						</div>
					</div>
				)

			case 'structure':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Subdiscipline:</span>{' '}
								<span className="text-gray-700">
									{currentProgram?.subdiscipline &&
									currentProgram.subdiscipline.length > 0
										? currentProgram.subdiscipline
												.map((s: any) => s.name || s.subdisciplineName)
												.join(', ')
										: 'N/A'}
								</span>
							</p>
						</div>

						{currentProgram?.program?.courseInclude && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Courses include:</p>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.courseInclude,
									}}
								/>
							</div>
						)}

						{currentProgram?.subdiscipline &&
							currentProgram.subdiscipline.length > 0 && (
								<div>
									<p className="text-base">
										<span className="font-bold text-gray-900">
											Discipline area:
										</span>{' '}
										<span className="text-gray-700">
											{currentProgram.subdiscipline
												.map(
													(s: any) =>
														s.disciplineName || s.discipline?.name || 'N/A'
												)
												.filter(
													(value: string, index: number, self: string[]) =>
														self.indexOf(value) === index
												)
												.join(', ')}
										</span>
									</p>
								</div>
							)}
					</div>
				)

			case 'admission':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-3">
								Academic requirements:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								{currentProgram?.program?.gpa && (
									<li>GPA: {currentProgram.program.gpa}</li>
								)}
								{currentProgram?.program?.gre && (
									<li>GRE: {currentProgram.program.gre}</li>
								)}
								{currentProgram?.program?.gmat && (
									<li>GMAT: {currentProgram.program.gmat}</li>
								)}
								{!currentProgram?.program?.gpa &&
									!currentProgram?.program?.gre &&
									!currentProgram?.program?.gmat && (
										<li>Please contact institution for requirements</li>
									)}
							</ul>
						</div>

						{currentProgram?.program?.certificates &&
							currentProgram.program.certificates.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Language requirements:
									</p>
									<ul className="list-disc pl-5 space-y-1 text-gray-700">
										{currentProgram.program.certificates.map((cert: any) => (
											<li key={cert.id}>
												{cert.name}: {cert.score}
											</li>
										))}
									</ul>
								</div>
							)}

						{currentProgram?.documents &&
							currentProgram.documents.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Required documents:
									</p>
									<ul className="list-disc pl-5 space-y-1 text-gray-700">
										{currentProgram.documents.map((doc: any) => (
											<li key={doc.document_type_id}>
												{doc.name}
												{doc.description && `: ${doc.description}`}
											</li>
										))}
									</ul>
								</div>
							)}

						{/* <div>
							<p className="font-bold text-gray-900 mb-3">Student insurance:</p>
							<p className="text-gray-700 mb-3">
								Make sure to cover your health, travel, and stay while studying
								abroad. Even global coverages can miss important items, so make
								sure your student insurance ticks all the following:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								<li>Additional medical costs (i.e. dental)</li>
								<li>
									Repatriation, if something happens to you or your family
								</li>
								<li>Liability</li>
								<li>Home contents and baggage</li>
								<li>Accidents</li>
								<li>Legal aid</li>
							</ul>
						</div> */}
					</div>
				)

			case 'fee':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-2">Tuition Fee:</p>
							<ul className="list-disc pl-5 text-gray-700">
								<li>
									{currentProgram?.program?.tuitionFeeFormatted ||
										(currentProgram?.program?.tuitionFee
											? `$${currentProgram.program.tuitionFeeFormatted}/year`
											: 'Contact institution for tuition fee information')}
								</li>
							</ul>
						</div>

						{currentProgram?.program?.feeDescription && (
							<div>
								<p className="font-bold text-gray-900 mb-2">Fee description:</p>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.feeDescription,
									}}
								/>
							</div>
						)}
					</div>
				)

			case 'scholarship':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Scholarships Information:
							</h3>
							{currentProgram?.program?.scholarshipInfo ? (
								<div
									className="text-gray-700 mb-6 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.program.scholarshipInfo,
									}}
								/>
							) : (
								<p className="text-gray-700 mb-6">
									Explore available scholarships offered by this institution
									that may help fund your studies.
								</p>
							)}
						</div>

						<div>
							<h4 className="text-lg font-bold text-gray-900 mb-4">
								Available Scholarships:
							</h4>
							{scholarships.length > 0 ? (
								<>
									<p className="text-sm text-gray-600 mb-4">
										You are eligible to apply for these scholarships but a
										selection process will still be applied by the provider.
									</p>

									<div className="space-y-4">
										{scholarships.map((scholarship, index) => (
											<ScholarshipCard
												key={scholarship.id}
												scholarship={scholarship}
												index={index}
												isWishlisted={isInWishlist(scholarship.id)}
												onWishlistToggle={() =>
													toggleWishlistItem(scholarship.id)
												}
												onClick={handleScholarshipClick}
											/>
										))}
									</div>

									{scholarshipPagination &&
										scholarshipPagination.totalPages > 1 && (
											<div className="mt-6">
												<Pagination
													currentPage={currentPage}
													totalPages={scholarshipPagination.totalPages}
													onPageChange={handleScholarshipPageChange}
												/>
											</div>
										)}
								</>
							) : isLoadingScholarships ? (
								<p className="text-gray-500 text-center py-8">
									Loading scholarships...
								</p>
							) : (
								<p className="text-gray-500 text-center py-8">
									No scholarships available from this institution at the moment.
								</p>
							)}
						</div>
					</div>
				)

			case 'other':
				return (
					<div className="space-y-6">
						{currentProgram?.otherInfo && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Other Information:
								</h3>
								<div
									className="text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: currentProgram.otherInfo,
									}}
								/>
							</div>
						)}

						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Contact Information:
							</h3>
							{currentProgram?.institution && (
								<div className="space-y-3 text-gray-700">
									{currentProgram.institution.email && (
										<p>
											<span className="font-semibold">Email:</span>{' '}
											<a
												href={`mailto:${currentProgram.institution.email}`}
												className="text-[#126E64] hover:underline"
											>
												{currentProgram.institution.email}
											</a>
										</p>
									)}
									{currentProgram.institution.hotline && (
										<p>
											<span className="font-semibold">Hotline:</span>{' '}
											{currentProgram.institution.hotlineCode && (
												<span>{currentProgram.institution.hotlineCode} </span>
											)}
											{currentProgram.institution.hotline}
										</p>
									)}
									{currentProgram.institution.website && (
										<p>
											<span className="font-semibold">Website:</span>{' '}
											<a
												href={currentProgram.institution.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[#126E64] hover:underline"
											>
												{currentProgram.institution.website}
											</a>
										</p>
									)}
									{currentProgram.institution.address && (
										<p>
											<span className="font-semibold">Address:</span>{' '}
											{currentProgram.institution.address}
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className="min-h-screen  bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative h-[500px] w-full"
			>
				<Image
					src={currentProgram?.institution?.coverImage || CoverImage}
					alt={currentProgram?.institution?.name || 'University'}
					fill
					unoptimized
					className="object-cover"
					priority
					onError={(e) => {
						const target = e.currentTarget as HTMLImageElement
						target.src = CoverImage.src
					}}
				/>

				<div className="container mx-auto px-4 h-full relative">
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="absolute bottom-0 right-2 sm:right-4 translate-y-1/3 bg-white rounded-2xl shadow-xl p-4 sm:p-8 max-w-xs sm:max-w-lg flex flex-col justify-center items-center"
					>
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
							{currentProgram?.title || 'Loading...'}
						</h1>
						<p className="text-gray-600 mb-6">
							{currentProgram?.institution?.name || 'Loading...'}
						</p>

						<div className="flex items-center gap-3 mb-4">
							{currentProgram?.institution?.website && (
								<Button
									onClick={() =>
										window.open(currentProgram.institution.website, '_blank')
									}
									className=""
								>
									Visit website
								</Button>
							)}
							{currentProgram?.institution?.userId && (
								<Button
									onClick={() => {
										const contactUrl = `/messages?contact=${currentProgram.institution.userId}`
										router.push(contactUrl)
									}}
									variant="outline"
									className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
								>
									Contact Institution
								</Button>
							)}
							{/* <Button
								className={
									hasApplied
										? 'bg-green-600 hover:bg-green-700'
										: 'bg-[#116E63] hover:bg-teal-700'
								}
								onClick={handleApply}
								disabled={hasApplied || isApplying}
							>
								{hasApplied ? (
									'✓ Applied'
								) : isApplying ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										Applying...
									</div>
								) : (
									'Apply'
								)}
							</Button> */}
							<motion.button
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									handleWishlistToggle()
								}}
								className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								<Heart
									className={`w-6 h-6 transition-all duration-200 ${
										isInWishlist(currentProgram?.id || params?.id)
											? 'fill-red-500 text-red-500'
											: 'text-gray-400 hover:text-red-500'
									}`}
								/>
							</motion.button>
						</div>

						<p className="text-sm text-gray-500">
							Number of applications:{' '}
							{currentProgram?.statistics?.applications?.total || 0}
						</p>
					</motion.div>
				</div>
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col gap-6 sm:gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* <div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
				</div> */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-4 sm:py-6 shadow-xl border rounded-lg"
				>
					<div className="px-4 sm:px-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
							{infoItems.map((item, index) => (
								<div key={index} className="text-center sm:text-left">
									<p className="text-xs sm:text-sm text-gray-500 mb-1">
										{item.label}
									</p>
									<p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</div>
				</motion.div>
				{/* -----------------------------------------------About Content---------------------------------------------- */}

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-4 sm:p-8 bg-white py-4 sm:py-6 shadow-xl border rounded-lg"
				>
					<h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4 text-sm sm:text-base">
						{currentProgram?.institution.about ? (
							<div
								className="prose prose-content max-w-none"
								dangerouslySetInnerHTML={{
									__html: currentProgram.institution.about,
								}}
							/>
						) : (
							<p>No description available.</p>
						)}
					</div>
				</motion.div>
				{/* -----------------------------------------------Overview Content---------------------------------------------- */}

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 p-4 sm:p-8 bg-white py-4 sm:py-6 shadow-xl border rounded-lg">
					{/* Left Sidebar Menu */}
					<motion.aside
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="lg:col-span-1"
					>
						<div className="space-y-2 lg:border-r h-full lg:border-gray-200 lg:pr-4">
							{menuItems.map((item) => (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full text-left px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all text-sm sm:text-base ${
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
						className="lg:col-span-3 min-w-0"
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
			</motion.div>

			{/* Post Status Management Section */}
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.4, duration: 0.5 }}
				className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
			>
				<PostStatusManager
					postId={params?.id as string}
					currentStatus={(currentProgram?.status || 'DRAFT') as PostStatus}
					postType="Program"
					onStatusChange={(newStatus) => {
						setCurrentProgram((prev: any) =>
							prev ? { ...prev, status: newStatus } : null
						)
					}}
				/>
			</motion.div>

			{/* Manage Files Side Panel */}
			{showManageModal && (
				<div
					className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ease-out ${
						isClosing ? 'translate-x-full' : 'translate-x-0'
					}`}
					style={{
						animation:
							showManageModal && !isClosing
								? 'slideInFromRight 0.3s ease-out'
								: 'none',
					}}
				>
					<div className="p-4 sm:p-6 border-b">
						<div className="flex items-center justify-between">
							<h2 className="text-lg sm:text-xl font-semibold">
								Manage Documents
							</h2>
							<Button
								variant="outline"
								onClick={handleCloseModal}
								className="rounded-full"
							>
								✕
							</Button>
						</div>
					</div>

					<div className="p-4 sm:p-6 overflow-y-auto h-[calc(100vh-80px)]">
						<div className="space-y-8">
							{/* Uploaded Files Section - Grouped by Document Type */}
							{uploadedFiles.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										Uploaded Files ({uploadedFiles.length})
									</h3>
									<div className="space-y-3">
										<h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1">
											Other Documents ({uploadedFiles.length})
										</h4>
										<div className="grid grid-cols-1 gap-3">
											{uploadedFiles.map((file) => (
												<div
													key={file.id}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
												>
													<div className="text-2xl">📄</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{file.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{(file.size / 1024).toFixed(1)} KB
														</p>
													</div>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																// Open S3 file URL in new tab
																window.open(file.url, '_blank')
															}}
														>
															View
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => removeFile(file.id)}
															className="text-red-500 hover:text-red-700"
														>
															Delete
														</Button>
													</div>
												</div>
											))}
										</div>
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
						const programId = currentProgram?.id || params?.id
						if (programId) {
							await checkExistingApplication(programId as string)
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

			{/* Admin Reject Modal */}
			<Modal
				isOpen={showRejectModal}
				onClose={() => {
					setShowRejectModal(false)
					setRejectReason('')
				}}
				title="Reject Post"
				maxWidth="md"
			>
				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Reason for Rejection
						</label>
						<textarea
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Please provide a detailed reason for rejecting this post..."
							rows={6}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
						/>
					</div>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => {
								setShowRejectModal(false)
								setRejectReason('')
							}}
							disabled={isProcessing}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Cancel
						</Button>
						<Button
							onClick={handleReject}
							disabled={isProcessing || !rejectReason.trim()}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							{isProcessing ? 'Rejecting...' : 'Confirm Reject'}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Admin Additional Requirements Modal */}
			<Modal
				isOpen={showRequirementsModal}
				onClose={() => {
					setShowRequirementsModal(false)
					setAdditionalRequirements('')
				}}
				title="Request Additional Requirements"
				maxWidth="md"
			>
				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Additional Requirements Needed
						</label>
						<textarea
							value={additionalRequirements}
							onChange={(e) => setAdditionalRequirements(e.target.value)}
							placeholder="Please specify what additional information or requirements are needed..."
							rows={6}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
						/>
					</div>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => {
								setShowRequirementsModal(false)
								setAdditionalRequirements('')
							}}
							disabled={isProcessing}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Cancel
						</Button>
						<Button
							onClick={handleRequireUpdate}
							disabled={isProcessing || !additionalRequirements.trim()}
							className="bg-blue-500 hover:bg-blue-600 text-white"
						>
							{isProcessing ? 'Sending...' : 'Send Request'}
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
		</div>
	)
}

export default AdminProgramDetail
