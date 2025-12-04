'use client'

import React, { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

interface InfoRequest {
	infoRequestId: string
	requestedBy: {
		userId: string
		name: string
		email: string
	}
	requestMessage: string
	requestedFields: string[]
	createdAt: string
}

interface InstitutionInfoRequestBannerProps {
	onPendingRequestsChange?: (hasPending: boolean) => void
}

export const InstitutionInfoRequestBanner: React.FC<
	InstitutionInfoRequestBannerProps
> = ({ onPendingRequestsChange }) => {
	const [pendingRequests, setPendingRequests] = useState<InfoRequest[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const loadPendingRequests = async () => {
			try {
				setIsLoading(true)
				const response = await fetch('/api/institution/info-requests', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const result = await response.json()

				if (result.success && result.data) {
					setPendingRequests(result.data)
					// Notify parent about pending requests
					if (onPendingRequestsChange) {
						onPendingRequestsChange(result.data.length > 0)
					}
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to load pending info requests:', error)
			} finally {
				setIsLoading(false)
			}
		}

		loadPendingRequests()
	}, [onPendingRequestsChange])

	// Don't show banner if loading or no pending requests
	if (isLoading || pendingRequests.length === 0) {
		return null
	}

	// Format the message more nicely
	const formatMessage = (message: string) => {
		if (!message)
			return 'Additional information is required from your institution.'

		// Capitalize first letter and ensure it ends with proper punctuation
		const trimmed = message.trim()
		const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)

		// Add period if it doesn't end with punctuation
		if (!/[.!?]$/.test(formatted)) {
			return formatted + '.'
		}

		return formatted
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="mb-4 space-y-3"
		>
			{pendingRequests.map((request) => (
				<Alert
					key={request.infoRequestId}
					variant="destructive"
					className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 py-3"
				>
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
						<AlertDescription className="text-orange-800 dark:text-orange-200 flex-1">
							<p className="text-sm font-medium leading-relaxed">
								{formatMessage(request.requestMessage)}
							</p>
							{request.requestedBy && (
								<p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
									Requested by: {request.requestedBy.name} •{' '}
									{new Date(request.createdAt).toLocaleDateString()}
								</p>
							)}
						</AlertDescription>
					</div>
				</Alert>
			))}
		</motion.div>
	)
}
