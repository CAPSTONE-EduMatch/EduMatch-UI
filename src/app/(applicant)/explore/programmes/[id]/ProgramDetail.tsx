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
import {
	DocumentSelector,
	SelectedDocument,
} from '@/components/ui/DocumentSelector'

import { ApplicationUpdateResponseModal } from '@/components/profile/applicant/sections/ApplicationUpdateResponseModal'
import { useNotification } from '@/contexts/NotificationContext'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useApiWrapper } from '@/services/api/api-wrapper'
import { applicationService } from '@/services/application/application-service'
import { ApplicationLimitError } from '@/types/api/application-errors'
import { Program } from '@/types/api/explore-api'
import {
	downloadSessionProtectedFile,
	openSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { formatUTCDateToLocal } from '@/utils/date'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, File, Heart, X } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import FileUploadManagerWithOCR from '@/components/ui/layout/file-upload-manager-with-ocr'
import CoverImage from '../../../../../../public/EduMatch_Default.png'
const ProgramDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	// Check if we're viewing an application (from URL query param)
	const applicationIdFromUrl = searchParams?.get('applicationId')
	const fromParam = searchParams?.get('from')
	// Don't auto-load application tab if coming from application section
	const shouldAutoLoadApplicationTab =
		applicationIdFromUrl && fromParam !== 'application'
	const [activeTab, setActiveTab] = useState(
		shouldAutoLoadApplicationTab ? 'application' : 'overview'
	)
	const [currentPage, setCurrentPage] = useState(1)
	const [carouselIndex, setCarouselIndex] = useState(0)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [selectedDocuments, setSelectedDocuments] = useState<
		SelectedDocument[]
	>([])
	const [showDocumentSelector, setShowDocumentSelector] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [showCancelEditModal, setShowCancelEditModal] = useState(false)
	const [originalUploadedFiles, setOriginalUploadedFiles] = useState<any[]>([])

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
	const [error, setError] = useState<string | null>(null)
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
	const [applicationId, setApplicationId] = useState<string | null>(
		applicationIdFromUrl ? applicationIdFromUrl : null
	)
	// Store pending application info (not yet loaded)
	const [pendingApplication, setPendingApplication] = useState<{
		applicationId: string
		status: string
	} | null>(null)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [selectedUpdateRequestId, setSelectedUpdateRequestId] = useState<
		string | null
	>(null)
	const [updateRequests, setUpdateRequests] = useState<any[]>([])
	const [loadingUpdateRequests, setLoadingUpdateRequests] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)

	// Ref to track if we're handling an application click (to prevent useEffect from fetching)
	const isHandlingClickRef = useRef(false)

	// Applications list for the post
	const [applications, setApplications] = useState<any[]>([])
	const [loadingApplications, setLoadingApplications] = useState(false)
	const [lastFetchedPostId, setLastFetchedPostId] = useState<string | null>(
		null
	)
	const [isAutoLoadingApplication, setIsAutoLoadingApplication] =
		useState(false)
	const [selectedApplication, setSelectedApplication] = useState<any>(null)
	const [loadingSelectedApplication, setLoadingSelectedApplication] =
		useState(false)

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

	// Fetch recommended programs using the new recommend API
	const fetchRecommendedPrograms = async (program: any) => {
		if (!program?.id) return

		try {
			setIsLoadingRecommendations(true)

			// Use the new recommend API endpoint
			const response = await fetch(
				`/api/explore/programs/program-detail/recommend?programId=${program.id}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			)

			if (response.ok) {
				const data = await response.json()
				if (data.success && data.data) {
					setRecommendedPrograms(data.data)
				} else {
					setRecommendedPrograms([])
				}
			} else {
				setRecommendedPrograms([])
			}
		} catch (error) {
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
			setError(null)
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
				const errorMessage = data.message || 'Failed to load program details'
				setError(errorMessage)
				showError('Error', errorMessage)
				return null
			}
		} catch (error) {
			const errorMessage = 'Failed to load program details'
			setError(errorMessage)
			showError('Error', errorMessage)
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

			// Skip if we already have this program loaded (only check program ID, not search params)
			if (currentProgram?.id === programId) {
				// Only update breadcrumb if needed, don't re-fetch program
				const fromTab = searchParams?.get('from') || 'programmes'
				const currentParams = new URLSearchParams(searchParams?.toString())
				currentParams.delete('from')
				currentParams.delete('applicationId') // Don't include applicationId in breadcrumb
				const paramsString = currentParams.toString()
				const queryString = paramsString ? `?${paramsString}` : ''

				const programName = currentProgram?.title || 'Information Technology'
				let items: Array<{ label: string; href?: string }> = [
					{ label: 'Explore', href: `/explore${queryString}` },
				]

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

				items.push({ label: programName })
				setBreadcrumbItems(items)
				return
			}

			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams?.get('from') || 'programmes'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams?.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			// Fetch program data from API
			const programData = await fetchProgramDetail(programId)

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
	}, [params?.id]) // Only depend on program ID, not searchParams to avoid re-fetching when applicationId is added

	// Check for existing application when component loads
	useEffect(() => {
		const programId = currentProgram?.id || params?.id
		// Skip if applicationIdFromUrl exists - fetchSelectedApplication will handle loading
		if (programId && !isCheckingApplication && !applicationIdFromUrl) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				checkExistingApplication(programId as string)
			}, 200) // 200ms delay

			return () => clearTimeout(timeoutId)
		}
	}, [currentProgram?.id, params?.id, applicationIdFromUrl]) // Added applicationIdFromUrl to prevent duplicate loads

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

	// Handle applicationId from URL - update Application Status section
	useEffect(() => {
		if (applicationIdFromUrl) {
			// Skip if we're handling a click (will be handled by handleApplicationClick)
			if (isHandlingClickRef.current) {
				isHandlingClickRef.current = false
				return
			}
			// Fetch if we don't have this application loaded OR if we have the ID but not the data
			// This handles both navigation and page reload scenarios
			const needsFetch =
				applicationId !== applicationIdFromUrl ||
				(applicationId === applicationIdFromUrl && !hasApplied)

			if (needsFetch) {
				// If coming from application section, switch to application tab and fetch applications list
				if (fromParam === 'application' && currentProgram?.id) {
					setActiveTab('application')
					// Fetch applications list for the "My Applications" tab
					if (lastFetchedPostId !== currentProgram.id) {
						fetchApplicationsForPost(currentProgram.id)
					}
					// Add extra delay when coming from application section to handle timeout issues
					// Wait longer to ensure page is fully loaded and tab is switched
					setTimeout(() => {
						fetchSelectedApplication(applicationIdFromUrl).then(() => {
							// Additional scroll attempt after fetch completes
							setTimeout(() => {
								const statusSection = document.getElementById(
									'application-status-section'
								)
								if (statusSection) {
									requestAnimationFrame(() => {
										statusSection.scrollIntoView({
											behavior: 'smooth',
											block: 'start',
										})
									})
								}
							}, 500)
						})
					}, 500)
				} else {
					// Fetch the application details when applicationId is in URL
					// If currentProgram is not loaded yet, wait a bit for it to load
					// This handles page reload scenarios where program data might not be ready
					const delay = currentProgram?.id ? 0 : 300
					setTimeout(() => {
						fetchSelectedApplication(applicationIdFromUrl)
					}, delay)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationIdFromUrl, fromParam, currentProgram?.id, hasApplied])

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

	// Fetch applications for a specific post
	const fetchApplicationsForPost = useCallback(
		async (postId: string) => {
			// Only show loading if we don't have applications for this post yet
			if (lastFetchedPostId !== postId) {
				setLoadingApplications(true)
			}
			try {
				const response = await fetch(`/api/applications/post/${postId}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})

				if (response.ok) {
					const result = await response.json()
					if (result.success && result.applications) {
						setApplications(result.applications)
						setLastFetchedPostId(postId) // Remember we fetched for this post
					}
				}
			} catch (error) {
				console.error('Failed to fetch applications:', error)
			} finally {
				setLoadingApplications(false)
			}
		},
		[lastFetchedPostId]
	)

	// Fetch applications for this post when application tab is active
	useEffect(() => {
		if (
			activeTab === 'application' &&
			currentProgram?.id &&
			lastFetchedPostId !== currentProgram.id &&
			!isAutoLoadingApplication
		) {
			fetchApplicationsForPost(currentProgram.id)
		}
	}, [
		activeTab,
		currentProgram?.id,
		lastFetchedPostId,
		isAutoLoadingApplication,
		fetchApplicationsForPost,
	])

	// Fetch selected application details
	const fetchSelectedApplication = async (
		appId: string,
		showLoading: boolean = true
	) => {
		if (showLoading) {
			setLoadingSelectedApplication(true)
		}
		try {
			const response = await fetch(`/api/applications/${appId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			})

			if (response.ok) {
				const result = await response.json()
				if (result.success && result.application) {
					setSelectedApplication(result.application)
					setHasApplied(true)
					setApplicationId(appId)
					setApplicationStatus(result.application.status)
					setPendingApplication(null) // Clear pending when application is loaded

					// Convert application documents to uploadedFiles format
					if (
						result.application.documents &&
						result.application.documents.length > 0
					) {
						// Filter out update submission documents - only show initial application documents
						const initialDocuments = result.application.documents.filter(
							(doc: any) => !doc.isUpdateSubmission && !doc.is_update_submission
						)

						const convertedFiles = initialDocuments.map(
							(doc: any, index: number) => ({
								id:
									doc.documentId ||
									doc.document_type_id ||
									`doc_${appId}_${index}_${Math.random().toString(36).substr(2, 9)}`,
								name: doc.name,
								url: doc.url,
								size: doc.size || 0,
								documentType: doc.documentType || 'application-document',
								uploadDate:
									doc.uploadDate ||
									result.application.applyAt ||
									new Date().toISOString(),
								applicationDocumentId: doc.documentId, // Preserve ApplicationDetail document_id for updates
								source: doc.isFromSnapshot
									? ('existing' as const)
									: ('new' as const), // Set source based on isFromSnapshot flag from API
							})
						)
						// Deduplicate by URL to prevent glitches
						const uniqueFiles = Array.from(
							new Map(
								convertedFiles.map((file: any) => [file.url, file])
							).values()
						)
						setUploadedFiles(uniqueFiles)

						// Don't load into selectedDocuments automatically - user will click Edit button
						setSelectedDocuments([])
						setIsEditMode(false)
					} else {
						setUploadedFiles([])
						setSelectedDocuments([])
					}

					// Scroll to the Application Status section with retry logic for timeout issues
					const scrollToStatusSection = (maxRetries = 5, delay = 300) => {
						let retries = 0
						const attemptScroll = () => {
							const statusSection = document.getElementById(
								'application-status-section'
							)
							if (statusSection) {
								// Use requestAnimationFrame to ensure DOM is ready
								requestAnimationFrame(() => {
									statusSection.scrollIntoView({
										behavior: 'smooth',
										block: 'start',
									})
								})
							} else if (retries < maxRetries) {
								// Retry if element not found yet
								retries++
								setTimeout(attemptScroll, delay)
							}
						}
						// Initial delay to allow page to render
						setTimeout(attemptScroll, delay)
					}
					scrollToStatusSection()
				}
			}
		} catch (error) {
			console.error('Failed to fetch application details:', error)
		} finally {
			if (showLoading) {
				setLoadingSelectedApplication(false)
			}
		}
	}

	// Handle application row click - update the Application Status section below
	const handleApplicationClick = async (appId: string) => {
		// Find the application from the list
		const clickedApp = applications.find((app) => app.applicationId === appId)
		if (!clickedApp) return

		// Set flag to prevent useEffect from fetching
		isHandlingClickRef.current = true

		// Switch to application tab first
		setActiveTab('application')

		// Update the Application Status section below using data we already have
		setHasApplied(true)
		setApplicationId(clickedApp.applicationId)
		setApplicationStatus(clickedApp.status)

		// Update URL with applicationId without scrolling
		const newUrl = new URL(window.location.href)
		newUrl.searchParams.set('applicationId', clickedApp.applicationId)
		// Use replace instead of push to avoid scroll
		router.replace(newUrl.pathname + newUrl.search, { scroll: false })

		// Convert application documents to uploadedFiles format
		if (clickedApp.documents && clickedApp.documents.length > 0) {
			// Filter out update submission documents - only show initial application documents
			const initialDocuments = clickedApp.documents.filter(
				(doc: any) => !doc.isUpdateSubmission && !doc.is_update_submission
			)

			const convertedFiles = initialDocuments.map((doc: any) => ({
				id:
					doc.documentId ||
					doc.document_type_id ||
					`doc_${clickedApp.applicationId}_${Math.random().toString(36).substr(2, 9)}`,
				name: doc.name,
				url: doc.url,
				size: doc.size || 0,
				documentType: doc.documentType || 'application-document',
				uploadDate:
					doc.uploadDate || clickedApp.applyAt || new Date().toISOString(),
				applicationDocumentId: doc.documentId, // Preserve ApplicationDetail document_id for updates
				source: doc.isFromSnapshot ? ('existing' as const) : ('new' as const), // Set source based on isFromSnapshot flag from API
			}))
			// Deduplicate by URL to prevent glitches
			const uniqueFiles = Array.from(
				new Map(convertedFiles.map((file: any) => [file.url, file])).values()
			)
			setUploadedFiles(uniqueFiles)

			// Don't load into selectedDocuments automatically - user will click Edit button
			setSelectedDocuments([])
			setIsEditMode(false)
		} else {
			setUploadedFiles([])
			setSelectedDocuments([])
		}

		// Fetch full application details in the background (for update requests, etc.)
		// but don't show loading state since we already have the basic data displayed
		fetchSelectedApplication(appId, false).catch((error) => {
			console.error('Failed to fetch full application details:', error)
			// Don't show error to user since we already have basic data displayed
		})

		// Scroll to the Application Status section smoothly without jumping
		// Use requestAnimationFrame to ensure DOM is updated
		requestAnimationFrame(() => {
			const statusSection = document.getElementById(
				'application-status-section'
			)
			if (statusSection) {
				statusSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
			}
		})
	}

	// Handle documents selection from DocumentSelector
	const handleDocumentsSelected = (documents: SelectedDocument[]) => {
		// DocumentSelector passes all selectedDocuments, but we only want profile documents from it
		// Filter to only get profile documents (source === 'existing') from the modal
		const profileDocumentsFromModal = documents.filter(
			(doc) => doc.source === 'existing'
		)
		// Preserve any uploaded documents (source === 'new') that were already selected
		const existingUploadedDocs = selectedDocuments.filter(
			(doc) => doc.source === 'new'
		)
		// Merge profile documents from modal with existing uploaded documents
		// Deduplicate by URL to avoid duplicates (same file might have different IDs)
		const allDocumentsMap = new Map<string, SelectedDocument>()

		// Add existing uploaded documents first
		existingUploadedDocs.forEach((doc) => {
			allDocumentsMap.set(doc.url, doc)
		})

		// Add profile documents from modal (use URL as key to prevent duplicates)
		profileDocumentsFromModal.forEach((doc) => {
			allDocumentsMap.set(doc.url, doc)
		})

		const allDocuments = Array.from(allDocumentsMap.values())
		setSelectedDocuments(allDocuments)
		// Convert all selected documents to uploadedFiles format for compatibility
		const convertedFiles = allDocuments.map((doc) => ({
			id: doc.document_id,
			name: doc.name,
			url: doc.url,
			size: doc.size,
			documentType: doc.documentType,
			source: doc.source,
			applicationDocumentId: (doc as any).applicationDocumentId, // Preserve ApplicationDetail document_id if exists
		}))
		// Deduplicate by URL to prevent glitches
		const uniqueFiles = Array.from(
			new Map(convertedFiles.map((file) => [file.url, file])).values()
		)
		setUploadedFiles(uniqueFiles)
	}

	const removeFile = (fileId: number | string) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
		// Also remove from selectedDocuments
		setSelectedDocuments((prev) =>
			prev.filter((doc) => doc.document_id !== fileId)
		)
	}

	const handleCancelEdit = () => {
		// Reset to original state
		setUploadedFiles([...originalUploadedFiles])
		setSelectedDocuments([])
		setIsEditMode(false)
		setShowCancelEditModal(false)
		setOriginalUploadedFiles([])
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

	const handleProgramClick = (program: Program | string) => {
		// Handle both Program object (from recommendations) and string ID (from other uses)
		const programId = typeof program === 'string' ? program : program.id

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
				// Get all applications for this specific post
				const postApplications = response.applications.filter(
					(app) => app.postId === programId
				)

				if (postApplications.length > 0) {
					// Check if all applications are rejected
					const allRejected = postApplications.every(
						(app) => app.status === 'REJECTED'
					)

					if (allRejected) {
						// If all applications are rejected, allow reapplication
						setHasApplied(false)
						setApplicationStatus(null)
						setApplicationId(null)
						setUploadedFiles([])
						setPendingApplication(null)
						return false // Return false to allow new application
					} else {
						// Find the most recent non-rejected application
						const existingApplication =
							postApplications.find((app) => app.status !== 'REJECTED') ||
							postApplications[0] // Fallback to most recent if all are rejected (shouldn't happen)

						if (existingApplication) {
							// If applicationId is in URL, load it immediately
							if (applicationIdFromUrl === existingApplication.applicationId) {
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
										.map((doc: any, index: number) => ({
											id:
												doc.documentId ||
												doc.documentTypeId ||
												`doc_${existingApplication.applicationId}_${index}_${Math.random().toString(36).substr(2, 9)}`, // Generate ID if not available
											name: doc.name,
											url: doc.url,
											size: doc.size || 0,
											documentType:
												doc.documentType ||
												doc.documentTypeId ||
												'application-document',
											uploadDate:
												doc.uploadDate ||
												doc.applyAt ||
												new Date().toISOString(), // Use upload date or application date
											applicationDocumentId: doc.documentId, // Preserve ApplicationDetail document_id for updates
											source: doc.isFromSnapshot
												? ('existing' as const)
												: ('new' as const), // Set source based on isFromSnapshot flag from API
										}))
									// Deduplicate by URL to prevent glitches
									const uniqueFiles = Array.from(
										new Map(
											submittedFiles.map((file) => [file.url, file])
										).values()
									)
									setUploadedFiles(uniqueFiles)
									// Don't automatically load into selectedDocuments - user will click Edit button
									setSelectedDocuments([])
									setIsEditMode(false)
								}
								setPendingApplication(null)
								return true
							} else {
								// Automatically load the application if found
								setIsAutoLoadingApplication(true)
								// Update URL with applicationId
								const newUrl = new URL(window.location.href)
								newUrl.searchParams.set(
									'applicationId',
									existingApplication.applicationId
								)
								router.replace(newUrl.pathname + newUrl.search, {
									scroll: false,
								})
								// Load the application details
								fetchSelectedApplication(
									existingApplication.applicationId,
									false
								).finally(() => {
									// After loading, fetch applications list and reset flag
									setTimeout(() => {
										setIsAutoLoadingApplication(false)
										if (currentProgram?.id) {
											fetchApplicationsForPost(currentProgram.id)
										}
									}, 100)
								})
								setActiveTab('application')
								return true
							}
						}
					}
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
		const programId = currentProgram?.id || params?.id
		if (!programId) {
			return
		}

		// If status is SUBMITTED, update documents instead of creating new application
		if (hasApplied && applicationStatus === 'SUBMITTED' && applicationId) {
			try {
				setIsApplying(true)

				// Extract selected profile document IDs (documents from profile, not newly uploaded)
				const selectedProfileDocumentIds = selectedDocuments
					.filter((doc) => doc.source === 'existing')
					.map((doc) => doc.document_id)
					.filter((id): id is string => Boolean(id)) // Filter out any undefined/null values

				// Prepare documents for update API
				// Only include documents that should be in ApplicationDetail:
				// 1. Documents already in ApplicationDetail (have applicationDocumentId)
				// 2. Newly uploaded files (source === 'new', no applicationDocumentId)
				// Exclude newly selected profile documents (source === 'existing', no applicationDocumentId)
				// - they should only update the profile snapshot, not create ApplicationDetail records
				const documentsToUpdate = selectedDocuments
					.filter((doc) => {
						const applicationDocumentId = (doc as any).applicationDocumentId
						// Include if: has applicationDocumentId (existing ApplicationDetail) OR is a new upload
						return (
							applicationDocumentId ||
							(doc.source === 'new' && !applicationDocumentId)
						)
					})
					.map((doc) => {
						// applicationDocumentId exists only for documents already in the application
						// If it exists, send it to keep the existing document
						// If it doesn't exist, don't send documentId so API creates a new document
						const applicationDocumentId = (doc as any).applicationDocumentId

						return {
							// Only include documentId for existing application documents
							// New uploads should not have documentId so API creates them
							documentId: applicationDocumentId || undefined,
							url: doc.url,
							name: doc.name,
							size: doc.size,
							documentTypeId: doc.documentType,
							documentType: doc.documentType,
						}
					})

				const response = await applicationService.updateApplicationDocuments(
					applicationId,
					documentsToUpdate,
					selectedProfileDocumentIds.length > 0
						? selectedProfileDocumentIds
						: undefined
				)

				if (response.success) {
					showSuccess(
						'Documents Updated!',
						'Your application documents have been updated successfully.'
					)
					// Exit edit mode and refresh the application to get updated documents
					setIsEditMode(false)
					setSelectedDocuments([])
					// Use fetchSelectedApplication to get complete document list including snapshot documents
					if (applicationId) {
						await fetchSelectedApplication(applicationId)
					} else {
						await checkExistingApplication(programId)
					}
				} else {
					showError(
						'Update Failed',
						response.message || 'Failed to update documents. Please try again.',
						{
							onRetry: handleApply,
							showRetry: true,
							retryText: 'Retry',
						}
					)
				}
			} catch (error: any) {
				showError(
					'Update Error',
					error.message || 'An unexpected error occurred. Please try again.',
					{
						onRetry: handleApply,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			} finally {
				setIsApplying(false)
			}
			return
		}

		// Check if already applied (but allow if all previous applications are rejected)
		// This check is handled in checkExistingApplication which sets hasApplied to false
		// if all applications are rejected
		if (hasApplied && applicationStatus !== 'REJECTED') {
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

			// Extract selected profile document IDs (documents from profile, not newly uploaded)
			const selectedProfileDocumentIds = selectedDocuments
				.filter((doc) => doc.source === 'existing')
				.map((doc) => doc.document_id)
				.filter((id): id is string => Boolean(id)) // Filter out any undefined/null values

			const response = await applicationService.submitApplication({
				postId: programId,
				documents: uploadedFiles.map((file) => ({
					documentTypeId: file.documentType || getDocumentType(file.name), // Use stored document type or fallback to filename detection
					name: file.name,
					url: file.url, // S3 URL from upload
					size: file.size,
				})),
				selectedProfileDocumentIds:
					selectedProfileDocumentIds.length > 0
						? selectedProfileDocumentIds
						: undefined,
			})

			if (response.success && response.application) {
				setHasApplied(true)
				setApplicationId(response.application.applicationId)
				// Redirect to the same page but with applicationId
				const newUrl = new URL(window.location.href)
				newUrl.searchParams.set(
					'applicationId',
					response.application.applicationId
				)
				router.push(newUrl.pathname + newUrl.search)
				setActiveTab('application')
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
			// Handle application limit error
			if (error instanceof ApplicationLimitError) {
				showError('Application Limit Reached', error.getUserFriendlyMessage(), {
					showRetry: false,
					showUpgradeButton: true,
					upgradeButtonText: 'Upgrade Plan',
					onUpgradeClick: () => {
						router.push('/pricing')
					},
				})
				// Handle specific "already applied" error
			} else if (error.message && error.message.includes('already applied')) {
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
					error.message || 'An unexpected error occurred. Please try again.',
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
		{ id: 'application', label: 'My Applications' },
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

			case 'application':
				// Show applications list - clicking will update the Application Status section below
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">
							My Applications
						</h2>

						{/* Upload area intentionally left out here; uploader is in "Apply here" section */}

						{loadingApplications && lastFetchedPostId !== currentProgram?.id ? (
							<div className="bg-white rounded-lg shadow border overflow-hidden">
								{/* Skeleton loader for table */}
								<div className="animate-pulse">
									<div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
										<div className="h-4 bg-gray-200 rounded w-1/4"></div>
									</div>
									{[1, 2, 3].map((i) => (
										<div key={i} className="px-6 py-4 border-b border-gray-200">
											<div className="flex items-center justify-between">
												<div className="flex-1 space-y-2">
													<div className="h-4 bg-gray-200 rounded w-1/3"></div>
													<div className="h-3 bg-gray-100 rounded w-1/4"></div>
												</div>
												<div className="h-6 bg-gray-200 rounded-full w-20"></div>
												<div className="h-4 bg-gray-200 rounded w-16"></div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : applications.length > 0 ? (
							<div className="bg-white rounded-lg shadow border overflow-hidden">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Application Date
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Documents
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{applications.map((app) => (
											<tr
												key={app.applicationId}
												onClick={() =>
													handleApplicationClick(app.applicationId)
												}
												className="hover:bg-gray-50 cursor-pointer transition-colors"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{formatUTCDateToLocal(app.applyAt)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`px-3 py-1 rounded-full text-xs font-medium ${
															app.status === 'ACCEPTED'
																? 'bg-green-100 text-green-800'
																: app.status === 'REJECTED'
																	? 'bg-red-100 text-red-800'
																	: app.status === 'PROGRESSING'
																		? 'bg-blue-100 text-blue-800'
																		: 'bg-yellow-100 text-yellow-800'
														}`}
													>
														{app.status}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{app.documents?.length || 0} document(s)
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="text-center py-12 bg-white rounded-lg shadow border">
								<File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-600">
									No applications found for this program
								</p>
								<p className="text-sm text-gray-500 mt-2">
									Submit an application to get started
								</p>
							</div>
						)}
					</div>
				)

			default:
				return null
		}
	}
	if (isLoadingProgram) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading program details...</p>
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
							{currentProgram?.institution && (
								<Button
									onClick={() => {
										const institutionId =
											currentProgram.institution.id ||
											currentProgram.institution.userId
										if (institutionId) {
											router.push(`/institution-detail/${institutionId}`)
										} else {
											// eslint-disable-next-line no-console
											console.warn('No institution ID available')
										}
									}}
									className=""
								>
									Institution Detail
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
					id="application-status-section"
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					{!(pendingApplication && !hasApplied) && (
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold">
								{hasApplied
									? 'Application Status'
									: pendingApplication
										? 'Application Status'
										: 'Apply here !'}
							</h2>
							{(hasApplied || pendingApplication) &&
								(applicationStatus || pendingApplication?.status) && (
									<span
										className={`px-4 py-2 rounded-full text-sm font-medium ${
											(applicationStatus || pendingApplication?.status) ===
												'SUBMITTED' ||
											(applicationStatus || pendingApplication?.status) ===
												'PENDING'
												? 'bg-yellow-100 text-yellow-800'
												: (applicationStatus || pendingApplication?.status) ===
													  'REQUIRE_UPDATE'
													? 'bg-orange-100 text-orange-800'
													: (applicationStatus ||
																pendingApplication?.status) === 'UPDATED'
														? 'bg-blue-100 text-blue-800'
														: (applicationStatus ||
																	pendingApplication?.status) === 'ACCEPTED'
															? 'bg-green-100 text-green-800'
															: (applicationStatus ||
																		pendingApplication?.status) === 'REJECTED'
																? 'bg-red-100 text-red-800'
																: (applicationStatus ||
																			pendingApplication?.status) ===
																	  'PROGRESSING'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-gray-100 text-gray-800'
										}`}
									>
										{(applicationStatus || pendingApplication?.status) ===
										'PENDING'
											? 'SUBMITTED'
											: (applicationStatus || pendingApplication?.status) ===
												  'REVIEWED'
												? 'REQUIRE_UPDATE'
												: applicationStatus || pendingApplication?.status}
									</span>
								)}
						</div>
					)}

					{/* Congratulations message for approved applications */}
					{hasApplied && applicationStatus === 'ACCEPTED' && (
						<div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-6">
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0">
									<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
										<Check className="w-8 h-8 text-green-600" />
									</div>
								</div>
								<div className="flex-1">
									<h3 className="text-2xl font-bold text-green-800 mb-2">
										🎉 Congratulations!
									</h3>
									<p className="text-lg text-green-700 mb-4">
										Your application has been approved! The institution will
										contact you with further details about the next steps.
									</p>
									<div className="bg-white rounded-lg p-4 border border-green-200">
										<p className="text-sm text-green-600 font-medium">
											Application Status:{' '}
											<span className="text-green-800">ACCEPTED</span>
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Application Status Message */}
					{hasApplied &&
						applicationStatus &&
						applicationStatus !== 'ACCEPTED' &&
						!isEditMode && (
							<div
								className={`mb-6 rounded-lg p-6 border ${
									applicationStatus === 'REJECTED'
										? 'bg-red-50 border-red-200'
										: applicationStatus === 'UPDATED'
											? 'bg-blue-50 border-blue-200'
											: applicationStatus === 'REQUIRE_UPDATE'
												? 'bg-orange-50 border-orange-200'
												: 'bg-yellow-50 border-yellow-200'
								}`}
							>
								<div className="flex items-start gap-3">
									<div
										className={`text-2xl ${
											applicationStatus === 'REJECTED'
												? 'text-red-600'
												: applicationStatus === 'UPDATED'
													? 'text-blue-600'
													: applicationStatus === 'REQUIRE_UPDATE'
														? 'text-orange-600'
														: 'text-yellow-600'
										}`}
									>
										{applicationStatus === 'REJECTED'
											? '❌'
											: applicationStatus === 'UPDATED'
												? '✓'
												: applicationStatus === 'REQUIRE_UPDATE'
													? '⚠'
													: 'ℹ'}
									</div>
									<div className="flex-1">
										<h3
											className={`text-lg font-semibold ${
												applicationStatus === 'REJECTED'
													? 'text-red-800'
													: applicationStatus === 'UPDATED'
														? 'text-blue-800'
														: applicationStatus === 'REQUIRE_UPDATE'
															? 'text-orange-800'
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
												applicationStatus === 'REJECTED'
													? 'text-red-700'
													: applicationStatus === 'UPDATED'
														? 'text-blue-700'
														: applicationStatus === 'REQUIRE_UPDATE'
															? 'text-orange-700'
															: 'text-yellow-700'
											}`}
										>
											{applicationStatus === 'ACCEPTED'
												? 'Congratulations! Your application has been accepted. The institution will contact you soon with next steps.'
												: applicationStatus === 'REJECTED'
													? 'We regret to inform you that your application was not selected this time. You can reapply below if you wish to submit a new application.'
													: applicationStatus === 'UPDATED'
														? 'Your application has been updated. The institution will review your changes.'
														: 'Your application has been submitted. You will receive updates via email.'}
										</p>
										{applicationStatus === 'REJECTED' &&
											// Only show reapply button if all applications for this post are REJECTED
											// Check if applications list has been fetched for this post
											lastFetchedPostId === currentProgram?.id &&
											applications.length > 0 &&
											applications.every(
												(app) => app.status === 'REJECTED'
											) && (
												<div className="mt-4">
													<Button
														onClick={() => {
															// Reset to allow new application
															setHasApplied(false)
															setApplicationStatus(null)
															setApplicationId(null)
															setUploadedFiles([])
															setSelectedDocuments([])
															// Scroll to the apply section
															setTimeout(() => {
																const applySection = document.getElementById(
																	'application-status-section'
																)
																if (applySection) {
																	applySection.scrollIntoView({
																		behavior: 'smooth',
																		block: 'start',
																	})
																}
															}, 100)
														}}
														className="bg-[#126E64] hover:bg-teal-700 text-white"
													>
														Reapply Now
													</Button>
												</div>
											)}
									</div>
								</div>
							</div>
						)}

					{((!hasApplied && !pendingApplication) ||
						(hasApplied && applicationStatus === 'SUBMITTED' && isEditMode)) &&
						applicationStatus !== 'ACCEPTED' && (
							<>
								{hasApplied &&
									applicationStatus === 'SUBMITTED' &&
									isEditMode && (
										<div className="mb-4 flex items-center justify-between">
											<h3 className="text-lg font-semibold text-gray-900">
												Edit Application Documents
											</h3>
											<Button
												variant="outline"
												onClick={() => {
													// Check if there are unsaved changes
													const hasChanges =
														uploadedFiles.length !==
															originalUploadedFiles.length ||
														uploadedFiles.some(
															(file, index) =>
																!originalUploadedFiles[index] ||
																file.id !== originalUploadedFiles[index].id ||
																file.url !== originalUploadedFiles[index].url
														)

													if (hasChanges) {
														setShowCancelEditModal(true)
													} else {
														handleCancelEdit()
													}
												}}
												className="text-gray-600 border-gray-300 hover:bg-gray-50"
												size="sm"
											>
												Cancel Edit
											</Button>
										</div>
									)}
								<div className="text-gray-600 mb-6">
									{currentProgram?.documents &&
									currentProgram.documents.length > 0 ? (
										<div className="space-y-3">
											{currentProgram.documents.map(
												(doc: any, index: number) => (
													<p
														key={
															doc.document_id || doc.document_type_id || index
														}
													>
														<span className="font-medium">{doc.name}:</span>{' '}
														{doc.description}
													</p>
												)
											)}
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
									<div className="space-y-6 pt-7">
										{/* Always show Select from Profile and Upload Files options */}
										<div className="space-y-4">
											{/* Select from Profile Button - Opens modal for profile snapshot selection */}
											<div className="text-center">
												<Button
													onClick={() => setShowDocumentSelector(true)}
													variant="outline"
													className="border-[#126E64] text-[#126E64] hover:bg-teal-50 px-8 py-3"
												>
													📄 Select from Profile
												</Button>
												<p className="text-sm text-gray-500 mt-2">
													Choose documents from your profile for the snapshot
												</p>
											</div>

											{/* Divider with OR */}
											<div className="flex items-center gap-4">
												<div className="flex-1 border-t border-gray-300"></div>
												<span className="text-sm font-medium text-gray-500">
													OR
												</span>
												<div className="flex-1 border-t border-gray-300"></div>
											</div>

											{/* Upload Files Section - replaced with OCR + AI validation uploader */}
											<div className="">
												<FileUploadManagerWithOCR
													category="application-documents"
													enableOCR={true}
													onFilesUploaded={async (files) => {
														// Map uploaded files to application document shape (temp ids)
														const newDocuments = files.map((file) => ({
															document_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
															name: file.name,
															url: file.url,
															size: file.size,
															documentType: 'general',
															source: 'new' as const,
														}))

														// Merge with existing selected documents and dedupe by URL
														const docsMap = new Map<string, any>()
														selectedDocuments.forEach((doc) =>
															docsMap.set(doc.url, doc)
														)
														newDocuments.forEach((doc) =>
															docsMap.set(doc.url, doc)
														)
														const updatedDocs = Array.from(docsMap.values())
														setSelectedDocuments(updatedDocs)

														// Update uploadedFiles to reflect merged documents
														const convertedFiles = updatedDocs.map((doc) => ({
															id: doc.document_id,
															name: doc.name,
															url: doc.url,
															size: doc.size,
															documentType: doc.documentType,
															source: doc.source,
															applicationDocumentId: (doc as any)
																.applicationDocumentId,
														}))
														const uniqueFiles = Array.from(
															new Map(
																convertedFiles.map((file) => [file.url, file])
															).values()
														)
														setUploadedFiles(uniqueFiles)

														showSuccess(
															'Files Uploaded',
															`${files.length} file(s) uploaded successfully`
														)
													}}
													onValidationComplete={(fileId, validation) => {
														if (!validation.isValid) {
															showError(
																'Validation Failed',
																validation.reasoning || 'File failed validation'
															)
														}
													}}
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Display uploaded files directly - same as submitted status view */}
								{((!hasApplied && !pendingApplication) ||
									(hasApplied &&
										applicationStatus === 'SUBMITTED' &&
										isEditMode)) &&
									uploadedFiles.length > 0 && (
										<div className="mt-6">
											<div className="mb-4">
												<h4 className="text-lg font-semibold text-gray-900">
													Application Documents ({uploadedFiles.length} file
													{uploadedFiles.length !== 1 ? 's' : ''})
												</h4>
											</div>
											<div className="space-y-3">
												{uploadedFiles.map((file) => (
													<div
														key={file.id}
														className="flex items-center gap-3 p-3 bg-white rounded-lg border"
													>
														<div className="text-2xl">📄</div>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																<p className="text-sm font-medium text-gray-900 truncate">
																	{file.name}
																</p>
																{file.source && (
																	<span
																		className={`px-2 py-0.5 rounded-full text-xs font-medium ${
																			file.source === 'existing'
																				? 'bg-blue-100 text-blue-700'
																				: 'bg-green-100 text-green-700'
																		}`}
																	>
																		{file.source === 'existing'
																			? 'From Profile'
																			: 'Uploaded'}
																	</span>
																)}
															</div>
															<div className="flex items-center gap-2 text-xs text-gray-500">
																<span>
																	{file.size
																		? `${(file.size / 1024).toFixed(1)} KB`
																		: '0 KB'}
																</span>
															</div>
														</div>
														<div className="flex gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	openSessionProtectedFile(file.url)
																}}
																className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
															>
																View
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => removeFile(file.id)}
																className="text-red-500 border-red-500 hover:bg-red-50"
															>
																Remove
															</Button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

								{/* Upload Progress */}
								{isUploading && uploadProgress.length > 0 && (
									<div className="mt-6 space-y-2">
										<p className="text-sm font-medium text-gray-700">
											Uploading files...
										</p>
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
							</>
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

					{/* Show uploaded files in read-only mode when applied and not in edit mode */}
					{hasApplied && uploadedFiles.length > 0 && !isEditMode && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center justify-between mb-4">
								<span className="font-medium text-gray-700">
									Application Documents ({uploadedFiles.length} file
									{uploadedFiles.length !== 1 ? 's' : ''})
								</span>
								{applicationStatus === 'SUBMITTED' && (
									<Button
										variant="outline"
										onClick={async () => {
											// Fetch profile documents to match against application documents
											try {
												const profileResponse = await fetch(
													'/api/applicant/documents',
													{
														method: 'GET',
														headers: {
															'Content-Type': 'application/json',
														},
														credentials: 'include',
													}
												)
												const profileData = await profileResponse.json()
												const profileDocuments =
													profileData.success && profileData.documents
														? profileData.documents
														: []

												// Match application documents to profile documents by URL
												// Preserve the original source from the API (isFromSnapshot flag)
												// Only use profile matching to get document_id for profile documents
												const selectedDocs = uploadedFiles.map((file) => {
													// Check if this file URL matches any profile document
													const matchingProfileDoc = profileDocuments.find(
														(profileDoc: any) => profileDoc.url === file.url
													)

													// Preserve the original source from API (file.source)
													// This was set based on isFromSnapshot flag when documents were loaded
													// Don't re-determine source by matching - use the original source
													const source =
														file.source ||
														(matchingProfileDoc
															? ('existing' as const)
															: ('new' as const))

													return {
														document_id:
															matchingProfileDoc?.document_id ||
															file.id ||
															`doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
														name: file.name,
														url: file.url,
														size: file.size || 0,
														documentType:
															file.documentType || 'application-document',
														source: source, // Use preserved source from API
														applicationDocumentId:
															file.applicationDocumentId || file.id, // Preserve ApplicationDetail document_id
													}
												})
												setSelectedDocuments(selectedDocs)
												// Store original files for comparison when canceling
												setOriginalUploadedFiles([...uploadedFiles])
												// Update uploadedFiles - preserve original source from API
												// Don't re-determine source, just ensure it's set
												const updatedFiles = uploadedFiles.map((file) => {
													// Preserve the original source that was set by the API
													// The source should already be set from fetchSelectedApplication
													// Only use fallback if source is somehow missing
													if (!file.source) {
														const matchingProfileDoc = profileDocuments.find(
															(profileDoc: any) => profileDoc.url === file.url
														)
														return {
															...file,
															source: matchingProfileDoc
																? ('existing' as const)
																: ('new' as const),
														}
													}
													return file
												})
												// Deduplicate by URL to prevent glitches
												const uniqueUpdatedFiles = Array.from(
													new Map(
														updatedFiles.map((file) => [file.url, file])
													).values()
												)
												setUploadedFiles(uniqueUpdatedFiles)
												setIsEditMode(true)
											} catch (error) {
												// Fallback: treat all as existing if fetch fails
												const selectedDocs = uploadedFiles.map((file) => ({
													document_id:
														file.id ||
														`doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
													name: file.name,
													url: file.url,
													size: file.size || 0,
													documentType:
														file.documentType || 'application-document',
													source: 'existing' as const,
													applicationDocumentId:
														file.applicationDocumentId || file.id, // Preserve ApplicationDetail document_id
												}))
												setSelectedDocuments(selectedDocs)
												// Store original files for comparison when canceling
												setOriginalUploadedFiles([...uploadedFiles])
												// Update uploadedFiles with source information so tags are visible
												const updatedFiles = uploadedFiles.map((file) => ({
													...file,
													source: 'existing' as const,
												}))
												// Deduplicate by URL to prevent glitches
												const uniqueUpdatedFiles = Array.from(
													new Map(
														updatedFiles.map((file) => [file.url, file])
													).values()
												)
												setUploadedFiles(uniqueUpdatedFiles)
												setIsEditMode(true)
											}
										}}
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
										size="sm"
									>
										Edit Documents
									</Button>
								)}
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
											<div className="flex items-center gap-2 mb-1">
												<p className="text-sm font-medium text-gray-900 truncate">
													{file.name}
												</p>
												{file.source && (
													<span
														className={`px-2 py-0.5 rounded-full text-xs font-medium ${
															file.source === 'existing'
																? 'bg-blue-100 text-blue-700'
																: 'bg-green-100 text-green-700'
														}`}
													>
														{file.source === 'existing'
															? 'From Profile'
															: 'Uploaded'}
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 text-xs text-gray-500">
												<span>{(file.size / 1024).toFixed(1)} KB</span>
												{file.uploadDate && (
													<>
														<span>•</span>
														<span>
															Uploaded: {formatUTCDateToLocal(file.uploadDate)}
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
													openSessionProtectedFile(file.url)
												}}
												className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
											>
												View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={async () => {
													await downloadSessionProtectedFile(
														file.url,
														file.name
													)
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
					{/* Selected Documents Summary - Show when documents are selected */}
					<div className="pt-10">
						{selectedDocuments.length > 0 && !isEditMode && (
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
									</div>
								</div>
							</div>
						)}
					</div>
					{/* Show warning if no documents selected */}
					{((!hasApplied && !pendingApplication) ||
						(hasApplied && applicationStatus === 'SUBMITTED' && isEditMode)) &&
						uploadedFiles.length === 0 && (
							<div className="text-center mb-6 pt-10">
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
									<div className="flex items-center justify-center gap-2 text-amber-700">
										<span className="text-lg">⚠️</span>
										<p className="font-medium">
											Please select at least one document to submit your
											application
										</p>
									</div>
								</div>
							</div>
						)}

					{!pendingApplication && (
						<div className="flex gap-3 justify-center pt-10">
							{((!hasApplied && selectedDocuments.length > 0) ||
								(hasApplied &&
									applicationStatus === 'SUBMITTED' &&
									isEditMode &&
									selectedDocuments.length > 0)) && (
								<Button
									variant="outline"
									onClick={handleRemoveAllClick}
									className="text-red-500 border-red-500 hover:bg-red-50"
								>
									Remove all
								</Button>
							)}
							{applicationStatus === 'SUBMITTED' &&
							isEditMode &&
							selectedDocuments.length > 0 ? (
								<Button
									className="bg-[#126E64] hover:bg-teal-700 text-white"
									onClick={handleApply}
									disabled={isApplying}
								>
									{isApplying ? (
										<div className="flex items-center gap-2">
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											Updating...
										</div>
									) : (
										'Update Documents'
									)}
								</Button>
							) : !hasApplied && selectedDocuments.length > 0 ? (
								<Button
									className="bg-[#126E64] hover:bg-teal-700 text-white"
									onClick={handleApply}
									disabled={isApplying || uploadedFiles.length === 0}
								>
									{isApplying ? (
										<div className="flex items-center gap-2">
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											Submitting...
										</div>
									) : (
										'Submit Application'
									)}
								</Button>
							) : null}
						</div>
					)}
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

			{/* Cancel Edit Confirmation Modal */}
			<Modal
				isOpen={showCancelEditModal}
				onClose={() => setShowCancelEditModal(false)}
				title="Discard Changes?"
				maxWidth="sm"
			>
				<div className="space-y-6">
					<p className="text-gray-600">
						You have unsaved changes. Are you sure you want to cancel editing?
						All changes will be lost.
					</p>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => setShowCancelEditModal(false)}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Keep Editing
						</Button>
						<Button
							onClick={handleCancelEdit}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Discard Changes
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
							{(() => {
								// Only count profile documents (source === 'existing')
								const profileDocuments = selectedDocuments.filter(
									(doc) => doc.source === 'existing'
								)
								const profileCount = profileDocuments.length
								return profileCount > 0 ? (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
											<Check className="w-5 h-5 text-green-600" />
										</div>
										<div>
											<p className="font-semibold text-gray-900">
												{profileCount} document
												{profileCount !== 1 ? 's' : ''} selected from profile
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
								)
							})()}
						</div>

						{/* Right Side - Action Buttons */}
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setShowDocumentSelector(false)
									// Only clear profile documents, keep uploaded ones
									const uploadedDocs = selectedDocuments.filter(
										(doc) => doc.source === 'new'
									)
									setSelectedDocuments(uploadedDocs)
									// Update uploadedFiles to only include uploaded documents
									if (uploadedDocs.length > 0) {
										const convertedFiles = uploadedDocs.map((doc) => ({
											id: doc.document_id,
											name: doc.name,
											url: doc.url,
											size: doc.size,
											documentType: doc.documentType,
											source: doc.source,
										}))
										// Deduplicate by URL to prevent glitches
										const uniqueFiles = Array.from(
											new Map(
												convertedFiles.map((file) => [file.url, file])
											).values()
										)
										setUploadedFiles(uniqueFiles)
									} else {
										setUploadedFiles([])
									}
								}}
								className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
								size="sm"
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									setShowDocumentSelector(false)
									const profileDocuments = selectedDocuments.filter(
										(doc) => doc.source === 'existing'
									)
									if (profileDocuments.length > 0) {
										showSuccess(
											'Documents Selected!',
											`${profileDocuments.length} document${
												profileDocuments.length !== 1 ? 's' : ''
											} ready for application submission`
										)
									}
								}}
								disabled={
									selectedDocuments.filter((doc) => doc.source === 'existing')
										.length === 0
								}
								className={`px-6 py-3 transition-all duration-200 ${
									selectedDocuments.filter((doc) => doc.source === 'existing')
										.length === 0
										? 'bg-gray-300 text-gray-500 cursor-not-allowed'
										: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
								}`}
								size="sm"
							>
								{selectedDocuments.filter((doc) => doc.source === 'existing')
									.length === 0 ? (
									'Select Documents First'
								) : (
									<div className="flex items-center gap-2">
										<span>Continue</span>
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
