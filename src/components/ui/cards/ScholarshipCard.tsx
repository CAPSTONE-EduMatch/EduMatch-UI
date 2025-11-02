'use client'

import {
	Heart,
	Building,
	FileText,
	MapPin,
	Clock,
	AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDateToDDMMYYYY, calculateDaysLeft } from '@/lib/date-utils'
import { Button } from '@/components/ui'

interface ScholarshipCardProps {
	scholarship: {
		id: string
		title: string
		description: string
		provider: string
		university: string
		essayRequired: string
		country: string
		date: string
		daysLeft: number
		amount: string
		match: string
		applicationStatus?: string
	}
	index: number
	isWishlisted: boolean
	onWishlistToggle: (id: string) => void
	hasApplied?: boolean
	isApplying?: boolean
	onApply?: (id: string) => void
	onClick?: (scholarshipId: string) => void
	applicationId?: string
	onUpdateRequest?: (applicationId: string) => void
}

export function ScholarshipCard({
	scholarship,
	index,
	isWishlisted,
	onWishlistToggle,
	hasApplied = false,
	isApplying = false,
	onApply,
	onClick,
	applicationId,
	onUpdateRequest,
}: ScholarshipCardProps) {
	// Format date and calculate days left on the client side
	const formattedDate = formatDateToDDMMYYYY(scholarship.date)
	const daysLeft = calculateDaysLeft(scholarship.date)

	return (
		<motion.div
			// initial={{ opacity: 0, x: -20 }}
			// animate={{ opacity: 1, x: 0 }}
			// transition={{ duration: 0.3 }}
			whileHover={{ x: 5 }}
			className="bg-white rounded-3xl border border-gray-600 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
			onClick={() => onClick?.(scholarship.id)}
		>
			{/* Header */}
			<div className="flex justify-between items-start mb-4">
				<span className="text-sm text-gray-500">{scholarship.provider}</span>
				<div className="flex items-center gap-3">
					<span className="text-lg font-bold text-orange-500">
						Grant: {scholarship.amount}
					</span>
					<motion.button
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							onWishlistToggle(scholarship.id)
						}}
						className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
					>
						<Heart
							className={`w-6 h-6 transition-all duration-200 ${
								isWishlisted
									? 'fill-red-500 text-red-500'
									: 'text-gray-400 hover:text-red-500'
							}`}
						/>
					</motion.button>
				</div>
			</div>

			{/* Title */}
			<h3 className="text-xl font-bold text-gray-900 mb-3">
				{scholarship.title}
			</h3>

			{/* Description */}
			<p className="text-gray-600 mb-4 line-clamp-3">
				{scholarship.description}
			</p>

			{/* Bottom section */}
			<div className="flex justify-between gap-3 items-center">
				<div className="w-2/3 flex items-center gap-3 text-sm text-gray-600 overflow-x-auto scrollbar-hide">
					<div className="flex items-center gap-3 min-w-max">
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Building className="w-4 h-4" />
							<span>{scholarship.university}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<FileText className="w-4 h-4" />
							<span>Essay required: {scholarship.essayRequired}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<MapPin className="w-4 h-4" />
							<span>{scholarship.country}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Clock className="w-4 h-4" />
							<span>
								{formattedDate}{' '}
								<span className="text-red-500">({daysLeft} days left)</span>
							</span>
						</div>
					</div>
				</div>

				<div className="mt-auto relative w-1/3 h-7 bg-gray-200 rounded-full overflow-hidden">
					{/* Animated progress */}
					<motion.div
						className="h-full bg-[#32CF5C] rounded-full relative"
						initial={{ width: '0%' }}
						animate={{ width: scholarship.match }}
						transition={{
							duration: 1.2,
							delay: index * 0.1 + 0.3,
							ease: [0.4, 0, 0.2, 1],
						}}
					/>

					{/* Centered text */}
					<div className="  absolute inset-0 flex items-center justify-center">
						<motion.span
							className="font-semibold text-lg text-white "
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: index * 0.1 + 0.8 }}
						>
							Match: {scholarship.match}
						</motion.span>
					</div>
				</div>

				{/* Application Status */}
				{scholarship.applicationStatus && (
					<div className="mt-3 flex flex-col items-center gap-2">
						<span
							className={`px-4 py-2 rounded-full text-sm font-medium ${
								scholarship.applicationStatus === 'SUBMITTED' ||
								scholarship.applicationStatus === 'PENDING'
									? 'bg-yellow-100 text-yellow-800'
									: scholarship.applicationStatus === 'REQUIRE_UPDATE'
										? 'bg-orange-100 text-orange-800'
										: scholarship.applicationStatus === 'UPDATED'
											? 'bg-blue-100 text-blue-800'
											: scholarship.applicationStatus === 'ACCEPTED'
												? 'bg-green-100 text-green-800'
												: scholarship.applicationStatus === 'REJECTED'
													? 'bg-red-100 text-red-800'
													: 'bg-gray-100 text-gray-800'
							}`}
						>
							<span className="inline-flex items-center gap-1">
								📋{' '}
								{scholarship.applicationStatus === 'PENDING'
									? 'SUBMITTED'
									: scholarship.applicationStatus === 'REVIEWED'
										? 'REQUIRE_UPDATE'
										: scholarship.applicationStatus}
							</span>
						</span>
						{scholarship.applicationStatus === 'REQUIRE_UPDATE' &&
							applicationId &&
							onUpdateRequest && (
								<Button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										onUpdateRequest(applicationId)
									}}
									className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5"
									size="sm"
								>
									<AlertCircle className="h-4 w-4 mr-1.5" />
									Update Required - Respond Now
								</Button>
							)}
					</div>
				)}
			</div>
		</motion.div>
	)
}
