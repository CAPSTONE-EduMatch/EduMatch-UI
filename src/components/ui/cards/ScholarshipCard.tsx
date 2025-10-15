'use client'

import { Heart, Building, FileText, MapPin, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ScholarshipCardProps {
	scholarship: {
		id: number
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
	}
	index: number
	isWishlisted: boolean
	onWishlistToggle: (scholarshipId: number) => void
	onClick?: (scholarshipId: number) => void
}

export function ScholarshipCard({
	scholarship,
	index,
	isWishlisted,
	onWishlistToggle,
	onClick,
}: ScholarshipCardProps) {
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
			<p className="text-gray-600 mb-6 line-clamp-3">
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
								{scholarship.date}{' '}
								<span className="text-red-500">
									({scholarship.daysLeft} days left)
								</span>
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
			</div>
		</motion.div>
	)
}
