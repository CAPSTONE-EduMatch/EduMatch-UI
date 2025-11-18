'use client'

import React, { useState, useEffect } from 'react'
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

interface InstitutionOverviewSectionProps {
	profile?: any
	onNavigationAttempt?: () => boolean
}

type PaymentStatus = 'unpaid' | 'paid'

interface DashboardData {
	stats: {
		total: number
		new: number
		underReview: number
		accepted: number
		rejected: number
	}
	chartSeries: Array<{ name: string; data: number[] }>
	categories: string[]
	statusBreakdown?: Array<{
		underReview: number
		rejected: number
		accepted: number
	}>
	posts: {
		total: number
		published: number
		draft: number
		closed: number
	}
}

export const InstitutionOverviewSection: React.FC<
	InstitutionOverviewSectionProps
> = () => {
	const router = useRouter()
	const [paymentStatus] = useState<PaymentStatus>('paid')
	const [timeFilter, setTimeFilter] = useState('today')
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch dashboard data from API
	useEffect(() => {
		const fetchDashboardData = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await fetch(
					`/api/dashboard/institution?timeFilter=${timeFilter}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (!response.ok) {
					throw new Error('Failed to fetch dashboard data')
				}

				const result = await response.json()

				if (result.success) {
					setDashboardData(result.data)
				} else {
					throw new Error(result.error || 'Failed to fetch dashboard data')
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to fetch dashboard data'
				)
				// Set default empty data on error
				setDashboardData({
					stats: {
						total: 0,
						new: 0,
						underReview: 0,
						accepted: 0,
						rejected: 0,
					},
					chartSeries: [{ name: 'Applications', data: [] }],
					categories: [],
					posts: {
						total: 0,
						published: 0,
						draft: 0,
						closed: 0,
					},
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchDashboardData()
	}, [timeFilter])

	const handleStartPlan = () => {
		// Redirect to Stripe checkout or payment processing
		router.push('/checkout')
	}

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
	// Show loading state with progress bar
	if (isLoading || !dashboardData) {
		return (
			<div className="space-y-6">
				<div className="bg-white rounded-xl shadow-sm p-6 w-full py-8 border">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
					<div className="space-y-4 py-8">
						<div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
							<div
								className="bg-primary h-2.5 rounded-full"
								style={{
									width: '100%',
									background:
										'linear-gradient(90deg, #126E64 0%, #0D504A 50%, #126E64 100%)',
									backgroundSize: '200% 100%',
									animation: 'shimmer 1.5s ease-in-out infinite',
								}}
							/>
						</div>
						<p className="text-sm text-gray-600 text-center">
							Loading dashboard data...
						</p>
					</div>
					<style jsx>{`
						@keyframes shimmer {
							0% {
								background-position: -200% 0;
							}
							100% {
								background-position: 200% 0;
							}
						}
					`}</style>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="space-y-6">
				<div className="bg-white rounded-xl shadow-sm p-6 w-full py-8 border">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
					<div className="text-center py-12">
						<p className="text-red-500 mb-4">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
						>
							Retry
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="bg-white  rounded-xl shadow-sm p-6 w-full  py-8 border">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>

				{/* Chart Section */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-full">
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							{dashboardData.chartSeries[0]?.data.length > 0 ? (
								<SplineArea
									height={320}
									series={dashboardData.chartSeries}
									categories={dashboardData.categories}
									statusBreakdown={dashboardData.statusBreakdown}
								/>
							) : (
								<div className="flex items-center justify-center h-[320px] text-gray-500">
									No data available for the selected period
								</div>
							)}
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
								<span className="text-gray-700">Rejected application(s)</span>
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
								{dashboardData.stats.rejected}
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
