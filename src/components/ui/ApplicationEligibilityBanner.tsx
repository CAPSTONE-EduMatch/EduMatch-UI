'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/cards/badge'
import Button from '@/components/ui/forms/Button'
import { Progress } from '@/components/ui/progress'
import { useApplicationEligibility } from '@/hooks/application/useApplicationEligibility'
import {
	AlertTriangle,
	CheckCircle,
	Crown,
	RefreshCw,
	XCircle,
	Zap,
} from 'lucide-react'
import React from 'react'

interface ApplicationEligibilityBannerProps {
	applicantId?: string
	variant?: 'card' | 'inline' | 'modal'
	showUpgradeButton?: boolean
	onUpgradeClick?: () => void
}

export function ApplicationEligibilityBanner({
	applicantId,
	variant = 'card',
	showUpgradeButton = true,
	onUpgradeClick,
}: ApplicationEligibilityBannerProps) {
	const {
		canApply,
		reason,
		planName,
		applicationsUsed,
		applicationsLimit,
		applicationsRemaining,
		daysUntilReset,
		isLoading,
		error,
		refresh,
	} = useApplicationEligibility(applicantId)

	if (isLoading) {
		return (
			<Alert className="animate-pulse">
				<RefreshCw className="h-4 w-4 animate-spin" />
				<AlertDescription>Loading application status...</AlertDescription>
			</Alert>
		)
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription className="flex items-center justify-between">
					<span>Unable to load application status: {error}</span>
					<Button variant="outline" size="sm" onClick={refresh}>
						<RefreshCw className="h-3 w-3 mr-1" />
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		)
	}

	const getPlanIcon = () => {
		switch (planName.toLowerCase()) {
			case 'premium':
				return <Crown className="h-4 w-4 text-yellow-500" />
			case 'standard':
				return <Zap className="h-4 w-4 text-blue-500" />
			default:
				return <CheckCircle className="h-4 w-4 text-green-500" />
		}
	}

	const getPlanBadgeVariant = () => {
		switch (planName.toLowerCase()) {
			case 'premium':
				return 'default' as const // Gold/yellow styling
			case 'standard':
				return 'secondary' as const // Blue styling
			default:
				return 'outline' as const // Basic styling
		}
	}

	const getProgressPercentage = () => {
		if (applicationsLimit === null) return 0 // Unlimited
		if (applicationsLimit === 0) return 100 // No applications allowed
		return (applicationsUsed / applicationsLimit) * 100
	}

	// Enhanced contextual messages
	const getContextualMessage = () => {
		if (applicationsLimit === null) {
			return 'Unlimited applications available'
		}

		const isNearLimit = applicationsUsed >= applicationsLimit - 1
		const isAtLimit = applicationsUsed >= applicationsLimit

		if (isAtLimit) {
			return `You've reached your limit of ${applicationsLimit} applications. ${daysUntilReset ? `Resets in ${daysUntilReset} days` : 'Upgrade for unlimited applications'}`
		}

		if (isNearLimit) {
			return `You've used ${applicationsUsed}/${applicationsLimit} applications. Only ${applicationsRemaining} remaining${daysUntilReset ? ` - resets in ${daysUntilReset} days` : ''}`
		}

		if (applicationsUsed === 0) {
			return `You have ${applicationsLimit} applications available this period`
		}

		return `You've used ${applicationsUsed}/${applicationsLimit} applications. ${applicationsRemaining} remaining${daysUntilReset ? ` - resets in ${daysUntilReset} days` : ''}`
	}

	const getMessageIcon = () => {
		if (applicationsLimit === null)
			return (
				<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
			)

		const isAtLimit = applicationsUsed >= applicationsLimit
		const isNearLimit = applicationsUsed >= applicationsLimit - 1

		if (isAtLimit)
			return <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
		if (isNearLimit)
			return (
				<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
			)
		return (
			<CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
		)
	}

	const renderContent = () => (
		<div className="space-y-3">
			{/* Plan Status Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{getPlanIcon()}
					<Badge variant={getPlanBadgeVariant()} className="font-medium">
						{planName} Plan
					</Badge>
				</div>
				{canApply ? (
					<div className="flex items-center gap-1 text-green-600">
						<CheckCircle className="h-4 w-4" />
						<span className="text-sm font-medium">Ready to Apply</span>
					</div>
				) : (
					<div className="flex items-center gap-1 text-red-600">
						<XCircle className="h-4 w-4" />
						<span className="text-sm font-medium">Application Blocked</span>
					</div>
				)}
			</div>

			{/* Application Usage Progress */}
			{applicationsLimit !== null && (
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Applications Used</span>
						<span className="font-medium">
							{applicationsUsed} /{' '}
							{applicationsLimit === null ? 'Unlimited' : applicationsLimit}
						</span>
					</div>
					<Progress
						value={getProgressPercentage()}
						className="h-2"
						// Color based on usage
						style={
							{
								'--progress-background':
									getProgressPercentage() > 80
										? 'rgb(239 68 68)' // red-500 for high usage
										: getProgressPercentage() > 60
											? 'rgb(245 158 11)' // amber-500 for medium usage
											: 'rgb(34 197 94)', // green-500 for low usage
							} as React.CSSProperties
						}
					/>
				</div>
			)}

			{/* Enhanced Status Message */}
			<div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
				{getMessageIcon()}
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground">
						{getContextualMessage()}
					</p>
					{reason && reason !== getContextualMessage() && (
						<p className="text-xs text-muted-foreground">{reason}</p>
					)}
				</div>
			</div>

			{/* Upgrade CTA */}
			{!canApply &&
				showUpgradeButton &&
				planName.toLowerCase() !== 'premium' && (
					<div className="pt-2">
						<Button
							onClick={onUpgradeClick}
							className="w-full"
							variant={
								planName.toLowerCase() === 'free' ? 'primary' : 'secondary'
							}
						>
							<Crown className="h-4 w-4 mr-2" />
							{planName.toLowerCase() === 'free'
								? 'Upgrade to Standard or Premium'
								: 'Upgrade to Premium'}
						</Button>
					</div>
				)}
		</div>
	)

	// Render based on variant
	switch (variant) {
		case 'inline':
			return (
				<div className="p-4 border rounded-lg bg-card">{renderContent()}</div>
			)
		case 'modal':
			return <div className="space-y-4">{renderContent()}</div>
		case 'card':
		default:
			return (
				<Alert className="border-l-4 border-l-primary">
					<div className="w-full">{renderContent()}</div>
				</Alert>
			)
	}
}
