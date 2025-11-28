'use client'

import { usePricing } from '@/hooks/pricing/usePricing'
import { Check, X } from 'lucide-react'
import {
	FeatureComparisonError,
	FeatureComparisonSkeleton,
} from './FeatureComparisonSkeleton'

export function FeatureComparison() {
	const { plans, loading, error } = usePricing()

	// Show loading skeleton while fetching plans
	if (loading) {
		return <FeatureComparisonSkeleton />
	}

	// Show error state if fetching plans failed
	if (error) {
		return <FeatureComparisonError error={error} />
	}

	// Generate unique features across all plans
	const allFeatures = Array.from(
		new Set(plans.flatMap((plan) => plan.features))
	)

	// Generate plan headers dynamically
	const planHeaders = plans.map((plan) => ({
		name: plan.name.replace(' Plan', ''),
		popular: plan.popular || false,
	}))

	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-7xl mx-auto">
				{/* Section Header */}
				<div className="text-center mb-12">
					<h2
						className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6 opacity-0 animate-fadeInUp"
						style={{ animationDelay: '200ms' }}
					>
						Compare Plans
					</h2>
					<p
						className="text-lg text-[#676767] max-w-3xl mx-auto opacity-0 animate-fadeInUp"
						style={{ animationDelay: '400ms' }}
					>
						Choose the plan that best fits your scholarship hunting needs and
						budget.
					</p>
				</div>

				{/* Desktop Comparison Table */}
				<div
					className="hidden md:block bg-[#FBFBFB] rounded-3xl p-8 lg:p-12 opacity-0 animate-fadeInUp"
					style={{ animationDelay: '600ms' }}
				>
					{/* Plan Headers */}
					<div
						className={`grid gap-4 mb-8 border-b border-gray-200 pb-6`}
						style={{ gridTemplateColumns: `1fr repeat(${plans.length}, 1fr)` }}
					>
						<div className="flex items-end">
							<span className="text-lg font-semibold text-black">Features</span>
						</div>
						{planHeaders.map((plan, index) => (
							<div
								key={index}
								className="text-center opacity-0 animate-slideInLeft"
								style={{ animationDelay: `${800 + index * 100}ms` }}
							>
								<h3 className="text-xl font-bold text-black mb-2">
									{plan.name}
									{plan.popular && (
										<span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
											Popular
										</span>
									)}
								</h3>
								<div className="text-2xl font-bold text-black">
									${plans[index].month_price / 100}
								</div>
								<div className="text-sm text-[#A2A2A2]">/monthly</div>
							</div>
						))}
					</div>

					{/* Feature Rows */}
					<div className="space-y-4">
						{allFeatures.map((featureName, index) => (
							<div
								key={index}
								className={`grid gap-4 py-4 border-b border-gray-100 last:border-b-0 opacity-0 animate-fadeInUp hover:bg-white transition-colors duration-200`}
								style={{
									gridTemplateColumns: `1fr repeat(${plans.length}, 1fr)`,
									animationDelay: `${1200 + index * 50}ms`,
								}}
							>
								<div className="flex items-center">
									<span className="text-sm text-black font-medium">
										{featureName}
									</span>
								</div>
								{plans.map((plan, planIndex) => (
									<div key={planIndex} className="flex justify-center">
										{plan.features.includes(featureName) ? (
											<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
												<Check className="w-4 h-4 text-green-600" />
											</div>
										) : (
											<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
												<X className="w-4 h-4 text-gray-400" />
											</div>
										)}
									</div>
								))}
							</div>
						))}
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden space-y-6">
					{planHeaders.map((plan, planIndex) => (
						<div key={planIndex} className="bg-[#FBFBFB] rounded-3xl p-6">
							<div className="text-center mb-6 pb-6 border-b border-gray-200">
								<h3 className="text-xl font-bold text-black mb-2">
									{plan.name}
									{plan.popular && (
										<span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
											Popular
										</span>
									)}
								</h3>
								<div className="text-2xl font-bold text-black">
									${plans[planIndex].month_price / 100}
								</div>
								<div className="text-sm text-[#A2A2A2]">/monthly</div>
							</div>
							<div className="space-y-4">
								{allFeatures.map((featureName, featureIndex) => {
									const included =
										plans[planIndex].features.includes(featureName)
									return (
										<div
											key={featureIndex}
											className="flex items-center justify-between"
										>
											<span className="text-sm text-black font-medium flex-1 pr-4">
												{featureName}
											</span>
											{included ? (
												<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
													<Check className="w-3 h-3 text-green-600" />
												</div>
											) : (
												<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
													<X className="w-3 h-3 text-gray-400" />
												</div>
											)}
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
