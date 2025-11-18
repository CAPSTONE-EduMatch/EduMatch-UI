'use client'
import {
	Breadcrumb,
	Button,
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

import { ExploreApiService } from '@/services/explore/explore-api'
import { Program } from '@/types/api/explore-api'
import { AnimatePresence, motion } from 'framer-motion'
import {
	ChevronLeft,
	ChevronRight,
	Heart,
	Trash2,
	Check,
	File,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { applicationService } from '@/services/application/application-service'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useNotification } from '@/contexts/NotificationContext'
import { useApiWrapper } from '@/services/api/api-wrapper'
import { ApplicationUpdateResponseModal } from '@/components/profile/applicant/sections/ApplicationUpdateResponseModal'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import CoverImage from '../../../../../../public/EduMatch_Default.png'
const ProgramDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('overview')
	const [currentPage, setCurrentPage] = useState(1)
	const [carouselIndex, setCarouselIndex] = useState(0)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [selectedDocuments, setSelectedDocuments] = useState<
		SelectedDocument[]
	>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [showDocumentSelector, setShowDocumentSelector] = useState(false)
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

	// Recommended programs state
	const [recommendedPrograms, setRecommendedPrograms] = useState<Program[]>([])
	const [isLoadingRecommendations, setIsLoadingRecommendations] =
		useState(false)

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

	// Utility function to get institution status
	const getInstitutionStatus = (institution?: {
		status: boolean
		deletedAt?: string | null
	}) => {
		if (!institution) return null

		if (!institution.status) {
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
			<div
				className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}
			>
				<X className="w-4 h-4" />
				{status.label}
			</div>
		)
	}

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
	const totalPrograms = recommendedPrograms.length

	// Fetch recommended programs based on current program's characteristics
	const fetchRecommendedPrograms = async (program: any) => {
		if (!program) return

		try {
			setIsLoadingRecommendations(true)

			// Extract program characteristics for matching
			const discipline =
				program.discipline ||
				(program.subdiscipline && program.subdiscipline.length > 0
					? program.subdiscipline[0]
					: null)
			const degreeLevel = program.degreeLevel || program.program?.degreeLevel
			const country = program.country || program.institution?.country

			// **MATCH ALL Logic**: Only proceed if we have ALL 3 criteria
			if (discipline && degreeLevel && country) {
				const filters = {
					limit: 9, // Fetch 9 most relevant programs
					page: 1,
					// Must match ALL criteria
					discipline: [discipline],
					degreeLevel: [degreeLevel],
					country: [country],
					sortBy: 'most-popular' as const,
				}

				const response = await ExploreApiService.getPrograms(filters)

				if (response.data && response.data.length > 0) {
					// Filter out the current program from recommendations
					const filtered = response.data.filter(
						(p: Program) => p.id !== program.id
					)
					setRecommendedPrograms(filtered)
				} else {
					// No exact matches found, show empty recommendations
					setRecommendedPrograms([])
				}
			} else {
				// If we don't have all 3 criteria, show fallback popular programs
				const fallbackResponse = await ExploreApiService.getPrograms({
					limit: 8,
					page: 1,
					sortBy: 'most-popular' as const,
				})

				if (fallbackResponse.data) {
					const filtered = fallbackResponse.data.filter(
						(p: Program) => p.id !== program.id
					)
					setRecommendedPrograms(filtered)
				}
			}
		} catch (error) {
			// Silently fail for recommendations, fallback to empty array
			setRecommendedPrograms([])
		} finally {
			setIsLoadingRecommendations(false)
		}
	}

	// Handle scholarship pagination change
	const handleScholarshipPageChange = (newPage: number) => {
		setCurrentPage(newPage)
		if (currentProgram?.institution?.id) {
			fetchScholarshipsByInstitution(currentProgram.institution.id, newPage)
		}
	}

	// Fetch program details from API
	const fetchProgramDetail = async (programId: string) => {
		try {
			setIsLoadingProgram(true)
			const response = await fetch(
				`/api/explore/programs/program-detail?id=${programId}`
			)
			const data = await response.json()

			if (data.success && data.data) {
				// Map subdiscipline to fields for compatibility with existing UI
				const programData = {
					...data.data,
					fields: data.data.subdiscipline || [],
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
			const programId = params.id as string

			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams.get('from') || 'programmes'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams.toString())
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
	}, [params.id, searchParams])

	// Check for existing application when component loads
	useEffect(() => {
		const programId = currentProgram?.id || params.id
		if (programId && !isCheckingApplication) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				checkExistingApplication(programId as string)
			}, 200) // 200ms delay

			return () => clearTimeout(timeoutId)
		}
	}, [currentProgram?.id, params.id]) // Removed isCheckingApplication from deps to prevent loops

	// Fetch all update requests when application is loaded
	useEffect(() => {
		if (applicationId) {
			fetchUpdateRequests()
		} else {
			setUpdateRequests([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationId])

	// Fetch recommended programs when currentProgram is loaded
	useEffect(() => {
		if (currentProgram) {
			fetchRecommendedPrograms(currentProgram)
		}
	}, [currentProgram])

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
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		router.push(
			`/explore/${programId}?from=${fromTab}${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
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
		// Check authentication first
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		// Use program ID from URL params as fallback
		const programId = currentProgram?.id || params.id
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
		const programId = currentProgram?.id || params.id
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
					className="object-cover"
					priority
				/>

				<div className="container mx-auto px-4 h-full relative">
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="absolute bottom-0 right-4 translate-y-1/3 bg-white rounded-2xl shadow-xl p-8 max-w-lg flex flex-col justify-center items-center"
					>
						<h1 className="text-3xl font-bold mb-2">
							{currentProgram?.title || 'Loading...'}
						</h1>
						<p className="text-gray-600 mb-3">
							{currentProgram?.institution?.name || 'Loading...'}
						</p>

						{/* Institution Status Badge */}
						{currentProgram?.institution && (
							<div className="mb-4">
								<InstitutionStatusBadge
									institution={currentProgram.institution}
								/>
							</div>
						)}

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
										isInWishlist(currentProgram?.id || params.id)
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
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
				</div>
				<motion.div
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
				</motion.div>
				{/* -----------------------------------------------About Content---------------------------------------------- */}

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
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
					</div>

					{!hasApplied && (
						<>
							<div className="text-gray-600 mb-6">
								{currentProgram?.documents &&
								currentProgram.documents.length > 0 ? (
									<div className="space-y-3">
										{currentProgram.documents.map((doc: any, index: number) => (
											<p key={doc.document_id || doc.document_type_id || index}>
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
											<div className="border-2 border-dashed  rounded-xl p-8 text-center ">
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
								{currentProgram?.documents &&
								currentProgram.documents.length > 0 ? (
									<div className="space-y-3">
										{currentProgram.documents.map((doc: any, index: number) => (
											<p key={doc.document_id || doc.document_type_id || index}>
												<span className="font-medium">{doc.name}:</span>{' '}
												{doc.description}
											</p>
										))}
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

					{!hasApplied && uploadedFiles.length === 0 && (
						<div className="text-center mb-6">
							<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
								<div className="flex items-center justify-center gap-2 text-amber-700">
									<span className="text-lg">⚠️</span>
									<p className="font-medium">
										Please select at least one document to submit your
										application
									</p>
								</div>
								<p className="text-sm text-amber-600 mt-2">
									Use the &quot;Select Documents&quot; button above to choose
									files from your profile or upload new ones
								</p>
							</div>
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

					{/* Carousel */}
					<div className="relative">
						{/* Show loading state */}
						{isLoadingRecommendations ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
							</div>
						) : recommendedPrograms.length === 0 ? (
							<div className="flex justify-center items-center py-12">
								<p className="text-gray-500">
									No recommendations available at this time.
								</p>
							</div>
						) : (
							<>
								{/* Navigation Buttons */}
								<button
									onClick={prevSlide}
									className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
									disabled={carouselIndex === 0}
								>
									<ChevronLeft className="w-6 h-6 text-gray-600" />
								</button>

								<button
									onClick={nextSlide}
									className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
									disabled={carouselIndex + programsPerPage >= totalPrograms}
								>
									<ChevronRight className="w-6 h-6 text-gray-600" />
								</button>

								{/* Programs Grid */}
								<div className="overflow-hidden px-12 py-5">
									<div
										className="flex transition-transform duration-300 ease-in-out"
										style={{
											transform: `translateX(-${(carouselIndex / programsPerPage) * 100}%)`,
										}}
									>
										{recommendedPrograms.map((program, index) => (
											<div
												key={program.id}
												className="w-1/3 flex-shrink-0 px-3"
											>
												<div className="h-[700px]">
													<ProgramCard
														program={program}
														index={index}
														isWishlisted={isInWishlist(program.id)}
														onWishlistToggle={() =>
															toggleWishlistItem(program.id)
														}
														onClick={handleProgramClick}
													/>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Dots Indicator */}
								<div className="flex justify-center mt-6 gap-2">
									{Array.from({
										length: Math.ceil(totalPrograms / programsPerPage),
									}).map((_, index) => (
										<button
											key={index}
											onClick={() => setCarouselIndex(index * programsPerPage)}
											className={`w-3 h-3 rounded-full transition-colors ${
												Math.floor(carouselIndex / programsPerPage) === index
													? 'bg-[#126E64]'
													: 'bg-gray-300'
											}`}
										/>
									))}
								</div>
							</>
						)}
					</div>
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
																// Open S3 file URL in new tab
																window.open(file.url, '_blank')
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
						const programId = currentProgram?.id || params.id
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
							currentProgram?.documents?.map((doc: any) => ({
								id: doc.document_type_id || doc.document_id,
								name: doc.name,
								description: doc.description,
							})) || []
						}
					/>
				</div>

				{/* Sticky Footer with Actions */}
				<div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-6 -mb-6 mt-6">
					<div className="flex items-center justify-between">
						{/* Left Side - Summary */}
						<div className="flex items-center gap-4">
							{selectedDocuments.length > 0 ? (
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
										<Check className="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p className="font-semibold text-gray-900">
											{selectedDocuments.length} document
											{selectedDocuments.length !== 1 ? 's' : ''} selected from
											profile
										</p>
										<p className="text-sm text-gray-500">Ready to submit</p>
									</div>
								</div>
							) : (
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
										<File className="w-5 h-5 text-gray-400" />
									</div>
									<div>
										<p className="font-medium text-gray-900">
											No documents selected
										</p>
										<p className="text-sm text-gray-500">
											Choose files to continue
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Right Side - Action Buttons */}
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setShowDocumentSelector(false)
									setSelectedDocuments([])
									setUploadedFiles([])
								}}
								className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									setShowDocumentSelector(false)
									if (selectedDocuments.length > 0) {
										showSuccess(
											'Documents Selected!',
											`${selectedDocuments.length} document${
												selectedDocuments.length !== 1 ? 's' : ''
											} ready for application submission`
										)
									}
								}}
								disabled={selectedDocuments.length === 0}
								className={`px-6 py-3 transition-all duration-200 ${
									selectedDocuments.length === 0
										? 'bg-gray-300 text-gray-500 cursor-not-allowed'
										: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
								}`}
							>
								{selectedDocuments.length === 0 ? (
									'Select Documents First'
								) : (
									<div className="flex items-center gap-2">
										<Check className="w-4 h-4" />
										<span>
											Continue with {selectedDocuments.length} Document
											{selectedDocuments.length !== 1 ? 's' : ''}
										</span>
									</div>
								)}
							</Button>
						</div>
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

export default ProgramDetail
