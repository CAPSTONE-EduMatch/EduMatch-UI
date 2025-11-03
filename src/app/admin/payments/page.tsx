'use client'

import { SplineArea } from '@/components/charts/SplineArea'
import { PaymentHistoryTable } from '@/components/payment/PaymentHistoryTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
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

interface PaymentStats {
	totalRevenue: number
	monthlyRevenue: number
	totalTransactions: number
	successfulTransactions: number
	pendingTransactions: number
	failedTransactions: number
	totalSubscriptions: number
	activeSubscriptions: number
}

interface ChartDataPoint {
	month: string
	revenue: number
	transactions: number
}

type Period = 'all' | '7d' | '1m' | '3m' | '6m'

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
	const [stats, setStats] = useState<PaymentStats | null>(null)
	const [chartData, setChartData] = useState<ChartDataPoint[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [exporting, setExporting] = useState<
		'transactions' | 'statistics' | null
	>(null)

	// Fetch payment stats
	const fetchPaymentStats = async (period: Period) => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(`/api/admin/payment-stats?period=${period}`)

			if (!response.ok) {
				throw new Error('Failed to fetch payment statistics')
			}

			const result = await response.json()

			if (result.success) {
				setStats(result.data.stats)
				setChartData(result.data.chartData)
			} else {
				throw new Error(result.error || 'Failed to fetch payment statistics')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		setIsClient(true)
	}, [])

	useEffect(() => {
		if (isClient) {
			fetchPaymentStats(selectedPeriod)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isClient, selectedPeriod])

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
				series: [
					{ name: 'Revenue ($)', data: [] },
					{ name: 'Transactions', data: [] },
				],
				categories: [],
			}
		}

		const categories = chartData.map((item) => item.month)
		const series = [
			{
				name: 'Revenue ($)',
				data: chartData.map((item) => item.revenue),
			},
			{
				name: 'Transactions',
				data: chartData.map((item) => item.transactions),
			},
		]

		return { series, categories }
	}

	const { series: chartSeries, categories: chartCategories } =
		prepareChartData()

	// Show loading while client is hydrating or fetching data
	if (!isClient || loading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	// Show error state
	if (error || !stats) {
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
								onClick={() => fetchPaymentStats(selectedPeriod)}
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
											{/* Period Filter */}
											<div className="flex items-center gap-2">
												<span className="text-sm text-gray-600">Period:</span>
												<select
													value={selectedPeriod}
													onChange={(e) =>
														setSelectedPeriod(e.target.value as Period)
													}
													className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64] bg-white"
												>
													{PERIOD_OPTIONS.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										{chartData.length > 0 ? (
											<SplineArea
												height={350}
												series={chartSeries}
												categories={chartCategories}
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
