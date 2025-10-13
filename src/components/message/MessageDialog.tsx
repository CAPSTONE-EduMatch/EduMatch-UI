'use client'

import { useState, useEffect, useRef } from 'react'
import {
	Search,
	Paperclip,
	Send,
	Check,
	CheckCheck,
	Image,
	File,
	FileText,
	Video,
	Music,
	RefreshCw,
} from 'lucide-react'
import { useAppSyncMessaging } from '@/hooks/useAppSyncMessaging'
import { authClient } from '@/app/lib/auth-client'
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

export function MessageDialog() {
	const [user, setUser] = useState<any>(null)
	const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [users, setUsers] = useState<User[]>([])
	// Threads are now managed by AppSync hook
	const [searchQuery, setSearchQuery] = useState('')
	const [activeTab, setActiveTab] = useState<'conversations' | 'new-chat'>(
		'conversations'
	)
	const [showFileUpload, setShowFileUpload] = useState(false)
	const [newMessage, setNewMessage] = useState('')
	const [isTyping, setIsTyping] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [isInitialLoad, setIsInitialLoad] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Initialize user
	useEffect(() => {
		const initUser = async () => {
			try {
				const session = await authClient.getSession()
				setUser(session?.data?.user)
			} catch (error) {
				console.error('Failed to get user session:', error)
			}
		}
		initUser()
	}, [])

	// Handle new messages to update sidebar (AppSync handles this automatically)
	const handleNewMessage = (message: any) => {
		// AppSync automatically updates the messages and threads
		// This function is kept for compatibility but doesn't need to do anything
	}

	// Use AppSync messaging hook
	const {
		messages,
		threads: appSyncThreads,
		selectedThreadId,
		isConnected,
		isLoading,
		error,
		sendMessage: sendAppSyncMessage,
		sendFileMessage,
		selectThread,
		createNewThread,
		loadMessages,
		loadThreads,
		markThreadAsRead,
	} = useAppSyncMessaging(user)

	// Auto-scroll to bottom
	const scrollToBottom = (smooth: boolean = true) => {
		messagesEndRef.current?.scrollIntoView({
			behavior: smooth ? 'smooth' : 'auto',
		})
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
			console.error('No thread selected for file upload')
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
			await sendFileMessage(
				selectedThread.id,
				uploadData.url,
				uploadData.originalName,
				uploadData.fileSize,
				uploadData.fileType
			)

			setShowFileUpload(false) // Close the modal after successful upload
		} catch (error) {
			console.error('File upload failed:', error)
			// You could add a toast notification here
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
			await sendAppSyncMessage(messageContent, selectedThread.id)
		} catch (error) {
			console.error('Error sending message:', error)
		}
	}

	// Simple unread count - no need to mark as read, just count unread messages
	// This is handled by the threads API which already provides unreadCount

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

	// Convert AppSync threads to the expected format
	const formattedThreads: Thread[] = Array.isArray(appSyncThreads)
		? appSyncThreads.map((appSyncThread) => {
				// In 1-to-1 chat: find the other participant (not the current user)
				const otherParticipantId = appSyncThread.participants.find(
					(p) => p !== user?.id
				)
				const otherUser = users.find((u) => u.id === otherParticipantId)

				// Use API data if available, otherwise fallback to users list
				const otherParticipant = (appSyncThread as any).otherParticipant || {
					id: otherParticipantId || '',
					name: otherUser?.name || (otherParticipantId ? 'Loading...' : 'User'),
					image: otherUser?.image,
				}

				// Create a mock lastMessage object from the string

				const lastMessage =
					appSyncThread.lastMessage && appSyncThread.lastMessage.trim()
						? {
								id: 'last-message',
								threadId: appSyncThread.id,
								senderId: otherParticipant.id,
								content: appSyncThread.lastMessage,
								sender: {
									id: otherParticipant.id,
									name: otherParticipant.name,
									image: otherParticipant.image,
								},
								fileUrl: (appSyncThread as any).lastMessageFileUrl,
								fileName: (appSyncThread as any).lastMessageFileName,
								mimeType: (appSyncThread as any).lastMessageMimeType,
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
					unreadCount: (appSyncThread as any).unreadCount || 0,
					updatedAt: new Date(appSyncThread.updatedAt),
				}
			})
		: []

	// Handle selecting an existing thread
	const selectExistingThread = (thread: Thread) => {
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

		// Mark any unread messages in this thread as read
		// We'll mark messages as read after they're loaded in the useEffect

		// Mark messages as read after a delay to allow messages to load
		setTimeout(() => {
			markThreadAsRead(thread.id)
		}, 1500) // Delay to allow messages to load first
	}

	// Handle starting a new thread with a user
	const startThreadWithUser = async (targetUser: User) => {
		try {
			// Use AppSync to create thread
			const newThread = await createNewThread(
				[user?.id || '', targetUser.id],
				targetUser
			)

			// Create a proper thread object that matches the Thread interface
			const threadObject: Thread = {
				id: newThread.id,
				title: targetUser.name,
				participants: [
					{
						id: user?.id || '',
						name: user?.name || '',
						image: user?.image,
					},
					{
						id: targetUser.id,
						name: targetUser.name,
						image: targetUser.image,
					},
				],
				unreadCount: 0,
				updatedAt: new Date(newThread.updatedAt),
			}

			setSelectedThread(threadObject)
			setSelectedUser(targetUser)
			setIsInitialLoad(true) // Mark as initial load for new thread

			// Select the thread in AppSync
			selectThread(newThread.id)

			// Refresh threads to update the list
			setTimeout(() => {
				loadThreads()
			}, 300)
		} catch (error) {
			console.error('Failed to start thread:', error)
		}
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
					console.error('Failed to fetch users:', response.statusText)
					setUsers([])
				}
			} catch (error) {
				console.error('Error fetching users:', error)
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

	// Threads are now fetched by AppSync hook

	const filteredUsers = Array.isArray(users)
		? users.filter(
				(user) =>
					user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					user.email.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: []

	const getFileIcon = (mimeType?: string) => {
		if (!mimeType) return <File className="w-6 h-6 text-gray-500" />

		if (mimeType.startsWith('image/'))
			return <Image className="w-6 h-6 text-green-500" />
		if (mimeType.startsWith('video/'))
			return <Video className="w-6 h-6 text-red-500" />
		if (mimeType.startsWith('audio/'))
			return <Music className="w-6 h-6 text-purple-500" />
		if (mimeType === 'application/pdf')
			return <FileText className="w-6 h-6 text-red-600" />
		if (mimeType.startsWith('text/'))
			return <FileText className="w-6 h-6 text-blue-500" />
		return <File className="w-6 h-6 text-gray-500" />
	}

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
			console.error('Error formatting date:', error, 'Input:', date)
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
								className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
							></div>
							<span className="text-xs text-gray-500">
								{isConnected ? 'Connected' : 'Disconnected'}
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

				{/* Tabs for Users and Threads */}
				<div className="flex border-b border-gray-200">
					<button
						className={`flex-1 px-4 py-2 text-sm font-medium ${
							activeTab === 'conversations'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500'
						}`}
						onClick={() => setActiveTab('conversations')}
					>
						Conversations
					</button>
					<button
						className={`flex-1 px-4 py-2 text-sm font-medium ${
							activeTab === 'new-chat'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500'
						}`}
						onClick={() => setActiveTab('new-chat')}
					>
						New Chat
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{activeTab === 'conversations' ? (
						/* Existing Threads */
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
										className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
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
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<h3 className="text-sm font-medium text-gray-900 truncate">
														{thread.title}
													</h3>
													{thread.unreadCount > 0 && (
														<span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
															{formatTime(
																new Date(thread.lastMessage.createdAt)
															)}
														</p>
													)}
												</div>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					) : (
						/* Users List for New Chat */
						<div>
							{filteredUsers.map((userItem) => (
								<div
									key={userItem.id}
									onClick={() => startThreadWithUser(userItem)}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
										selectedUser?.id === userItem.id
											? 'bg-blue-50 border-blue-200'
											: ''
									}`}
								>
									<div className="flex items-center space-x-3">
										<div className="relative">
											<img
												src={
													userItem.image ||
													'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
												}
												alt={userItem.name}
												className="w-12 h-12 rounded-full object-cover"
											/>
											{userItem.status === 'online' && (
												<span className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full w-4 h-4"></span>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-medium text-gray-900 truncate">
													{userItem.name}
												</h3>
												<span
													className={`text-xs px-2 py-1 rounded-full ${
														userItem.status === 'online'
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-600'
													}`}
												>
													{userItem.status}
												</span>
											</div>
											<p className="text-sm text-gray-500 truncate">
												{userItem.email}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col">
				{selectedUser ? (
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
													(message as any).sender?.image ||
													(message as any).senderImage ||
													'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='
												}
												alt={
													(message as any).sender?.name ||
													(message as any).senderName ||
													'User'
												}
												className="w-8 h-8 rounded-full object-cover flex-shrink-0"
												onError={(e) => {
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
																			console.error('Download error:', error)
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
																		{message.fileSize && (
																			<div
																				className={`text-xs opacity-75 ${
																					message.senderId === user.id
																						? 'text-white'
																						: 'text-gray-600'
																				}`}
																			>
																				{formatFileSize(message.fileSize)}
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
																			console.error('Download error:', error)
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
