'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../ui'

interface InstitutionPaymentSectionProps {
	onStartPlan?: () => void
}

type BillingCycle = 'monthly' | 'yearly'

export const InstitutionPaymentSection: React.FC<
	InstitutionPaymentSectionProps
> = ({ onStartPlan }) => {
	const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')

	const price = billingCycle === 'yearly' ? '99' : '12'

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

	const handleStartPlan = () => {
		if (onStartPlan) {
			onStartPlan()
		}
		// Default action - could redirect to Stripe checkout
	}

	return (
		<div className="min-h-auto max-w-[1500px] bg-white rounded-xl py-8 border">
			<div className="">
				{/* Header */}
				<motion.div
					className="mb-8 px-5    w-full"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h1 className="text-3xl font-bold text-gray-900 mb-2 ">
						Complete Your Payment
					</h1>
					<p className="text-gray-600">
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
					<div className="inline-flex bg-gray-100 gap-3 rounded-full p-1">
						<motion.button
							onClick={() => setBillingCycle('monthly')}
							className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
								billingCycle === 'monthly'
									? 'bg-[#126E64] text-white shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Monthly
						</motion.button>
						<motion.button
							onClick={() => setBillingCycle('yearly')}
							className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
								billingCycle === 'yearly'
									? 'bg-[#126E64] text-white shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Yearly
						</motion.button>
					</div>
				</motion.div>

				{/* Pricing Card */}
				<motion.div
					className="bg-white rounded-2xl border-2 border-gray-200 p-8 max-w-2xl mx-auto flex flex-col items-center"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					{/* Plan Title */}
					<motion.div
						className="text-center mb-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4, delay: 0.5 }}
					>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Institution Plan
						</h2>
						<p className="text-gray-600 text-sm">
							All-in-one solution for institutions to post opportunities,
							connect with applicants, and manage the entire selection process.
						</p>
					</motion.div>

					{/* Price */}
					<motion.div
						className="text-center mb-8"
						key={billingCycle}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<div className="flex items-baseline justify-center">
							<span className="text-5xl font-bold text-gray-900">{price}$</span>
							<span className="text-orange-500 ml-2 text-lg">
								/{billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
							</span>
						</div>
					</motion.div>

					{/* Features List */}
					<div className="space-y-4 mb-8">
						{features.map((feature, index) => (
							<motion.div
								key={index}
								className="flex gap-3"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.4, delay: 0.6 + index * 0.08 }}
								whileHover={{ x: 5, transition: { duration: 0.2 } }}
							>
								<div className="flex-shrink-0 mt-0.5">
									<motion.div
										className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{
											duration: 0.3,
											delay: 0.7 + index * 0.08,
											type: 'spring',
											stiffness: 200,
										}}
									>
										<Check className="w-3.5 h-3.5 text-green-600" />
									</motion.div>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 text-sm mb-0.5">
										{feature.title}
									</h3>
									<p className="text-gray-600 text-xs leading-relaxed">
										{feature.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>

					{/* CTA Button */}
					<Button className="w-full" onClick={handleStartPlan}>
						Start Institution Plan
					</Button>
				</motion.div>
			</div>
		</div>
	)
}
