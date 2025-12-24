'use client'

import { SplineArea } from '@/components/charts/SplineArea'
import { SimplePieChart } from '@/components/charts/SimplePieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { CustomSelect } from '@/components/ui/inputs/custom-select'
import { motion } from 'framer-motion'
import {
	Info,
	Users,
	GraduationCap,
	Building2,
	FileCheck,
	CheckCircle,
	XCircle,
	FileText,
	Ban,
	Clock,
	Send,
} from 'lucide-react'

import { useEffect, useState } from 'react'

interface DashboardStats {
	totalUsers: {
		total: number
		applicants: number
		institutions: number
		systemManagers: number
	}
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
		rejected: number
		closed: number
		submitted: number
		progressing: number
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

// No longer needed - using bar charts instead

// Stat Card Component
const StatCard = ({
	title,
	value,
	icon: Icon,
	bgColor = 'bg-white',
	subtitle,
	tooltip,
}: {
	title: string
	value: string | number
	icon: any
	bgColor?: string
	subtitle?: string
	tooltip?: string
}) => (
	<Card
		className={`${bgColor} border shadow-sm hover:shadow-md transition-shadow`}
	>
		<CardContent className="p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon className="w-5 h-5 text-[#126E64]" />
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
			</div>
			{subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
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

	// Prepare pie chart data for Total Users
	const totalUsersPieData = [
		{
			name: 'Applicants',
			value: stats.totalUsers.applicants,
			color: '#FFA500',
		},
		{
			name: 'Institutions',
			value: stats.totalUsers.institutions,
			color: '#3B82F6',
		},
		{
			name: 'System Managers',
			value: stats.totalUsers.systemManagers,
			color: '#126E64',
		},
	]

	// Prepare pie chart data for Applicants
	const applicantPieData = [
		{ name: 'Activated', value: stats.applicants.activated, color: '#126E64' },
		{
			name: 'Deactivated',
			value: stats.applicants.deactivated,
			color: '#EF4444',
		},
	]

	// Prepare bar chart data for Institutions
	const institutionPieData = [
		{
			name: 'Activated',
			value: stats.institutions.activated,
			color: '#126E64',
		},
		{
			name: 'Deactivated',
			value: stats.institutions.deactivated,
			color: '#EF4444',
		},
		{ name: 'Pending', value: stats.institutions.pending, color: '#FBBF24' },
	]

	return (
		<div className="min-h-screen bg-[#F5F7FB]">
			{/* Main Content */}
			<div className="flex-1">
				{/* Header */}
				<div className="bg-white shadow-sm px-8 py-6">
					<h1 className="text-3xl font-bold text-[#126E64]">Administrator</h1>
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
							<Card className="bg-white border shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											<Users className="w-5 h-5 text-[#126E64]" />
											<p className="text-sm font-medium text-gray-600">
												Total Users
											</p>
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{stats.totalUsers.total.toLocaleString()}
										</p>
									</div>
									<SimplePieChart
										data={totalUsersPieData}
										height={180}
										showLegendInside={true}
									/>
								</CardContent>
							</Card>

							{/* Applicants */}
							<Card className="bg-white border shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											<GraduationCap className="w-5 h-5 text-[#126E64]" />
											<p className="text-sm font-medium text-gray-600">
												Applicants
											</p>
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{stats.applicants.total.toLocaleString()}
										</p>
									</div>
									<SimplePieChart
										data={applicantPieData}
										height={180}
										showLegendInside={true}
									/>
								</CardContent>
							</Card>

							{/* Institutions */}
							<Card className="bg-white border shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											<Building2 className="w-5 h-5 text-[#126E64]" />
											<p className="text-sm font-medium text-gray-600">
												Institutions
											</p>
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{stats.institutions.total.toLocaleString()}
										</p>
									</div>
									<SimplePieChart
										data={institutionPieData}
										height={150}
										showLegendInside={true}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Application Statistics */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<StatCard
								title="Submitted application(s)"
								value={stats.applications.new.toLocaleString()}
								icon={Send}
								tooltip="Total applications with status = SUBMITTED"
							/>
							<StatCard
								title="Accepted application(s)"
								value={stats.applications.accepted.toLocaleString()}
								icon={CheckCircle}
								tooltip="Applications that have been reviewed and approved by institutions"
							/>
							<StatCard
								title="Rejected Applications"
								value={stats.applications.rejected.toLocaleString()}
								icon={XCircle}
								tooltip="Applications that have been reviewed and declined by institutions"
							/>
						</div>

						{/* Posts Statistics Row */}
						<div className="grid grid-cols-1 md:grid-cols-5 gap-6">
							<StatCard
								title="Published Posts"
								value={(stats.posts.published || 0).toLocaleString()}
								icon={FileCheck}
							/>
							<StatCard
								title="Rejected Posts"
								value={(stats.posts.rejected || 0).toLocaleString()}
								icon={XCircle}
							/>
							<StatCard
								title="Closed Posts"
								value={(stats.posts.closed || 0).toLocaleString()}
								icon={Ban}
							/>
							<StatCard
								title="Submitted Posts"
								value={(stats.posts.submitted || 0).toLocaleString()}
								icon={FileText}
							/>
							<StatCard
								title="Progressing Posts"
								value={(stats.posts.progressing || 0).toLocaleString()}
								icon={Clock}
							/>
						</div>

						{/* Analytics Section */}
						<div className="grid grid-cols-1 gap-6">
							{/* Application Trends Chart */}
							<Card className="bg-white border shadow-sm">
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg font-semibold">
											Application & User Trends
										</CardTitle>
										{/* Period Filter */}
										<div className="flex items-center gap-2">
											<span className="text-sm text-gray-600">Period:</span>
											<div className="w-40">
												<CustomSelect
													value={{
														value: selectedPeriod,
														label:
															PERIOD_OPTIONS.find(
																(opt) => opt.value === selectedPeriod
															)?.label || 'Last 30 Days',
													}}
													onChange={(selected: any) =>
														setSelectedPeriod(
															(selected?.value as Period) || '30d'
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
