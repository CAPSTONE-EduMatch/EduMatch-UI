'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { InstitutionPaymentSection } from '@/components/payment/InstitutionPaymentSection'
import { SplineArea } from '@/components/charts/SplineArea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/inputs/select'
import { mockDashboardData } from '@/data/utils'

interface InstitutionOverviewSectionProps {
	profile?: any
	onNavigationAttempt?: () => boolean
}

type PaymentStatus = 'unpaid' | 'paid'

export const InstitutionOverviewSection: React.FC<
	InstitutionOverviewSectionProps
> = () => {
	const router = useRouter()
	const [paymentStatus] = useState<PaymentStatus>('paid')
	const [timeFilter, setTimeFilter] = useState('today')

	const handleStartPlan = () => {
		// Redirect to Stripe checkout or payment processing
		router.push('/checkout')
	}

	// Get dashboard data based on selected time filter
	const dashboardData = useMemo(() => {
		return mockDashboardData[timeFilter] || mockDashboardData.today
	}, [timeFilter])

	// Trạng thái 1: Chưa thanh toán - Hiển thị Complete Payment
	if (paymentStatus === 'unpaid') {
		return <InstitutionPaymentSection onStartPlan={handleStartPlan} />
	}

	// Trạng thái 2: Đang xử lý thanh toán (optional)
	// if (paymentStatus === 'processing') {
	// 	return (
	// 		<div className="space-y-6">
	// 			<div className="bg-white rounded-xl shadow-sm p-6">
	// 				<h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
	// 				<div className="py-12 text-center">
	// 					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
	// 					<p className="text-gray-600">
	// 						Processing your payment. Please wait...
	// 					</p>
	// 				</div>
	// 			</div>
	// 		</div>
	// 	)
	// }

	// Trạng thái 3: Đã thanh toán - Hiển thị Dashboard
	return (
		<div className="space-y-6">
			<div className="bg-white  rounded-xl shadow-sm p-6 w-full  py-8 border">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>

				{/* Chart Section */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-full">
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<SplineArea
								height={320}
								series={dashboardData.chartSeries}
								categories={dashboardData.categories}
							/>
						</div>
					</div>

					{/* Statistics Cards */}
					<div className="space-y-4">
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-medium text-gray-600">
								Display by
							</span>
							<Select value={timeFilter} onValueChange={setTimeFilter}>
								<SelectTrigger className="w-[140px] h-8 text-sm">
									<SelectValue placeholder="Select period" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="today">Today</SelectItem>
									<SelectItem value="yesterday">Yesterday</SelectItem>
									<SelectItem value="this-week">This week</SelectItem>
									<SelectItem value="last-week">Last week</SelectItem>
									<SelectItem value="this-month">This month</SelectItem>
									<SelectItem value="last-month">Last month</SelectItem>
									<SelectItem value="this-year">This year</SelectItem>
									<SelectItem value="last-year">Last year</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
							<div className="flex items-center gap-2">
								<span className="text-gray-700">Total application(s)</span>
								<button className="text-gray-400 hover:text-gray-600">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							</div>
							<span className="text-2xl font-bold">
								{dashboardData.stats.total}
							</span>
						</div>

						<div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
							<div className="flex items-center gap-2">
								<span className="text-gray-700">New application(s)</span>
								<button className="text-gray-400 hover:text-gray-600">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							</div>
							<span className="text-2xl font-bold">
								{dashboardData.stats.new}
							</span>
						</div>

						<div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
							<div className="flex items-center gap-2">
								<span className="text-gray-700">
									Under review application(s)
								</span>
								<button className="text-gray-400 hover:text-gray-600">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							</div>
							<span className="text-2xl font-bold">
								{dashboardData.stats.underReview}
							</span>
						</div>

						<div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
							<div className="flex items-center gap-2">
								<span className="text-gray-700">Accepted application(s)</span>
								<button className="text-gray-400 hover:text-gray-600">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							</div>
							<span className="text-2xl font-bold">
								{dashboardData.stats.accepted}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
