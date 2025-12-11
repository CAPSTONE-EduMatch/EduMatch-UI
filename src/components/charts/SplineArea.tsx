'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Import ApexCharts dynamically to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface SplineAreaProps {
	height?: number
	series?: {
		name: string
		data: number[]
	}[]
	categories?: string[]
	statusBreakdown?: Array<{
		underReview: number
		rejected: number
		accepted: number
	}>
	paymentBreakdown?: Array<{
		revenue: number
		transactions: number
	}>
}

export const SplineArea: React.FC<SplineAreaProps> = ({
	height = 350,
	series = [
		{
			name: 'series1',
			data: [31, 40, 28, 51, 42, 109, 100],
		},
		{
			name: 'series2',
			data: [11, 32, 45, 32, 34, 52, 41],
		},
	],
	categories = [
		'2018-09-19T00:00:00.000Z',
		'2018-09-19T01:30:00.000Z',
		'2018-09-19T02:30:00.000Z',
		'2018-09-19T03:30:00.000Z',
		'2018-09-19T04:30:00.000Z',
		'2018-09-19T05:30:00.000Z',
		'2018-09-19T06:30:00.000Z',
	],
	statusBreakdown,
	paymentBreakdown,
}) => {
	// Determine if we should show all labels or group them
	// Check the time difference between first and last category
	// If span is ~1 day (< 2 days) -> it's Today/Yesterday -> group labels
	// If span is ~7 days -> it's This week/Last week -> show all labels
	// If span is ~30 days -> it's This month/Last month -> group labels
	// If span is ~365 days -> it's This year/Last year -> show all labels
	const firstDate = new Date(categories[0])
	const lastDate = new Date(categories[categories.length - 1])
	const daysDiff =
		(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)

	// Show all labels for week (5-8 days) and year (350-380 days) data
	const shouldShowAllLabels =
		(daysDiff >= 5 && daysDiff <= 8) || (daysDiff >= 350 && daysDiff <= 380)

	// Calculate max value from all series data and round up to next whole number
	const allDataValues = series.flatMap((s) => s.data)
	const maxDataValue = Math.max(...allDataValues, 0)
	// Round up to next whole number, but ensure at least 1 if there's any data
	// Add 1 to ensure there's always space above the max value so 0 stays at bottom
	const maxYValue = maxDataValue > 0 ? Math.ceil(maxDataValue) + 3 : 2

	const options: ApexOptions = {
		chart: {
			height: height,
			type: 'area',
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
			parentHeightOffset: 0,
		},
		dataLabels: {
			enabled: false,
		},
		stroke: {
			curve: 'smooth',
			width: 2,
		},
		xaxis: {
			type: 'datetime',
			categories: categories,
			labels: {
				style: {
					colors: '#6B7280',
					fontSize: shouldShowAllLabels ? '11px' : '12px',
				},
				rotate: 0,
				rotateAlways: false,
				hideOverlappingLabels: !shouldShowAllLabels,
				trim: false,
				minHeight: shouldShowAllLabels ? 30 : undefined,
			},
			axisBorder: {
				show: true,
			},
			axisTicks: {
				show: true,
			},
			tickAmount: shouldShowAllLabels ? categories.length : undefined,
		},
		yaxis: {
			labels: {
				style: {
					colors: '#6B7280',
					fontSize: '12px',
				},
				formatter: (val: number) => {
					return Math.floor(val).toString()
				},
			},
			min: 0,
			max: maxYValue,
			forceNiceScale: false,
			floating: false,
			reversed: false,
		},
		tooltip: {
			x: {
				format: 'dd/MM/yyyy',
			},
			theme: 'light',
			shared: true,
			intersect: false,
			custom: paymentBreakdown
				? (function (breakdownData, catData) {
						return function ({ dataPointIndex }) {
							const breakdown = breakdownData[dataPointIndex]
							if (!breakdown) return ''

							// Get date from categories array (ISO string)
							const dateStr = catData[dataPointIndex]
							if (!dateStr) return ''

							const date = new Date(dateStr)
							if (isNaN(date.getTime())) return ''

							const formattedDate = date.toLocaleDateString('en-GB', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
							})

							const revenue = breakdown.revenue.toFixed(2)
							const transactions = breakdown.transactions

							return `<div style="padding: 8px;">
								<div style="font-weight: 600; margin-bottom: 8px;">${formattedDate}</div>
								<div style="margin-bottom: 4px;">Revenue: $${revenue}</div>
								<div>Transactions: ${transactions}</div>
							</div>`
						}
					})(paymentBreakdown, categories)
				: statusBreakdown
					? (function (breakdownData, catData) {
							return function ({ dataPointIndex }) {
								const breakdown = breakdownData[dataPointIndex]
								if (!breakdown) return ''

								const total =
									breakdown.underReview +
									breakdown.rejected +
									breakdown.accepted

								// Get date from categories array (ISO string)
								const dateStr = catData[dataPointIndex]
								if (!dateStr) return ''

								const date = new Date(dateStr)
								if (isNaN(date.getTime())) return ''

								const formattedDate = date.toLocaleDateString('en-GB', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								})

								let html = `<div style="padding: 8px;">
									<div style="font-weight: 600; margin-bottom: 8px;">${formattedDate}</div>
									<div style="font-weight: 600; margin-bottom: 4px;">Total: ${total}</div>`

								if (breakdown.underReview > 0) {
									html += `<div style="margin-bottom: 2px;">Under Review: ${breakdown.underReview}</div>`
								}
								if (breakdown.rejected > 0) {
									html += `<div style="margin-bottom: 2px;">Rejected: ${breakdown.rejected}</div>`
								}
								if (breakdown.accepted > 0) {
									html += `<div style="margin-bottom: 2px;">Accepted: ${breakdown.accepted}</div>`
								}

								html += `</div>`
								return html
							}
						})(statusBreakdown, categories)
					: undefined,
		},
		colors: ['#3B82F6'],
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.7,
				opacityTo: 0.2,
				stops: [0, 90, 100],
			},
		},
		grid: {
			borderColor: '#E5E7EB',
			strokeDashArray: 4,
			padding: {
				right: shouldShowAllLabels ? 25 : 20,
				left: 10,
				bottom: shouldShowAllLabels ? 10 : 0,
			},
		},
		legend: {
			position: 'top',
			horizontalAlign: 'right',
			fontSize: '12px',
			markers: {
				size: 5,
				strokeWidth: 0,
			},
			itemMargin: {
				horizontal: 10,
			},
		},
	}

	return (
		<div className="w-full">
			<Chart options={options} series={series} type="area" height={height} />
		</div>
	)
}
