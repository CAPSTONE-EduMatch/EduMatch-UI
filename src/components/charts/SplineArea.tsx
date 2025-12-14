'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import {
	formatUTCDate,
	getDateInTimezone,
	getUserTimezone,
} from '@/utils/date/timezone-utils'

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
	// Validate categories array before processing
	if (!categories || categories.length === 0) {
		// Return empty chart if no categories
		return (
			<div className="w-full flex items-center justify-center h-[320px] text-gray-500">
				No data available
			</div>
		)
	}

	// Filter out invalid dates and convert to timestamps for ApexCharts datetime axis
	const validCategories = categories
		.map((cat) => {
			if (!cat) return null
			try {
				const date = new Date(cat)
				if (isNaN(date.getTime())) return null
				// Return timestamp (number) for ApexCharts datetime axis
				return date.getTime()
			} catch {
				return null
			}
		})
		.filter((cat): cat is number => cat !== null)

	if (validCategories.length === 0) {
		return (
			<div className="w-full flex items-center justify-center h-[320px] text-gray-500">
				No valid date data available
			</div>
		)
	}

	const firstDate = new Date(validCategories[0])
	const lastDate = new Date(validCategories[validCategories.length - 1])

	// Validate dates
	if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
		return (
			<div className="w-full flex items-center justify-center h-[320px] text-gray-500">
				Invalid date data
			</div>
		)
	}

	const daysDiff =
		(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)

	// Determine if this is hourly data (today/yesterday) or daily/weekly data
	const isHourlyData = daysDiff < 2 // Today or yesterday (hourly data)
	const isDailyBucketed = !isHourlyData // Week/month/year summary (1 point per day)

	// Show all labels for week (6-8 days to include Monday-Sunday) and year (350-380 days) data
	const shouldShowAllLabels =
		(daysDiff >= 6 && daysDiff <= 8) || (daysDiff >= 350 && daysDiff <= 380)

	// For daily-bucketed data, create category labels
	const categoryLabels = isDailyBucketed
		? validCategories.map((ts) => {
				const date = new Date(ts)
				const timezone = getUserTimezone()
				const dateComponents = getDateInTimezone(date, timezone)
				const months = [
					'Jan',
					'Feb',
					'Mar',
					'Apr',
					'May',
					'Jun',
					'Jul',
					'Aug',
					'Sep',
					'Oct',
					'Nov',
					'Dec',
				]
				// Reuse week label format
				if (daysDiff >= 5 && daysDiff <= 8) {
					// For week data, show day and date (e.g., "Mon, 14 Dec")
					const weekday = formatUTCDate(date, { weekday: 'short' }, timezone)
					return `${weekday}, ${dateComponents.day.toString().padStart(2, '0')} ${months[dateComponents.month - 1]}`
				} else {
					// For other data, show date (e.g., "14 Dec")
					return `${dateComponents.day.toString().padStart(2, '0')} ${months[dateComponents.month - 1]}`
				}
			})
		: []

	// For category axis: use plain number[] series (not [x,y] pairs)
	const categorySeries = isDailyBucketed
		? series.map((s) => {
				const data = [...s.data]
				// Pad with zeros if data is shorter than categories
				while (data.length < categoryLabels.length) {
					data.push(0)
				}
				return {
					...s,
					data: data.slice(0, categoryLabels.length),
				}
			})
		: []

	// Transform series data to use [timestamp, value] pairs for ApexCharts datetime axis
	// This ensures proper x-axis scaling and tooltip functionality (for hourly data)
	const adjustedSeries = series.map((s) => {
		const dataLength = Math.min(s.data.length, validCategories.length)
		const dataPoints: [number, number][] = []

		for (let i = 0; i < dataLength; i++) {
			const timestamp = validCategories[i]
			const value = s.data[i] || 0
			dataPoints.push([timestamp, value])
		}

		// If data is shorter than categories, pad with zeros
		if (s.data.length < validCategories.length) {
			for (let i = s.data.length; i < validCategories.length; i++) {
				dataPoints.push([validCategories[i], 0])
			}
		}

		return {
			...s,
			data: dataPoints,
		}
	})

	// Calculate max value from all series data and round up to next whole number
	// Handle both category series (number[]) and datetime series ([timestamp, value][])
	const allDataValues = (
		isDailyBucketed ? categorySeries : adjustedSeries
	).flatMap((s) => {
		if (s.data.length === 0) return [0]
		// Check if data is in [timestamp, value][] format (datetime)
		const firstItem = s.data[0]
		if (
			Array.isArray(firstItem) &&
			firstItem.length === 2 &&
			typeof firstItem[0] === 'number' &&
			typeof firstItem[1] === 'number'
		) {
			return (s.data as [number, number][]).map(([, value]) => value)
		}
		// For category series, data is number[]
		return s.data as number[]
	})
	const maxDataValue =
		allDataValues.length > 0 ? Math.max(...allDataValues, 0) : 0
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
			// Ensure chart uses full width
			sparkline: {
				enabled: false,
			},
		},
		dataLabels: {
			enabled: false,
		},
		stroke: {
			curve: 'smooth',
			width: 2,
		},
		xaxis: isDailyBucketed
			? {
					type: 'category',
					categories: categoryLabels,
					tickPlacement: 'on',
					axisBorder: {
						show: true,
					},
					axisTicks: {
						show: true,
					},
					labels: {
						rotate: 0,
						trim: false,
						hideOverlappingLabels: false,
						style: {
							colors: '#6B7280',
							fontSize: shouldShowAllLabels ? '11px' : '12px',
						},
					},
				}
			: {
					type: 'datetime',
					axisBorder: {
						show: true,
					},
					axisTicks: {
						show: true,
					},
					labels: {
						style: {
							colors: '#6B7280',
							fontSize: shouldShowAllLabels ? '11px' : '12px',
						},
						rotate: 0,
						rotateAlways: false,
						hideOverlappingLabels: false,
						trim: false,
						minHeight: shouldShowAllLabels ? 30 : undefined,
						showDuplicates: false, // Prevent duplicate labels
						// Custom formatter for x-axis labels
						// ApexCharts datetime formatter receives timestamp as number
						formatter: (value: string, timestamp?: number, opts?: any) => {
							let date: Date

							// ApexCharts provides timestamp as the actual timestamp value (milliseconds)
							if (
								timestamp !== undefined &&
								timestamp !== null &&
								!isNaN(timestamp)
							) {
								date = new Date(timestamp)
							} else if (value) {
								// Fallback: parse the value if it's a number or ISO string
								const numValue = Number(value)
								if (!isNaN(numValue)) {
									date = new Date(numValue)
								} else {
									date = new Date(value)
								}
							} else {
								return value || ''
							}

							if (isNaN(date.getTime())) {
								return value || ''
							}

							// Use timezone-aware formatting to ensure consistent date display
							const timezone = getUserTimezone()

							// For hourly data (today/yesterday), show time only (e.g., "14:30")
							return formatUTCDate(
								date,
								{
									hour: '2-digit',
									minute: '2-digit',
									hour12: false,
								},
								timezone
							)
						},
					},
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
				? (function (breakdownData) {
						// Ensure breakdown data length matches categories
						const adjustedBreakdown =
							breakdownData.length > validCategories.length
								? breakdownData.slice(0, validCategories.length)
								: [
										...breakdownData,
										...Array(
											Math.max(0, validCategories.length - breakdownData.length)
										).fill({ revenue: 0, transactions: 0 }),
									]

						return function ({ dataPointIndex }) {
							// Ensure index is within bounds
							if (
								dataPointIndex < 0 ||
								dataPointIndex >= validCategories.length
							) {
								return ''
							}

							const breakdown = adjustedBreakdown[dataPointIndex]
							if (!breakdown) return ''

							// Get timestamp from validCategories array (number)
							const timestamp = validCategories[dataPointIndex]
							if (timestamp === undefined || timestamp === null) return ''

							const date = new Date(timestamp)
							if (isNaN(date.getTime())) return ''

							// Use timezone-aware formatting
							const timezone = getUserTimezone()
							const formattedDate = formatUTCDate(
								date,
								{
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								},
								timezone
							)

							const revenue = (breakdown.revenue || 0).toFixed(2)
							const transactions = breakdown.transactions || 0

							return `<div style="padding: 8px;">
								<div style="font-weight: 600; margin-bottom: 8px;">${formattedDate}</div>
								<div style="margin-bottom: 4px;">Revenue: $${revenue}</div>
								<div>Transactions: ${transactions}</div>
							</div>`
						}
					})(paymentBreakdown)
				: statusBreakdown
					? (function (breakdownData) {
							// Ensure breakdown data length matches categories
							const adjustedBreakdown =
								breakdownData.length > validCategories.length
									? breakdownData.slice(0, validCategories.length)
									: [
											...breakdownData,
											...Array(
												Math.max(
													0,
													validCategories.length - breakdownData.length
												)
											).fill({ underReview: 0, rejected: 0, accepted: 0 }),
										]

							return function ({ dataPointIndex }) {
								// Ensure index is within bounds
								if (
									dataPointIndex < 0 ||
									dataPointIndex >= validCategories.length
								) {
									return ''
								}

								const breakdown = adjustedBreakdown[dataPointIndex]
								if (!breakdown) return ''

								const total =
									(breakdown.underReview || 0) +
									(breakdown.rejected || 0) +
									(breakdown.accepted || 0)

								// Get timestamp from validCategories array (number)
								const timestamp = validCategories[dataPointIndex]
								if (timestamp === undefined || timestamp === null) return ''

								const date = new Date(timestamp)
								if (isNaN(date.getTime())) return ''

								// Format date with time for hourly data (today/yesterday), or just date for daily/weekly data
								// Use the already calculated isHourlyData from component scope
								// Use timezone-aware formatting to ensure consistent date display
								const timezone = getUserTimezone()

								let formattedDate: string
								if (isHourlyData) {
									// For hourly data, show date and time (e.g., "14/01/2025, 14:30")
									// This ensures each hour shows its correct date/time in user's timezone
									formattedDate = formatUTCDate(
										date,
										{
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
											hour12: false,
										},
										timezone
									)
								} else {
									// For daily/weekly data, show just date
									formattedDate = formatUTCDate(
										date,
										{
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
										},
										timezone
									)
								}

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
						})(statusBreakdown)
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
				right: 0, // No right padding - let chart extend fully
				left: 0, // No left padding - chart starts at edge
				bottom: shouldShowAllLabels ? 10 : 0,
				top: 0,
			},
		},
		plotOptions: {
			area: {
				// Ensure area chart uses full width
				fillTo: 'end',
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
		<div className="w-full" style={{ width: '100%', overflow: 'visible' }}>
			<Chart
				options={options}
				series={isDailyBucketed ? categorySeries : adjustedSeries}
				type="area"
				height={height}
				width="100%"
			/>
		</div>
	)
}
