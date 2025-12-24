'use client'

import React from 'react'
import Modal from '@/components/ui/modals/Modal'
import Button from '@/components/ui/forms/Button'
import { Badge } from '@/components/ui/cards/badge'
import { Crown, Zap, CheckCircle, ArrowRight } from 'lucide-react'

interface PlanFeature {
	name: string
	included: boolean
}

interface PlanOption {
	name: string
	price: string
	priceDetail: string
	features: PlanFeature[]
	popular?: boolean
	current?: boolean
}

interface PlanUpgradeModalProps {
	isOpen: boolean
	onClose: () => void
	currentPlan: string
	onUpgrade: (planName: string) => void
	applicationsUsed: number
	applicationsLimit: number | null
}

const PLAN_OPTIONS: PlanOption[] = [
	{
		name: 'Standard',
		price: '$9.99',
		priceDetail: 'per month',
		features: [
			{ name: 'Up to 10 applications per month', included: true },
			{ name: 'Basic matching algorithm', included: true },
			{ name: 'Email support', included: true },
			{ name: 'Document upload (5MB limit)', included: true },
			{ name: 'Priority application review', included: false },
			{ name: 'Advanced matching insights', included: false },
			{ name: 'Unlimited applications', included: false },
		],
	},
	{
		name: 'Premium',
		price: '$24.99',
		priceDetail: 'per month',
		popular: true,
		features: [
			{ name: 'Unlimited applications', included: true },
			{ name: 'Advanced matching algorithm', included: true },
			{ name: 'Priority support', included: true },
			{ name: 'Document upload (50MB limit)', included: true },
			{ name: 'Priority application review', included: true },
			{ name: 'Advanced matching insights', included: true },
			{ name: 'Application analytics', included: true },
		],
	},
]

export function PlanUpgradeModal({
	isOpen,
	onClose,
	currentPlan,
	onUpgrade,
	applicationsUsed,
	applicationsLimit,
}: PlanUpgradeModalProps) {
	const getPlanIcon = (planName: string) => {
		switch (planName.toLowerCase()) {
			case 'premium':
				return <Crown className="h-5 w-5 text-yellow-500" />
			case 'standard':
				return <Zap className="h-5 w-5 text-blue-500" />
			default:
				return null
		}
	}

	const getUsageMessage = () => {
		if (applicationsLimit === null) {
			return `You've used ${applicationsUsed} applications this month`
		}
		const remaining = Math.max(0, applicationsLimit - applicationsUsed)
		if (remaining === 0) {
			return `You've reached your monthly limit of ${applicationsLimit} applications`
		}
		return `You've used ${applicationsUsed} of ${applicationsLimit} applications this month`
	}

	const shouldShowPlan = (plan: PlanOption) => {
		const currentPlanLower = currentPlan.toLowerCase()
		const planNameLower = plan.name.toLowerCase()

		// Always show plans that are upgrades from current plan
		if (currentPlanLower === 'free') {
			return true // Show both Standard and Premium for Free users
		}
		if (currentPlanLower === 'standard' && planNameLower === 'premium') {
			return true // Show Premium for Standard users
		}
		return false
	}

	const getButtonText = (plan: PlanOption) => {
		const currentPlanLower = currentPlan.toLowerCase()
		if (plan.name.toLowerCase() === currentPlanLower) {
			return 'Current Plan'
		}
		return `Upgrade to ${plan.name}`
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Upgrade Your Plan"
			maxWidth="xl"
		>
			<div className="space-y-6">
				{/* Current Status */}
				<div className="bg-muted/50 rounded-lg p-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium text-lg flex items-center gap-2">
								{currentPlan === 'Free' ? (
									<CheckCircle className="h-5 w-5 text-green-500" />
								) : (
									getPlanIcon(currentPlan)
								)}
								Current Plan: {currentPlan}
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{getUsageMessage()}
							</p>
						</div>
					</div>
				</div>

				{/* Plan Options */}
				<div className="grid gap-6 md:grid-cols-2">
					{PLAN_OPTIONS.filter(shouldShowPlan).map((plan) => (
						<div
							key={plan.name}
							className={`relative border rounded-lg p-6 ${
								plan.popular
									? 'border-primary ring-2 ring-primary/20'
									: 'border-border'
							}`}
						>
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<Badge className="bg-primary text-primary-foreground">
										Most Popular
									</Badge>
								</div>
							)}

							<div className="space-y-4">
								{/* Plan Header */}
								<div className="text-center">
									<div className="flex items-center justify-center gap-2 mb-2">
										{getPlanIcon(plan.name)}
										<h3 className="text-xl font-semibold">{plan.name}</h3>
									</div>
									<div className="mb-4">
										<span className="text-3xl font-bold">{plan.price}</span>
										<span className="text-muted-foreground ml-1">
											{plan.priceDetail}
										</span>
									</div>
								</div>

								{/* Features */}
								<div className="space-y-3">
									{plan.features.map((feature, index) => (
										<div key={index} className="flex items-start gap-3">
											{feature.included ? (
												<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
											) : (
												<div className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full border-2 border-muted" />
											)}
											<span
												className={`text-sm ${
													feature.included
														? 'text-foreground'
														: 'text-muted-foreground'
												}`}
											>
												{feature.name}
											</span>
										</div>
									))}
								</div>

								{/* Upgrade Button */}
								<div className="pt-4">
									<Button
										variant={plan.popular ? 'primary' : 'outline'}
										className="w-full"
										onClick={() => onUpgrade(plan.name)}
									>
										{getButtonText(plan)}
										<ArrowRight className="h-4 w-4 ml-2" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Footer */}
				<div className="text-center text-sm text-muted-foreground">
					<p>All plans include access to our platform and basic features.</p>
					<p className="mt-1">
						You can cancel or change your plan at any time.
					</p>
				</div>
			</div>
		</Modal>
	)
}
