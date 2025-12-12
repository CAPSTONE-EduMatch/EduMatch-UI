'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
	Search,
	Paperclip,
	Send,
	Check,
	CheckCheck,
	User,
	Mail,
	GraduationCap,
	FileText,
	Lock,
	Building2,
	MapPin,
	Loader2,
} from 'lucide-react'
import { useAppSyncMessaging } from '@/hooks/messaging/useAppSyncMessaging'
import { FileUpload } from './FileUpload'
import { formatFileSize } from '@/utils/file/file-utils'
import { MessageAvatar } from './MessageAvatar'
import { MessageImage } from './MessageImage'
import { ProtectedImg } from '@/components/ui/ProtectedImage'
import {
	openSessionProtectedFile,
	downloadSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { useUserProfile } from '@/hooks/profile/useUserProfile'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import {
	formatUTCTimeToLocal,
	formatUTCDateToLocal,
	getDateInTimezone,
	getUserTimezone,
} from '@/utils/date'

interface Message {
	id: string
	threadId: string
	senderId: string
	content: string
	sender: {
		id: string
		name: string
		image?: string | null
	}
	fileUrl?: string
	fileName?: string
	fileSize?: number
	mimeType?: string
	isRead: boolean
	readAt?: Date
	createdAt: Date
}

interface Thread {
	id: string
	title: string
	lastMessage?: Message
	participants: Array<{
		id: string
		name: string
		image?: string
		status?: string
		userType?: 'applicant' | 'institution' | 'unknown'
	}>
	unreadCount: number
	updatedAt: Date
}

interface User {
	id: string
	name: string
	email: string
	image?: string | null
	status?: 'online' | 'offline'
	userType?: 'applicant' | 'institution' | 'unknown'
}

interface ContactApplicant {
	id: string
	name: string
	email: string
	image?: string
	degreeLevel?: string
	subDiscipline?: string
	status: string
	postTitle?: string
	// Institution fields
	institutionType?: string
	institutionCountry?: string
	institutionAbbreviation?: string
	userType?: 'applicant' | 'institution' | 'unknown'
}

interface MessageDialogProps {
	threadId?: string
}

export function MessageDialog({
	threadId: threadIdProp,
}: MessageDialogProps = {}) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const [user, setUser] = useState<any>(null)
	const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [isLoadingThread, setIsLoadingThread] = useState(false)
	const [threadIdFromUrl, setThreadIdFromUrl] = useState<string | null>(null)

	// Extract threadId from URL path if not passed as prop
	// Also listen to popstate events to handle browser back/forward
	useEffect(() => {
		const updateThreadIdFromUrl = () => {
			if (!threadIdProp && typeof window !== 'undefined') {
				const pathname = window.location.pathname
				const match = pathname.match(/\/messages\/([^/]+)/)
				if (match) {
					setThreadIdFromUrl(match[1])
				} else {
					setThreadIdFromUrl(null)
				}
			}
		}

		// Initial update
		updateThreadIdFromUrl()

		// Listen to popstate for browser back/forward
		window.addEventListener('popstate', updateThreadIdFromUrl)

		return () => {
			window.removeEventListener('popstate', updateThreadIdFromUrl)
		}
	}, [threadIdProp])

	const threadId = threadIdProp || threadIdFromUrl
	const [users, setUsers] = useState<User[]>([])
	const [usersLoaded, setUsersLoaded] = useState(false)
	const [refreshingUsers, setRefreshingUsers] = useState(false)
	const [contactApplicant, setContactApplicant] =
		useState<ContactApplicant | null>(null)
	const [showContactPreview, setShowContactPreview] = useState(false)
	// State for loading thread detection
	const [isCheckingThread, setIsCheckingThread] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [showFileUpload, setShowFileUpload] = useState(false)
	const [newMessage, setNewMessage] = useState('')
	const [isTyping, setIsTyping] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [isInitialLoad, setIsInitialLoad] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
	const processedContactRef = useRef<string | null>(null) // Track processed contact to prevent re-processing
	const isManuallySelectingRef = useRef(false) // Track manual thread selection to prevent useEffect conflicts

	// Get user profile and subscription
	const { profile, isLoading: profileLoading } = useUserProfile()
	const {
		currentPlan,
		loading: subscriptionLoading,
		upgradeSubscription,
	} = useSubscription()

	// Check if user is applicant with free subscription
	// Wait for both profile and subscription to load before making decision
	const isApplicant = profile?.role === 'applicant'
	const isFreePlan = currentPlan === 'free' || currentPlan === null
	// Only allow reply if we've loaded both profile and subscription, and user is not a free plan applicant
	const canReply =
		profileLoading || subscriptionLoading
			? false // Disable while loading to prevent premature replies
			: !isApplicant || !isFreePlan

	// Use AppSync messaging hook
	const {
		messages,
		threads: appSyncThreads,
		sendMessage: sendAppSyncMessage,
		startNewThread,
		selectThread,
		loadMessages,
		clearUnreadCount,
		loadThreads,
		loading: threadsLoading,
		user: appSyncUser,
	} = useAppSyncMessaging()

	// Use user from AppSync hook
	useEffect(() => {
		if (appSyncUser) {
			setUser(appSyncUser)
		}
	}, [appSyncUser])

	// Handle threadId - navigate to specific thread
	// This effect only runs when threadId changes from URL/prop, not from manual selection
	useEffect(() => {
		const handleThreadSelection = async () => {
			if (!threadId || !user?.id) return

			// Skip if we're manually selecting a thread (to prevent conflicts)
			// Check this FIRST before doing anything else
			if (isManuallySelectingRef.current) {
				return
			}

			// Don't reload if we already have the correct thread selected and user is set
			// This prevents unnecessary reloads when manually selecting threads
			if (selectedThread?.id === threadId && selectedUser) {
				return
			}

			setIsLoadingThread(true)

			try {
				// If threads haven't loaded yet, wait for them to load first
				// This is important for page reloads when threads are empty initially
				if (appSyncThreads.length === 0 && !threadsLoading && loadThreads) {
					await loadThreads(true) // Force load threads
					// Wait a moment for threads to update
					await new Promise((resolve) => setTimeout(resolve, 300))
				}

				// Wait a bit for threads to load if they're still loading
				let attempts = 0
				while (appSyncThreads.length === 0 && threadsLoading && attempts < 15) {
					await new Promise((resolve) => setTimeout(resolve, 200))
					attempts++
				}

				// First, try to find thread in appSyncThreads
				// Use a more specific search to ensure we get the exact thread
				let thread = appSyncThreads.find((t: any) => t.id === threadId)

				// If thread not found in appSyncThreads, try to fetch it directly from API
				if (!thread) {
					try {
						const response = await fetch(`/api/threads`)
						if (response.ok) {
							const data = await response.json()
							if (data.success && data.threads) {
								const foundThread = data.threads.find(
									(t: any) => t.id === threadId
								)
								if (foundThread) {
									thread = foundThread
								}
							}
						}
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error('Failed to fetch thread:', error)
					}
				}

				// Only proceed if we found the exact thread matching threadId
				if (thread && thread.id === threadId) {
					// Find the other participant
					const otherParticipantId =
						thread.user1Id === user.id ? thread.user2Id : thread.user1Id

					// Fetch user data individually
					const otherUser = await fetchUserData(otherParticipantId)

					if (otherUser) {
						const threadObject: Thread = {
							id: thread.id,
							title: otherUser.name,
							participants: [
								{
									id: user.id,
									name: user.name || '',
									image: user.image,
									userType:
										profile?.role === 'institution'
											? 'institution'
											: 'applicant',
								},
								{
									id: otherUser.id,
									name: otherUser.name,
									image: otherUser.image,
									status: otherUser.status,
									userType: otherUser.userType || 'unknown',
								},
							],
							unreadCount: thread.unreadCount || 0,
							updatedAt: new Date(thread.updatedAt),
						}

						setSelectedThread(threadObject)
						setSelectedUser({
							id: otherUser.id,
							name: otherUser.name,
							email: otherUser.email,
							image: otherUser.image,
							status: otherUser.status,
							userType: otherUser.userType,
						})

						setIsInitialLoad(true)
						setShouldAutoScroll(true)
						selectThread(thread.id)
						await loadMessages(thread.id)
					}
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error loading thread:', error)
			} finally {
				setIsLoadingThread(false)
			}
		}

		handleThreadSelection()
		// Include appSyncThreads to find the thread, but use length check to prevent unnecessary re-runs
		// This ensures threads are loaded before trying to find the thread from URL (important for page reloads)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [threadId, user?.id, appSyncThreads.length, threadsLoading, loadThreads])

	// Handle contact parameter from URL with loading states
	useEffect(() => {
		const handleContactParam = async () => {
			const contactParam = searchParams?.get('contact')

			// If contact parameter is empty or invalid, clean up URL and reset state
			if (contactParam !== null && (!contactParam || !contactParam.trim())) {
				const url = new URL(window.location.href)
				url.searchParams.delete('contact')
				router.replace(url.pathname + url.search, { scroll: false })
				setIsCheckingThread(false)
				setShowContactPreview(false)
				setContactApplicant(null)
				processedContactRef.current = null
				return
			}

			// Reset processed ref if contact param changed (allows re-processing new contacts)
			if (
				contactParam &&
				processedContactRef.current &&
				processedContactRef.current !== contactParam
			) {
				processedContactRef.current = null
			}

			// Don't handle contact parameter if we're already in a specific thread
			// Skip if we've already processed this contact parameter (prevents re-processing)
			if (
				contactParam &&
				contactParam.trim() &&
				!threadId &&
				processedContactRef.current !== contactParam
			) {
				processedContactRef.current = contactParam // Mark as processed
				setIsCheckingThread(true)

				if (appSyncThreads.length > 0) {
					// Check if contactParam is JSON (old format) or just userId (new format)
					let userId: string
					let applicantData: any = null

					try {
						// Try to parse as JSON first (old format)
						applicantData = JSON.parse(decodeURIComponent(contactParam))
						userId = applicantData.id
					} catch (error) {
						// If parsing fails, treat as direct userId (new format)
						userId = contactParam
					}

					// Check if thread already exists using user ID
					const existingThread = appSyncThreads.find(
						(thread: any) =>
							thread.user1Id === userId || thread.user2Id === userId
					)

					if (existingThread) {
						// Navigate directly to existing thread - OPTIMIZED
						const threadObject: Thread = {
							id: existingThread.id,
							title: applicantData?.name || 'User',
							participants: [
								{
									id: user?.id || '',
									name: user?.name || '',
									image: user?.image,
								},
								{
									id: userId,
									name: applicantData?.name || 'User',
									image: applicantData?.image,
								},
							],
							unreadCount: existingThread.unreadCount || 0,
							updatedAt: new Date(existingThread.updatedAt),
						}
						setSelectedThread(threadObject)

						// Set initial state
						setIsInitialLoad(true)
						setShouldAutoScroll(true)

						// Use applicantData if available, otherwise fetch user data in parallel with loading messages
						if (applicantData) {
							// Use applicant data immediately - no API call needed
							setSelectedUser({
								id: userId,
								name: applicantData.name || 'User',
								email: applicantData.email || '',
								image: applicantData.image,
								status: 'offline', // Will be updated if user data is fetched
							})
						}

						// Load messages (selectThread already calls loadMessages, so we only need one)
						selectThread(existingThread.id)

						// Fetch user data only if we don't have applicantData (non-blocking)
						if (!applicantData) {
							fetch(`/api/users/${userId}`)
								.then((response) => {
									if (response.ok) {
										return response.json()
									}
									return null
								})
								.then((userData) => {
									if (userData?.user) {
										setSelectedUser({
											id: userId,
											name: userData.user.name || 'User',
											email: userData.user.email || '',
											image: userData.user.image,
											status: userData.user.status || 'offline',
											userType: userData.user.userType || 'unknown',
										})
									}
								})
								.catch(() => {
									// Silently fail - we already have basic data
								})
						}

						// Clear unread count (fire-and-forget, don't wait)
						clearUnreadCount(existingThread.id).catch(() => {
							// Silently fail
						})

						// Update URL using Next.js router for proper navigation
						router.push(`/messages/${existingThread.id}`, { scroll: false })
						// Clear processed ref since we've navigated away from contact param
						processedContactRef.current = null
						setIsCheckingThread(false)
					} else {
						// No existing thread - show preview for new contact
						if (applicantData) {
							// Old format with full applicant data - show preview
							setContactApplicant(applicantData)
							setShowContactPreview(true)
						} else {
							// New format with just userId - fetch user data and show preview
							try {
								const userResponse = await fetch(`/api/users/${userId}`)
								if (userResponse.ok) {
									const userData = await userResponse.json()
									const contactData = {
										id: userId,
										name: userData.user.name || 'User',
										email: userData.user.email || '',
										image: userData.user.image,
										degreeLevel: userData.user.degreeLevel || undefined,
										subDiscipline: userData.user.subDiscipline || undefined,
										status: userData.user.status || 'offline',
										postTitle:
											userData.user.userType === 'institution'
												? undefined
												: 'Application',
										institutionType: userData.user.institutionType || undefined,
										institutionCountry:
											userData.user.institutionCountry || undefined,
										institutionAbbreviation:
											userData.user.institutionAbbreviation || undefined,
										userType: userData.user.userType || 'unknown',
									}
									setContactApplicant(contactData)
									setShowContactPreview(true)
								} else {
									// Fallback - start thread directly and update URL
									const newThread = await startNewThread(userId)
									if (newThread?.id) {
										// Update URL using Next.js router
										router.replace(`/messages/${newThread.id}`)
									}
								}
							} catch (error) {
								// Fallback - start thread directly and update URL
								const newThread = await startNewThread(userId)
								if (newThread?.id) {
									// Update URL using Next.js router for proper navigation
									router.push(`/messages/${newThread.id}`, { scroll: false })
								}
							}
						}
					}
					setIsCheckingThread(false)
				} else {
					// Threads not loaded yet, wait for them
					const timeout = setTimeout(async () => {
						if (searchParams?.get('contact') && appSyncThreads.length === 0) {
							const contactParam = searchParams?.get('contact')
							if (contactParam) {
								try {
									// Try to parse as JSON first (old format)
									const applicantData = JSON.parse(
										decodeURIComponent(contactParam)
									)
									// If parsing succeeds, it's old format - show preview
									setContactApplicant(applicantData)
									setShowContactPreview(true)
								} catch (error) {
									// If parsing fails, it's new format - fetch user data and show preview
									try {
										const userResponse = await fetch(
											`/api/users/${contactParam}`
										)
										if (userResponse.ok) {
											const userData = await userResponse.json()
											const contactData = {
												id: contactParam,
												name: userData.user.name || 'User',
												email: userData.user.email || '',
												image: userData.user.image,
												degreeLevel: userData.user.degreeLevel || undefined,
												subDiscipline: userData.user.subDiscipline || undefined,
												status: userData.user.status || 'offline',
												postTitle:
													userData.user.userType === 'institution'
														? undefined
														: 'Application',
												institutionType:
													userData.user.institutionType || undefined,
												institutionCountry:
													userData.user.institutionCountry || undefined,
												institutionAbbreviation:
													userData.user.institutionAbbreviation || undefined,
												userType: userData.user.userType || 'unknown',
											}
											setContactApplicant(contactData)
											setShowContactPreview(true)
										} else {
											// Fallback - start thread directly
											await startNewThread(contactParam)

											// Clear the contact parameter from URL
											const url = new URL(window.location.href)
											url.searchParams.delete('contact')
											router.replace(url.pathname + url.search, {
												scroll: false,
											})
										}
									} catch (fetchError) {
										// Fallback - start thread directly
										await startNewThread(contactParam)

										// Clear the contact parameter from URL
										const url = new URL(window.location.href)
										url.searchParams.delete('contact')
										window.history.replaceState({}, '', url.toString())
									}
								}
							}
						}
						setIsCheckingThread(false)
					}, 3000)

					return () => clearTimeout(timeout)
				}
			}
		}

		handleContactParam()
	}, [
		searchParams,
		appSyncThreads.length, // Only depend on length, not the full array
		user?.id, // Only depend on user ID, not full user object
		threadId,
		// Removed isCheckingThread from dependencies - it's set inside the effect
	])

	// Auto-scroll to bottom
	const scrollToBottom = (smooth: boolean = true) => {
		messagesEndRef.current?.scrollIntoView({
			behavior: smooth ? 'smooth' : 'auto',
		})
	}

	// Manual refresh function removed - using individual user fetching instead

	// Handle starting chat with applicant
	const handleStartChat = async () => {
		if (!contactApplicant) return

		try {
			// Check if thread already exists
			const existingThread = appSyncThreads.find(
				(thread: any) =>
					thread.user1Id === contactApplicant.id ||
					thread.user2Id === contactApplicant.id
			)

			if (existingThread) {
				// Navigate to existing thread
				const threadObject: Thread = {
					id: existingThread.id,
					title: contactApplicant.name,
					participants: [
						{
							id: user?.id || '',
							name: user?.name || '',
							image: user?.image,
						},
						{
							id: contactApplicant.id,
							name: contactApplicant.name,
							image: contactApplicant.image,
						},
					],
					unreadCount: existingThread.unreadCount || 0,
					updatedAt: new Date(existingThread.updatedAt),
				}
				setSelectedThread(threadObject)

				// Fetch actual user data to get correct image and status
				try {
					const userResponse = await fetch(`/api/users/${contactApplicant.id}`)
					if (userResponse.ok) {
						const userData = await userResponse.json()
						setSelectedUser({
							id: contactApplicant.id,
							name: contactApplicant.name,
							email: userData.user.email || contactApplicant.email,
							image: userData.user.image || contactApplicant.image,
							status: userData.user.status || 'offline',
							userType:
								userData.user.userType ||
								contactApplicant.userType ||
								'unknown',
						})
					} else {
						// Fallback to applicant data if user fetch fails
						setSelectedUser({
							id: contactApplicant.id,
							name: contactApplicant.name,
							email: contactApplicant.email,
							image: contactApplicant.image,
							status: 'offline',
							userType: contactApplicant.userType || 'unknown',
						})
					}
				} catch (error) {
					// Fallback to applicant data if user fetch fails
					setSelectedUser({
						id: contactApplicant.id,
						name: contactApplicant.name,
						email: contactApplicant.email,
						image: contactApplicant.image,
						status: 'offline',
					})
				}

				selectThread(existingThread.id)
				await loadMessages(existingThread.id)

				// Clear unread count for this thread when selected
				try {
					await clearUnreadCount(existingThread.id)
				} catch (error) {
					// Handle error silently
				}
			} else {
				// Create a new thread with the applicant
				const newThread = await startNewThread(contactApplicant.id)
				if (newThread?.id) {
					// Update URL using Next.js router for proper navigation
					router.push(`/messages/${newThread.id}`, { scroll: false })
					return
				}
			}

			setShowContactPreview(false)
			setContactApplicant(null)
		} catch (error) {
			// Handle error silently
		}
	}

	// Handle closing contact preview
	const handleCloseContactPreview = () => {
		setShowContactPreview(false)
		setContactApplicant(null)
		// Navigate back to messages list
		window.history.back()
	}

	// Check if thread already exists with contact applicant
	const checkExistingThread = (applicantId: string) => {
		const hasThread = appSyncThreads.some((thread: any) => {
			const isMatch =
				thread.user1Id === applicantId || thread.user2Id === applicantId
			return isMatch
		})
		return hasThread
	}

	// Handle message input changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewMessage(e.target.value)

		// Start typing indicator (not implemented in AppSync version yet)
		if (!isTyping && e.target.value.trim()) {
			setIsTyping(true)
			// Typing functionality not implemented in AppSync version yet
		}

		// Stop typing if input is empty (not implemented in AppSync version yet)
		if (isTyping && !e.target.value.trim()) {
			setIsTyping(false)
			// Typing functionality not implemented in AppSync version yet
		}
	}

	// Handle file upload
	const handleFileUpload = async (file: File) => {
		if (!selectedThread || !canReply) {
			return
		}

		setIsUploading(true)
		try {
			// Create FormData for file upload
			const formData = new FormData()
			formData.append('file', file)
			formData.append('category', 'messages')

			// Upload file to S3
			const response = await fetch('/api/files/s3-upload', {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) {
				throw new Error('Failed to upload file')
			}

			const uploadData = await response.json()

			if (!uploadData.success) {
				throw new Error('Upload failed')
			}

			// Send file message through AppSync
			await sendAppSyncMessage(
				selectedThread.id,
				'[File]',
				uploadData.url,
				uploadData.originalName,
				uploadData.fileType
			)

			// Always scroll to bottom when sending own file
			setShouldAutoScroll(true)

			setShowFileUpload(false) // Close the modal after successful upload
		} catch (error) {
			// Handle error silently
		} finally {
			setIsUploading(false)
		}
	}

	// Handle message submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!newMessage.trim() || !selectedThread || !canReply) return

		const messageContent = newMessage.trim()
		setNewMessage('')
		setIsTyping(false)

		// Always scroll to bottom when sending own message
		setShouldAutoScroll(true)

		try {
			// Use AppSync to send message
			await sendAppSyncMessage(selectedThread.id, messageContent)
		} catch (error) {
			// Handle error silently
		}
	}

	// Simplified unread count logic:
	// - Only counts messages from OTHER users as unread
	// - Your own messages are never considered "unread"
	// - This is handled by the threads API which already provides unreadCount

	// Handle scroll events to track if user is at bottom
	useEffect(() => {
		const container = messagesContainerRef.current
		if (!container) return

		const handleScroll = () => {
			// Check if user is near bottom when scrolling
			const threshold = 100 // 100px from bottom
			const nearBottom =
				container.scrollHeight - container.scrollTop - container.clientHeight <
				threshold
			setShouldAutoScroll(nearBottom)
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [])

	// Auto-scroll when messages change - only if user is at bottom or initial load
	useEffect(() => {
		if (messages.length > 0) {
			// Use instant scroll when messages are first loaded
			if (isInitialLoad) {
				// Small delay to ensure DOM is updated for initial load
				setTimeout(() => {
					scrollToBottom(false) // Instant scroll for initial load
					setIsInitialLoad(false)
					setShouldAutoScroll(true) // Reset flag after initial load
				}, 50)
			} else if (shouldAutoScroll) {
				// Only auto-scroll if user is already at/near the bottom
				scrollToBottom(true) // Smooth scroll for new messages
			}
		}
	}, [messages, isInitialLoad, shouldAutoScroll])

	// Thread selection is now handled by AppSync hook

	// Typing indicator for 1-to-1 chat (not implemented in AppSync version yet)
	const isOtherUserTyping = false

	// Convert AppSync threads to the expected format and sort by newest message
	// Memoize to prevent unnecessary recalculations when selecting threads
	const formattedThreads: Thread[] = useMemo(() => {
		if (!Array.isArray(appSyncThreads)) {
			return []
		}

		const threads = appSyncThreads
			.map((appSyncThread) => {
				// In 1-to-1 chat: find the other participant (not the current user)
				const otherParticipantId =
					appSyncThread.user1Id === user?.id
						? appSyncThread.user2Id
						: appSyncThread.user1Id
				const otherUser = users.find((u) => u.id === otherParticipantId)

				// Use the new flat structure from AppSync
				const otherParticipant = {
					id: otherParticipantId || '',
					name: otherUser?.name || (otherParticipantId ? 'Loading...' : 'User'),
					image: otherUser?.image,
					status: otherUser?.status || 'offline',
					userType:
						(otherUser?.userType as 'applicant' | 'institution' | 'unknown') ||
						'unknown',
				}

				// Create a mock lastMessage object from the string

				const lastMessage =
					appSyncThread.lastMessage && appSyncThread.lastMessage.trim()
						? {
								id: 'last-message',
								threadId: appSyncThread.id,
								senderId:
									appSyncThread.lastMessageSenderId || otherParticipant.id,
								content: appSyncThread.lastMessage,
								sender: {
									id: appSyncThread.lastMessageSenderId || otherParticipant.id,
									name:
										appSyncThread.lastMessageSenderName ||
										otherParticipant.name,
									image:
										appSyncThread.lastMessageSenderImage ||
										otherParticipant.image ||
										undefined,
								},
								fileUrl: appSyncThread.lastMessageFileUrl,
								fileName: appSyncThread.lastMessageFileName,
								mimeType: appSyncThread.lastMessageMimeType,
								isRead: true,
								createdAt: (() => {
									const dateStr =
										appSyncThread.lastMessageAt || appSyncThread.updatedAt
									const date = new Date(dateStr)
									return isNaN(date.getTime()) ? new Date() : date
								})(),
							}
						: undefined

				return {
					id: appSyncThread.id,
					title: otherParticipant.name,
					lastMessage,
					participants: [
						{
							id: user?.id || '',
							name: user?.name || '',
							image: user?.image,
							userType: (profile?.role === 'institution'
								? 'institution'
								: 'applicant') as 'applicant' | 'institution' | 'unknown',
						},
						{
							id: otherParticipant.id,
							name: otherParticipant.name,
							image: otherParticipant.image,
							userType: (otherParticipant.userType || 'unknown') as
								| 'applicant'
								| 'institution'
								| 'unknown',
						},
					],
					unreadCount: appSyncThread.unreadCount || 0,
					updatedAt: new Date(appSyncThread.updatedAt),
				}
			})
			.sort((a, b) => {
				// Sort by lastMessageAt if available, otherwise by updatedAt
				const aTime = a.lastMessage?.createdAt || a.updatedAt
				const bTime = b.lastMessage?.createdAt || b.updatedAt
				return new Date(bTime).getTime() - new Date(aTime).getTime()
			})

		// Filter threads based on search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			return threads.filter((thread) => {
				// Search in thread title (other participant's name)
				const titleMatch = thread.title.toLowerCase().includes(query)

				// Search in last message content
				const messageMatch = thread.lastMessage?.content
					?.toLowerCase()
					.includes(query)

				// Search in participant email (if available in users list)
				const otherParticipant = thread.participants.find(
					(p) => p.id !== user?.id
				)
				const userData = users.find((u) => u.id === otherParticipant?.id)
				const emailMatch = userData?.email?.toLowerCase().includes(query)

				return titleMatch || messageMatch || emailMatch
			})
		}

		return threads
	}, [appSyncThreads, users, user?.id, user?.name, user?.image, searchQuery])

	// Handle selecting an existing thread
	const selectExistingThread = async (thread: Thread) => {
		// Don't do anything if clicking the same thread
		if (selectedThread?.id === thread.id) {
			return
		}

		// Mark that we're manually selecting to prevent useEffect from interfering
		// Set this FIRST before any state updates to prevent race conditions
		isManuallySelectingRef.current = true

		try {
			// Find the other participant first (before setting thread)
			const otherParticipant = thread.participants.find(
				(p) => p.id !== user?.id
			)

			// Set selectedUser and selectedThread FIRST to prevent useEffect from running
			// This ensures the component state is updated before URL changes
			if (otherParticipant) {
				// Find the user in the users list to get their current status and correct image
				const userWithStatus = users.find((u) => u.id === otherParticipant.id)
				// Use image from users list (which has correct institution logo) if available,
				// otherwise fall back to participant image
				const imageToUse = userWithStatus?.image || otherParticipant.image
				setSelectedUser({
					id: otherParticipant.id,
					name: otherParticipant.name,
					email: userWithStatus?.email || '', // Get email from users list
					image: imageToUse, // Use image from users list (has correct institution logo)
					status: userWithStatus?.status || 'offline', // Get actual status
					userType:
						(otherParticipant.userType as
							| 'applicant'
							| 'institution'
							| 'unknown') ||
						(userWithStatus?.userType as
							| 'applicant'
							| 'institution'
							| 'unknown') ||
						'unknown',
				})
			}

			// Set the thread locally first for immediate UI update
			setSelectedThread(thread)
			setIsInitialLoad(true) // Mark as initial load for this thread
			setShouldAutoScroll(true) // Reset auto-scroll flag

			// Now update threadIdFromUrl - this will trigger useEffect but it will see
			// selectedThread is already set and return early
			setThreadIdFromUrl(thread.id)

			// Use AppSync to select thread and load messages
			// This will update the messages state in the hook
			// We await this to ensure messages are loaded before rendering
			await selectThread(thread.id)
			await loadMessages(thread.id)

			// Clear unread count for this thread when selected (non-blocking)
			clearUnreadCount(thread.id).catch(() => {
				// Silently handle errors
			})

			// Update URL LAST using history API to avoid full page reload
			// This prevents the page from rerunning when switching threads
			// Do this after state is set to prevent useEffect from interfering
			if (typeof window !== 'undefined') {
				const newUrl = `/messages/${thread.id}`
				window.history.pushState({ threadId: thread.id }, '', newUrl)
			}
		} finally {
			// Reset the flag after a longer delay to prevent useEffect from interfering
			// This ensures the manual selection completes before useEffect can run
			setTimeout(() => {
				isManuallySelectingRef.current = false
			}, 1000) // Increased delay further to prevent race condition
		}
	}

	// Fetch users when component mounts and poll periodically for real-time online status
	useEffect(() => {
		if (!user?.id) return

		const fetchUsers = async () => {
			try {
				const response = await fetch('/api/users/status', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				})

				if (response.ok) {
					const data = await response.json()
					if (data.success && data.users) {
						setUsers(data.users)
						setUsersLoaded(true)
						// Store timestamp for cache management
						localStorage.setItem('usersLastLoad', Date.now().toString())
					}
				}
			} catch (error) {
				console.error('Failed to fetch users:', error)
			}
		}

		// Fetch users immediately
		fetchUsers()

		// Poll for updated user statuses every 30 seconds for real-time updates
		const usersInterval = setInterval(() => {
			fetchUsers()
		}, 30000) // 30 seconds

		return () => clearInterval(usersInterval)
	}, [user?.id]) // Only depend on user ID

	// Status updates are now handled globally in AuthContext
	// No need to update status here - it's done app-wide when user is authenticated

	// User data refresh removed - will fetch individual users as needed

	// Visibility change handler removed - will fetch individual users as needed

	// Fetch individual user data only when needed
	const fetchUserData = async (userId: string) => {
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (response.ok) {
				const data = await response.json()
				if (data.success && data.user) {
					return data.user
				}
			}
		} catch (error) {
			console.error('Failed to fetch user data:', error)
		}
		return null
	}

	// Threads are now fetched by AppSync hook

	// Use timezone-aware time formatting with date when needed
	const formatTime = (
		date: Date | string,
		previousMessageDate?: Date | string
	) => {
		try {
			if (!date) return '--:--'

			const messageDate = typeof date === 'string' ? new Date(date) : date
			if (isNaN(messageDate.getTime())) return '--:--'

			const timezone = getUserTimezone()
			const now = new Date()

			// Get date components in user's timezone for accurate comparison
			const messageComponents = getDateInTimezone(messageDate, timezone)
			const nowComponents = getDateInTimezone(now, timezone)

			// Check if message is from today
			const isToday =
				messageComponents.year === nowComponents.year &&
				messageComponents.month === nowComponents.month &&
				messageComponents.day === nowComponents.day

			// Check if message is from yesterday
			const yesterday = new Date(now)
			yesterday.setDate(yesterday.getDate() - 1)
			const yesterdayComponents = getDateInTimezone(yesterday, timezone)
			const isYesterday =
				messageComponents.year === yesterdayComponents.year &&
				messageComponents.month === yesterdayComponents.month &&
				messageComponents.day === yesterdayComponents.day

			// Check if previous message is from a different day
			let showDate = false
			if (previousMessageDate) {
				const prevDate =
					typeof previousMessageDate === 'string'
						? new Date(previousMessageDate)
						: previousMessageDate
				if (!isNaN(prevDate.getTime())) {
					const prevComponents = getDateInTimezone(prevDate, timezone)
					// Show date if previous message was from a different day
					showDate =
						messageComponents.year !== prevComponents.year ||
						messageComponents.month !== prevComponents.month ||
						messageComponents.day !== prevComponents.day
				}
			}

			// Show date + time if:
			// - Not from today
			// - Previous message was from a different day
			// - This is the first message in the list
			if (!isToday || showDate || !previousMessageDate) {
				if (isToday) {
					// Today: show "Today, HH:MM"
					return `Today, ${formatUTCTimeToLocal(date)}`
				} else if (isYesterday) {
					// Yesterday: show "Yesterday, HH:MM"
					return `Yesterday, ${formatUTCTimeToLocal(date)}`
				} else {
					// Older: show "DD/MM/YYYY, HH:MM"
					return `${formatUTCDateToLocal(date)}, ${formatUTCTimeToLocal(date)}`
				}
			}

			// Same day as previous message: just show time
			return formatUTCTimeToLocal(date)
		} catch (error) {
			return '--:--'
		}
	}

	if (!user) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<p className="text-gray-500">Please sign in to view messages.</p>
				</div>
			</div>
		)
	}

	// Check if we're still loading initial data
	// Show loading screen if:
	// 1. Threads are still loading, OR
	// 2. Users haven't loaded yet and we have threads that need user data, OR
	// 3. Any thread still shows "Loading..." as the name
	// Only show loading screen when NOT in a specific thread (threadId) to allow thread content to show
	const hasThreadsWithLoadingNames = formattedThreads.some(
		(t) => t.title === 'Loading...' || t.title === 'User'
	)
	const isInitialLoading =
		!threadId && // Don't show loading screen when viewing a specific thread
		(threadsLoading ||
			(user?.id &&
				!usersLoaded &&
				appSyncThreads.length > 0 &&
				hasThreadsWithLoadingNames) ||
			(user?.id && threadsLoading && appSyncThreads.length === 0))

	// Show loading screen during initial load
	if (isInitialLoading) {
		return (
			<div className="flex h-full bg-white items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 text-[#126E64] animate-spin mx-auto mb-4" />
					<p className="text-gray-600 text-lg font-medium">
						Loading messages...
					</p>
					<p className="text-gray-400 text-sm mt-2">
						Please wait while we load your conversations
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full bg-white">
			{/* Sidebar */}
			<div className="w-96 border-r border-gray-200 flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-gray-200">
					<div className="flex items-center justify-between mb-3">
						<h1 className="text-xl font-semibold text-gray-900">Messages</h1>
						<div className="flex items-center space-x-2">
							<div
								className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT ? 'bg-green-500' : 'bg-red-500'}`}
							></div>
							<span className="text-xs text-gray-500">
								{process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT
									? 'Connected'
									: 'Disconnected'}
							</span>
						</div>
					</div>
					<div className="mt-3 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search users..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{/* Existing Threads */}
					<div>
						{formattedThreads.length === 0 ? (
							<div className="p-4 text-center text-gray-500">
								No conversations yet
							</div>
						) : (
							formattedThreads.map((thread) => (
								<div
									key={thread.id}
									onClick={() => selectExistingThread(thread)}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
										selectedThread?.id === thread.id
											? 'bg-blue-50 border-blue-200'
											: thread.unreadCount > 0
												? 'bg-yellow-50 border-yellow-200'
												: ''
									}`}
								>
									<div className="flex items-center space-x-3">
										<MessageAvatar
											src={(() => {
												const otherParticipant = thread.participants.find(
													(p) => p.id !== user?.id
												)
												// Use image from users list (which has correct institution logo) if available,
												// otherwise fall back to participant image
												const userWithStatus = users.find(
													(u) => u.id === otherParticipant?.id
												)
												return userWithStatus?.image || otherParticipant?.image
											})()}
											alt={thread.title}
											size="lg"
											showOnlineStatus={true}
											isOnline={(() => {
												const otherParticipant = thread.participants.find(
													(p) => p.id !== user?.id
												)
												const userWithStatus = users.find(
													(u) => u.id === otherParticipant?.id
												)
												return userWithStatus?.status === 'online'
											})()}
											userType={(() => {
												const otherParticipant = thread.participants.find(
													(p) => p.id !== user?.id
												)
												const userWithStatus = users.find(
													(u) => u.id === otherParticipant?.id
												)
												return (
													(userWithStatus?.userType as
														| 'applicant'
														| 'institution'
														| 'unknown') ||
													(otherParticipant?.userType as
														| 'applicant'
														| 'institution'
														| 'unknown') ||
													'unknown'
												)
											})()}
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-medium text-gray-900 truncate">
													{thread.title}
												</h3>
												{thread.unreadCount > 0 && (
													<span
														className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
														title={`${thread.unreadCount} unread message${thread.unreadCount > 1 ? 's' : ''} from ${thread.title}`}
													>
														{thread.unreadCount}
													</span>
												)}
											</div>
											<div className="flex items-center justify-between">
												<p className="text-sm text-gray-500 truncate flex-1">
													{thread.lastMessage
														? thread.lastMessage.content ||
															(thread.lastMessage.fileUrl
																? thread.lastMessage.fileName ||
																	(thread.lastMessage.mimeType?.startsWith(
																		'image/'
																	)
																		? '📷 Image'
																		: '📎 File')
																: '')
														: 'No messages yet'}
												</p>
												{thread.lastMessage && (
													<p className="text-xs text-gray-400 ml-2 flex-shrink-0">
														{formatTime(new Date(thread.lastMessage.createdAt))}
													</p>
												)}
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col">
				{(isCheckingThread || isLoadingThread) && !selectedUser && threadId ? (
					/* Loading State - only show when not already in a thread and not transitioning */
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<Loader2 className="w-8 h-8 text-[#126E64] animate-spin mx-auto mb-4" />
							<p className="text-gray-600">
								{isLoadingThread
									? 'Loading conversation...'
									: 'Checking for existing conversation...'}
							</p>
						</div>
					</div>
				) : selectedUser ? (
					<>
						{/* Chat Header */}
						{(() => {
							// Get the latest status from users array to ensure real-time updates
							const userWithLatestStatus = users.find(
								(u) => u.id === selectedUser.id
							)
							const currentStatus =
								userWithLatestStatus?.status || selectedUser.status || 'offline'
							return (
								<div className="p-4 border-b border-gray-200 bg-white">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<MessageAvatar
												src={selectedUser.image}
												alt={selectedUser.name}
												size="md"
												showOnlineStatus={true}
												isOnline={currentStatus === 'online'}
												userType={selectedUser.userType}
											/>
											<div>
												<h2 className="text-lg font-semibold text-gray-900">
													{selectedUser.name}
												</h2>
												<p className="text-sm text-gray-500">
													{currentStatus === 'online' ? 'Online' : 'Offline'}
												</p>
											</div>
										</div>
										{/* <button
									onClick={async () => {
										if (selectedThread) {
											await loadMessages(selectedThread.id)
											// Scroll to bottom smoothly after refresh
											setTimeout(() => scrollToBottom(true), 100)
										}
									}}
									className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
									title="Refresh messages"
								>
									<RefreshCw className="w-5 h-5" />
								</button> */}
									</div>
								</div>
							)
						})()}

						{/* Messages */}
						<div
							ref={messagesContainerRef}
							className="flex-1 overflow-y-auto p-4 space-y-4"
						>
							{(() => {
								// Filter messages to only show messages for the currently selected thread
								// This prevents showing messages from previous thread during transition
								const threadMessages = Array.isArray(messages)
									? messages.filter(
											(msg) => msg.threadId === selectedThread?.id
										)
									: []

								if (threadMessages.length === 0) {
									return (
										<div className="text-center text-gray-500 py-8">
											No messages yet. Start the conversation!
										</div>
									)
								}

								return threadMessages.map((message, index) => {
									// Get previous message date for date comparison
									const previousMessage =
										index > 0 ? threadMessages[index - 1] : null
									return (
										<div
											key={message.id}
											className={`flex ${
												message.senderId === user.id
													? 'justify-end'
													: 'justify-start'
											}`}
										>
											<div
												className={`max-w-[70%] flex gap-2 ${
													message.senderId === user.id
														? 'flex-row-reverse'
														: 'flex-row'
												}`}
											>
												<MessageAvatar
													src={
														message.senderId === user?.id
															? user?.image
															: selectedUser?.image
													}
													alt={
														message.senderId === user?.id
															? user?.name || 'You'
															: selectedUser?.name || 'User'
													}
													userType={
														message.senderId === user?.id
															? profile?.role === 'institution'
																? 'institution'
																: 'applicant'
															: selectedUser?.userType || 'unknown'
													}
													size="sm"
												/>
												<div
													className={`rounded-lg px-3 py-2 ${
														message.senderId === user.id
															? 'bg-blue-500 text-white'
															: 'bg-gray-100 text-gray-900'
													}`}
												>
													{message.fileUrl && (
														<div className="mb-2">
															{message.mimeType?.startsWith('image/') ? (
																<MessageImage
																	src={message.fileUrl}
																	alt={message.fileName}
																	fileName={message.fileName}
																	onDownload={async () => {
																		if (!message.fileUrl) return
																		try {
																			await downloadSessionProtectedFile(
																				message.fileUrl,
																				message.fileName || 'download'
																			)
																		} catch (error) {
																			// eslint-disable-next-line no-console
																			console.error('Download failed:', error)
																		}
																	}}
																/>
															) : (
																<div className="relative group">
																	<button
																		onClick={() => {
																			if (!message.fileUrl) return
																			// Always open in new tab for preview (for all file types)
																			// Uses proxy route which requires authentication
																			openSessionProtectedFile(message.fileUrl)
																		}}
																		className={`flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-all duration-200 cursor-pointer w-full text-left ${
																			message.senderId === user.id
																				? 'bg-blue-500 bg-opacity-30'
																				: 'bg-white bg-opacity-20 border border-white border-opacity-10'
																		}`}
																	>
																		<div className="flex-1 min-w-0 pr-12">
																			<div
																				className={`text-sm font-medium truncate ${
																					message.senderId === user.id
																						? 'text-white'
																						: 'text-gray-900'
																				}`}
																			>
																				{message.fileName}
																			</div>
																			{(message as any).fileSize && (
																				<div
																					className={`text-xs opacity-75 ${
																						message.senderId === user.id
																							? 'text-white'
																							: 'text-gray-600'
																					}`}
																				>
																					{formatFileSize(
																						(message as any).fileSize
																					)}
																				</div>
																			)}
																		</div>
																	</button>
																	{/* Download button for all files */}
																	<button
																		onClick={async (e) => {
																			e.stopPropagation()
																			if (!message.fileUrl) return

																			try {
																				// Use the download function which handles authentication
																				await downloadSessionProtectedFile(
																					message.fileUrl,
																					message.fileName || 'download'
																				)
																			} catch (error) {
																				// eslint-disable-next-line no-console
																				console.error('Download failed:', error)
																				alert(
																					'Failed to download file. Please try again.'
																				)
																			}
																		}}
																		className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
																		title="Download file"
																	>
																		<svg
																			className="w-4 h-4"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																			/>
																		</svg>
																	</button>
																</div>
															)}
														</div>
													)}
													{message.content && !message.fileUrl && (
														<div className="text-sm">{message.content}</div>
													)}
													<div
														className={`text-xs mt-1 flex items-center gap-1 ${
															message.senderId === user.id
																? 'text-blue-100'
																: 'text-gray-500'
														}`}
													>
														<span>
															{formatTime(
																message.createdAt,
																previousMessage?.createdAt
															)}
														</span>
														{message.senderId === user.id && (
															<>
																{message.isRead ? (
																	<CheckCheck className="w-3 h-3" />
																) : (
																	<Check className="w-3 h-3" />
																)}
															</>
														)}
													</div>
												</div>
											</div>
										</div>
									)
								})
							})()}

							{/* Typing indicator for 1-to-1 chat */}
							{isOtherUserTyping && selectedUser && (
								<div className="flex justify-start">
									<div className="flex gap-2">
										<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
										</div>
										<div className="bg-gray-100 rounded-lg px-3 py-2">
											<div className="text-sm text-gray-500">
												{selectedUser.name} is typing...
											</div>
										</div>
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>

						{/* Message Input */}
						<div className="p-4 border-t border-gray-200 bg-white">
							{/* Show upgrade message if: loading and applicant, OR confirmed free plan applicant */}
							{(profileLoading || subscriptionLoading) && isApplicant ? (
								// Loading state - disable while checking subscription
								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
									<div className="flex items-center gap-3">
										<Loader2 className="w-4 h-4 text-[#126E64] animate-spin" />
										<p className="text-sm text-gray-600">
											Checking subscription...
										</p>
									</div>
								</div>
							) : !canReply && isApplicant && isFreePlan ? (
								// Upgrade message for free plan applicants
								<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<div className="flex-shrink-0">
											<Lock className="w-5 h-5 text-blue-600 mt-0.5" />
										</div>
										<div className="flex-1">
											<h3 className="text-sm font-semibold text-gray-900 mb-1">
												Upgrade to Reply to Messages
											</h3>
											<p className="text-sm text-gray-600 mb-3">
												You can view messages from institutions, but you need to
												upgrade your subscription plan to reply and continue the
												conversation.
											</p>
											<button
												onClick={() => {
													router.push('/pricing')
												}}
												className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
											>
												Upgrade Plan
											</button>
										</div>
									</div>
								</div>
							) : (
								<form
									onSubmit={handleSubmit}
									className="flex items-center space-x-2"
								>
									<button
										type="button"
										onClick={() => setShowFileUpload(true)}
										disabled={isUploading || !canReply}
										className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<Paperclip className="w-5 h-5" />
									</button>
									<input
										type="text"
										value={newMessage}
										onChange={handleInputChange}
										placeholder={
											canReply ? 'Type a message...' : 'Upgrade to reply...'
										}
										disabled={!canReply}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
									/>
									<button
										type="submit"
										disabled={!newMessage.trim() || !canReply}
										className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
									>
										<Send className="w-5 h-5" />
									</button>
								</form>
							)}
						</div>
					</>
				) : showContactPreview && contactApplicant ? (
					/* Contact Preview Section - Supports both Applicants and Institutions */
					<div className="flex-1 flex items-center justify-center p-8">
						<div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6">
							{/* Header */}
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-gray-900">
									{contactApplicant.userType === 'institution'
										? 'Contact Institution'
										: 'Contact Applicant'}
								</h2>
								<button
									onClick={handleCloseContactPreview}
									className="text-gray-400 hover:text-gray-600"
								>
									×
								</button>
							</div>

							{/* Contact Details */}
							<div className="space-y-4 mb-6">
								{/* Profile Section */}
								<div className="flex items-center space-x-4">
									<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
										{contactApplicant.image ? (
											<ProtectedImg
												src={contactApplicant.image}
												alt={contactApplicant.name}
												className="w-16 h-16 rounded-full object-cover"
												expiresIn={3600}
												autoRefresh={false}
												fallback={
													contactApplicant.userType === 'institution' ? (
														<Building2 className="w-8 h-8 text-gray-400" />
													) : (
														<User className="w-8 h-8 text-gray-400" />
													)
												}
											/>
										) : contactApplicant.userType === 'institution' ? (
											<Building2 className="w-8 h-8 text-gray-400" />
										) : (
											<User className="w-8 h-8 text-gray-400" />
										)}
									</div>
									<div>
										<h3 className="text-lg font-medium text-gray-900">
											{contactApplicant.name}
											{contactApplicant.institutionAbbreviation && (
												<span className="text-sm text-gray-500 ml-2">
													({contactApplicant.institutionAbbreviation})
												</span>
											)}
										</h3>
										<p className="text-sm text-gray-500">
											{contactApplicant.email}
										</p>
									</div>
								</div>

								{/* Details - Conditionally render based on user type */}
								<div className="space-y-3">
									{contactApplicant.userType === 'institution' ? (
										<>
											{contactApplicant.institutionType && (
												<div className="flex items-center space-x-3">
													<Building2 className="w-5 h-5 text-gray-400" />
													<span className="text-sm text-gray-600">
														Type: {contactApplicant.institutionType}
													</span>
												</div>
											)}
											{contactApplicant.institutionCountry && (
												<div className="flex items-center space-x-3">
													<MapPin className="w-5 h-5 text-gray-400" />
													<span className="text-sm text-gray-600">
														Country: {contactApplicant.institutionCountry}
													</span>
												</div>
											)}
										</>
									) : (
										<>
											{contactApplicant.degreeLevel &&
												contactApplicant.subDiscipline && (
													<div className="flex items-center space-x-3">
														<GraduationCap className="w-5 h-5 text-gray-400" />
														<span className="text-sm text-gray-600">
															{contactApplicant.degreeLevel} in{' '}
															{contactApplicant.subDiscipline}
														</span>
													</div>
												)}
											{contactApplicant.postTitle && (
												<div className="flex items-center space-x-3">
													<FileText className="w-5 h-5 text-gray-400" />
													<span className="text-sm text-gray-600">
														{contactApplicant.postTitle}
													</span>
												</div>
											)}
										</>
									)}
									<div className="flex items-center space-x-3">
										<Mail className="w-5 h-5 text-gray-400" />
										<span className="text-sm text-gray-600">
											Status: {contactApplicant.status}
										</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3">
								<button
									onClick={handleStartChat}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
								>
									{checkExistingThread(contactApplicant.id)
										? 'Open Chat'
										: 'Start Chat'}
								</button>
								<button
									onClick={handleCloseContactPreview}
									className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center text-gray-500">
							<p>Select a user to start messaging</p>
						</div>
					</div>
				)}
			</div>

			{/* File Upload Modal */}
			{showFileUpload && (
				<FileUpload
					onFileSelect={handleFileUpload}
					onClose={() => setShowFileUpload(false)}
				/>
			)}
		</div>
	)
}
