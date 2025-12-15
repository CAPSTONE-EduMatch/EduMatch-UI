'use client'
import {
	Breadcrumb,
	Button,
	ErrorModal,
	Modal,
	ResearchLabCard,
} from '@/components/ui'
import {
	DocumentSelector,
	SelectedDocument,
} from '@/components/ui/DocumentSelector'

import FileUploadManagerWithOCR from '@/components/ui/layout/file-upload-manager-with-ocr'
import { useNotification } from '@/contexts/NotificationContext'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useResearchLabDetail } from '@/hooks/explore/useResearchLabDetail'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { applicationService } from '@/services/application/application-service'
import { ApplicationLimitError } from '@/types/api/application-errors'
import { formatUTCDateToLocal } from '@/utils/date'
import {
	downloadSessionProtectedFile,
	openSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, File, Heart, Lock, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const ResearchLabDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const { isAuthenticated } = useAuthCheck()
	const { currentPlan } = useSubscription()
	const [showAuthModal, setShowAuthModal] = useState(false)
	const t = useTranslations()

	// Check if we're viewing an application (from URL query param)
	const applicationIdFromUrl = searchParams?.get('applicationId')
	const fromParam = searchParams?.get('from')
	// Don't auto-load application tab if coming from application section
	const shouldAutoLoadApplicationTab =
		applicationIdFromUrl && fromParam !== 'application'

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist({
		autoFetch: true,
		isAuthenticated: isAuthenticated,
		initialParams: {
			page: 1,
			limit: 100,
			status: 1,
		},
	})

	const [activeTab, setActiveTab] = useState(
		shouldAutoLoadApplicationTab ? 'application' : 'job-description'
	)

	// Fetch research lab detail from API
	const labId = params?.id as string
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
	const [isResettingApplication, setIsResettingApplication] = useState(false)
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
		status?: boolean | string
		deletedAt?: string | null
	}) => {
		if (!institution) return null

		const statusValue =
			typeof institution.status === 'string'
				? institution.status.toLowerCase() === 'false'
					? false
					: institution.status.toLowerCase() === 'true'
						? true
						: undefined
				: institution.status

		// Check for deactivated account (status = false)
		if (statusValue === false) {
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
			status: string | boolean
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

	// Dynamic info items based on current lab data
	const infoItems = [
		{
			label: t('research_lab_detail.info.salary'),
			value: researchLab?.salary || 'Up to $2000',
		},
		{
			label: t('research_lab_detail.info.location'),
			value: researchLab?.country || 'Italy',
		},
		{
			label: t('research_lab_detail.info.job_type'),
			value: researchLab?.jobType || 'Researcher',
		},
		{
			label: t('research_lab_detail.info.deadline'),
			value: researchLab?.applicationDeadline || '07/07/2026',
		},
	]

	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [selectedDocuments, setSelectedDocuments] = useState<
		SelectedDocument[]
	>([])
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [showDocumentSelector, setShowDocumentSelector] = useState(false)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([
		{ label: t('breadcrumb.explore'), href: '/explore' },
		{ label: t('research_lab_detail.breadcrumb.research_labs') },
	])

	// Update breadcrumb when component mounts or research lab data changes
	useEffect(() => {
		const updateBreadcrumb = () => {
			const fromTab = searchParams?.get('from') || 'research'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams?.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			const labName =
				researchLab?.title || t('research_lab_detail.breadcrumb.research_labs')

			let items: Array<{ label: string; href?: string }> = [
				{ label: t('breadcrumb.explore'), href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: t('program_detail.breadcrumb.programmes'),
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'scholarships') {
				items.push({
					label: t('scholarship_detail.breadcrumb.scholarships'),
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: t('research_lab_detail.breadcrumb.research_labs'),
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, researchLab?.title])

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
			// Don't fetch if user is not authenticated
			if (!isAuthenticated) {
				return
			}

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
		[lastFetchedPostId, isAuthenticated]
	)

	// Fetch applications for this post when application tab is active
	useEffect(() => {
		if (
			activeTab === 'application' &&
			researchLab?.id &&
			isAuthenticated &&
			lastFetchedPostId !== researchLab.id &&
			!isAutoLoadingApplication
		) {
			fetchApplicationsForPost(researchLab.id)
		}
	}, [
		activeTab,
		isAuthenticated,
		researchLab?.id,
		lastFetchedPostId,
		isAutoLoadingApplication,
		fetchApplicationsForPost,
	])

	// Check for existing application when component loads
	useEffect(() => {
		// Skip if we're resetting application to prevent flash
		if (isResettingApplication) {
			return
		}
		const researchLabId = researchLab?.id || params?.id
		// Skip if applicationIdFromUrl exists - fetchSelectedApplication will handle loading
		// Only check if user is authenticated
		if (
			researchLabId &&
			isAuthenticated &&
			!isCheckingApplication &&
			!applicationIdFromUrl
		) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				checkExistingApplication(researchLabId as string)
			}, 200) // 200ms delay

			return () => clearTimeout(timeoutId)
		}
	}, [
		researchLab?.id,
		params?.id,
		applicationIdFromUrl,
		isAuthenticated,
		isResettingApplication,
	]) // Added isResettingApplication to prevent checks during reset

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
				if (fromParam === 'application' && researchLab?.id) {
					setActiveTab('application')
					// Fetch applications list for the "My Applications" tab
					if (lastFetchedPostId !== researchLab.id) {
						fetchApplicationsForPost(researchLab.id)
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
					// If researchLab is not loaded yet, wait a bit for it to load
					// This handles page reload scenarios where research lab data might not be ready
					const delay = researchLab?.id ? 0 : 300
					setTimeout(() => {
						fetchSelectedApplication(applicationIdFromUrl, false)
					}, delay)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [applicationIdFromUrl, fromParam, researchLab?.id, hasApplied])

	// Fetch recommended research labs when researchLab is loaded
	useEffect(() => {
		if (researchLab) {
			fetchRecommendedResearchLabs(researchLab)
		}
	}, [researchLab])

	// Fetch recommended research labs using the new recommend API
	const fetchRecommendedResearchLabs = async (lab: any) => {
		if (!lab?.id) return

		try {
			setIsLoadingRecommendations(true)
			setIsRecommendationsRestricted(false)

			// Use the new recommend API endpoint
			const response = await fetch(
				`/api/explore/research/research-detail/recommend?researchLabId=${lab.id}`,
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
					// Check if recommendations are restricted by plan
					if (data.restricted) {
						setIsRecommendationsRestricted(true)
						setRecommendedResearchLabs([])
					} else {
						setRecommendedResearchLabs(data.data)
					}
				} else {
					setRecommendedResearchLabs([])
				}
			} else {
				setRecommendedResearchLabs([])
			}
		} catch (error) {
			setRecommendedResearchLabs([])
		} finally {
			setIsLoadingRecommendations(false)
		}
	}

	// Handle application click from My Applications tab
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

		// Fetch full application details in the background without showing loading
		await fetchSelectedApplication(clickedApp.applicationId, false)

		// Reset flag after a short delay
		setTimeout(() => {
			isHandlingClickRef.current = false
		}, 100)
	}

	// Check if user has already applied to this post
	const checkExistingApplication = async (researchLabId: string) => {
		// Don't check if user is not authenticated
		if (!isAuthenticated) {
			return false
		}

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
					(app) => app.postId === researchLabId
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
												doc.document_type_id ||
												`doc_${existingApplication.applicationId}_${index}_${Math.random().toString(36).substr(2, 9)}`,
											name: doc.name,
											url: doc.url,
											size: doc.size || 0,
											documentType: doc.documentType || 'application-document',
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
										if (researchLab?.id) {
											fetchApplicationsForPost(researchLab.id)
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
		const researchLabId = researchLab?.id || params?.id
		if (!researchLabId) {
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
						await checkExistingApplication(researchLabId as string)
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
				'You have already applied to this research lab. You cannot submit multiple applications.',
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
				postId:
					typeof researchLabId === 'string'
						? researchLabId
						: String(researchLabId),
				// Only include uploaded files (source === 'new'), not profile documents (source === 'existing')
				documents: uploadedFiles
					.filter((file) => file.source === 'new')
					.map((file) => ({
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
				showSuccess(
					'Application Submitted!',
					'Your application has been submitted successfully. You will receive updates via email.'
				)
				// Refresh to get full application details
				if (response.application.applicationId) {
					await fetchSelectedApplication(response.application.applicationId)
				}
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
					'You have already applied to this research lab. You cannot submit multiple applications.',
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

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams?.get('from') || 'research'

			const labName = researchLab?.title || 'AI Research Lab'

			let items: Array<{ label: string; href?: string }> = [
				// { label: 'Explore', href: '/explore' },
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

	const handleResearchLabClick = (researchLabId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams?.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		currentParams.delete('applicationId') // Remove 'applicationId' as it's specific to the previous post
		const paramsString = currentParams.toString()

		// Navigate to research lab detail page
		router.push(
			`/explore/research-labs/${researchLabId}?from=research${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const menuItems = [
		{
			id: 'job-description',
			label: t('research_lab_detail.tabs.job_description'),
		},
		{
			id: 'offer-information',
			label: t('research_lab_detail.tabs.offer_information'),
		},
		{
			id: 'job-requirements',
			label: t('research_lab_detail.tabs.job_requirements'),
		},
		{
			id: 'other-information',
			label: t('research_lab_detail.tabs.other_information'),
		},
		{ id: 'application', label: t('research_lab_detail.tabs.application') },
	]

	const renderTabContent = () => {
		if (loading) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">
						{t('research_lab_detail.loading')}
					</div>
				</div>
			)
		}

		if (error) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-red-500">
						{t('research_lab_detail.error')}: {error}
					</div>
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
									{t('research_lab_detail.job_description.research_field')}
								</span>
								<div
									className="mt-2 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html: researchLab.researchFields,
									}}
								/>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.start_date')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.startDate ||
										t('research_lab_detail.job_description.not_specified')}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.deadline')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.applicationDeadline ||
										t('research_lab_detail.job_description.not_specified')}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.country')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.country ||
										t('research_lab_detail.job_description.not_specified')}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.contract_type')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.contractType ||
										t('research_lab_detail.job_description.not_specified')}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.attendance')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.attendance ||
										t('research_lab_detail.job_description.not_specified')}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.job_type')}
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.jobType || 'Researcher'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.job_description.detail_description')}
								</span>
								<div
									className="mt-2 text-gray-700 prose prose-content max-w-none"
									dangerouslySetInnerHTML={{
										__html:
											researchLab.description ||
											researchLab.mainResponsibility ||
											t('research_lab_detail.job_description.no_description'),
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
								<span className="font-bold text-gray-900">
									{t('research_lab_detail.offer_information.salary')}
								</span>{' '}
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
								<p className="font-bold text-gray-900 mb-3">
									{t('research_lab_detail.offer_information.benefit')}
								</p>
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
										{t(
											'research_lab_detail.job_requirements.main_responsibilities'
										)}
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
									{t(
										'research_lab_detail.job_requirements.qualification_requirements'
									)}
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
									{t(
										'research_lab_detail.job_requirements.experience_requirements'
									)}
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
									{t(
										'research_lab_detail.job_requirements.assessment_criteria'
									)}
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
										{t(
											'research_lab_detail.job_requirements.other_requirements'
										)}
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
									{t('research_lab_detail.job_requirements.technical_skills')}
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.technicalSkills}
								</div>
							</div>
						)}

						{researchLab.academicBackground && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									{t(
										'research_lab_detail.job_requirements.academic_background'
									)}
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
								{t('research_lab_detail.other_information.title')}
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

			case 'application':
				// Show applications list - clicking will update the Application Status section below
				return (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-gray-900">
							{t('research_lab_detail.applications_list.title')}
						</h2>

						{loadingApplications && lastFetchedPostId !== researchLab?.id ? (
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
												{t(
													'research_lab_detail.applications_list.table_headers.date'
												)}
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												{t(
													'research_lab_detail.applications_list.table_headers.status'
												)}
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												{t(
													'research_lab_detail.applications_list.table_headers.documents'
												)}
											</th>
										</tr>
									</thead>
									{/* Warning banner for reapply limit */}
									{applications.length > 0 &&
										(() => {
											const maxReapplyCount = Math.max(
												...applications.map((app: any) => app.reapplyCount || 0)
											)
											// reapplyCount is the number of reapplies, so total applications = 1 + reapplyCount
											// Remaining = 3 - (1 + maxReapplyCount) = 2 - maxReapplyCount
											const totalApplications = 1 + maxReapplyCount
											const remaining = 3 - totalApplications
											return (
												<thead className="bg-transparent">
													<tr>
														<td colSpan={3} className="px-6 py-3">
															<div
																className={`rounded-lg p-4 border ${
																	remaining <= 0
																		? 'bg-red-50 border-red-200'
																		: remaining === 1
																			? 'bg-amber-50 border-amber-200'
																			: 'bg-blue-50 border-blue-200'
																}`}
															>
																<div className="flex items-start gap-3">
																	<div
																		className={`text-xl ${
																			remaining <= 0
																				? 'text-red-600'
																				: remaining === 1
																					? 'text-amber-600'
																					: 'text-blue-600'
																		}`}
																	>
																		⚠️
																	</div>
																	<div className="flex-1">
																		<p
																			className={`text-sm font-medium ${
																				remaining <= 0
																					? 'text-red-800'
																					: remaining === 1
																						? 'text-amber-800'
																						: 'text-blue-800'
																			}`}
																		>
																			{remaining <= 0
																				? t(
																						'research_lab_detail.apply.reapply_limit_reached'
																					)
																				: remaining === 1
																					? t(
																							'research_lab_detail.apply.reapply_limit_warning',
																							{
																								remaining: remaining,
																							}
																						)
																					: t(
																							'research_lab_detail.apply.reapply_limit_info',
																							{
																								remaining: remaining,
																							}
																						)}
																		</p>
																	</div>
																</div>
															</div>
														</td>
													</tr>
												</thead>
											)
										})()}
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
													{t(
														'research_lab_detail.applications_list.documents_count',
														{ count: app.documents?.length || 0 }
													)}
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
									{t('research_lab_detail.applications_list.empty.title')}
								</p>
								<p className="text-sm text-gray-500 mt-2">
									{t('research_lab_detail.applications_list.empty.message')}
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
					<p className="mt-4 text-gray-600">
						{t('research_lab_detail.loading')}
					</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 text-lg">
						{t('research_lab_detail.error')}: {error}
					</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
					>
						{t('buttons.retry')}
					</button>
				</div>
			</div>
		)
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
								{researchLab?.title || t('research_lab_detail.header.job_name')}
							</h1>
							<p className="text-gray-600 mb-4">
								{t('research_lab_detail.header.provided_by', {
									organization:
										researchLab?.organization ||
										t('research_lab_detail.header.job_name'),
								})}
							</p>

							{/* Institution Status Badge */}
							<InstitutionStatusBadge institution={researchLab?.institution} />

							<div className="flex items-center gap-3 mb-4">
								{researchLab?.institution && (
									<Button
										onClick={() => {
											const institutionId =
												researchLab.institution.id ||
												researchLab.institution.userId
											if (institutionId) {
												router.push(`/institution-detail/${institutionId}`)
											} else {
												// eslint-disable-next-line no-console
												console.warn('No institution ID available')
											}
										}}
										className="bg-[#126E64] hover:bg-[#0d5952] text-white"
									>
										{t('research_lab_detail.header.institution_detail_button')}
									</Button>
								)}
								{researchLab?.institution?.userId &&
									currentPlan !== 'free' &&
									lastFetchedPostId === researchLab?.id &&
									applications.length > 0 && (
										<Button
											onClick={() => {
												const contactUrl = `/messages?contact=${(researchLab.institution as any).userId}`
												router.push(contactUrl)
											}}
											variant="outline"
											className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
										>
											{t('research_lab_detail.header.contact_button')}
										</Button>
									)}
								{/* Hide wishlist button if post is closed, deleted, or rejected */}
								{researchLab?.status !== 'CLOSED' &&
									researchLab?.status !== 'DELETED' &&
									researchLab?.status !== 'REJECTED' && (
										<motion.button
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
												const labId =
													researchLab?.id ||
													(typeof params?.id === 'string'
														? params?.id
														: String(params?.id))
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
															(typeof params?.id === 'string'
																? params?.id
																: String(params?.id))
													)
														? 'fill-red-500 text-red-500'
														: 'text-gray-400 hover:text-red-500'
												}`}
											/>{' '}
										</motion.button>
									)}
							</div>

							<p className="text-sm text-gray-500">
								{t('research_lab_detail.header.applications_count', {
									count: researchLab?.applicationCount || 0,
								})}
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
					<h2 className="text-3xl font-bold mb-6">
						{t('research_lab_detail.about.title')}
					</h2>

					{loading ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-gray-500">
								{t('research_lab_detail.loading')}
							</div>
						</div>
					) : error ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-red-500">
								{t('research_lab_detail.error')}: {error}
							</div>
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
					id="application-status-section"
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="relative p-8 bg-white py-6 shadow-xl border"
				>
					{/* Loading overlay with blur to prevent flash */}
					{isResettingApplication && (
						<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
							<div className="flex flex-col items-center gap-3">
								<div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
								<p className="text-sm text-gray-600">
									{t('research_lab_detail.apply.resetting') || 'Resetting...'}
								</p>
							</div>
						</div>
					)}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-3xl font-bold">
							{hasApplied
								? t('research_lab_detail.apply.title_applied')
								: t('research_lab_detail.apply.title_not_applied')}
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
										{t('research_lab_detail.congratulations.title')}
									</h3>
									<p className="text-lg text-green-700 mb-4">
										{t('research_lab_detail.congratulations.message')}
									</p>
									<div className="bg-white rounded-lg p-4 border border-green-200">
										<p className="text-sm text-green-600 font-medium">
											{t('research_lab_detail.congratulations.status_label')}{' '}
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
												{t('research_lab_detail.apply.edit_documents')}
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
												{t('research_lab_detail.apply.cancel_edit')}
											</Button>
										</div>
									)}
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
											{t(
												'research_lab_detail.apply.document_requirements.no_specific'
											)}
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
													onClick={() => {
														if (!isAuthenticated) {
															setShowAuthModal(true)
															return
														}
														setShowDocumentSelector(true)
													}}
													variant="outline"
													className="border-[#126E64] text-[#126E64] hover:bg-teal-50 px-8 py-3"
													disabled={!isAuthenticated}
												>
													{t('research_lab_detail.apply.select_profile_button')}
												</Button>
												<p className="text-sm text-gray-500 mt-2">
													{!isAuthenticated
														? t('auth.required.message') ||
															'Please sign in to select documents from your profile.'
														: t(
																'research_lab_detail.apply.select_profile_hint'
															)}
												</p>
											</div>

											{/* Divider with OR */}
											<div className="flex items-center gap-4">
												<div className="flex-1 border-t border-gray-300"></div>
												<span className="text-sm font-medium text-gray-500">
													{t('research_lab_detail.apply.or_divider')}
												</span>
												<div className="flex-1 border-t border-gray-300"></div>
											</div>

											{/* Upload Files Section - Direct upload, no modal */}
											<div className="">
												<FileUploadManagerWithOCR
													category="application-documents"
													isAuthenticated={isAuthenticated}
													onAuthRequired={() => setShowAuthModal(true)}
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
													{t('research_lab_detail.apply.documents_uploaded', {
														count: uploadedFiles.length,
														plural: uploadedFiles.length !== 1 ? 's' : '',
													})}
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
																			? t(
																					'research_lab_detail.apply.from_profile_badge'
																				)
																			: t(
																					'research_lab_detail.apply.uploaded_badge'
																				)}
																	</span>
																)}
															</div>
															<div className="flex items-center gap-2 text-xs text-gray-500">
																<span>
																	{file.size
																		? t('research_lab_detail.apply.file_size', {
																				size: (file.size / 1024).toFixed(1),
																			})
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
																{t('research_lab_detail.apply.view_button')}
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => removeFile(file.id)}
																className="text-red-500 border-red-500 hover:bg-red-50"
															>
																{t('research_lab_detail.apply.remove_button')}
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
											{t('research_lab_detail.apply.uploading_progress')}
										</p>
										{uploadProgress.map((progress) => (
											<div key={progress.fileIndex} className="space-y-1">
												<div className="flex justify-between text-sm">
													<span>
														{t('research_lab_detail.apply.file_progress', {
															index: progress.fileIndex + 1,
														})}
													</span>
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
					{!isResettingApplication &&
						hasApplied &&
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
												? t(
														'research_lab_detail.apply.status_messages.accepted'
													)
												: applicationStatus === 'REJECTED'
													? t(
															'research_lab_detail.apply.status_messages.rejected'
														)
													: applicationStatus === 'UPDATED'
														? t(
																'research_lab_detail.apply.status_messages.updated'
															)
														: t(
																'research_lab_detail.apply.status_messages.submitted'
															)}
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
												? t(
														'research_lab_detail.apply.status_messages.accepted_message'
													)
												: applicationStatus === 'REJECTED'
													? t(
															'research_lab_detail.apply.status_messages.rejected_message'
														)
													: applicationStatus === 'UPDATED'
														? t(
																'research_lab_detail.apply.status_messages.updated_message'
															)
														: t(
																'research_lab_detail.apply.status_messages.submitted_message'
															)}
										</p>
										{applicationStatus === 'REJECTED' && (
											<div className="mt-4">
												{/* Check if post is closed, deleted, or rejected */}
												{['CLOSED', 'DELETED', 'REJECTED'].includes(
													researchLab?.status || ''
												) ? (
													<div className="rounded-lg p-4">
														<p className="text-sm text-red-800">
															{t(
																'research_lab_detail.apply.post_closed_message'
															)}
														</p>
													</div>
												) : (
													// Only show reapply button if all applications for this post are REJECTED
													// and post is not closed
													lastFetchedPostId === researchLab?.id &&
													applications.length > 0 &&
													applications.every(
														(app) => app.status === 'REJECTED'
													) && (
														<Button
															onClick={async () => {
																// Set loading state immediately to hide rejected section
																setIsResettingApplication(true)
																// Use flushSync to force immediate state updates and prevent flash
																flushSync(() => {
																	setHasApplied(false)
																	setApplicationStatus(null)
																	setApplicationId(null)
																	setPendingApplication(null)
																	setUploadedFiles([])
																	setSelectedDocuments([])
																})
																// Switch to job-description tab if on application tab
																if (activeTab === 'application') {
																	setActiveTab('job-description')
																}
																// Remove applicationId from URL to show apply section
																const newUrl = new URL(window.location.href)
																newUrl.searchParams.delete('applicationId')
																// Use push instead of replace to ensure navigation happens
																await router.push(
																	newUrl.pathname + newUrl.search,
																	{
																		scroll: false,
																	}
																)
																// Force a longer delay to ensure URL change is processed,
																// all useEffects have run, and any fetches are blocked
																await new Promise((resolve) =>
																	setTimeout(resolve, 500)
																)
																// Clear loading state after everything is settled
																setIsResettingApplication(false)
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
																}, 150)
															}}
															className="bg-[#126E64] hover:bg-teal-700 text-white"
														>
															{t('research_lab_detail.apply.reapply_button')}
														</Button>
													)
												)}
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
									{t('research_lab_detail.apply.documents_uploaded', {
										count: uploadedFiles.length,
										plural: uploadedFiles.length !== 1 ? 's' : '',
									})}
								</span>
								{applicationStatus === 'SUBMITTED' && (
									<Button
										variant="outline"
										onClick={async () => {
											// Check subscription eligibility before allowing edit
											try {
												const eligibilityResponse = await fetch(
													'/api/applications/eligibility',
													{
														method: 'GET',
														headers: {
															'Content-Type': 'application/json',
														},
														credentials: 'include',
													}
												)
												const eligibilityData = await eligibilityResponse.json()

												if (!eligibilityData.eligibility?.canApply) {
													showError(
														'Subscription Required',
														'You need an active Standard or Premium subscription to edit applications.',
														{
															onRetry: () => router.push('/pricing'),
															showRetry: true,
															retryText: 'Upgrade Now',
														}
													)
													return
												}
											} catch (eligibilityError) {
												showError(
													'Error',
													'Failed to verify subscription status. Please try again.'
												)
												return
											}

											// Proceed with edit mode setup
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
															crypto.randomUUID(),
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
													document_id: file.id || crypto.randomUUID(),
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
										{t('research_lab_detail.apply.edit_documents_button')}
									</Button>
								)}
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
									<p>{t('research_lab_detail.apply.documents_description')}</p>
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
															? t(
																	'research_lab_detail.apply.from_profile_badge'
																)
															: t('research_lab_detail.apply.uploaded_badge')}
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 text-xs text-gray-500">
												<span>
													{t('research_lab_detail.apply.file_size', {
														size: (file.size / 1024).toFixed(1),
													})}
												</span>
												{file.uploadDate && (
													<>
														<span>•</span>
														<span>
															{t('research_lab_detail.apply.uploaded_label')}{' '}
															{formatUTCDateToLocal(file.uploadDate)}
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
												{t('research_lab_detail.apply.view_button')}
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
												{t('research_lab_detail.apply.download_button')}
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
								{t('research_lab_detail.apply.upload_warning')}
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
								{t('research_lab_detail.apply.remove_all_button')}
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
								t('research_lab_detail.apply.application_submitted')
							) : isApplying ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									{t('research_lab_detail.apply.submitting_button')}
								</div>
							) : isUploading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									{t('research_lab_detail.apply.uploading_files_button')}
								</div>
							) : isCheckingApplication ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									{t('research_lab_detail.apply.checking_button')}
								</div>
							) : uploadedFiles.length === 0 ? (
								t('research_lab_detail.apply.upload_files_button')
							) : (
								t('research_lab_detail.apply.submit_button')
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
						<h2 className="text-3xl font-bold mb-6">
							{t('research_lab_detail.recommendations.title')}
						</h2>

						{/* Show loading state */}
						{isLoadingRecommendations ? (
							<div className="flex justify-center items-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
							</div>
						) : isRecommendationsRestricted ? (
							<div className="flex flex-col items-center justify-center py-12 px-6">
								<div className="bg-gradient-to-br from-[#126E64]/10 to-[#126E64]/5 rounded-2xl p-8 text-center max-w-md">
									<div className="w-16 h-16 bg-[#126E64]/20 rounded-full flex items-center justify-center mx-auto mb-4">
										<Lock className="w-8 h-8 text-[#126E64]" />
									</div>
									<h3 className="text-xl font-semibold text-gray-800 mb-2">
										{t('research_lab_detail.recommendations.upgrade.title')}
									</h3>
									<p className="text-gray-600 mb-6">
										{t('research_lab_detail.recommendations.upgrade.message')}
									</p>
									<Button
										onClick={() => router.push('/pricing')}
										className="bg-[#126E64] hover:bg-[#0d5a52] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
									>
										{t('research_lab_detail.recommendations.upgrade.button')}
									</Button>
								</div>
							</div>
						) : recommendedResearchLabs.length === 0 ? (
							<div className="flex justify-center items-center py-12">
								<p className="text-gray-500">
									{t('research_lab_detail.recommendations.no_recommendations')}
								</p>
							</div>
						) : (
							<div className="relative h-[900px] overflow-y-auto overflow-x-hidden">
								{recommendedResearchLabs.slice(0, 9).map((lab, index) => (
									<div key={lab.id} className="mb-7">
										<ResearchLabCard
											lab={lab}
											index={index}
											isWishlisted={isInWishlist(lab.id)}
											onWishlistToggle={() => toggleWishlistItem(lab.id)}
											onClick={handleResearchLabClick}
										/>
									</div>
								))}
							</div>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showDeleteConfirmModal}
				onClose={() => setShowDeleteConfirmModal(false)}
				title={t('research_lab_detail.modals.delete_confirm.title')}
				maxWidth="sm"
			>
				<div className="space-y-6">
					<p className="text-gray-600">
						{t('research_lab_detail.modals.delete_confirm.message')}
					</p>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirmModal(false)}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							{t('research_lab_detail.modals.delete_confirm.cancel')}
						</Button>
						<Button
							onClick={removeAllFiles}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							{t('research_lab_detail.modals.delete_confirm.confirm')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Cancel Edit Confirmation Modal */}
			<Modal
				isOpen={showCancelEditModal}
				onClose={() => setShowCancelEditModal(false)}
				title={t('research_lab_detail.modals.cancel_edit.title')}
				maxWidth="sm"
			>
				<div className="space-y-6">
					<p className="text-gray-600">
						{t('research_lab_detail.modals.cancel_edit.message')}
					</p>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => setShowCancelEditModal(false)}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							{t('research_lab_detail.modals.cancel_edit.keep')}
						</Button>
						<Button
							onClick={handleCancelEdit}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							{t('research_lab_detail.modals.cancel_edit.discard')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Authentication Required Modal */}
			<ErrorModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				title={t('research_lab_detail.modals.auth_required.title')}
				message={t('research_lab_detail.modals.auth_required.message')}
				buttonText={t('research_lab_detail.modals.auth_required.sign_in')}
				onButtonClick={handleSignIn}
				showSecondButton={true}
				secondButtonText={t('research_lab_detail.modals.auth_required.sign_up')}
				onSecondButtonClick={handleSignUp}
				showCloseButton={true}
			/>

			{/* Document Selector Modal */}
			<Modal
				isOpen={showDocumentSelector}
				onClose={() => setShowDocumentSelector(false)}
				title={t('research_lab_detail.modals.document_selector.title')}
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
												{t(
													'research_lab_detail.modals.document_selector.summary.selected',
													{
														count: profileCount,
														plural: profileCount !== 1 ? 's' : '',
													}
												)}
											</p>
											<p className="text-sm text-gray-500">
												{t(
													'research_lab_detail.modals.document_selector.summary.ready'
												)}
											</p>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
											<File className="w-5 h-5 text-gray-400" />
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{t(
													'research_lab_detail.modals.document_selector.summary.none_selected'
												)}
											</p>
											<p className="text-sm text-gray-500">
												{t(
													'research_lab_detail.modals.document_selector.summary.choose_files'
												)}
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
								{t('research_lab_detail.modals.document_selector.cancel')}
							</Button>
							<Button
								onClick={() => {
									setShowDocumentSelector(false)
									const profileDocuments = selectedDocuments.filter(
										(doc) => doc.source === 'existing'
									)
									if (profileDocuments.length > 0) {
										showSuccess(
											t('research_lab_detail.modals.document_selector.success'),
											t(
												'research_lab_detail.modals.document_selector.success_message',
												{
													count: profileDocuments.length,
													plural: profileDocuments.length !== 1 ? 's' : '',
												}
											)
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
									t('research_lab_detail.modals.document_selector.select_first')
								) : (
									<div className="flex items-center gap-2">
										<span>
											{t(
												'research_lab_detail.modals.document_selector.continue'
											)}
										</span>
									</div>
								)}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ResearchLabDetail
