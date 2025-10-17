'use client'

import { Heart, Building, MapPin, Users, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ResearchLabCardProps {
	lab: {
		id: string
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
	onWishlistToggle: (id: string) => void
	hasApplied?: boolean
	isApplying?: boolean
	onApply?: (id: string) => void
	onClick?: (labId: string) => void
}

export function ResearchLabCard({
	lab,
	index,
	isWishlisted,
	onWishlistToggle,
	hasApplied = false,
	isApplying = false,
	onApply,
	onClick,
}: ResearchLabCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			whileHover={{ x: 5 }}
			className="bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
			onClick={() => onClick?.(lab.id)}
		>
			{/* Header with wishlist */}
			<div className="flex justify-between items-start mb-4">
				<div></div>
				<motion.button
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						onWishlistToggle(lab.id)
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

			{/* Title */}
			<h3 className="text-xl font-bold text-gray-900 mb-3">{lab.title}</h3>

			{/* Description */}
			<p className="text-gray-600 mb-4 line-clamp-3">{lab.description}</p>

			{/* Professor */}
			<div className="flex items-center gap-2 mb-4 text-[#116E63] font-medium">
				<Users className="w-4 h-4" />
				<span>{lab.professor}</span>
			</div>

			{/* Apply Button */}
			{onApply && (
				<div className="mb-4">
					<motion.button
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							onApply(lab.id)
						}}
						disabled={hasApplied || isApplying}
						className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
							hasApplied
								? 'bg-green-600 text-white cursor-not-allowed'
								: isApplying
									? 'bg-gray-400 text-white cursor-not-allowed'
									: 'bg-[#116E63] text-white hover:bg-teal-700'
						}`}
						whileHover={!hasApplied && !isApplying ? { scale: 1.02 } : {}}
						whileTap={!hasApplied && !isApplying ? { scale: 0.98 } : {}}
					>
						{hasApplied ? (
							'✓ Applied'
						) : isApplying ? (
							<div className="flex items-center justify-center gap-2">
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								Applying...
							</div>
						) : (
							'Apply Now'
						)}
					</motion.button>
				</div>
			)}

			{/* Bottom section */}
			<div className="flex justify-between gap-3 items-center">
				<div className="w-2/3 flex items-center gap-3 text-sm text-gray-600 overflow-x-auto scrollbar-hide">
					<div className="flex items-center gap-3 min-w-max">
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Building className="w-4 h-4" />
							<span>{lab.field}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<MapPin className="w-4 h-4" />
							<span>{lab.country}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Users className="w-4 h-4" />
							<span>{lab.position}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Clock className="w-4 h-4" />
							<span>
								{lab.date}{' '}
								<span className="text-red-500">({lab.daysLeft} days left)</span>
							</span>
						</div>
					</div>
				</div>

				<div className="mt-auto relative w-1/3 h-7 bg-gray-200 rounded-full overflow-hidden">
					{/* Animated progress */}
					<motion.div
						className="h-full bg-[#32CF5C] rounded-full relative"
						initial={{ width: '0%' }}
						animate={{ width: lab.match }}
						transition={{
							duration: 1.2,
							delay: index * 0.1 + 0.3,
							ease: [0.4, 0, 0.2, 1],
						}}
					/>

					{/* Centered text */}
					<div className="absolute inset-0 flex items-center justify-center">
						<motion.span
							className="font-semibold text-lg text-white"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: index * 0.1 + 0.8 }}
						>
							Match: {lab.match}
						</motion.span>
					</div>
				</div>
			</div>
		</motion.div>
	)
}
