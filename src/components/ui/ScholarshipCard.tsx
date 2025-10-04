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
}

export function ScholarshipCard({
	scholarship,
	index,
	isWishlisted,
	onWishlistToggle,
}: ScholarshipCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			whileHover={{ x: 5 }}
			className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
		>
			{/* Header */}
			<div className="flex justify-between items-start mb-4">
				<span className="text-sm text-gray-500">{scholarship.provider}</span>
				<div className="flex items-center gap-3">
					<span className="text-lg font-bold text-orange-500">
						Grant: {scholarship.amount}
					</span>
					<motion.button
						onClick={() => onWishlistToggle(scholarship.id)}
						className={`p-2 rounded-full transition-all duration-200 ${
							isWishlisted
								? 'bg-red-500 text-white'
								: 'text-red-500 hover:bg-red-50'
						}`}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
					>
						<Heart
							className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
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
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-6 text-sm text-gray-600">
					<div className="flex items-center gap-2">
						<Building className="w-4 h-4" />
						<span>{scholarship.university}</span>
					</div>
					<div className="flex items-center gap-2">
						<FileText className="w-4 h-4" />
						<span>Essay required: {scholarship.essayRequired}</span>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4" />
						<span>{scholarship.country}</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4" />
						<span>
							{scholarship.date}{' '}
							<span className="text-red-500">
								({scholarship.daysLeft} days left)
							</span>
						</span>
					</div>
				</div>

				<motion.button
					className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full font-medium transition-colors"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					Match: {scholarship.match}
				</motion.button>
			</div>
		</motion.div>
	)
}
