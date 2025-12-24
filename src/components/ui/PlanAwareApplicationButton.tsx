'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/forms/Button'
import { Crown, Loader2, ExternalLink } from 'lucide-react'
import { useApplicationEligibility } from '@/hooks/application/useApplicationEligibility'
import { ApplicationEligibilityBanner } from '@/components/ui/ApplicationEligibilityBanner'
import Modal from '@/components/ui/modals/Modal'

interface PlanAwareApplicationButtonProps {
	applicantId?: string
	onApply: () => void
	children?: React.ReactNode
	variant?: 'primary' | 'secondary' | 'outline'
	size?: 'sm' | 'md' | 'lg'
	className?: string
	disabled?: boolean
	showFullStatus?: boolean
}

export function PlanAwareApplicationButton({
	applicantId,
	onApply,
	children = 'Apply Now',
	variant = 'primary',
	size = 'md',
	className,
	disabled = false,
	showFullStatus = false,
}: PlanAwareApplicationButtonProps) {
	const [showStatusModal, setShowStatusModal] = useState(false)
	const [isApplying, setIsApplying] = useState(false)

	const { canApply, reason, planName, isLoading, error, refresh } =
		useApplicationEligibility(applicantId)

	const handleClick = async () => {
		if (!canApply) {
			if (showFullStatus) {
				setShowStatusModal(true)
			}
			return
		}

		setIsApplying(true)
		try {
			await onApply()
		} catch (error) {
			// Handle error silently or through error boundary
		} finally {
			setIsApplying(false)
			refresh() // Refresh eligibility after application attempt
		}
	}

	const getButtonText = () => {
		if (isApplying) return 'Applying...'
		if (isLoading) return 'Checking...'
		if (!canApply && planName.toLowerCase() === 'free') {
			return 'Upgrade to Apply'
		}
		if (!canApply && reason?.includes('limit')) {
			return 'Application Limit Reached'
		}
		if (!canApply) return 'Cannot Apply'
		return children
	}

	const getButtonVariant = () => {
		if (!canApply && planName.toLowerCase() === 'free') {
			return 'primary' // Encourage upgrade
		}
		if (!canApply) {
			return 'outline' // Less prominent for blocked states
		}
		return variant
	}

	if (error && !disabled) {
		return (
			<Button
				variant="outline"
				size={size}
				className={className}
				onClick={refresh}
				disabled={isLoading}
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin mr-2" />
				) : (
					'Retry'
				)}
			</Button>
		)
	}

	return (
		<>
			<Button
				variant={getButtonVariant()}
				size={size}
				className={className}
				onClick={handleClick}
				disabled={disabled || isLoading || isApplying}
			>
				{isApplying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
				{isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
				{!canApply &&
					planName.toLowerCase() === 'free' &&
					!isLoading &&
					!isApplying && <Crown className="h-4 w-4 mr-2" />}
				{!canApply &&
					!isLoading &&
					!isApplying &&
					planName.toLowerCase() !== 'free' && (
						<ExternalLink className="h-4 w-4 mr-2" />
					)}
				{getButtonText()}
			</Button>

			{/* Status Modal for detailed information */}
			{showFullStatus && (
				<Modal
					isOpen={showStatusModal}
					onClose={() => setShowStatusModal(false)}
					title="Application Status"
					maxWidth="md"
				>
					<ApplicationEligibilityBanner
						applicantId={applicantId}
						variant="modal"
						showUpgradeButton={true}
						onUpgradeClick={() => {
							setShowStatusModal(false)
							// Navigate to pricing or upgrade flow
							window.open('/pricing', '_blank')
						}}
					/>
				</Modal>
			)}
		</>
	)
}
