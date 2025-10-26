'use client'

import { Heart, Calendar, MapPin, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { formatDateToDDMMYYYY, calculateDaysLeft } from '@/lib/date-utils'

interface ProgramCardProps {
	program: {
		id: string
		title: string
		description: string
		university: string
		logo: string
		field: string
		country: string
		date: string
		daysLeft: number
		price: string
		match: string
		attendance: string
		applicationStatus?: string
	}
	index: number
	isWishlisted: boolean
	// eslint-disable-next-line no-unused-vars
	onWishlistToggle: (id: string) => void
	// eslint-disable-next-line no-unused-vars
	onClick?: (programId: string) => void
	hasApplied?: boolean
	isApplying?: boolean
	onApply?: (programId: string) => void
}

export function ProgramCard({
	program,
	index,
	isWishlisted,
	onWishlistToggle,
	onClick,
	hasApplied = false,
	isApplying = false,
	onApply,
}: ProgramCardProps) {
	// Format date and calculate days left on the client side
	const formattedDate = formatDateToDDMMYYYY(program.date)
	const daysLeft = calculateDaysLeft(program.date)

	return (
		<motion.div
			// initial={{ opacity: 0, y: 20 }}
			// animate={{ opacity: 1, y: 0 }}
			// transition={{ duration: 0.3 }}
			whileHover={{ y: -5 }}
			onClick={() => onClick?.(program.id)}
			className="flex flex-col h-full bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
		>
			{/* Header with logo and wishlist */}
			<div className="flex justify-between items-start mb-4 gap-10">
				{/* <div className="flex items-center gap-3">
					<div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
						<span className="text-white text-xl font-bold">{program.logo}</span>
					</div>
					<div>
						<div className="text-xl font-bold text-gray-900">HARVARD</div>
						<div className="text-sm text-gray-600 tracking-wider">
							UNIVERSITY
						</div>
					</div>
				</div> */}

				<div className="">
					<Image
						src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/1200px-Harvard_University_logo.svg.png"
						alt={program.university}
						width={340}
						height={340}
						className="rounded-lg"
					/>
				</div>

				<motion.button
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						onWishlistToggle(program.id)
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
			<h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
				{program.title}
			</h3>

			{/* Description */}
			<p className="text-gray-500 mb-6 line-clamp-3 text-sm leading-relaxed flex-shrink-0">
				{program.description}
			</p>

			{/* Tags */}
			<div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
				<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
					<GraduationCap className="w-4 h-4" />
					{program.field}
				</span>
				<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
					<MapPin className="w-4 h-4" />
					{program.country}
				</span>
			</div>

			<div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
				<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
					<Calendar className="w-4 h-4" />
					{formattedDate}{' '}
					<span className="text-red-500 font-semibold">
						({daysLeft} days left)
					</span>
				</span>
			</div>

			<div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
				<span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
					<span className="inline-flex items-center gap-1">
						📱 {program.attendance}
					</span>
				</span>
			</div>

			{/* Price */}
			<div className="text-center mb-6 flex-grow flex items-end justify-center min-h-[60px]">
				<div className="text-2xl font-bold text-gray-900">{program.price}</div>
			</div>
			{/* Match */}
			<div className="mt-auto relative w-full h-7 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
				{/* Animated progress */}
				<motion.div
					className="h-full bg-[#32CF5C] rounded-full relative"
					initial={{ width: '0%' }}
					animate={{ width: program.match }}
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
						Match: {program.match}
					</motion.span>
				</div>
			</div>

			{/* Application Status */}
			{program.applicationStatus && (
				<div className="mt-3 flex justify-center">
					<span
						className={`px-4 py-2 rounded-full text-sm font-medium ${
							program.applicationStatus === 'PENDING'
								? 'bg-yellow-100 text-yellow-800'
								: program.applicationStatus === 'REVIEWED'
									? 'bg-blue-100 text-blue-800'
									: program.applicationStatus === 'ACCEPTED'
										? 'bg-green-100 text-green-800'
										: program.applicationStatus === 'REJECTED'
											? 'bg-red-100 text-red-800'
											: 'bg-gray-100 text-gray-800'
						}`}
					>
						<span className="inline-flex items-center gap-1">
							📋 {program.applicationStatus}
						</span>
					</span>
				</div>
			)}
		</motion.div>
	)
}
