'use client'

import { LucideIcon, Bell, Check, MessageCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileSidebar } from './ProfileSidebar'
import { useNotifications } from '@/hooks/notifications/useNotifications'
import { useUnreadMessageCount } from '@/hooks/messaging/useUnreadMessageCount'

export type ProfileSection = string

export interface NavItem {
	id: ProfileSection
	label: string
	icon: LucideIcon
}

interface SidebarStyle {
	bgColor?: string
	width?: string
	activeItemBgColor?: string
	activeItemTextColor?: string
	inactiveItemTextColor?: string
}

interface ProfileLayoutBaseProps {
	activeSection: ProfileSection
	onSectionChange: (section: ProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile?: () => void
	navItems: NavItem[]
	roleLabel: string
	roleIcon?: React.ReactNode
	containerPaddingTop?: string
	sidebarStyle?: SidebarStyle
}

export const ProfileLayoutBase: React.FC<ProfileLayoutBaseProps> = ({
	activeSection,
	onSectionChange,
	children,
	profile,
	navItems,
	roleLabel,
	roleIcon,
	containerPaddingTop = 'pt-24',
	sidebarStyle,
}) => {
	const router = useRouter()
	const { notifications, unreadCount, markAsRead } = useNotifications()
	const unreadMessageCount = useUnreadMessageCount()
	const [isNotificationOpen, setIsNotificationOpen] = useState(false)

	// Format notification time
	const formatNotificationTime = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

		if (diffInSeconds < 60) return 'Just now'
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
		if (diffInSeconds < 604800)
			return `${Math.floor(diffInSeconds / 86400)}d ago`
		return date.toLocaleDateString()
	}

	// Handle notification click
	const handleNotificationClick = async (
		notificationId: string,
		url: string
	) => {
		// Mark as read
		await markAsRead([notificationId])
		setIsNotificationOpen(false)

		// Navigate to URL
		if (url) {
			router.push(url)
		}
	}

	// Handle mark all as read
	const handleMarkAllAsRead = async () => {
		await markAsRead([], true)
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement
			if (!target.closest('.notification-dropdown') && isNotificationOpen) {
				setIsNotificationOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isNotificationOpen])

	return (
		<div className={`bg-gray-50 min-h-screen `}>
			<div className="pr-8">
				<div className="flex gap-8 min-h-screen">
					{/* Sidebar */}
					<ProfileSidebar
						activeSection={activeSection}
						onSectionChange={onSectionChange}
						profile={profile}
						navItems={navItems}
						roleLabel={roleLabel}
						roleIcon={roleIcon}
						containerPaddingTop={containerPaddingTop}
						sidebarStyle={sidebarStyle}
					/>

					{/* Main Content Area */}
					<div className={`w-full pb-12 pt-10 ${containerPaddingTop}`}>
						{/* Message and Notification Icons - Top Right */}
						<div className="flex justify-end items-center gap-3 mb-4 pr-4">
							{/* Teal Chat Icon */}
							<div className="relative">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors bg-white shadow-sm"
									onClick={() => router.push('/messages')}
								>
									<MessageCircle className="w-5 h-5 text-[#126e64]" />
									{/* Badge for unread messages */}
									{unreadMessageCount > 0 && (
										<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{unreadMessageCount > 99 ? '99+' : unreadMessageCount}
										</div>
									)}
								</div>
							</div>

							{/* Orange Bell Icon */}
							<div className="relative notification-dropdown">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors bg-white shadow-sm"
									onClick={() => setIsNotificationOpen(!isNotificationOpen)}
								>
									<Bell className="w-5 h-5 text-[#f0a227]" />
									{/* Badge for unread notifications */}
									{unreadCount > 0 && (
										<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{unreadCount > 99 ? '99+' : unreadCount}
										</div>
									)}
								</div>

								{/* Notification Dropdown */}
								{isNotificationOpen && (
									<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-[99999]">
										{/* Header */}
										<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
											<h3 className="text-sm font-semibold text-gray-700">
												Notifications
											</h3>
											{unreadCount > 0 && (
												<button
													onClick={handleMarkAllAsRead}
													className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
												>
													<Check className="w-3 h-3" />
													Mark all read
												</button>
											)}
										</div>

										{/* Notifications List */}
										<div className="max-h-96 overflow-y-auto">
											{notifications.length === 0 ? (
												<div className="px-4 py-8 text-center text-gray-500">
													<Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
													<p className="text-sm">No notifications yet</p>
												</div>
											) : (
												notifications.map((notification) => (
													<div
														key={notification.id}
														className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
															!notification.read_at ? 'bg-blue-50' : ''
														}`}
														onClick={() =>
															handleNotificationClick(
																notification.id,
																notification.url
															)
														}
													>
														<div className="flex items-start gap-3">
															<div
																className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
																	!notification.read_at
																		? 'bg-[#126e64]'
																		: 'bg-gray-300'
																}`}
															></div>
															<div className="flex-1">
																<h4 className="text-sm font-medium text-gray-800 mb-1">
																	{notification.title}
																</h4>
																<p className="text-xs text-gray-500 mb-2">
																	{notification.bodyText}
																</p>
															</div>
															<span className="text-xs text-gray-400">
																{formatNotificationTime(notification.createAt)}
															</span>
														</div>
													</div>
												))
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Content */}
						<div className="w-full">{children}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
