'use client'

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from 'react'
import { ErrorModal } from '@/components/ui'
import { SuccessModal } from '@/components/ui'

export interface NotificationData {
	id: string
	type: 'success' | 'error' | 'warning'
	title: string
	message: string
	duration?: number
	onClose?: () => void
	onRetry?: () => void
	showRetry?: boolean
	retryText?: string
	// Upgrade button support
	showUpgradeButton?: boolean
	upgradeButtonText?: string
	onUpgradeClick?: () => void
}

interface NotificationContextType {
	showNotification: (notification: Omit<NotificationData, 'id'>) => void
	showSuccess: (
		title: string,
		message: string,
		options?: Partial<NotificationData>
	) => void
	showError: (
		title: string,
		message: string,
		options?: Partial<NotificationData>
	) => void
	hideNotification: (id: string) => void
	clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
)

export const useNotification = () => {
	const context = useContext(NotificationContext)
	if (!context) {
		throw new Error(
			'useNotification must be used within a NotificationProvider'
		)
	}
	return context
}

interface NotificationProviderProps {
	children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
	children,
}) => {
	const [notifications, setNotifications] = useState<NotificationData[]>([])

	const hideNotification = useCallback((id: string) => {
		setNotifications((prev) => {
			const notification = prev.find((n) => n.id === id)
			if (notification?.onClose) {
				notification.onClose()
			}
			return prev.filter((n) => n.id !== id)
		})
	}, [])

	const showNotification = useCallback(
		(notification: Omit<NotificationData, 'id'>) => {
			const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
			const newNotification: NotificationData = {
				id,
				duration: 5000, // Default 5 seconds
				...notification,
			}

			setNotifications((prev) => [...prev, newNotification])

			// Auto-hide after duration
			if (newNotification.duration && newNotification.duration > 0) {
				setTimeout(() => {
					hideNotification(id)
				}, newNotification.duration)
			}
		},
		[hideNotification]
	)

	const showSuccess = useCallback(
		(title: string, message: string, options?: Partial<NotificationData>) => {
			showNotification({
				type: 'success',
				title,
				message,
				...options,
			})
		},
		[showNotification]
	)

	const showError = useCallback(
		(title: string, message: string, options?: Partial<NotificationData>) => {
			showNotification({
				type: 'error',
				title,
				message,
				duration: 0, // Don't auto-hide errors
				...options,
			})
		},
		[showNotification]
	)

	const clearAllNotifications = useCallback(() => {
		setNotifications([])
	}, [])

	const contextValue: NotificationContextType = {
		showNotification,
		showSuccess,
		showError,
		hideNotification,
		clearAllNotifications,
	}

	return (
		<NotificationContext.Provider value={contextValue}>
			{children}

			{/* Render all active notifications */}
			{notifications.map((notification) => {
				if (notification.type === 'error') {
					return (
						<ErrorModal
							key={notification.id}
							isOpen={true}
							onClose={() => hideNotification(notification.id)}
							title={notification.title}
							message={notification.message}
							showRetry={notification.showRetry}
							onRetry={notification.onRetry}
							retryText={notification.retryText}
							// Upgrade button mapping -> use second button slot in ErrorModal
							showSecondButton={notification.showUpgradeButton}
							secondButtonText={notification.upgradeButtonText}
							onSecondButtonClick={notification.onUpgradeClick}
						/>
					)
				} else if (notification.type === 'success') {
					return (
						<SuccessModal
							key={notification.id}
							isOpen={true}
							onClose={() => hideNotification(notification.id)}
							title={notification.title}
							message={notification.message}
						/>
					)
				}
				return null
			})}
		</NotificationContext.Provider>
	)
}
