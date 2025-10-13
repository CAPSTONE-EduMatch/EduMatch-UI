'use client'

import { Button, Modal } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PricingCards() {
	const {
		currentPlan,
		canUpgradeTo,
		upgradeSubscription,
		cancelSubscription,
		subscriptions,
		// fetchSubscriptions,
		loading,
		isAuthenticated,
	} = useSubscription()
	const router = useRouter()
	const [upgrading, setUpgrading] = useState<string | null>(null)
	const [cancelling, setCancelling] = useState<string | null>(null)
	const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
	const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
	const [showCancelModal, setShowCancelModal] = useState(false)

	// Plan hierarchy for downgrade checking
	const PLAN_HIERARCHY = {
		free: 0,
		standard: 1,
		premium: 2,
	} as const

	// Helper function to check if a plan is lower than current plan (downgrade)
	const isDowngrade = (planId: string): boolean => {
		if (!isAuthenticated) return false
		const currentLevel =
			PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0
		const targetLevel = PLAN_HIERARCHY[planId as keyof typeof PLAN_HIERARCHY]
		return targetLevel !== undefined && targetLevel < currentLevel
	}

	const plans = [
		{
			name: 'Free Plan',
			planId: 'free',
			price: 0,
			period: 'MONTHLY',
			description: 'Ideal for applicants ready to apply and track progress.',
			features: [
				'Account registration & OTP verification',
				'Create & update personal profile (GPA, skills, research topic, etc.)',
				'Basic scholarship, program & research group search',
				'View scholarship details & requirements',
				'Receive deadline reminders for saved scholarships/programs',
				'Send messages to scholarship staff / professors',
			],
			buttonText: 'Get Started Free',
			popular: false,
			limits: {
				applications: 3,
				scholarships: 10,
				programs: 5,
			},
		},
		{
			name: 'Standard Membership',
			planId: 'standard',
			price: 99,
			period: 'MONTHLY',
			description: 'Perfect for active scholarship hunters and applicants.',
			features: [
				'All Free Plan features',
				'Advanced scholarship matching algorithms',
				'Priority application tracking',
				'Extended program database access',
				'Email notifications & reminders',
				'Direct messaging with admissions staff',
				'Application deadline calendar sync',
				'Basic analytics dashboard',
			],
			buttonText: 'Upgrade to Standard',
			popular: true,
			limits: {
				applications: 10,
				scholarships: 50,
				programs: 30,
			},
		},
		{
			name: 'Premium Membership',
			planId: 'premium',
			price: 199,
			period: 'MONTHLY',
			description: 'Ultimate package for serious academic pursuers.',
			features: [
				'All Standard Plan features',
				'AI-powered essay review & suggestions',
				'One-on-one consultation calls',
				'Custom scholarship recommendations',
				'Application document templates',
				'Interview preparation resources',
				'Exclusive webinars & workshops',
				'Priority customer support',
			],
			buttonText: 'Upgrade to Premium',
			popular: false,
			limits: {
				applications: 25,
				scholarships: 100,
				programs: 75,
			},
		},
	]
	// useEffect(() => {
	// 	fetchSubscriptions()
	// }, [])

	const handleUpgrade = async (planId: string) => {
		// If user is not authenticated, redirect to signup
		if (!isAuthenticated) {
			router.push('/signup')
			return
		}

		if (planId === 'free') {
			// Free plan doesn't require upgrade for authenticated users
			return
		}

		// Check if user already has an active subscription
		const activeSubscription = subscriptions.find(
			(sub) => sub.status === 'active'
		)

		if (activeSubscription && activeSubscription.plan !== 'free') {
			// User has an active paid subscription, show modal
			setPendingPlanId(planId)
			setShowSubscriptionModal(true)
			return
		}

		// No active subscription or only free plan, proceed with upgrade
		try {
			setUpgrading(planId)
			await upgradeSubscription(planId)
		} catch (err) {
			// Error is handled by the hook
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.error('Upgrade failed:', err)
			}
		} finally {
			setUpgrading(null)
		}
	}

	// const handleModalConfirm = async () => {
	// 	// User chose to proceed anyway (create new subscription)
	// 	if (pendingPlanId) {
	// 		try {
	// 			setUpgrading(pendingPlanId)
	// 			await upgradeSubscription(pendingPlanId)
	// 		} catch (err) {
	// 			if (process.env.NODE_ENV === 'development') {
	// 				// eslint-disable-next-line no-console
	// 				console.error('Upgrade failed:', err)
	// 			}
	// 		} finally {
	// 			setUpgrading(null)
	// 		}
	// 	}
	// 	setShowSubscriptionModal(false)
	// 	setPendingPlanId(null)
	// }

	const handleModalCancel = async () => {
		// User chose to cancel current subscription first
		const activeSubscription = subscriptions.find(
			(sub) => sub.status === 'active'
		)

		if (activeSubscription) {
			try {
				setCancelling(activeSubscription.id)
				await cancelSubscription(activeSubscription.id)
				// After cancellation, we'll proceed with the new subscription
				if (pendingPlanId) {
					setUpgrading(pendingPlanId)
					await upgradeSubscription(pendingPlanId)
				}
			} catch (err) {
				if (process.env.NODE_ENV === 'development') {
					// eslint-disable-next-line no-console
					console.error('Cancel/Upgrade failed:', err)
				}
			} finally {
				setCancelling(null)
				setUpgrading(null)
			}
		}
		setShowSubscriptionModal(false)
		setPendingPlanId(null)
	}

	const handleConfirmCancel = async () => {
		if (!isAuthenticated) return

		// Find the active subscription
		const activeSubscription = subscriptions.find(
			(sub) => sub.status === 'active'
		)

		if (!activeSubscription) return

		try {
			setCancelling(activeSubscription.id)
			await cancelSubscription(activeSubscription.id)
			// Close the modal on successful cancellation
			setShowCancelModal(false)
		} catch (err) {
			// Error is handled by the hook
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.error('Cancel failed:', err)
			}
		} finally {
			setCancelling(null)
		}
	}

	const getButtonState = (plan: any) => {
		const isCurrentPlan = currentPlan === plan.planId
		const canUpgrade = canUpgradeTo(plan.planId)
		const isUpgrading = upgrading === plan.planId
		const isLowerPlan = isDowngrade(plan.planId)

		// If user is not authenticated, show "Get Started" for all plans
		if (!isAuthenticated) {
			return {
				text: 'Get Started',
				disabled: false,
				className: plan.popular
					? 'bg-[#116E63] text-white hover:bg-[#0f5c54]'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		// Authenticated user logic
		if (isCurrentPlan) {
			return {
				text: 'Current Plan',
				disabled: true,
				className: 'bg-green-100 text-green-700 cursor-not-allowed',
			}
		}

		// If this plan is lower than current plan, disable the button
		if (isLowerPlan) {
			return {
				text: 'Lower Plan',
				disabled: true,
				className: 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60',
			}
		}

		if (plan.planId === 'free' && !isLowerPlan) {
			return {
				text: 'Get Started Free',
				disabled: false,
				className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		if (!canUpgrade) {
			return {
				text: 'Contact Us',
				disabled: false,
				className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		if (isUpgrading) {
			return {
				text: 'Processing...',
				disabled: true,
				className: 'bg-gray-300 text-gray-600 cursor-not-allowed',
			}
		}

		return {
			text: plan.buttonText,
			disabled: loading,
			className: plan.popular
				? 'bg-[#116E63] text-white hover:bg-[#0f5c54]'
				: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
		}
	}

	return (
		<section className="px-4 py-16 bg-[#FBFBFB]">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
					{plans.map((plan, index) => {
						const buttonState = getButtonState(plan)

						return (
							<div
								key={index}
								className={`relative bg-white rounded-[30px] p-8 lg:p-12 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fadeInUp ${
									plan.popular
										? 'ring-2 ring-[#116E63] scale-105 shadow-xl'
										: 'hover:shadow-lg'
								}`}
								style={{
									animationDelay: `${index * 200}ms`,
								}}
							>
								{/* Popular Badge */}
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
										<span className="bg-[#116E63] text-white text-sm font-semibold px-4 py-1 rounded-full">
											Most Popular
										</span>
									</div>
								)}

								{/* Current Plan Badge */}
								{currentPlan === plan.planId && (
									<div className="absolute -top-3 right-4">
										<span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
											Active
										</span>
									</div>
								)}

								{/* Plan Header */}
								<div className="mb-8">
									<h3 className="text-2xl lg:text-3xl font-bold text-black mb-4">
										{plan.name}
									</h3>
									<div className="mb-4">
										<span className="text-3xl lg:text-4xl font-bold text-black">
											${plan.price}
										</span>
										<span className="text-lg text-black ml-2">
											/ {plan.period}
										</span>
									</div>
									<p className="text-[#A2A2A2] text-base">{plan.description}</p>

									{/* Plan Limits */}
									{plan.limits && (
										<div className="mt-4 text-sm text-gray-600">
											<div className="flex justify-between">
												<span>Applications:</span>
												<span className="font-semibold">
													{plan.limits.applications}
												</span>
											</div>
											<div className="flex justify-between">
												<span>Scholarships:</span>
												<span className="font-semibold">
													{plan.limits.scholarships}
												</span>
											</div>
											<div className="flex justify-between">
												<span>Programs:</span>
												<span className="font-semibold">
													{plan.limits.programs}
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Features */}
								<div className="mb-8">
									<h4 className="text-lg font-medium text-[#232323] mb-6">
										Includes
									</h4>
									<ul className="space-y-4">
										{plan.features.map((feature, featureIndex) => (
											<li
												key={featureIndex}
												className="flex items-start gap-3 opacity-0 animate-slideInLeft"
												style={{
													animationDelay: `${index * 200 + featureIndex * 100}ms`,
												}}
											>
												<div className="w-5 h-5 rounded-full border border-black flex items-center justify-center flex-shrink-0 mt-1">
													<div className="w-2 h-2 bg-black rounded-full"></div>
												</div>
												<span className="text-sm text-[#A2A2A2] leading-relaxed">
													{feature}
												</span>
											</li>
										))}
									</ul>
								</div>

								{/* Button */}
								<button
									className={`w-full py-3 px-6 rounded-[30px] font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg opacity-0 animate-fadeInUp ${buttonState.className}`}
									style={{ animationDelay: `${index * 200 + 600}ms` }}
									disabled={buttonState.disabled}
									onClick={() => handleUpgrade(plan.planId)}
								>
									{buttonState.text}
								</button>

								{/* Cancel Button - Only show for current paid plans */}
								{currentPlan === plan.planId && plan.planId !== 'free' && (
									<button
										className={`w-full mt-3 py-2.5 px-6 rounded-[30px] font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg opacity-0 animate-fadeInUp ${
											cancelling
												? 'bg-gray-200 text-gray-600 cursor-not-allowed'
												: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
										}`}
										style={{ animationDelay: `${index * 200 + 700}ms` }}
										disabled={!!cancelling}
										onClick={() => setShowCancelModal(true)}
									>
										{cancelling ? 'Cancelling...' : 'Cancel Subscription'}
									</button>
								)}
							</div>
						)
					})}
				</div>

				{/* Subscription Modal */}
				<Modal
					isOpen={showSubscriptionModal}
					onClose={() => {
						setShowSubscriptionModal(false)
						setPendingPlanId(null)
					}}
					title="You Already Have an Active Subscription"
					maxWidth="md"
				>
					<div className="text-center">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
							<svg
								className="h-6 w-6 text-orange-600"
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
							<p>
								You currently have an active{' '}
								<span className="font-semibold capitalize">
									{subscriptions.find((sub) => sub.status === 'active')?.plan ||
										''}
								</span>{' '}
								subscription.
							</p>
							<p>
								To subscribe to the{' '}
								<span className="font-semibold capitalize">
									{pendingPlanId || ''}
								</span>{' '}
								plan, you need to cancel your current subscription first.
							</p>
							<p className="text-xs text-gray-500 mt-3">
								You&apos;ll retain access to your current plan until the end of
								your billing period.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<Button
							onClick={() => {
								setShowSubscriptionModal(false)
								setPendingPlanId(null)
							}}
							variant="secondary"
							fullWidth
						>
							Keep Current Plan
						</Button>
						<Button
							onClick={handleModalCancel}
							disabled={cancelling !== null}
							isLoading={cancelling !== null}
							loadingText="Canceling..."
							variant="primary"
							fullWidth
							className="!bg-red-600 hover:!bg-red-700"
						>
							Cancel Current Plan
						</Button>
					</div>

					{/* <div className="mt-4 text-center">
						<button
							type="button"
							onClick={handleModalConfirm}
							className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
						>
							Or continue to new subscription anyway
						</button>
					</div> */}
				</Modal>

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
								<span className="font-semibold capitalize">{currentPlan}</span>{' '}
								subscription.
							</p>
							<p>
								You&apos;ll retain access to your current plan until the end of
								your billing period.
							</p>
							<p className="text-xs text-gray-500 mt-3">
								This action cannot be undone. You&apos;ll need to resubscribe to
								regain access.
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
							onClick={handleConfirmCancel}
							disabled={cancelling !== null}
							isLoading={cancelling !== null}
							loadingText="Canceling..."
							variant="primary"
							fullWidth
							className="!bg-red-600 hover:!bg-red-700"
						>
							Cancel Subscription
						</Button>
					</div>
				</Modal>
			</div>
		</section>
	)
}
