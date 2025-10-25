'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { motion } from 'framer-motion'
import {
	Building2,
	Calendar,
	GraduationCap,
	HelpCircle,
	TrendingUp,
	Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
	children,
}: {
	title: string
	value: string | number
	icon: any
	bgColor?: string
	iconBgColor?: string
	children?: React.ReactNode
}) => (
	<Card className={`${bgColor} border shadow-sm`}>
		<CardContent className="p-6">
			<div className="flex items-center justify-between mb-4">
				<div className={`p-3 rounded-full ${iconBgColor}`}>
					<Icon className="w-6 h-6 text-white" />
				</div>
				<HelpCircle className="w-5 h-5 text-gray-400" />
			</div>
			<div className="space-y-2">
				<p className="text-sm font-medium text-gray-600">{title}</p>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
				{children}
			</div>
		</CardContent>
	</Card>
)

// Simple Line Chart for Profit
const SimpleLineChart = ({
	data,
	height = 200,
	color = '#126E64',
}: {
	data: Array<{ month: string; value: number }>
	height?: number
	color?: string
}) => {
	const maxValue = Math.max(...data.map((d) => d.value))
	const width = 600
	const padding = 40

	const points = data
		.map((item, index) => {
			const x = padding + (index * (width - 2 * padding)) / (data.length - 1)
			const y =
				height - padding - (item.value / maxValue) * (height - 2 * padding)
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

				{/* Data line */}
				<polyline points={points} fill="none" stroke={color} strokeWidth="3" />

				{/* Data points */}
				{data.map((item, index) => {
					const x =
						padding + (index * (width - 2 * padding)) / (data.length - 1)
					const y =
						height - padding - (item.value / maxValue) * (height - 2 * padding)
					return <circle key={index} cx={x} cy={y} r="4" fill={color} />
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

export default function AdminDashboard() {
	const [isClient, setIsClient] = useState(false)
	const router = useRouter()

	useEffect(() => {
		setIsClient(true)
	}, [])

	// Mock data - in real app, this would come from API
	const applicantData = [
		{ value: 600, label: 'Activated' },
		{ value: 400, label: 'Deactivated' },
	]

	const institutionData = [
		{ value: 400, label: 'Activated' },
		{ value: 300, label: 'Deactivated' },
		{ value: 300, label: 'Pending' },
	]

	const profitData = [
		{ month: 'JAN', value: 800 },
		{ month: 'FEB', value: 600 },
		{ month: 'MAR', value: 900 },
		{ month: 'APR', value: 700 },
		{ month: 'MAY', value: 1000 },
		{ month: 'JUN', value: 850 },
		{ month: 'JUL', value: 950 },
		{ month: 'AUG', value: 750 },
		{ month: 'SEP', value: 800 },
		{ month: 'OCT', value: 900 },
		{ month: 'NOV', value: 1100 },
		{ month: 'DEC', value: 1200 },
	]

	// Show loading while checking client hydration
	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

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
								value="100"
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
											<p className="text-2xl font-bold text-gray-900">1000</p>
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
											<p className="text-2xl font-bold text-gray-900">1000</p>
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
								value="200"
								icon={TrendingUp}
								iconBgColor="bg-green-500"
							/>
							<StatCard
								title="Under review application(s)"
								value="200"
								icon={Calendar}
								iconBgColor="bg-yellow-500"
							/>
							<StatCard
								title="Accepted application(s)"
								value="200"
								icon={TrendingUp}
								iconBgColor="bg-blue-500"
							/>
						</div>

						{/* Analytics Section */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Profit Chart */}
							<div className="lg:col-span-2">
								<Card className="bg-white border shadow-sm">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg font-semibold">
												Profit
											</CardTitle>
											<div className="flex items-center gap-2">
												<span className="text-sm text-gray-600">USD</span>
												<button className="bg-[#126E64] text-white px-4 py-2 rounded-full text-sm">
													Today
												</button>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<SimpleLineChart data={profitData} />
									</CardContent>
								</Card>
							</div>

							{/* Right Side Stats */}
							<div className="space-y-6">
								<StatCard
									title="Total Profit"
									value="200"
									icon={TrendingUp}
									iconBgColor="bg-[#126E64]"
								/>
								<StatCard
									title="Total transactions"
									value="200"
									icon={TrendingUp}
									iconBgColor="bg-[#126E64]"
								/>
								<StatCard
									title="Total user subscribed"
									value="200"
									icon={Users}
									iconBgColor="bg-[#126E64]"
								/>
								<StatCard
									title="Conversion rate"
									value="200"
									icon={TrendingUp}
									iconBgColor="bg-[#126E64]"
								/>
							</div>
						</div>

						{/* Bottom Section - User Management Link */}
						<div className="flex justify-center mt-8">
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
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	)
}
