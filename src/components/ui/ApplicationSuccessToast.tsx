'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Star, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from './alert'

interface ApplicationSuccessToastProps {
	show: boolean
	onHide: () => void
	applicationsUsed: number
	applicationsLimit: number | null
	planName: string
	autoHideDelay?: number
}

export function ApplicationSuccessToast({
	show,
	onHide,
	applicationsUsed,
	applicationsLimit,
	planName,
	autoHideDelay = 5000,
}: ApplicationSuccessToastProps) {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (show) {
			setIsVisible(true)

			// Simple animation without external dependencies
			// Future: Add canvas confetti animation when library is available

			// Auto-hide after delay
			const timer = setTimeout(() => {
				setIsVisible(false)
				setTimeout(onHide, 300) // Allow for exit animation
			}, autoHideDelay)

			return () => clearTimeout(timer)
		}
	}, [show, autoHideDelay, onHide])

	if (!show && !isVisible) return null

	const getSuccessMessage = () => {
		if (applicationsLimit === null) {
			return `🎉 Application submitted successfully! You have unlimited applications with your ${planName} plan.`
		}

		const remaining = applicationsLimit - applicationsUsed
		if (remaining <= 0) {
			return `🎉 Application submitted! You've used all ${applicationsLimit} applications this period. Consider upgrading for unlimited applications.`
		}

		if (remaining === 1) {
			return `🎉 Application submitted! You have 1 application remaining this period.`
		}

		return `🎉 Application submitted! You have ${remaining} applications remaining this period.`
	}

	const getIcon = () => {
		if (applicationsLimit === null) {
			return <Trophy className="h-5 w-5 text-yellow-500" />
		}

		const remaining = applicationsLimit - applicationsUsed
		if (remaining <= 0) {
			return <Star className="h-5 w-5 text-blue-500" />
		}

		return <CheckCircle className="h-5 w-5 text-green-500" />
	}

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: -50, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -50, scale: 0.9 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
					className="fixed top-4 right-4 z-50 max-w-md"
				>
					<Alert className="bg-green-50 border-green-200 shadow-lg">
						<div className="flex items-start space-x-3">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.1, duration: 0.3 }}
							>
								{getIcon()}
							</motion.div>
							<AlertDescription className="text-green-800 font-medium">
								{getSuccessMessage()}
							</AlertDescription>
						</div>
					</Alert>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
