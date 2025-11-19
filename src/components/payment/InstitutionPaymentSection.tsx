'use client'

import { useSubscription } from '@/hooks/subscription/useSubscription'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Button, Modal } from '../ui'

interface InstitutionPaymentSectionProps {
	onStartPlan?: () => void
}

type BillingCycle = 'monthly' | 'yearly'

export const InstitutionPaymentSection: React.FC<
	InstitutionPaymentSectionProps
> = ({ onStartPlan }) => {
	const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
	const {
		upgradeSubscription,
		cancelSubscription,
		subscriptions,
		currentPlan,
		loading,
		isAuthenticated,
	} = useSubscription()
	const [upgrading, setUpgrading] = useState(false)
	const [cancelling, setCancelling] = useState(false)
	const [showCancelModal, setShowCancelModal] = useState(false)
	const router = useRouter()

	const institutionPlanId =
		billingCycle === 'yearly' ? 'institution_yearly' : 'institution_monthly'
	const price = billingCycle === 'yearly' ? '99' : '12'

	// Check if user has any active institution subscription (monthly or yearly)
	const hasActiveInstitutionSubscription = subscriptions.some(
		(sub) =>
			sub.status === 'active' &&
			(sub.plan === 'institution_monthly' || sub.plan === 'institution_yearly')
	)

	// If user has any institution subscription, both cards should show "Current Plan"
	const isCurrentPlan = hasActiveInstitutionSubscription

	const features = [
		{
			title: 'Organizational Profile Management',
			description:
				'Create and manage comprehensive institutional profiles with branding and details.',
		},
		{
			title: 'Opportunity Posting',
			description:
				'Post detailed opportunities with descriptions, eligibility criteria, and deadlines.',
		},
		{
			title: 'Custom Applicant Filters',
			description:
				'Create and manage comprehensive institutional profiles with branding and details.',
		},
		{
			title: 'AI-Generated Shortlists',
			description:
				'Access intelligent matching algorithms to find the best candidates.',
		},
		{
			title: 'Applicant Profile Access',
			description:
				'View detailed applicant profiles with matching scores and analytics.',
		},
		{
			title: 'Interview Management',
			description:
				'Invite applicants for interviews and update selection results seamlessly.',
		},
		{
			title: 'Integrated Communication',
			description:
				'Communicate with applicants via built-in chat and email systems.',
		},
		{
			title: 'Analytics Dashboard',
			description:
				'Monitor engagement statistics, views, and applications through web dashboards.',
		},
	]

	const handleStartPlan = async () => {
		// If user is not authenticated, redirect to signup
		if (!isAuthenticated) {
			router.push('/signup')
			return
		}

		// If user already has this plan, do nothing
		if (isCurrentPlan) {
			return
		}

		if (onStartPlan) {
			onStartPlan()
		}

		try {
			setUpgrading(true)
			await upgradeSubscription(institutionPlanId)
		} catch (err) {
			// Error is handled by the hook
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.error('Institution plan upgrade failed:', err)
			}
		} finally {
			setUpgrading(false)
		}
	}

	const handleCancelSubscription = async () => {
		if (!isAuthenticated) return

		// Find the active institution subscription
		const activeSubscription = subscriptions.find(
			(sub) =>
				sub.status === 'active' &&
				(sub.plan === 'institution_monthly' ||
					sub.plan === 'institution_yearly')
		)

		if (!activeSubscription) return

		try {
			setCancelling(true)
			await cancelSubscription(activeSubscription.id)
			setShowCancelModal(false)
		} catch (err) {
			// Error is handled by the hook
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.error('Cancel failed:', err)
			}
		} finally {
			setCancelling(false)
		}
	}

	const getButtonState = () => {
		// If user is not authenticated, show signup text
		if (!isAuthenticated) {
			return {
				text: 'Sign Up to Continue',
				disabled: false,
				showCancelButton: false,
			}
		}

		// If this is the current plan, show current plan
		if (isCurrentPlan) {
			return {
				text: 'Current Plan',
				disabled: true,
				showCancelButton: true,
			}
		}

		// If upgrading, show processing
		if (upgrading) {
			return {
				text: 'Processing...',
				disabled: true,
				showCancelButton: false,
			}
		}

		// Default upgrade text
		return {
			text: 'Start Institution Plan',
			disabled: loading,
			showCancelButton: false,
		}
	}

	return (
		<section className="px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<motion.div
					className="text-center mb-8"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
						Complete Your Payment
					</h1>
					<p className="text-[#A2A2A2] text-base max-w-3xl mx-auto">
						Thank you for choosing EduMatch. To activate your Institution
						account and access all features (posting opportunities, managing
						applicants, and sending messages), please complete your payment
						below.
					</p>
				</motion.div>

				{/* Billing Cycle Toggle */}
				<motion.div
					className="flex justify-center mb-8"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4, delay: 0.2 }}
				>
					<div className="inline-flex bg-gray-100 rounded-full p-1 relative">
						<button
							onClick={() => setBillingCycle('monthly')}
							className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative z-10 ${
								billingCycle === 'monthly'
									? 'text-white'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setBillingCycle('yearly')}
							className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative z-10 ${
								billingCycle === 'yearly'
									? 'text-white'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Yearly
						</button>
						{/* Animated background slider */}
						<motion.div
							className="absolute top-1 bg-[#116E63] rounded-full h-[32px]"
							initial={false}
							animate={{
								left: billingCycle === 'monthly' ? '4px' : '50%',
								width: billingCycle === 'monthly' ? '100px' : '90px',
							}}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						/>
					</div>
				</motion.div>

				{/* Pricing Card - Using same structure as existing pricing cards */}
				<div className="flex justify-center pt-10">
					<motion.div
						className="relative bg-white rounded-[30px] p-8 lg:p-12 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ring-2 ring-[#116E63] scale-105 shadow-xl max-w-lg w-full"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						{/* Popular Badge */}
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<span className="bg-[#116E63] text-white text-sm font-semibold px-4 py-1 rounded-full">
								Recommended
							</span>
						</div>
						{/* Current Plan Badge */}
						{isCurrentPlan && (
							<div className="absolute -top-3 right-4">
								<span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
									Active
								</span>
							</div>
						)}{' '}
						{/* Plan Header */}
						<div className="mb-8">
							<h3 className="text-2xl lg:text-3xl font-bold text-black mb-4">
								Institution Plan
							</h3>
							<div className="mb-4">
								<span className="text-3xl lg:text-4xl font-bold text-black">
									${price}
								</span>
								<span className="text-lg text-black ml-2">
									/ {billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY'}
								</span>
							</div>
							<p className="text-[#A2A2A2] text-base">
								All-in-one solution for institutions to post opportunities,
								connect with applicants, and manage the entire selection process
							</p>
						</div>
						{/* Features */}
						<div className="mb-8">
							<h4 className="text-lg font-medium text-[#232323] mb-6">
								Includes
							</h4>
							<ul className="space-y-4">
								{features.map((feature, featureIndex) => (
									<motion.li
										key={featureIndex}
										className="flex items-start gap-3"
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											duration: 0.4,
											delay: 0.6 + featureIndex * 0.1,
										}}
									>
										<div className="w-5 h-5 rounded-full border border-black flex items-center justify-center flex-shrink-0 mt-1">
											<div className="w-2 h-2 bg-black rounded-full"></div>
										</div>
										<div className="flex-1">
											<span className="text-sm font-medium text-black leading-relaxed block mb-1">
												{feature.title}
											</span>
											<span className="text-xs text-[#A2A2A2] leading-relaxed">
												{feature.description}
											</span>
										</div>
									</motion.li>
								))}
							</ul>
						</div>
						{/* Button */}
						{(() => {
							const buttonState = getButtonState()
							return (
								<>
									<button
										className={`w-full py-3 px-6 rounded-[30px] font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
											isCurrentPlan
												? 'bg-green-100 text-green-700 cursor-not-allowed'
												: 'bg-[#116E63] text-white hover:bg-[#0f5c54]'
										}`}
										onClick={handleStartPlan}
										disabled={buttonState.disabled}
									>
										{buttonState.text}
									</button>

									{/* Cancel Button - Only show for current plan */}
									{buttonState.showCancelButton && (
										<button
											className={`w-full mt-3 py-2.5 px-6 rounded-[30px] font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
												cancelling
													? 'bg-gray-200 text-gray-600 cursor-not-allowed'
													: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
											}`}
											onClick={() => setShowCancelModal(true)}
											disabled={cancelling}
										>
											{cancelling ? 'Cancelling...' : 'Cancel Subscription'}
										</button>
									)}
								</>
							)
						})()}
					</motion.div>
				</div>
			</div>

			{/* Cancel Confirmation Modal */}
			<Modal
				isOpen={showCancelModal}
				onClose={() => setShowCancelModal(false)}
				title="Cancel Subscription"
				maxWidth="md"
			>
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
							/>
						</svg>
					</div>
					<div className="text-sm text-gray-600 mb-6 space-y-2">
						<p className="font-semibold text-gray-800 text-lg mb-3">
							Are you sure you want to cancel your subscription?
						</p>
						<p>
							You currently have an active{' '}
							<span className="font-semibold capitalize">
								{currentPlan?.replace('_', ' ')}
							</span>{' '}
							subscription.
						</p>
						<p>
							You&apos;ll retain access to your current plan until the end of
							your billing period.
						</p>
						<p className="text-xs text-gray-500 mt-3">
							This action cannot be undone. You&apos;ll need to resubscribe to
							regain access to institution features.
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<Button
						onClick={() => setShowCancelModal(false)}
						variant="secondary"
						fullWidth
					>
						Keep My Subscription
					</Button>
					<Button
						onClick={handleCancelSubscription}
						disabled={cancelling}
						isLoading={cancelling}
						loadingText="Canceling..."
						variant="primary"
						fullWidth
						className="!bg-red-600 hover:!bg-red-700"
					>
						Cancel Subscription
					</Button>
				</div>
			</Modal>
		</section>
	)
}
