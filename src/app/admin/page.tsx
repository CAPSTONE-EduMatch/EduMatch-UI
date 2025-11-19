'use client'

import { SplineArea } from '@/components/charts/SplineArea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { motion } from 'framer-motion'
import {
	Building2,
	Calendar,
	GraduationCap,
	Info,
	TrendingUp,
	Users,
} from 'lucide-react'

import { useEffect, useState } from 'react'

interface DashboardStats {
	totalUsers: number
	applicants: {
		total: number
		activated: number
		deactivated: number
	}
	institutions: {
		total: number
		activated: number
		deactivated: number
		pending: number
	}
	applications: {
		total: number
		new: number
		underReview: number
		accepted: number
		rejected: number
	}
	posts: {
		total: number
		published: number
		draft: number
		closed: number
	}
	revenue: {
		total: number
		monthly: number
		transactions: number
		subscriptions: number
	}
}

interface ChartDataPoint {
	date: string
	applications: number
	users: number
	revenue: number
}

type Period = '7d' | '30d' | '90d' | '1y'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
	{ value: '7d', label: 'Last 7 Days' },
	{ value: '30d', label: 'Last 30 Days' },
	{ value: '90d', label: 'Last 90 Days' },
	{ value: '1y', label: 'Last Year' },
]

// Pie Chart Component for User Statistics
const SimpleDonutChart = ({
	data,
	colors = ['#126E64', '#FFA500', '#E5E7EB'],
	size = 80,
}: {
	data: Array<{ value: number; label: string }>
	colors?: string[]
	size?: number
}) => {
	const total = data.reduce((sum, item) => sum + item.value, 0)
	let currentAngle = 0

	const radius = size / 2 - 10
	const centerX = size / 2
	const centerY = size / 2

	return (
		<div className="flex items-center gap-4">
			<svg width={size} height={size} className="transform -rotate-90">
				{data.map((item, index) => {
					const percentage = item.value / total
					const angle = percentage * 360
					const startAngle = currentAngle
					const endAngle = currentAngle + angle

					currentAngle += angle

					const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
					const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
					const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
					const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

					const largeArcFlag = angle > 180 ? 1 : 0

					const pathData = [
						`M ${centerX} ${centerY}`,
						`L ${x1} ${y1}`,
						`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
						'Z',
					].join(' ')

					return (
						<path
							key={index}
							d={pathData}
							fill={colors[index % colors.length]}
						/>
					)
				})}
				{/* Inner circle to make it donut */}
				<circle cx={centerX} cy={centerY} r={radius * 0.6} fill="white" />
			</svg>

			<div className="flex flex-col gap-1">
				{data.map((item, index) => (
					<div key={index} className="flex items-center gap-2 text-xs">
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: colors[index % colors.length] }}
						/>
						<span>{item.label}</span>
					</div>
				))}
			</div>
		</div>
	)
}

// Stat Card Component
const StatCard = ({
	title,
	value,
	icon: Icon,
	bgColor = 'bg-white',
	iconBgColor = 'bg-[#126E64]',
	subtitle,
	tooltip,
}: {
	title: string
	value: string | number
	icon: any
	bgColor?: string
	iconBgColor?: string
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
			<div className="space-y-2">
				<p className="text-sm font-medium text-gray-600">{title}</p>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
				{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
			</div>
		</CardContent>
	</Card>
)

export default function AdminDashboard() {
	const [isClient, setIsClient] = useState(false)
	const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d')
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [chartData, setChartData] = useState<ChartDataPoint[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch dashboard stats
	const fetchDashboardStats = async (period: Period) => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(
				`/api/admin/dashboard-stats?period=${period}`
			)

			if (!response.ok) {
				throw new Error('Failed to fetch dashboard statistics')
			}

			const result = await response.json()

			if (result.success) {
				setStats(result.data.stats)
				setChartData(result.data.chartData)
			} else {
				throw new Error(result.error || 'Failed to fetch dashboard statistics')
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
			fetchDashboardStats(selectedPeriod)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isClient, selectedPeriod])

	// Show loading while checking client hydration or fetching data
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
						<h1 className="text-3xl font-bold text-[#126E64]">Administrator</h1>
					</div>
					<div className="p-8 flex items-center justify-center">
						<div className="text-center">
							<p className="text-red-600 mb-4">
								{error || 'Failed to load dashboard statistics'}
							</p>
							<button
								onClick={() => fetchDashboardStats(selectedPeriod)}
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

	// Prepare chart data for SplineArea
	const chartSeries = [
		{
			name: 'Applications',
			data: chartData.map((item) => item.applications),
		},
		{
			name: 'New Users',
			data: chartData.map((item) => item.users),
		},
	]

	const chartCategories = chartData.map((item) => item.date)

	// Prepare donut chart data
	const applicantData = [
		{ value: stats.applicants.activated, label: 'Activated' },
		{ value: stats.applicants.deactivated, label: 'Deactivated' },
	]

	const institutionData = [
		{ value: stats.institutions.activated, label: 'Activated' },
		{ value: stats.institutions.deactivated, label: 'Deactivated' },
		{ value: stats.institutions.pending, label: 'Pending' },
	]

	return (
		<div className="min-h-screen bg-[#F5F7FB]">
			{/* Main Content */}
			<div className="flex-1">
				{/* Header */}
				<div className="bg-white shadow-sm px-8 py-6 flex justify-between items-center">
					<h1 className="text-3xl font-bold text-[#126E64]">Administrator</h1>

					{/* Header Icons */}
					<div className="flex items-center gap-4">
						<div className="p-2 bg-gray-100 rounded-full">
							<Users className="w-5 h-5 text-gray-600" />
						</div>
						<div className="p-2 bg-gray-100 rounded-full">
							<TrendingUp className="w-5 h-5 text-gray-600" />
						</div>
						<div className="w-8 h-8 bg-gray-300 rounded-full"></div>
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
						{/* Top Stats Row */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Total Users */}
							<StatCard
								title="Total Users"
								value={(
									stats.applicants.total + stats.institutions.total
								).toLocaleString()}
								icon={Users}
								iconBgColor="bg-[#126E64]"
							/>

							{/* Applicants */}
							<Card className="bg-white border shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-4">
										<div>
											<p className="text-sm font-medium text-gray-600 mb-2">
												Applicants
											</p>
											<p className="text-2xl font-bold text-gray-900">
												{stats.applicants.total.toLocaleString()}
											</p>
										</div>
										<div className="p-3 bg-orange-500 rounded-full">
											<GraduationCap className="w-6 h-6 text-white" />
										</div>
									</div>
									<SimpleDonutChart
										data={applicantData}
										colors={['#126E64', '#FFA500']}
									/>
								</CardContent>
							</Card>

							{/* Institutions */}
							<Card className="bg-white border shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-4">
										<div>
											<p className="text-sm font-medium text-gray-600 mb-2">
												Institutions
											</p>
											<p className="text-2xl font-bold text-gray-900">
												{stats.institutions.total.toLocaleString()}
											</p>
										</div>
										<div className="p-3 bg-blue-500 rounded-full">
											<Building2 className="w-6 h-6 text-white" />
										</div>
									</div>
									<SimpleDonutChart
										data={institutionData}
										colors={['#126E64', '#3B82F6', '#FFA500']}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Application Statistics */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<StatCard
								title="New application(s)"
								value={stats.applications.new.toLocaleString()}
								icon={TrendingUp}
								iconBgColor="bg-green-500"
							/>
							<StatCard
								title="Under review application(s)"
								value={stats.applications.underReview.toLocaleString()}
								icon={Calendar}
								iconBgColor="bg-yellow-500"
							/>
							<StatCard
								title="Accepted application(s)"
								value={stats.applications.accepted.toLocaleString()}
								icon={TrendingUp}
								iconBgColor="bg-blue-500"
							/>
						</div>

						{/* Analytics Section */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Application Trends Chart */}
							<div className="lg:col-span-2">
								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg font-semibold">
												Application & User Trends
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
										<SplineArea
											series={chartSeries}
											categories={chartCategories}
											height={350}
										/>
									</CardContent>
								</Card>
							</div>

							{/* Right Side Stats */}
							<div className="space-y-6">
								<StatCard
									title="Published Posts"
									value={stats.posts.published.toLocaleString()}
									icon={TrendingUp}
									iconBgColor="bg-[#126E64]"
								/>
								<StatCard
									title="Draft Posts"
									value={stats.posts.draft.toLocaleString()}
									icon={TrendingUp}
									iconBgColor="bg-yellow-500"
								/>
								<StatCard
									title="Rejected Applications"
									value={stats.applications.rejected.toLocaleString()}
									icon={Users}
									iconBgColor="bg-red-500"
								/>
								<StatCard
									title="Conversion Rate"
									value={
										stats.applications.total > 0
											? `${((stats.applications.accepted / stats.applications.total) * 100).toFixed(1)}%`
											: '0%'
									}
									icon={TrendingUp}
									iconBgColor="bg-[#126E64]"
									subtitle={`${stats.applications.accepted} of ${stats.applications.total} accepted`}
								/>
							</div>
						</div>

						{/* Bottom Section - User Management Link */}
						{/* <div className="flex justify-center mt-8">
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => router.push('/admin/users')}
								className="bg-[#126E64] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-[#0E5B52] transition-colors"
							>
								User Management
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => router.push('/admin/payments')}
								className="bg-[#126E64] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-[#0E5B52] transition-colors ml-4"
							>
								Payment Management
							</motion.button>
						</div> */}
					</motion.div>
				</div>
			</div>
		</div>
	)
}
