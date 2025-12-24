'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	const generatePageNumbers = () => {
		const pages: (number | string)[] = []

		if (totalPages <= 7) {
			// Show all pages if total is 7 or less
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			// Always show first page
			pages.push(1)

			if (currentPage <= 4) {
				// Show pages 2, 3, 4, 5 and ellipsis
				for (let i = 2; i <= 5; i++) {
					pages.push(i)
				}
				pages.push('...')
				pages.push(totalPages)
			} else if (currentPage >= totalPages - 3) {
				// Show ellipsis and last 4 pages
				pages.push('...')
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i)
				}
			} else {
				// Show ellipsis, current page with neighbors, ellipsis
				pages.push('...')
				for (let i = currentPage - 2; i <= currentPage + 2; i++) {
					pages.push(i)
				}
				pages.push('...')
				pages.push(totalPages)
			}
		}

		return pages
	}

	const pages = generatePageNumbers()

	return (
		<motion.div
			className="flex items-center justify-center space-x-2 mt-8"
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
		>
			<motion.button
				className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
				whileTap={{ scale: 0.92, transition: { duration: 0.1 } }}
			>
				<ChevronLeft className="w-4 h-4" />
			</motion.button>

			{pages.map((page, index) => (
				<motion.div
					key={`${page}-${index}`}
					// layout
					transition={{
						layout: { duration: 0.3, ease: 'easeInOut' },
					}}
				>
					{page === '...' ? (
						<span className="px-3 py-2 text-gray-500">...</span>
					) : (
						<motion.button
							className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
								currentPage === page
									? 'bg-[#116E63] text-white'
									: 'border border-gray-300 hover:border-teal-500 hover:bg-teal-50'
							}`}
							onClick={() => onPageChange(page as number)}
							whileHover={{
								scale: 1.15,
								transition: { duration: 0.2, ease: 'easeOut' },
							}}
							whileTap={{
								scale: 0.85,
								transition: { duration: 0.1 },
							}}
						>
							{page}
						</motion.button>
					)}
				</motion.div>
			))}
			{/* <div className="h-10 w-20 p-6 bg-amber-100"></div> */}

			<motion.button
				className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
				whileTap={{ scale: 0.92, transition: { duration: 0.1 } }}
			>
				<ChevronRight className="w-4 h-4" />
			</motion.button>
		</motion.div>
	)
}
