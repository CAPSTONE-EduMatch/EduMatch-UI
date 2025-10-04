'use client'

import { Heart, Building, MapPin, Users, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ResearchLabCardProps {
	lab: {
		id: number
		title: string
		description: string
		professor: string
		field: string
		country: string
		position: string
		date: string
		daysLeft: number
		match: string
	}
	index: number
	isWishlisted: boolean
	onWishlistToggle: (labId: number) => void
}

export function ResearchLabCard({
	lab,
	index,
	isWishlisted,
	onWishlistToggle,
}: ResearchLabCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			whileHover={{ x: 5 }}
			className="bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300"
		>
			{/* Header with wishlist */}
			<div className="flex justify-between items-start ">
				<div></div>
				<motion.button
					onClick={() => onWishlistToggle(lab.id)}
					className={`p-2 rounded-full transition-all duration-200 ${
						isWishlisted
							? 'bg-red-500 text-white'
							: 'text-red-500 hover:bg-red-50'
					}`}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					<Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
				</motion.button>
			</div>

			{/* Title */}
			<h3 className="text-xl font-bold text-gray-900 mb-3">{lab.title}</h3>

			{/* Description */}
			<p className="text-gray-600 mb-4 line-clamp-3">{lab.description}</p>

			{/* Professor */}
			<div className="flex items-center gap-2 mb-6 text-[#116E63] font-medium">
				<Users className="w-4 h-4" />
				<span>{lab.professor}</span>
			</div>

			{/* Bottom section */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-6 text-sm text-gray-600">
					<div className="flex items-center gap-2">
						<Building className="w-4 h-4" />
						<span>{lab.field}</span>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4" />
						<span>{lab.country}</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4" />
						<span>{lab.position}</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4" />
						<span>
							{lab.date}{' '}
							<span className="text-red-500">({lab.daysLeft} days left)</span>
						</span>
					</div>
				</div>

				<motion.button
					className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full font-medium transition-colors"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					Match: {lab.match}
				</motion.button>
			</div>
		</motion.div>
	)
}
