'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
	Search,
	Paperclip,
	Send,
	Check,
	CheckCheck,
	RefreshCw,
	User,
	Mail,
	GraduationCap,
	FileText,
} from 'lucide-react'
import { useAppSyncMessaging } from '@/hooks/useAppSyncMessaging'
import { FileUpload } from './FileUpload'
import { formatFileSize } from '@/lib/file-utils'

interface Message {
	id: string
	threadId: string
	senderId: string
	content: string
	sender: {
		id: string
		name: string
		image?: string
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
	}>
	unreadCount: number
	updatedAt: Date
}

interface User {
	id: string
	name: string
	email: string
	image?: string
	status?: 'online' | 'offline'
}

interface ContactApplicant {
	id: string
	name: string
	email: string
	image?: string
	degreeLevel: string
	subDiscipline: string
	status: string
	postTitle: string
}

interface MessageDialogProps {
	threadId?: string
}

export function MessageDialog({ threadId }: MessageDialogProps = {}) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const [user, setUser] = useState<any>(null)
	const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [users, setUsers] = useState<User[]>([])
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

	// Use AppSync messaging hook
	const {
		messages,
		threads: appSyncThreads,
		sendMessage: sendAppSyncMessage,
		startNewThread,
		selectThread,
		loadMessages,
		clearUnreadCount,
		user: appSyncUser,
	} = useAppSyncMessaging()

	// Use user from AppSync hook
	useEffect(() => {
		if (appSyncUser) {
			setUser(appSyncUser)
		}
	}, [appSyncUser])

	// Handle threadId prop - navigate to specific thread
	useEffect(() => {
		if (threadId && appSyncThreads.length > 0) {
			const thread = appSyncThreads.find((t: any) => t.id === threadId)
			if (thread) {
				// Find the other participant
				const otherParticipantId =
					thread.user1Id === user?.id ? thread.user2Id : thread.user1Id
				const otherUser = users.find((u) => u.id === otherParticipantId)

				if (otherUser) {
					const threadObject: Thread = {
						id: thread.id,
						title: otherUser.name,
						participants: [
							{
								id: user?.id || '',
								name: user?.name || '',
								image: user?.image,
							},
							{
								id: otherUser.id,
								name: otherUser.name,
								image: otherUser.image,
								status: otherUser.status,
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
					})

					selectThread(thread.id)
					loadMessages(thread.id)
				}
			}
		}
	}, [threadId, appSyncThreads, user, users, selectThread, loadMessages])

	// Handle contact parameter from URL with loading states
	useEffect(() => {
		const handleContactParam = async () => {
			const contactParam = searchParams.get('contact')
			// Don't handle contact parameter if we're already in a specific thread
			if (contactParam && !threadId) {
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
						// Navigate directly to existing thread
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

						// Fetch actual user data to get correct image and status
						try {
							const userResponse = await fetch(`/api/users/${userId}`)
							if (userResponse.ok) {
								const userData = await userResponse.json()
								setSelectedUser({
									id: userId,
									name: userData.user.name || applicantData?.name || 'User',
									email: userData.user.email || applicantData?.email || '',
									image: userData.user.image || applicantData?.image,
									status: userData.user.status || 'offline',
								})
							} else {
								// Fallback to applicant data if user fetch fails
								setSelectedUser({
									id: userId,
									name: applicantData?.name || 'User',
									email: applicantData?.email || '',
									image: applicantData?.image,
									status: 'offline',
								})
							}
						} catch (error) {
							// Fallback to applicant data if user fetch fails
							setSelectedUser({
								id: userId,
								name: applicantData?.name || 'User',
								email: applicantData?.email || '',
								image: applicantData?.image,
								status: 'offline',
							})
						}

						selectThread(existingThread.id)
						loadMessages(existingThread.id)

						// Clear unread count for this thread when selected
						try {
							await clearUnreadCount(existingThread.id)
						} catch (error) {
							// Handle error silently
						}

						// Update URL without causing a full page reload or adding history entry
						window.history.replaceState(
							{},
							'',
							`/messages/${existingThread.id}`
						)
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
										degreeLevel: 'Unknown',
										subDiscipline: 'Unknown',
										status: userData.user.status || 'offline',
										postTitle: 'Application',
									}
									setContactApplicant(contactData)
									setShowContactPreview(true)
								} else {
									// Fallback - start thread directly and update URL
									const newThread = await startNewThread(userId)
									if (newThread?.id) {
										// Update URL without causing a full page reload or adding history entry
										window.history.replaceState(
											{},
											'',
											`/messages/${newThread.id}`
										)
									}
								}
							} catch (error) {
								// Fallback - start thread directly and update URL
								const newThread = await startNewThread(userId)
								if (newThread?.id) {
									// Update URL without causing a full page reload or adding history entry
									window.history.replaceState(
										{},
										'',
										`/messages/${newThread.id}`
									)
								}
							}
						}
					}
					setIsCheckingThread(false)
				} else {
					// Threads not loaded yet, wait for them
					const timeout = setTimeout(async () => {
						if (searchParams.get('contact') && appSyncThreads.length === 0) {
							const contactParam = searchParams.get('contact')
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
												degreeLevel: 'Unknown',
												subDiscipline: 'Unknown',
												status: userData.user.status || 'offline',
												postTitle: 'Application',
											}
											setContactApplicant(contactData)
											setShowContactPreview(true)
										} else {
											// Fallback - start thread directly
											await startNewThread(contactParam)

											// Clear the contact parameter from URL
											const url = new URL(window.location.href)
											url.searchParams.delete('contact')
											window.history.replaceState({}, '', url.toString())
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
		appSyncThreads,
		user,
		loadMessages,
		selectThread,
		startNewThread,
		threadId,
	])

	// Auto-scroll to bottom
	const scrollToBottom = (smooth: boolean = true) => {
		messagesEndRef.current?.scrollIntoView({
			behavior: smooth ? 'smooth' : 'auto',
		})
	}

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
						})
					} else {
						// Fallback to applicant data if user fetch fails
						setSelectedUser({
							id: contactApplicant.id,
							name: contactApplicant.name,
							email: contactApplicant.email,
							image: contactApplicant.image,
							status: 'offline',
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
					// Update URL without causing a full page reload or adding history entry
					window.history.replaceState({}, '', `/messages/${newThread.id}`)
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
		// Remove contact parameter from URL
		const url = new URL(window.location.href)
		url.searchParams.delete('contact')
		window.history.replaceState({}, '', url.toString())
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
		if (!selectedThread) {
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

		if (!newMessage.trim() || !selectedThread) return

		const messageContent = newMessage.trim()
		setNewMessage('')
		setIsTyping(false)

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

	// Auto-scroll when messages change
	useEffect(() => {
		if (messages.length > 0) {
			// Use instant scroll when messages are first loaded, smooth scroll for new messages
			if (isInitialLoad) {
				// Small delay to ensure DOM is updated for initial load
				setTimeout(() => {
					scrollToBottom(false) // Instant scroll for initial load
					setIsInitialLoad(false)
				}, 50)
			} else {
				scrollToBottom(true) // Smooth scroll for new messages
			}
		}
	}, [messages, isInitialLoad])

	// Thread selection is now handled by AppSync hook

	// Typing indicator for 1-to-1 chat (not implemented in AppSync version yet)
	const isOtherUserTyping = false

	// Convert AppSync threads to the expected format and sort by newest message
	const formattedThreads: Thread[] = Array.isArray(appSyncThreads)
		? appSyncThreads
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
						name:
							otherUser?.name || (otherParticipantId ? 'Loading...' : 'User'),
						image: otherUser?.image,
						status: otherUser?.status || 'offline',
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
										id:
											appSyncThread.lastMessageSenderId || otherParticipant.id,
										name:
											appSyncThread.lastMessageSenderName ||
											otherParticipant.name,
										image:
											appSyncThread.lastMessageSenderImage ||
											otherParticipant.image,
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
							},
							{
								id: otherParticipant.id,
								name: otherParticipant.name,
								image: otherParticipant.image,
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
		: []

	// Handle selecting an existing thread
	const selectExistingThread = async (thread: Thread) => {
		// Set the thread locally first
		setSelectedThread(thread)
		setIsInitialLoad(true) // Mark as initial load for this thread

		// Use AppSync to select thread
		selectThread(thread.id)

		// Find the other participant (not the current user)
		const otherParticipant = thread.participants.find((p) => p.id !== user?.id)
		if (otherParticipant) {
			// Find the user in the users list to get their current status
			const userWithStatus = users.find((u) => u.id === otherParticipant.id)
			setSelectedUser({
				id: otherParticipant.id,
				name: otherParticipant.name,
				email: userWithStatus?.email || '', // Get email from users list
				image: otherParticipant.image,
				status: userWithStatus?.status || 'offline', // Get actual status
			})
		}

		// Load messages for this thread
		await loadMessages(thread.id)

		// Clear unread count for this thread when selected
		try {
			await clearUnreadCount(thread.id)
		} catch (error) {
			// Handle error silently
		}

		// Update URL without causing a full page reload or adding history entry
		window.history.replaceState({}, '', `/messages/${thread.id}`)
	}

	// Fetch real users with status from database
	useEffect(() => {
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
					}
				} else {
					setUsers([])
				}
			} catch (error) {
				setUsers([])
			}
		}

		if (user) {
			fetchUsers()

			// Update user status as online
			fetch('/api/users/status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ isOnline: true }),
			})

			// Refresh user status every 2 minutes (less frequent)
			const statusInterval = setInterval(() => {
				fetchUsers()
				fetch('/api/users/status', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ isOnline: true }),
				})
			}, 120000) // 2 minutes instead of 30 seconds

			return () => clearInterval(statusInterval)
		}
	}, [user])

	// Refresh selected user data when users list updates (for image changes)
	useEffect(() => {
		if (selectedUser && users.length > 0) {
			const updatedUser = users.find((u) => u.id === selectedUser.id)
			if (updatedUser && updatedUser.image !== selectedUser.image) {
				setSelectedUser({
					...selectedUser,
					image: updatedUser.image,
					status: updatedUser.status,
				})
			}
		}
	}, [users, selectedUser])

	// Refresh users when page becomes visible (in case user updated image in another tab)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && user) {
				// Refresh users when page becomes visible
				fetch('/api/users/status', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				})
					.then((response) => response.json())
					.then((data) => {
						if (data.success && data.users) {
							setUsers(data.users)
						}
					})
					.catch(() => {
						// Handle error silently
					})
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () =>
			document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [user])

	// Threads are now fetched by AppSync hook

	const formatTime = (date: Date | string) => {
		try {
			const dateObj = typeof date === 'string' ? new Date(date) : date
			if (isNaN(dateObj.getTime())) {
				return '--:--'
			}
			return new Intl.DateTimeFormat('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			}).format(dateObj)
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
										<div className="relative">
											<img
												src={
													thread.participants.find((p) => p.id !== user?.id)
														?.image ||
													'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
												}
												alt={thread.title}
												className="w-12 h-12 rounded-full object-cover"
											/>
											{(() => {
												const otherParticipant = thread.participants.find(
													(p) => p.id !== user?.id
												)
												const userWithStatus = users.find(
													(u) => u.id === otherParticipant?.id
												)
												return userWithStatus?.status === 'online'
											})() && (
												<span className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full w-4 h-4"></span>
											)}
										</div>
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
				{isCheckingThread && !selectedUser ? (
					/* Loading State - only show when not already in a thread */
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-gray-600">
								Checking for existing conversation...
							</p>
						</div>
					</div>
				) : selectedUser ? (
					<>
						{/* Chat Header */}
						<div className="p-4 border-b border-gray-200 bg-white">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="relative">
										<img
											src={
												selectedUser.image ||
												'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
											}
											alt={selectedUser.name}
											className="w-10 h-10 rounded-full object-cover"
										/>
										{selectedUser.status === 'online' && (
											<span className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full w-3 h-3"></span>
										)}
									</div>
									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											{selectedUser.name}
										</h2>
										<p className="text-sm text-gray-500">
											{selectedUser.status === 'online' ? 'Online' : 'Offline'}
										</p>
									</div>
								</div>
								<button
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
								</button>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{Array.isArray(messages) && messages.length === 0 ? (
								<div className="text-center text-gray-500 py-8">
									No messages yet. Start the conversation!
								</div>
							) : Array.isArray(messages) ? (
								messages.map((message) => (
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
											<img
												src={
													// Use current user data instead of cached message data
													(() => {
														const currentImage =
															message.senderId === user?.id
																? user?.image
																: selectedUser?.image

														// Return image if available, otherwise use fallback
														return (
															currentImage ||
															'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
														)
													})()
												}
												alt={
													// Use current user data instead of cached message data
													message.senderId === user?.id
														? user?.name
														: selectedUser?.name || 'User'
												}
												className="w-8 h-8 rounded-full object-cover flex-shrink-0"
												onError={(e) => {
													// Set fallback avatar when image fails to load
													e.currentTarget.src =
														'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
												}}
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
															<div className="relative group">
																<a
																	href={message.fileUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="block hover:opacity-90 transition-opacity"
																	title="Click to view full size"
																>
																	<img
																		src={message.fileUrl}
																		alt={message.fileName}
																		className="max-w-xs max-h-64 rounded-lg cursor-pointer object-cover"
																	/>
																</a>
																<button
																	onClick={async () => {
																		if (!message.fileUrl) return
																		try {
																			// Try to fetch the file first to ensure it's accessible
																			const response = await fetch(
																				message.fileUrl,
																				{
																					method: 'GET',
																					mode: 'cors',
																				}
																			)

																			if (response.ok) {
																				// Get the blob from the response
																				const blob = await response.blob()

																				// Create a blob URL
																				const blobUrl =
																					window.URL.createObjectURL(blob)

																				// Create a temporary anchor element to trigger download
																				const link = document.createElement('a')
																				link.href = blobUrl
																				link.download =
																					message.fileName || 'download'
																				link.style.display = 'none'
																				document.body.appendChild(link)
																				link.click()
																				document.body.removeChild(link)

																				// Clean up the blob URL
																				window.URL.revokeObjectURL(blobUrl)
																			} else {
																				// If fetch fails, try the direct download method
																				const link = document.createElement('a')
																				link.href = message.fileUrl
																				link.download =
																					message.fileName || 'download'
																				link.target = '_blank'
																				link.style.display = 'none'
																				document.body.appendChild(link)
																				link.click()
																				document.body.removeChild(link)
																			}
																		} catch (error) {
																			// Fallback: try to open in new tab
																			window.open(message.fileUrl, '_blank')
																		}
																	}}
																	className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
																	title="Download image"
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
														) : (
															<div className="relative group">
																<button
																	onClick={() => {
																		if (!message.fileUrl) return

																		// For PDFs and images, open in new tab for preview
																		// For other files, download directly
																		const isPreviewable =
																			message.mimeType?.startsWith('image/') ||
																			message.mimeType === 'application/pdf' ||
																			message.mimeType?.startsWith('text/')

																		if (isPreviewable) {
																			// Open in new tab for preview
																			window.open(message.fileUrl, '_blank')
																		} else {
																			// Download for other file types
																			const link = document.createElement('a')
																			link.href = message.fileUrl
																			link.download =
																				message.fileName || 'download'
																			link.target = '_blank'
																			link.style.display = 'none'
																			document.body.appendChild(link)
																			link.click()
																			document.body.removeChild(link)
																		}
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
																			// Try to fetch the file first to ensure it's accessible
																			const response = await fetch(
																				message.fileUrl,
																				{
																					method: 'GET',
																					mode: 'cors',
																				}
																			)

																			if (response.ok) {
																				// Get the blob from the response
																				const blob = await response.blob()

																				// Create a blob URL
																				const blobUrl =
																					window.URL.createObjectURL(blob)

																				// Create a temporary anchor element to trigger download
																				const link = document.createElement('a')
																				link.href = blobUrl
																				link.download =
																					message.fileName || 'download'
																				link.style.display = 'none'
																				document.body.appendChild(link)
																				link.click()
																				document.body.removeChild(link)

																				// Clean up the blob URL
																				window.URL.revokeObjectURL(blobUrl)
																			} else {
																				// If fetch fails, try the direct download method
																				const link = document.createElement('a')
																				link.href = message.fileUrl
																				link.download =
																					message.fileName || 'download'
																				link.target = '_blank'
																				link.style.display = 'none'
																				document.body.appendChild(link)
																				link.click()
																				document.body.removeChild(link)
																			}
																		} catch (error) {
																			// Fallback: try to open in new tab
																			window.open(message.fileUrl, '_blank')
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
													<span>{formatTime(new Date(message.createdAt))}</span>
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
								))
							) : null}

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
							<form
								onSubmit={handleSubmit}
								className="flex items-center space-x-2"
							>
								<button
									type="button"
									onClick={() => setShowFileUpload(true)}
									disabled={isUploading}
									className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Paperclip className="w-5 h-5" />
								</button>
								<input
									type="text"
									value={newMessage}
									onChange={handleInputChange}
									placeholder="Type a message..."
									disabled={false}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
								/>
								<button
									type="submit"
									disabled={!newMessage.trim()}
									className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
								>
									<Send className="w-5 h-5" />
								</button>
							</form>
						</div>
					</>
				) : showContactPreview && contactApplicant ? (
					/* Contact Applicant Preview Section */
					<div className="flex-1 flex items-center justify-center p-8">
						<div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6">
							{/* Header */}
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-gray-900">
									Contact Applicant
								</h2>
								<button
									onClick={handleCloseContactPreview}
									className="text-gray-400 hover:text-gray-600"
								>
									×
								</button>
							</div>

							{/* Applicant Details */}
							<div className="space-y-4 mb-6">
								{/* Profile Section */}
								<div className="flex items-center space-x-4">
									<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
										{contactApplicant.image ? (
											<img
												src={contactApplicant.image}
												alt={contactApplicant.name}
												className="w-16 h-16 rounded-full object-cover"
											/>
										) : (
											<User className="w-8 h-8 text-gray-400" />
										)}
									</div>
									<div>
										<h3 className="text-lg font-medium text-gray-900">
											{contactApplicant.name}
										</h3>
										<p className="text-sm text-gray-500">
											{contactApplicant.email}
										</p>
									</div>
								</div>

								{/* Applicant Details */}
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										<GraduationCap className="w-5 h-5 text-gray-400" />
										<span className="text-sm text-gray-600">
											{contactApplicant.degreeLevel} in{' '}
											{contactApplicant.subDiscipline}
										</span>
									</div>
									<div className="flex items-center space-x-3">
										<FileText className="w-5 h-5 text-gray-400" />
										<span className="text-sm text-gray-600">
											{contactApplicant.postTitle}
										</span>
									</div>
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
