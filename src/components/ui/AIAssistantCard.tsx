'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import robot from '../../../public/Robot.png'
import Button from './Button'

interface AIAssistantCardProps {
	className?: string
	delay?: number
}

export function AIAssistantCard({
	className = '',
	delay = 0.3,
}: AIAssistantCardProps) {
	return (
		<motion.div
			className={`bg-gradient-to-br from-[#116E63] via-[#0F5F54] to-[#0D4F45] text-white rounded-3xl p-6 shadow-2xl border-2 border-[#F0A227]/20 ${className} flex flex-col items-center gap-3 relative overflow-hidden w-72`}
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ delay, duration: 0.6, ease: 'easeOut' }}
			// whileHover={{
			// 	scale: 1.02,
			// 	boxShadow: '0 20px 40px rgba(240, 162, 39, 0.3)',
			// 	borderColor: 'rgba(240, 162, 39, 0.5)',
			// }}
		>
			{/* Animated background glow */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-[#F0A227]/10 via-transparent to-[#F0A227]/10 rounded-3xl"
				animate={{
					opacity: [0.3, 0.6, 0.3],
					scale: [1, 1.05, 1],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: 'easeInOut',
				}}
			/>

			{/* Sparkle effects */}
			<motion.div
				className="absolute top-4 right-4 w-2 h-2 bg-[#F0A227] rounded-full"
				animate={{
					scale: [0, 1, 0],
					opacity: [0, 1, 0],
				}}
				transition={{
					duration: 2,
					repeat: Number.POSITIVE_INFINITY,
					delay: 0.5,
				}}
			/>
			<motion.div
				className="absolute top-8 left-4 w-1.5 h-1.5 bg-white rounded-full"
				animate={{
					scale: [0, 1, 0],
					opacity: [0, 0.8, 0],
				}}
				transition={{
					duration: 2.5,
					repeat: Number.POSITIVE_INFINITY,
					delay: 1,
				}}
			/>
			<motion.div
				className="absolute bottom-6 right-6 w-1 h-1 bg-[#F0A227] rounded-full"
				animate={{
					scale: [0, 1, 0],
					opacity: [0, 1, 0],
				}}
				transition={{
					duration: 1.8,
					repeat: Number.POSITIVE_INFINITY,
					delay: 1.5,
				}}
			/>
			<motion.h3
				className="font-bold mb-2 text-2xl text-center relative z-10"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: delay + 0.2 }}
			>
				Lost in information overload?
			</motion.h3>
			<motion.p
				className="mb-4 text-xl font-bold text-[#F0A227] text-center relative z-10"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: delay + 0.4 }}
			>
				Just ask - AI will find it for you
			</motion.p>
			{/* <motion.button
				className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium w-full transition-colors"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				Search Faster with AI
			</motion.button> */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: delay + 0.6, type: 'spring', stiffness: 200 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className="relative z-10 w-full"
			>
				<Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-full text-md font-bold w-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
					Search Faster with AI
				</Button>
			</motion.div>
			<motion.div
				className="mt-4 flex justify-center relative z-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: delay + 0.8 }}
			>
				<motion.div
					animate={{
						y: [0, -8, 0],
						rotate: [0, 2, -2, 0],
					}}
					transition={{
						duration: 3,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
					whileHover={{
						scale: 1.1,
						rotate: 5,
					}}
					className="relative"
				>
					{/* Glow effect behind robot */}
					<motion.div
						className="absolute inset-0 bg-[#F0A227]/30 rounded-2xl blur-xl"
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.3, 0.6, 0.3],
						}}
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						}}
					/>
					<Image
						src={robot}
						alt="AI Assistant"
						width={140}
						height={140}
						className="rounded-2xl  relative z-10"
					/>
				</motion.div>
			</motion.div>
			<motion.p
				className="text-sm mt-3 text-center opacity-90 w-48 font-medium relative z-10"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.9 }}
				transition={{ delay: delay + 1 }}
			>
				&ldquo;I found some suitable opportunities for you&rdquo;
			</motion.p>
		</motion.div>
	)
}
