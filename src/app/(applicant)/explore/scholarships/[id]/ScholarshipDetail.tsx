'use client'
import {
	Breadcrumb,
	Button,
	ErrorModal,
	FilterSidebar,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
} from '@/components/ui'
import {
	DocumentSelector,
	SelectedDocument,
} from '@/components/ui/DocumentSelector'

import FileUploadManagerWithOCR from '@/components/ui/layout/file-upload-manager-with-ocr'
import { useNotification } from '@/contexts/NotificationContext'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { applicationService } from '@/services/application/application-service'
import { ExploreApiService } from '@/services/explore/explore-api'
import { ApplicationLimitError } from '@/types/api/application-errors'
import type { ExploreFilters } from '@/types/api/explore-api'
import { formatUTCDateToLocal } from '@/utils/date'
import {
	downloadSessionProtectedFile,
	openSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, File, Heart, Lock, X } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const ScholarshipDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const { isAuthenticated } = useAuthCheck()
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Check if we're viewing an application (from URL query param)
	const applicationIdFromUrl = searchParams?.get('applicationId')
	const fromParam = searchParams?.get('from')
	// Don't auto-load application tab if coming from application section
	const shouldAutoLoadApplicationTab =
		applicationIdFromUrl && fromParam !== 'application'

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 100,
			status: 1,
		},
	})

	const [activeTab, setActiveTab] = useState(
		shouldAutoLoadApplicationTab ? 'application' : 'detail'
	)
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
	const [isEditMode, setIsEditMode] = useState(false)
	const [showCancelEditModal, setShowCancelEditModal] = useState(false)
	const [originalUploadedFiles, setOriginalUploadedFiles] = useState<any[]>([])
	const [pendingApplication, setPendingApplication] = useState<{
		applicationId: string
		status: string
	} | null>(null)

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
	const isHandlingClickRef = useRef(false)

	// Notification system
	const { showSuccess, showError } = useNotification()

	// Utility function to get institution status
	const getInstitutionStatus = (institution?: {
		status: string | boolean
		deletedAt?: string | null
	}) => {
		if (!institution) return null

		// Check for non-approved status
		// The API returns verification_status as 'status' field
		// verification_status can be: PENDING, APPROVED, REJECTED
		// Also handle legacy boolean status field
		const isApproved =
			institution.status === 'APPROVED' ||
			institution.status === true ||
			institution.status === 'ACTIVE' // Legacy support

		if (!isApproved) {
			const statusLabel =
				institution.status === 'PENDING'
					? 'Pending Approval'
					: institution.status === 'REJECTED'
						? 'Account Rejected'
						: 'Account Deactivated'
			return {
				type: 'deactivated' as const,
				label: statusLabel,
				color:
					institution.status === 'PENDING'
						? 'bg-blue-100 text-blue-800 border-blue-200'
						: 'bg-orange-100 text-orange-800 border-orange-200',
			}
		}

		return null
	}

	// Institution status badge component
	const InstitutionStatusBadge: React.FC<{
		institution?: {
			status: string | boolean
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

	// Constants for pagination
	const ITEMS_PER_PAGE_PROGRAMS = 6

	// Recommended scholarships state
	const [recommendedScholarships, setRecommendedScholarships] = useState<any[]>(
		[]
	)
	const [isLoadingRecommendations, setIsLoadingRecommendations] =
		useState(false)
	const [isRecommendationsRestricted, setIsRecommendationsRestricted] =
		useState(false)

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

	const [eligibilityFilters, setEligibilityFilters] = useState<
		Record<string, string[]>
	>({})

	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Scholarship Detail' }])

	// Fetch recommended scholarships based on current scholarship's characteristics
	const fetchRecommendedScholarships = async (scholarship: any) => {
		if (!scholarship) return

		try {
			setIsLoadingRecommendations(true)
			setIsRecommendationsRestricted(false)

			const response = await fetch(
				`/api/explore/scholarships/scholarship-detail/recommend?scholarshipId=${scholarship.id}`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
				}
			)

			if (response.ok) {
				const result = await response.json()
				if (result.success && result.data) {
					// Check if recommendations are restricted by plan
					if (result.restricted) {
						setIsRecommendationsRestricted(true)
						setRecommendedScholarships([])
					} else {
						setRecommendedScholarships(result.data)
					}
				} else {
					setRecommendedScholarships([])
				}
			} else {
				setRecommendedScholarships([])
			}
		} catch (error) {
			// Silently fail for recommendations, fallback to empty array
			setRecommendedScholarships([])
		} finally {
			setIsLoadingRecommendations(false)
		}
	}

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
				const scholarshipId = params?.id as string
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
	}, [params?.id])

	// Separate useEffect for breadcrumb to avoid triggering scholarship fetch
	useEffect(() => {
		const updateBreadcrumb = () => {
			const fromTab = searchParams?.get('from') || 'scholarships'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams?.toString())
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
					// Error handled by UI state
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

	// Reset pagination when scholarship changes
	useEffect(() => {
		if (currentScholarship?.id) {
			setEligibilityProgramsPage(1)
		}
	}, [currentScholarship?.id])

	// Fetch recommended scholarships when currentScholarship is loaded
	useEffect(() => {
		if (currentScholarship) {
			fetchRecommendedScholarships(currentScholarship)
		}
	}, [currentScholarship])

	// Fetch selected application details
	const fetchSelectedApplication = useCallback(
		async (appId: string, showLoading: boolean = true) => {
			if (showLoading) {
				setIsCheckingApplication(true)
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
								(doc: any) =>
									!doc.isUpdateSubmission && !doc.is_update_submission
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
				// Error handled by UI state
			} finally {
				if (showLoading) {
					setIsCheckingApplication(false)
				}
			}
		},
		[]
	)

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
				// Error handled by UI state
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
			currentScholarship?.id &&
			lastFetchedPostId !== currentScholarship.id &&
			!isAutoLoadingApplication
		) {
			fetchApplicationsForPost(currentScholarship.id)
		}
	}, [
		activeTab,
		currentScholarship?.id,
		lastFetchedPostId,
		isAutoLoadingApplication,
		fetchApplicationsForPost,
	])

	// Fetch recommended scholarships when currentScholarship is loaded
	useEffect(() => {
		if (currentScholarship) {
			fetchRecommendedScholarships(currentScholarship)
		}
	}, [currentScholarship])

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
			// On page reload, applicationId might be set from URL but data hasn't been fetched yet
			const needsFetch =
				applicationId !== applicationIdFromUrl ||
				(applicationId === applicationIdFromUrl && !hasApplied)

			if (needsFetch) {
				// If coming from application section, switch to application tab and fetch applications list
				if (fromParam === 'application' && currentScholarship?.id) {
					setActiveTab('application')
					// Fetch applications list for the "My Applications" tab
					if (lastFetchedPostId !== currentScholarship.id) {
						fetchApplicationsForPost(currentScholarship.id)
					}
					// Add extra delay when coming from application section to handle timeout issues
					// Wait longer to ensure page is fully loaded and tab is switched
					setTimeout(() => {
						fetchSelectedApplication(applicationIdFromUrl, false).then(() => {
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
					// If currentScholarship is not loaded yet, wait a bit for it to load
					// This handles page reload scenarios where scholarship data might not be ready
					const delay = currentScholarship?.id ? 0 : 300
					setTimeout(() => {
						fetchSelectedApplication(applicationIdFromUrl, false)
					}, delay)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationIdFromUrl, fromParam, currentScholarship?.id, hasApplied])

	// Check if user has already applied to this post
	const checkExistingApplication = useCallback(
		async (scholarshipId: string) => {
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
						(app) => app.postId === scholarshipId
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
							return false // Return false to allow new application
						} else {
							// Find the most recent non-rejected application
							const existingApplication =
								postApplications.find((app) => app.status !== 'REJECTED') ||
								postApplications[0] // Fallback to most recent if all are rejected (shouldn't happen)

							if (existingApplication) {
								// If applicationId is in URL, load it immediately
								if (
									applicationIdFromUrl === existingApplication.applicationId
								) {
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
													doc.document_type_id ||
													`doc_${existingApplication.applicationId}_${index}_${Math.random().toString(36).substr(2, 9)}`,
												name: doc.name,
												url: doc.url,
												size: doc.size || 0,
												documentType:
													doc.documentType || 'application-document',
												uploadDate:
													doc.uploadDate ||
													existingApplication.applyAt ||
													new Date().toISOString(),
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
									return true
								} else {
									// Automatically load the application if found
									// Update URL with applicationId
									setIsAutoLoadingApplication(true)
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
											if (currentScholarship?.id) {
												fetchApplicationsForPost(currentScholarship.id)
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
				// Error handled by UI state
				return false
			} finally {
				setIsCheckingApplication(false)
			}
		},
		[
			fetchSelectedApplication,
			router,
			fetchApplicationsForPost,
			applicationIdFromUrl,
			currentScholarship?.id,
		]
	)

	// Handle application click from My Applications tab
	const handleApplicationClick = useCallback(
		async (appId: string) => {
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

			// Fetch full application details in the background without showing loading
			await fetchSelectedApplication(clickedApp.applicationId, false)

			// Reset flag after a short delay
			setTimeout(() => {
				isHandlingClickRef.current = false
			}, 100)
		},
		[applications, fetchSelectedApplication, router]
	)

	// // Check for existing application when component loads
	// useEffect(() => {
	// 	const scholarshipId = currentScholarship?.id || params.id
	// 	// Skip if applicationIdFromUrl exists - fetchSelectedApplication will handle loading
	// 	if (
	// 		scholarshipId &&
	// 		isAuthenticated &&
	// 		!isCheckingApplication &&
	// 		!applicationIdFromUrl
	// 	) {
	// 		checkExistingApplication(scholarshipId as string)
	// 	}
	// }, [
	// 	currentScholarship?.id,
	// 	params.id,
	// 	isAuthenticated,
	// 	checkExistingApplication,
	// 	applicationIdFromUrl,
	// 	isCheckingApplication,
	// ])

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
				// Error handled by UI state
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
				// Error handled by UI state
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

	const handleProgramClick = (programId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams?.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to programmes detail page
		router.push(
			`/explore/programmes/${programId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams?.toString())
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
		const scholarshipId = currentScholarship?.id || params?.id
		if (!scholarshipId) {
			return
		}

		// Check if already applied (but allow if all previous applications are rejected)
		// This check is handled in checkExistingApplication which sets hasApplied to false
		// if all applications are rejected
		if (hasApplied && applicationStatus !== 'REJECTED') {
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
			// Handle application limit error with user-friendly message
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
					'You have already applied to this scholarship. You cannot submit multiple applications.',
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

	const menuItems = [
		{ id: 'detail', label: 'Detail' },
		{ id: 'eligibility', label: 'Eligibility' },
		{ id: 'other', label: 'Other information' },
		{ id: 'application', label: 'My Applications' },
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
												} catch (error) {
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

			case 'application':
				// Show applications list - clicking will update the Application Status section below
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">
							My Applications
						</h2>

						{loadingApplications &&
						lastFetchedPostId !== currentScholarship?.id ? (
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
									No applications found for this scholarship
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
							<p className="text-gray-600 mb-3">
								{currentScholarship?.university || 'Army West University (AWU)'}
							</p>

							{/* Institution Status Badge */}
							{currentScholarship?.institution && (
								<div className="mb-4">
									<InstitutionStatusBadge
										institution={currentScholarship.institution}
									/>
								</div>
							)}

							<div className="flex items-center gap-3 mb-4">
								{currentScholarship.institution && (
									<div className="mt-4">
										<Button
											onClick={() => {
												const institutionId =
													currentScholarship.institution.id ||
													currentScholarship.institution.userId
												if (institutionId) {
													router.push(`/institution-detail/${institutionId}`)
												} else {
													// No institution ID available
												}
											}}
											className="bg-[#126E64] hover:bg-[#0d5952] text-white"
										>
											View Institution Detail
										</Button>
									</div>
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
										const scholarshipId = currentScholarship?.id || params?.id
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
											isInWishlist(currentScholarship?.id || params?.id)
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
					id="application-status-section"
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

											{/* Upload Files Section - Direct upload, no modal */}
											<div className="">
												<FileUploadManagerWithOCR
													category="application-documents"
													onFilesUploaded={(uploadedFileData: any[]) => {
														if (
															!uploadedFileData ||
															uploadedFileData.length === 0
														)
															return

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

														// Merge with existing documents, deduplicate by URL
														const docsMap = new Map<string, any>()
														selectedDocuments.forEach((doc) => {
															docsMap.set(doc.url, doc)
														})
														newDocuments.forEach((doc) => {
															docsMap.set(doc.url, doc)
														})
														const updatedDocs = Array.from(docsMap.values())
														setSelectedDocuments(updatedDocs)

														// Convert to uploadedFiles format and dedupe
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
															`${uploadedFileData.length} file(s) uploaded successfully`
														)
													}}
													onValidationComplete={(
														tempId: string,
														validation: any
													) => {
														if (validation && validation.isValid === false) {
															showError(
																'Validation Failed',
																validation.message ||
																	'File failed validation. Please redact sensitive information and try again.'
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

					{hasApplied && applicationStatus !== 'REQUIRE_UPDATE' && (
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
												? 'We regret to inform you that your application was not selected this time. You can reapply below if you wish to submit a new application.'
												: applicationStatus === 'UPDATED'
													? 'Your application has been updated. The institution will review your changes.'
													: 'Your application has been submitted. You will receive updates via email.'}
									</p>
									{applicationStatus === 'REJECTED' &&
										// Only show reapply button if all applications for this post are REJECTED
										// Check if applications list has been fetched for this post
										lastFetchedPostId === currentScholarship?.id &&
										applications.length > 0 &&
										applications.every((app) => app.status === 'REJECTED') && (
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

					{/* Show helpful message when no files uploaded */}
					{!hasApplied && uploadedFiles.length === 0 && (
						<div className="text-center mb-4">
							<p className="text-amber-600 text-sm font-medium">
								📁 Please upload at least one document to submit your
								application
							</p>
						</div>
					)}

					<div className="flex gap-3 justify-center pt-10">
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
				{/* Recommended Scholarships Section */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Recommended Scholarships</h2>
					<p className="text-gray-600 mb-6">
						Similar scholarships based on discipline or degree level
					</p>

					{isLoadingRecommendations ? (
						<div className="flex items-center justify-center py-20">
							<div className="flex flex-col items-center gap-3">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#116E63]"></div>
								<p className="text-gray-600 text-sm">
									Loading recommendations...
								</p>
							</div>
						</div>
					) : isRecommendationsRestricted ? (
						<div className="flex flex-col items-center justify-center py-12 px-6">
							<div className="bg-gradient-to-br from-[#126E64]/10 to-[#126E64]/5 rounded-2xl p-8 text-center max-w-md">
								<div className="w-16 h-16 bg-[#126E64]/20 rounded-full flex items-center justify-center mx-auto mb-4">
									<Lock className="w-8 h-8 text-[#126E64]" />
								</div>
								<h3 className="text-xl font-semibold text-gray-800 mb-2">
									Unlock Personalized Recommendations
								</h3>
								<p className="text-gray-600 mb-6">
									Upgrade to Standard or Premium to see scholarships tailored to
									your profile and interests.
								</p>
								<Button
									onClick={() => router.push('/pricing')}
									className="bg-[#126E64] hover:bg-[#0d5a52] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
								>
									View Upgrade Options
								</Button>
							</div>
						</div>
					) : recommendedScholarships.length === 0 ? (
						<div className="flex justify-center items-center py-12">
							<p className="text-gray-500">
								No recommendations available at this time.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 h-[900px] overflow-auto overflow-x-hidden">
							{recommendedScholarships.map((scholarship, index) => (
								<ScholarshipCard
									key={scholarship.id}
									scholarship={scholarship}
									index={index}
									isWishlisted={isInWishlist(scholarship.id)}
									onWishlistToggle={(id: string) => toggleWishlistItem(id)}
									onClick={handleScholarshipClick}
								/>
							))}
						</div>
					)}
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
		</div>
	)
}

export default ScholarshipDetail
