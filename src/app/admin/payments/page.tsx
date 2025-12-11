'use client'

import { SplineArea } from '@/components/charts/SplineArea'
import { PaymentHistoryTable } from '@/components/payment/PaymentHistoryTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { CustomSelect } from '@/components/ui/inputs/custom-select'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { useAdminPaymentStats, type Period } from '@/hooks/admin'
import { motion } from 'framer-motion'
import {
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Download,
	Info,
	Users,
	XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
	{ value: 'all', label: 'All Time' },
	{ value: '7d', label: 'Last 7 Days' },
	{ value: '1m', label: 'Last Month' },
	{ value: '3m', label: 'Last 3 Months' },
	{ value: '6m', label: 'Last 6 Months' },
]

// Stat Card Component
const PaymentStatCard = ({
	title,
	value,
	icon: Icon,
	bgColor = 'bg-white',
	iconBgColor = 'bg-[#126E64]',
	trend,
	subtitle,
	tooltip,
}: {
	title: string
	value: string | number
	icon: any
	bgColor?: string
	iconBgColor?: string
	trend?: string
	subtitle?: string
	tooltip?: string
}) => (
	<Card
		className={`${bgColor} border shadow-sm hover:shadow-md transition-shadow`}
	>
		<CardContent className="p-6">
			<div className="flex items-center justify-between mb-4">
				<div className={`p-3 rounded-full ${iconBgColor}`}>
					<Icon className="w-6 h-6 text-white" />
				</div>
				{trend && (
					<span className="text-sm text-green-600 font-medium">{trend}</span>
				)}
			</div>
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium text-gray-600">{title}</p>
					{tooltip && (
						<Tooltip
							content={tooltip}
							maxWidth={280}
							offsetX={24}
							contentClassName="text-sm"
						>
							<Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
						</Tooltip>
					)}
				</div>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
				{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
			</div>
		</CardContent>
	</Card>
)

export default function PaymentsPage() {
	const [isClient, setIsClient] = useState(false)
	const [selectedPeriod, setSelectedPeriod] = useState<Period>('all')
	const [chartGroupBy, setChartGroupBy] = useState<'day' | 'month'>('day')
	const [exporting, setExporting] = useState<
		'transactions' | 'statistics' | null
	>(null)

	// Use React Query hook for payment stats
	const {
		data,
		isLoading: loading,
		error: queryError,
		refetch,
	} = useAdminPaymentStats(selectedPeriod, chartGroupBy)

	const stats = data?.stats ?? {
		totalRevenue: 0,
		monthlyRevenue: 0,
		totalTransactions: 0,
		successfulTransactions: 0,
		pendingTransactions: 0,
		failedTransactions: 0,
		totalSubscriptions: 0,
		activeSubscriptions: 0,
	}
	const chartData = data?.chartData ?? []
	const error = queryError?.message ?? null

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Export handlers
	const handleExportTransactions = async () => {
		try {
			setExporting('transactions')
			const response = await fetch(
				`/api/admin/export-transactions?period=${selectedPeriod}`
			)

			if (!response.ok) {
				throw new Error('Failed to export transactions')
			}

			// Create blob from response
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `transactions-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (err) {
			alert(
				err instanceof Error
					? err.message
					: 'Failed to export transactions. Please try again.'
			)
		} finally {
			setExporting(null)
		}
	}

	const handleExportStatistics = async () => {
		try {
			setExporting('statistics')
			const response = await fetch(
				`/api/admin/export-statistics?period=${selectedPeriod}`
			)

			if (!response.ok) {
				throw new Error('Failed to export statistics')
			}

			// Create blob from response
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `payment-statistics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.txt`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (err) {
			alert(
				err instanceof Error
					? err.message
					: 'Failed to export statistics. Please try again.'
			)
		} finally {
			setExporting(null)
		}
	}

	// Prepare data for SplineArea chart
	const prepareChartData = () => {
		if (!chartData || chartData.length === 0) {
			return {
				series: [{ name: 'Revenue ($)', data: [] }],
				categories: [],
				paymentBreakdown: [],
			}
		}

		// Ensure categories are valid ISO date strings
		const categories = chartData
			.map((item) => {
				if (!item.month) return null
				// If it's already an ISO string, use it; otherwise convert
				if (typeof item.month === 'string' && item.month.includes('T')) {
					return item.month
				}
				// Try to parse and convert to ISO
				try {
					const date = new Date(item.month)
					return isNaN(date.getTime()) ? null : date.toISOString()
				} catch {
					return null
				}
			})
			.filter((cat): cat is string => cat !== null)

		// Only show revenue line
		const series = [
			{
				name: 'Revenue ($)',
				data: chartData.map((item) => item.revenue || 0),
			},
		]

		// Create payment breakdown for tooltip
		const paymentBreakdown = chartData.map((item) => ({
			revenue: item.revenue || 0,
			transactions: item.transactions || 0,
		}))

		return { series, categories, paymentBreakdown }
	}

	const {
		series: chartSeries,
		categories: chartCategories,
		paymentBreakdown,
	} = prepareChartData()

	// Show loading only on initial client hydration
	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	// Show error state only on initial load with no data
	if (error && !data && !isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB]">
				<div className="flex-1">
					<div className="bg-white shadow-sm px-8 py-6">
						<h1 className="text-3xl font-bold text-[#126E64]">
							Payment Management
						</h1>
					</div>
					<div className="p-8 flex items-center justify-center">
						<div className="text-center">
							<p className="text-red-600 mb-4">
								{error || 'Failed to load payment statistics'}
							</p>
							<button
								onClick={() => refetch()}
								className="px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0E5B52] transition-colors"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB]">
			<div className="flex-1">
				{/* Header */}
				<div className="bg-white shadow-sm px-8 py-6">
					<h1 className="text-3xl font-bold text-[#126E64]">
						Payment Management
					</h1>
				</div>

				{/* Page Content */}
				<div className="p-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="space-y-8"
					>
						{/* Revenue Stats Row */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<PaymentStatCard
								title="Total Revenue"
								value={`$${stats.totalRevenue.toLocaleString()}`}
								icon={DollarSign}
								iconBgColor="bg-green-500"
								subtitle="Cumulative revenue"
								tooltip="Total revenue from subscriptions, application fees, and premium features for the selected period"
							/>
							<PaymentStatCard
								title="Total Transactions"
								value={stats.totalTransactions.toLocaleString()}
								icon={CreditCard}
								iconBgColor="bg-blue-500"
								subtitle="All transactions"
								tooltip="Total number of payment transactions including successful, pending, and failed payments for the selected period"
							/>
							<PaymentStatCard
								title="Active Subscriptions"
								value={stats.activeSubscriptions.toLocaleString()}
								icon={Users}
								iconBgColor="bg-purple-500"
								subtitle={`${stats.totalSubscriptions} total`}
								tooltip="Number of users with active subscription plans, excluding expired or cancelled subscriptions"
							/>
						</div>

						{/* Transaction Status Row */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<PaymentStatCard
								title="Successful Transactions"
								value={stats.successfulTransactions.toLocaleString()}
								icon={CheckCircle}
								iconBgColor="bg-green-500"
								subtitle={`${stats.totalTransactions > 0 ? ((stats.successfulTransactions / stats.totalTransactions) * 100).toFixed(1) : 0}% success rate`}
								tooltip="Transactions that have been successfully processed with confirmed payments for subscriptions and purchases"
							/>
							<PaymentStatCard
								title="Pending Transactions"
								value={stats.pendingTransactions.toLocaleString()}
								icon={Clock}
								iconBgColor="bg-yellow-500"
								subtitle="Awaiting processing"
								tooltip="Transactions currently being processed by payment providers. Typically resolve within 24-48 hours"
							/>
							<PaymentStatCard
								title="Failed Transactions"
								value={stats.failedTransactions.toLocaleString()}
								icon={XCircle}
								iconBgColor="bg-red-500"
								subtitle="Requires attention"
								tooltip="Transactions that failed due to insufficient funds, invalid payment methods, or technical issues"
							/>
						</div>

						{/* Revenue Chart and Analytics */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Revenue Chart */}
							<div className="lg:col-span-2">
								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg font-semibold">
												Revenue Overview
											</CardTitle>
											{/* Period and Group By Filters */}
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-2">
													<span className="text-sm text-gray-600">
														Group by:
													</span>
													<div className="w-32">
														<CustomSelect
															value={{
																value: chartGroupBy,
																label: chartGroupBy === 'day' ? 'Day' : 'Month',
															}}
															onChange={(selected: any) =>
																setChartGroupBy(
																	(selected?.value as 'day' | 'month') || 'day'
																)
															}
															options={[
																{ value: 'day', label: 'Day' },
																{ value: 'month', label: 'Month' },
															]}
															variant="default"
															isClearable={false}
															className="w-full"
														/>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-sm text-gray-600">Period:</span>
													<div className="w-40">
														<CustomSelect
															value={{
																value: selectedPeriod,
																label:
																	PERIOD_OPTIONS.find(
																		(opt) => opt.value === selectedPeriod
																	)?.label || 'All Time',
															}}
															onChange={(selected: any) =>
																setSelectedPeriod(
																	(selected?.value as Period) || 'all'
																)
															}
															options={PERIOD_OPTIONS.map((opt) => ({
																value: opt.value,
																label: opt.label,
															}))}
															variant="default"
															isClearable={false}
															className="w-full"
														/>
													</div>
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										{loading ? (
											<div className="h-[350px] flex items-center justify-center">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#126E64]"></div>
											</div>
										) : chartData.length > 0 && chartCategories.length > 0 ? (
											<SplineArea
												height={350}
												series={chartSeries}
												categories={chartCategories}
												paymentBreakdown={paymentBreakdown}
											/>
										) : (
											<div className="h-[350px] flex items-center justify-center text-gray-500">
												No data available for the selected period
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Operations Panel */}
							<div className="space-y-4">
								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<CardTitle className="text-lg font-semibold">
											Operations
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<button
											onClick={handleExportTransactions}
											disabled={exporting !== null}
											className="w-full px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0E5B52] transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											{exporting === 'transactions' ? (
												<>
													<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
													Exporting...
												</>
											) : (
												<>
													<Download className="w-4 h-4" />
													Export Transactions
												</>
											)}
										</button>
										<button
											onClick={handleExportStatistics}
											disabled={exporting !== null}
											className="w-full px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0E5B52] transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											{exporting === 'statistics' ? (
												<>
													<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
													Exporting...
												</>
											) : (
												<>
													<Download className="w-4 h-4" />
													Export Statistics Report
												</>
											)}
										</button>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Payment History Table */}
						<div>
							<PaymentHistoryTable />
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
