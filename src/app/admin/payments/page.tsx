'use client'

import { PaymentHistoryTable } from '@/components/payment/PaymentHistoryTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { motion } from 'framer-motion'
import {
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Info,
	TrendingUp,
	Users,
	XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

// Mock data for payments - replace with actual API calls
const mockPaymentStats = {
	totalRevenue: 125000,
	monthlyRevenue: 12500,
	totalTransactions: 1430,
	successfulTransactions: 1385,
	pendingTransactions: 25,
	failedTransactions: 20,
	totalSubscriptions: 850,
	activeSubscriptions: 800,
}

const mockRevenueData = [
	{ month: 'Jan', revenue: 8000, transactions: 120 },
	{ month: 'Feb', revenue: 8500, transactions: 125 },
	{ month: 'Mar', revenue: 9200, transactions: 140 },
	{ month: 'Apr', revenue: 10100, transactions: 155 },
	{ month: 'May', revenue: 11000, transactions: 165 },
	{ month: 'Jun', revenue: 12500, transactions: 180 },
]

// Simple Revenue Chart Component
const RevenueChart = ({
	data,
	height = 300,
}: {
	data: Array<{ month: string; revenue: number; transactions: number }>
	height?: number
}) => {
	const maxRevenue = Math.max(...data.map((d) => d.revenue))
	const width = 600
	const padding = 40

	const points = data
		.map((item, index) => {
			const x = padding + (index * (width - 2 * padding)) / (data.length - 1)
			const y =
				height - padding - (item.revenue / maxRevenue) * (height - 2 * padding)
			return `${x},${y}`
		})
		.join(' ')

	return (
		<div className="w-full">
			<svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
				{/* Grid lines */}
				{[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
					const y = height - padding - ratio * (height - 2 * padding)
					return (
						<line
							key={index}
							x1={padding}
							y1={y}
							x2={width - padding}
							y2={y}
							stroke="#E5E7EB"
							strokeWidth="1"
						/>
					)
				})}

				{/* Revenue line */}
				<polyline
					points={points}
					fill="none"
					stroke="#126E64"
					strokeWidth="3"
				/>

				{/* Data points */}
				{data.map((item, index) => {
					const x =
						padding + (index * (width - 2 * padding)) / (data.length - 1)
					const y =
						height -
						padding -
						(item.revenue / maxRevenue) * (height - 2 * padding)
					return <circle key={index} cx={x} cy={y} r="4" fill="#126E64" />
				})}
			</svg>

			{/* Month labels */}
			<div className="flex justify-between mt-2 px-10 text-xs text-gray-500">
				{data.map((item, index) => (
					<span key={index}>{item.month}</span>
				))}
			</div>
		</div>
	)
}

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
	const [timeFilter, setTimeFilter] = useState('6months')

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Show loading while client is hydrating
	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB]">
			<div className="flex-1">
				{/* Header */}
				<div className="bg-white shadow-sm px-8 py-6 flex justify-between items-center">
					<h1 className="text-3xl font-bold text-[#126E64]">
						Payment Management
					</h1>
					<div className="flex items-center gap-4">
						<select
							value={timeFilter}
							onChange={(e) => setTimeFilter(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#126E64]"
						>
							<option value="30days">Last 30 days</option>
							<option value="6months">Last 6 months</option>
							<option value="1year">Last year</option>
						</select>
					</div>
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
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<PaymentStatCard
								title="Total Revenue"
								value={`$${mockPaymentStats.totalRevenue.toLocaleString()}`}
								icon={DollarSign}
								iconBgColor="bg-green-500"
								trend="+12.5%"
								subtitle="All time revenue"
								tooltip="Total revenue from subscriptions, application fees, and premium features since platform launch"
							/>
							<PaymentStatCard
								title="Monthly Revenue"
								value={`$${mockPaymentStats.monthlyRevenue.toLocaleString()}`}
								icon={TrendingUp}
								iconBgColor="bg-[#126E64]"
								trend="+8.2%"
								subtitle="This month"
								tooltip="Current month revenue including recurring subscriptions and one-time payments"
							/>
							<PaymentStatCard
								title="Total Transactions"
								value={mockPaymentStats.totalTransactions.toLocaleString()}
								icon={CreditCard}
								iconBgColor="bg-blue-500"
								subtitle="All transactions"
								tooltip="Total number of payment transactions including successful, pending, and failed payments"
							/>
							<PaymentStatCard
								title="Active Subscriptions"
								value={mockPaymentStats.activeSubscriptions.toLocaleString()}
								icon={Users}
								iconBgColor="bg-purple-500"
								subtitle={`${mockPaymentStats.totalSubscriptions} total`}
								tooltip="Number of users with active subscription plans, excluding expired or cancelled subscriptions"
							/>
						</div>

						{/* Transaction Status Row */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<PaymentStatCard
								title="Successful Transactions"
								value={mockPaymentStats.successfulTransactions.toLocaleString()}
								icon={CheckCircle}
								iconBgColor="bg-green-500"
								subtitle={`${((mockPaymentStats.successfulTransactions / mockPaymentStats.totalTransactions) * 100).toFixed(1)}% success rate`}
								tooltip="Transactions that have been successfully processed with confirmed payments for subscriptions and purchases"
							/>
							<PaymentStatCard
								title="Pending Transactions"
								value={mockPaymentStats.pendingTransactions.toLocaleString()}
								icon={Clock}
								iconBgColor="bg-yellow-500"
								subtitle="Awaiting processing"
								tooltip="Transactions currently being processed by payment providers. Typically resolve within 24-48 hours"
							/>
							<PaymentStatCard
								title="Failed Transactions"
								value={mockPaymentStats.failedTransactions.toLocaleString()}
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
											<div className="flex items-center gap-2">
												<span className="text-sm text-gray-600">USD</span>
												<button className="bg-[#126E64] text-white px-4 py-2 rounded-full text-sm">
													{timeFilter}
												</button>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<RevenueChart data={mockRevenueData} />
									</CardContent>
								</Card>
							</div>

							{/* Payment Method Distribution */}
							<div className="space-y-6">
								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<CardTitle className="text-lg font-semibold">
											Payment Methods
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<CreditCard className="w-5 h-5 text-blue-500" />
												<span className="text-sm">Credit Cards</span>
											</div>
											<span className="font-medium">68%</span>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<CreditCard className="w-5 h-5 text-purple-500" />
												<span className="text-sm">PayPal</span>
											</div>
											<span className="font-medium">24%</span>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<CreditCard className="w-5 h-5 text-green-500" />
												<span className="text-sm">Bank Transfer</span>
											</div>
											<span className="font-medium">8%</span>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<CardTitle className="text-lg font-semibold">
											Quick Actions
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<button className="w-full px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0E5B52] transition-colors text-sm">
											Export Transactions
										</button>
										<button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
											Generate Report
										</button>
										<button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
											Subscription Settings
										</button>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Payment History Table */}
						<Card className="bg-white border shadow-sm">
							<CardHeader>
								<CardTitle className="text-lg font-semibold">
									Recent Transactions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<PaymentHistoryTable />
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
