'use client'

import { Button, Modal } from '@/components/ui'
import { usePricing } from '@/hooks/pricing/usePricing'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PricingCardsError, PricingCardsSkeleton } from './PricingCardsSkeleton'
import { useTranslations } from 'next-intl'

export function PricingCards() {
	const t = useTranslations('pricing')
	const {
		currentPlan,
		canUpgradeTo,
		upgradeSubscription,
		cancelSubscription,
		subscriptions,
		loading,
		isAuthenticated,
	} = useSubscription()
	const {
		plans: dbPlans,
		loading: plansLoading,
		error: plansError,
	} = usePricing()
	const router = useRouter()
	const [upgrading, setUpgrading] = useState<string | null>(null)
	const [cancelling, setCancelling] = useState<string | null>(null)
	const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
	const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
	const [showCancelModal, setShowCancelModal] = useState(false)

	// Show loading skeleton while fetching plans
	if (plansLoading) {
		return <PricingCardsSkeleton />
	}

	// Show error state if fetching plans failed
	if (plansError) {
		return <PricingCardsError error={plansError} />
	}

	// Helper function to map plan name to database plan by matching name
	const getPlanByName = (planName: string) => {
		const nameMap: Record<string, string> = {
			free: 'Free Plan',
			standard: 'Standard Plan',
			premium: 'Premium Plan',
		}
		const searchName = nameMap[planName.toLowerCase()] || planName
		return dbPlans.find((p) => p.name === searchName)
	}

	// Helper to get plan name key for canUpgradeTo (converts hierarchy to plan name)
	const getPlanNameKey = (hierarchy: number): string => {
		const hierarchyMap: Record<number, string> = {
			0: 'free',
			1: 'standard',
			2: 'premium',
		}
		return hierarchyMap[hierarchy] || 'free'
	}

	// Helper function to check if a plan is lower than current plan (downgrade)
	const isDowngrade = (planHierarchy: number): boolean => {
		if (!isAuthenticated) return false
		const currentPlanData = getPlanByName(currentPlan || 'free')
		if (!currentPlanData) return false
		return planHierarchy < currentPlanData.hierarchy
	}

	// Helper function to normalize feature text for translation lookup
	const normalizeFeatureText = (text: string): string => {
		// Remove extra whitespace, normalize line breaks, and trim
		return text
			.replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
			.trim()
	}

	// Helper function to translate plan name
	const translatePlanName = (planName: string): string => {
		const planNames = t.raw('comparison.plan_names') as
			| Record<string, string>
			| undefined

		if (planNames && typeof planNames === 'object' && planNames[planName]) {
			return planNames[planName]
		}

		return planName
	}

	// Helper function to translate plan description
	const translatePlanDescription = (description: string): string => {
		const planDescriptions = t.raw('comparison.plan_descriptions') as
			| Record<string, string>
			| undefined

		if (
			planDescriptions &&
			typeof planDescriptions === 'object' &&
			planDescriptions[description]
		) {
			return planDescriptions[description]
		}

		return description
	}

	// Helper function to translate feature
	const translateFeature = (featureName: string): string => {
		const normalized = normalizeFeatureText(featureName)

		// Get the entire feature_map object
		const featureMap = t.raw('comparison.feature_map') as
			| Record<string, string>
			| undefined

		if (featureMap && typeof featureMap === 'object') {
			// Direct lookup
			if (featureMap[normalized]) {
				return featureMap[normalized]
			}

			// Try finding with case-insensitive match
			const key = Object.keys(featureMap).find(
				(k) => k.toLowerCase() === normalized.toLowerCase()
			)
			if (key && featureMap[key]) {
				return featureMap[key]
			}
		}

		// Fallback to original text
		return featureName
	}

	// Map database plans to component structure
	const plans = dbPlans.map((plan) => ({
		name: plan.name,
		translatedName: translatePlanName(plan.name),
		planId: plan.plan_id,
		planNameKey: getPlanNameKey(plan.hierarchy), // For canUpgradeTo
		price: plan.month_price / 100, // Convert cents to dollars
		period: 'MONTHLY',
		description: plan.description || '',
		translatedDescription: translatePlanDescription(plan.description || ''),
		features: plan.features,
		buttonText:
			plan.hierarchy === 0
				? 'Get Started Free'
				: `Upgrade to ${plan.name.replace(' Plan', '')}`,
		popular: plan.popular || false,
		hierarchy: plan.hierarchy,
	}))
	// useEffect(() => {
	// 	fetchSubscriptions()
	// }, [])

	const handleUpgrade = async (planId: string, planHierarchy: number) => {
		// If user is not authenticated, redirect to signup
		if (!isAuthenticated) {
			router.push('/signup')
			return
		}

		if (planId === 'free') {
			// Free plan doesn't require upgrade for authenticated users
			return
		}

		// Check if this is a downgrade
		if (isDowngrade(planHierarchy)) {
			// Show subscription modal to guide user to cancel first
			setPendingPlanId(planId)
			setShowSubscriptionModal(true)
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
		// Check if this is the current plan by comparing hierarchy
		const currentPlanData = getPlanByName(currentPlan || 'free')
		const isCurrentPlan = currentPlanData?.hierarchy === plan.hierarchy
		const canUpgrade = canUpgradeTo(plan.planNameKey)
		const isUpgrading = upgrading === plan.planId
		const isLowerPlan = isDowngrade(plan.hierarchy)

		// If user is not authenticated, show "Get Started" for all plans
		if (!isAuthenticated) {
			return {
				text: t('buttons.get_started'),
				disabled: false,
				className: plan.popular
					? 'bg-[#116E63] text-white hover:bg-[#0f5c54]'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		// Authenticated user logic
		if (isCurrentPlan) {
			return {
				text: t('buttons.current_plan'),
				disabled: true,
				className: 'bg-green-100 text-green-700 cursor-not-allowed',
			}
		}

		// If this plan is lower than current plan, disable the button
		if (isLowerPlan) {
			return {
				text: t('buttons.lower_plan'),
				disabled: true,
				className: 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60',
			}
		}

		if (plan.hierarchy === 0 && !isLowerPlan) {
			return {
				text: t('buttons.get_started'),
				disabled: false,
				className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		if (!canUpgrade) {
			return {
				text: t('buttons.contact_us'),
				disabled: false,
				className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			}
		}

		if (isUpgrading) {
			return {
				text: t('buttons.processing'),
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
						const currentPlanData = getPlanByName(currentPlan || 'free')
						const isCurrentPlan = currentPlanData?.hierarchy === plan.hierarchy

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
											{t('badges.most_popular')}
										</span>
									</div>
								)}

								{/* Current Plan Badge */}
								{isCurrentPlan && (
									<div className="absolute -top-3 right-4">
										<span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
											{t('badges.active')}
										</span>
									</div>
								)}

								{/* Plan Header */}
								<div className="mb-8">
									<h3 className="text-2xl lg:text-3xl font-bold text-black mb-4">
										{plan.translatedName}
									</h3>
									<div className="mb-4">
										<span className="text-3xl lg:text-4xl font-bold text-black">
											${plan.price}
										</span>
										<span className="text-lg text-black ml-2">
											/ {t('comparison.monthly')}
										</span>
									</div>
									<p className="text-[#A2A2A2] text-base">
										{plan.translatedDescription}
									</p>
								</div>

								{/* Features */}
								<div className="mb-8">
									<h4 className="text-lg font-medium text-[#232323] mb-6">
										{t('includes')}
									</h4>
									<ul className="space-y-4">
										{' '}
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
													{translateFeature(feature)}
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
									onClick={() => handleUpgrade(plan.planId, plan.hierarchy)}
								>
									{buttonState.text}
								</button>

								{/* Cancel Button - Only show for current paid plans */}
								{isCurrentPlan && plan.hierarchy > 0 && (
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
										{cancelling
											? t('buttons.cancelling')
											: t('buttons.cancel_subscription')}
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
					title={t('modals.active_subscription.title')}
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
								{t('modals.active_subscription.current_plan', {
									plan:
										subscriptions.find((sub) => sub.status === 'active')
											?.plan || '',
								})}
							</p>
							<p>
								{t('modals.active_subscription.need_cancel', {
									newPlan: pendingPlanId || '',
								})}
							</p>
							<p className="text-xs text-gray-500 mt-3">
								{t('modals.active_subscription.access_note')}
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
							{t('buttons.keep_current_plan')}
						</Button>
						<Button
							onClick={handleModalCancel}
							disabled={cancelling !== null}
							isLoading={cancelling !== null}
							loadingText={t('modals.active_subscription.canceling')}
							variant="primary"
							fullWidth
							className="!bg-red-600 hover:!bg-red-700"
						>
							{t('buttons.cancel_current_plan')}
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
					title={t('modals.cancel_confirmation.title')}
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
								{t('modals.cancel_confirmation.confirm_question')}
							</p>
							<p>
								{t('modals.cancel_confirmation.current_plan', {
									plan: currentPlan || '',
								})}
							</p>
							<p>{t('modals.cancel_confirmation.access_note')}</p>
							<p className="text-xs text-gray-500 mt-3">
								{t('modals.cancel_confirmation.warning')}
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<Button
							onClick={() => setShowCancelModal(false)}
							variant="secondary"
							fullWidth
						>
							{t('buttons.keep_my_subscription')}
						</Button>
						<Button
							onClick={handleConfirmCancel}
							disabled={cancelling !== null}
							isLoading={cancelling !== null}
							loadingText={t('buttons.canceling')}
							variant="primary"
							fullWidth
							className="!bg-red-600 hover:!bg-red-700"
						>
							{t('buttons.cancel_subscription')}
						</Button>
					</div>
				</Modal>
			</div>
		</section>
	)
}
