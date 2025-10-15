'use client'

import { useState } from 'react'
import { ChevronDown, ArrowUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'

export type SortOption =
	| 'most-popular'
	| 'newest'
	| 'oldest'
	| 'match-score'
	| 'deadline'
	| 'default'

interface SortDropdownProps {
	value: SortOption
	onChange: (value: SortOption) => void
}

interface SortOptionItem {
	value: SortOption
	label: string
	separator?: boolean
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
	const [isOpen, setIsOpen] = useState(false)

	const sortOptions: SortOptionItem[] = [
		{ value: 'most-popular' as SortOption, label: 'Most popular' },
		{ value: 'newest' as SortOption, label: 'Newest' },
		{ value: 'oldest' as SortOption, label: 'Oldest' },
		{ value: 'match-score' as SortOption, label: 'Match score' },
		{ value: 'deadline' as SortOption, label: 'Deadline' },
		// { value: 'default' as SortOption, label: 'Clear sort', separator: true },
	]

	const currentOption = sortOptions.find((option) => option.value === value)

	return (
		<div className="relative">
			<Button
				variant="outline"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 rounded-full border-gray-300 hover:border-teal-500 transition-colors"
			>
				<ArrowUpDown className="w-4 h-4" />
				<span>Sort</span>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronDown className="w-4 h-4" />
				</motion.div>
			</Button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.95 }}
						transition={{ duration: 0.2 }}
						className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px]"
					>
						{sortOptions.map((option, index) => (
							<div key={option.value}>
								{option.separator && (
									<div className="border-t border-gray-200 my-1" />
								)}
								<motion.button
									onClick={() => {
										onChange(option.value)
										setIsOpen(false)
									}}
									className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
										index === 0 ? 'rounded-t-xl' : ''
									} ${index === sortOptions.length - 1 ? 'rounded-b-xl' : ''} ${
										value === option.value
											? 'bg-teal-50 text-teal-700'
											: option.value === 'default'
												? 'text-red-600 hover:bg-red-50'
												: 'text-gray-700'
									}`}
									whileHover={{
										backgroundColor:
											option.value === 'default'
												? 'rgb(254 242 242)'
												: 'rgb(249 250 251)',
									}}
									whileTap={{ scale: 0.98 }}
								>
									{option.label}
								</motion.button>
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{isOpen && (
				<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
			)}
		</div>
	)
}
