'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface PieChartData {
	name: string
	value: number
	color: string
}

interface SimplePieChartProps {
	data: PieChartData[]
	height?: number
	showLegendInside?: boolean
}

export const SimplePieChart = ({
	data,
	height = 200,
	showLegendInside = false,
}: SimplePieChartProps) => {
	if (showLegendInside) {
		// Custom layout with pie on left and legend on right
		return (
			<div className="flex items-center gap-4">
				<div style={{ width: '120px', height: '120px' }}>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={data}
								cx="50%"
								cy="50%"
								labelLine={false}
								outerRadius={50}
								fill="#8884d8"
								dataKey="value"
							>
								{data.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				</div>
				<div className="flex flex-col gap-2">
					{data.map((entry, index) => (
						<div key={index} className="flex items-center gap-2 text-sm">
							<div
								className="w-3 h-3 rounded-full shrink-0"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-gray-700">
								{entry.name}:{' '}
								<span className="font-semibold">{entry.value}</span>
							</span>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<ResponsiveContainer width="100%" height={height}>
			<PieChart>
				<Pie
					data={data}
					cx="50%"
					cy="50%"
					labelLine={false}
					label={({ name, percent }) =>
						`${name}: ${(percent * 100).toFixed(0)}%`
					}
					outerRadius={60}
					fill="#8884d8"
					dataKey="value"
				>
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={entry.color} />
					))}
				</Pie>
				<Legend
					verticalAlign="bottom"
					height={36}
					iconType="circle"
					formatter={(value, entry: any) => (
						<span style={{ color: '#666', fontSize: '12px' }}>
							{value}: {entry.payload.value}
						</span>
					)}
				/>
			</PieChart>
		</ResponsiveContainer>
	)
}
