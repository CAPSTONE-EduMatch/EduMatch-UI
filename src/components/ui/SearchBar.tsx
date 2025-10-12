'use client'

import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import Input from './Input'
import Button from './Button'

export function SearchBar() {
	return (
		// <motion.div
		// 	className="text-center"
		// 	initial={{ opacity: 0, y: 20 }}
		// 	animate={{ opacity: 1, y: 0 }}
		// 	transition={{ duration: 0.5 }}
		// >
		<motion.div
			className="mx-auto flex w-full max-w-6xl px-4"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: 0.3, duration: 0.3 }}
		>
			<Input
				type="text"
				placeholder="Enter name, country you want to find..."
				variant="signin"
				className="w-full rounded-l-full rounded-r-none border-r-0 focus:border-teal-500"
			/>
			<motion.div>
				<div
					shadow-md
					transition-all
					duration-100
					font-medium
					className="text-white p-5 px-7 rounded-r-full rounded-l-none bg-[#116E63] hover:bg-teal-700"
				>
					<Search className="w-[25px] h-[25px]" />
				</div>
			</motion.div>
		</motion.div>
		// </motion.div>
	)
}
