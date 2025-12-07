'use client'

import { useApplicationEligibility } from '@/hooks/application/useApplicationEligibility'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock, Crown } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SubscriptionProgressWidgetProps {
	applicantId?: string
	variant?: 'compact' | 'detailed'
	className?: string
	showTitle?: boolean
}

export function SubscriptionProgressWidget({
	applicantId,
	variant = 'detailed',
	className = '',
	showTitle = true,
}: SubscriptionProgressWidgetProps) {
	const t = useTranslations('profile_view.subscription_widget')
	const {
		planName,
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
					className={`bg-gray-200 rounded-lg ${
						variant === 'compact' ? 'h-8 w-20' : 'h-16 w-full'
					}`}
				/>
			</div>
		)
	}

	if (error || !applicationsLimit) {
		return null // Don't show for unlimited plans or errors
	}

	const progress = (applicationsUsed / applicationsLimit) * 100
	const isNearLimit = applicationsUsed >= applicationsLimit - 1
	const isAtLimit = applicationsUsed >= applicationsLimit

	if (variant === 'compact') {
		return (
			<div className={`inline-flex items-center gap-2 ${className}`}>
				<div className="flex items-center gap-1 text-sm">
					<div
						className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
							isAtLimit
								? 'bg-red-100 text-red-700 border border-red-200'
								: isNearLimit
									? 'bg-amber-100 text-amber-700 border border-amber-200'
									: 'bg-blue-100 text-blue-700 border border-blue-200'
						}`}
					>
						{isAtLimit ? (
							<AlertTriangle className="w-3 h-3" />
						) : (
							<CheckCircle className="w-3 h-3" />
						)}
						<span>
							{applicationsUsed}/{applicationsLimit}
						</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={`bg-white rounded-xl border p-4 ${className}`}
		>
			{showTitle && (
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
						<Crown className="w-4 h-4 text-amber-500" />
						{planName} {t('plan_applications')}
					</h3>
					{daysUntilReset && (
						<div className="flex items-center gap-1 text-xs text-gray-500">
							<Clock className="w-3 h-3" />
							{t('resets_in_days', { days: daysUntilReset })}
						</div>
					)}
				</div>
			)}

			{/* Progress Bar */}
			<div className="mb-3">
				<div className="flex justify-between text-sm mb-2">
					<span className="text-gray-600">{t('applications_used')}</span>
					<span
						className={`font-semibold ${
							isAtLimit
								? 'text-red-600'
								: isNearLimit
									? 'text-amber-600'
									: 'text-blue-600'
						}`}
					>
						{applicationsUsed} / {applicationsLimit}
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<motion.div
						className={`h-full rounded-full transition-all duration-500 ${
							isAtLimit
								? 'bg-red-500'
								: isNearLimit
									? 'bg-amber-500'
									: 'bg-blue-500'
						}`}
						initial={{ width: '0%' }}
						animate={{ width: `${Math.min(progress, 100)}%` }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
					/>
				</div>
			</div>

			{/* Status Message */}
			<div
				className={`text-sm p-3 rounded-lg ${
					isAtLimit
						? 'bg-red-50 text-red-700 border border-red-200'
						: isNearLimit
							? 'bg-amber-50 text-amber-700 border border-amber-200'
							: 'bg-blue-50 text-blue-700 border border-blue-200'
				}`}
			>
				{isAtLimit ? (
					<div className="flex items-center gap-2">
						<AlertTriangle className="w-4 h-4" />
						<span>
							{t('status.limit_reached')}{' '}
							{daysUntilReset
								? t('resets_in_days', { days: daysUntilReset.toString() })
								: t('status.upgrade_unlimited')}
						</span>
					</div>
				) : isNearLimit ? (
					<div className="flex items-center gap-2">
						<AlertTriangle className="w-4 h-4" />
						<span>
							{applicationsRemaining === 1
								? t('status.only_remaining', {
										count: (applicationsRemaining || 0).toString(),
									})
								: t('status.only_remaining_plural', {
										count: (applicationsRemaining || 0).toString(),
									})}
						</span>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4" />
						<span>
							{t('status.remaining', {
								count: (applicationsRemaining || 0).toString(),
							})}
						</span>
					</div>
				)}
			</div>
		</motion.div>
	)
}
