'use client'

import { useApplicationEligibility } from '@/hooks/application/useApplicationEligibility'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface ApplicationLimitIndicatorProps {
	applicantId?: string
	variant?: 'badge' | 'inline' | 'card'
	className?: string
	showResetTime?: boolean
}

export function ApplicationLimitIndicator({
	applicantId,
	variant = 'badge',
	className = '',
	showResetTime = true,
}: ApplicationLimitIndicatorProps) {
	const {
		applicationsUsed,
		applicationsLimit,
		applicationsRemaining,
		daysUntilReset,
		isLoading,
		error,
	} = useApplicationEligibility(applicantId)

	if (isLoading) {
		return (
			<div className={`animate-pulse ${className}`}>
				<div
					className={`bg-gray-200 rounded ${
						variant === 'badge'
							? 'h-6 w-12'
							: variant === 'inline'
								? 'h-4 w-16'
								: 'h-8 w-20'
					}`}
				/>
			</div>
		)
	}

	if (error || !applicationsLimit) {
		return null // Don't show for unlimited plans or errors
	}

	const isNearLimit = applicationsUsed >= applicationsLimit - 1
	const isAtLimit = applicationsUsed >= applicationsLimit

	const getStatusColor = () => {
		if (isAtLimit) return 'bg-red-100 text-red-700 border-red-200'
		if (isNearLimit) return 'bg-amber-100 text-amber-700 border-amber-200'
		return 'bg-blue-100 text-blue-700 border-blue-200'
	}

	const getIcon = () => {
		if (isAtLimit) return <AlertTriangle className="w-3 h-3" />
		return <CheckCircle className="w-3 h-3" />
	}

	const getText = () => {
		if (variant === 'badge') {
			return `${applicationsUsed}/${applicationsLimit}`
		}

		if (isAtLimit) {
			return `Limit reached (${applicationsUsed}/${applicationsLimit})`
		}

		if (isNearLimit) {
			return `${applicationsRemaining} left (${applicationsUsed}/${applicationsLimit})`
		}

		return `${applicationsUsed}/${applicationsLimit} applications used`
	}

	if (variant === 'badge') {
		return (
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${className}`}
			>
				{getIcon()}
				<span>{getText()}</span>
			</motion.div>
		)
	}

	if (variant === 'inline') {
		return (
			<span
				className={`inline-flex items-center gap-1 text-xs ${
					isAtLimit
						? 'text-red-600'
						: isNearLimit
							? 'text-amber-600'
							: 'text-blue-600'
				} ${className}`}
			>
				{getIcon()}
				{getText()}
				{showResetTime && daysUntilReset && (
					<span className="text-gray-500">
						• Resets in {daysUntilReset} days
					</span>
				)}
			</span>
		)
	}

	if (variant === 'card') {
		return (
			<motion.div
				initial={{ opacity: 0, y: 5 }}
				animate={{ opacity: 1, y: 0 }}
				className={`p-3 rounded-lg border ${getStatusColor()} ${className}`}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{getIcon()}
						<span className="text-sm font-medium">{getText()}</span>
					</div>
					{showResetTime && daysUntilReset && (
						<div className="flex items-center gap-1 text-xs opacity-75">
							<Clock className="w-3 h-3" />
							{daysUntilReset}d
						</div>
					)}
				</div>
			</motion.div>
		)
	}

	return null
}
