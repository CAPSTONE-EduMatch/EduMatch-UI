'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
	currentPage: number
	totalPages: number
	itemsPerPage: number
	totalItems: number
	onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	itemsPerPage,
	totalItems,
	onPageChange,
}) => {
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

	return (
		<div className="pt-4 flex items-center justify-between">
			<div className="text-sm text-gray-700">
				Display {startIndex + 1}-{endIndex} results of {totalItems}
			</div>

			<div className="flex items-center space-x-2">
				<button
					onClick={() => onPageChange(Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>

				{Array.from({ length: Math.min(6, totalPages) }, (_, i) => {
					const pageNum = i + 1
					return (
						<button
							key={pageNum}
							onClick={() => onPageChange(pageNum)}
							className={`px-3 py-2 rounded-lg text-sm font-medium ${
								currentPage === pageNum
									? 'bg-teal-600 text-white'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							{pageNum}
						</button>
					)
				})}

				{totalPages > 6 && (
					<>
						<span className="px-2 text-gray-500">....</span>
						<button
							onClick={() => onPageChange(totalPages)}
							className={`px-3 py-2 rounded-lg text-sm font-medium ${
								currentPage === totalPages
									? 'bg-teal-600 text-white'
									: 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							{totalPages}
						</button>
					</>
				)}

				<button
					onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	)
}
