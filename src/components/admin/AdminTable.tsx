'use client'

import { Card, CardContent } from '@/components/ui'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

interface Column<T> {
	header: string
	// eslint-disable-next-line no-unused-vars
	accessor: keyof T | ((row: T) => ReactNode)
	className?: string
	headerClassName?: string
}

interface AdminTableProps<T> {
	data: T[]
	columns: Column<T>[]
	loading?: boolean
	error?: string
	currentPage?: number
	totalPages?: number
	totalItems?: number
	itemsPerPage?: number
	// eslint-disable-next-line no-unused-vars
	onPageChange?: (pageNumber: number) => void
	emptyMessage?: string
}

export function AdminTable<T extends { id: string }>({
	data,
	columns,
	loading = false,
	error,
	currentPage = 1,
	totalPages = 1,
	totalItems = 0,
	itemsPerPage = 10,
	onPageChange,
	emptyMessage = 'No data found',
}: AdminTableProps<T>) {
	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-base text-gray-600">Loading...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-base text-red-600">Error: {error}</div>
			</div>
		)
	}

	const getCellContent = (item: T, column: Column<T>) => {
		if (typeof column.accessor === 'function') {
			return column.accessor(item)
		}
		return item[column.accessor] as ReactNode
	}

	return (
		<div className="space-y-6">
			<Card className="bg-white rounded-[24px] shadow-xl overflow-hidden border-0">
				<CardContent className="p-0">
					{/* Table Header */}
					<div
						className="bg-[#126E64] text-white px-8 py-5 text-left font-bold text-base grid gap-4"
						style={{
							gridTemplateColumns: columns
								.map((col) => col.className || '1fr')
								.join(' '),
						}}
					>
						{columns.map((column, index) => (
							<div key={index} className={column.headerClassName}>
								{column.header}
							</div>
						))}
					</div>

					{/* Table Body */}
					<div className="divide-y divide-gray-100">
						{data.length === 0 ? (
							<div className="text-center py-12 text-gray-500">
								{emptyMessage}
							</div>
						) : (
							data.map((item, index) => {
								const isEven = index % 2 === 0
								const rowBg = isEven ? 'bg-[#EAEDF3]' : 'bg-white'

								return (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className={`${rowBg} px-8 py-5 items-center grid gap-4`}
										style={{
											gridTemplateColumns: columns
												.map((col) => col.className || '1fr')
												.join(' '),
										}}
									>
										{columns.map((column, colIndex) => (
											<div key={colIndex} className="">
												{getCellContent(item, column)}
											</div>
										))}
									</motion.div>
								)
							})
						)}
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-between items-center mt-6">
					<div className="text-gray-600 text-xs font-medium">
						Display {Math.min(itemsPerPage, data.length)} results of{' '}
						<span className="font-semibold text-gray-800">{totalItems}</span>
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium text-sm"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						{(() => {
							const maxPagesToShow = 6
							let startPage = Math.max(
								1,
								currentPage - Math.floor(maxPagesToShow / 2)
							)
							let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

							// Adjust startPage if we're near the end
							if (endPage - startPage < maxPagesToShow - 1) {
								startPage = Math.max(1, endPage - maxPagesToShow + 1)
							}

							const pages = []

							// Show first page if not in range
							if (startPage > 1) {
								pages.push(
									<button
										key={1}
										onClick={() => onPageChange?.(1)}
										className="w-8 h-8 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#126E64] transition-all"
									>
										1
									</button>
								)
								if (startPage > 2) {
									pages.push(
										<span
											key="ellipsis-start"
											className="text-gray-400 mx-1 text-xs"
										>
											...
										</span>
									)
								}
							}

							// Show page numbers in range
							for (let i = startPage; i <= endPage; i++) {
								pages.push(
									<button
										key={i}
										onClick={() => onPageChange?.(i)}
										className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
											currentPage === i
												? 'bg-[#126E64] text-white shadow-md'
												: 'text-gray-700 hover:bg-gray-100 hover:text-[#126E64]'
										}`}
									>
										{i}
									</button>
								)
							}

							// Show last page if not in range
							if (endPage < totalPages) {
								if (endPage < totalPages - 1) {
									pages.push(
										<span
											key="ellipsis-end"
											className="text-gray-400 mx-1 text-xs"
										>
											...
										</span>
									)
								}
								pages.push(
									<button
										key={totalPages}
										onClick={() => onPageChange?.(totalPages)}
										className="w-8 h-8 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#126E64] transition-all"
									>
										{totalPages}
									</button>
								)
							}

							return pages
						})()}{' '}
						<button
							onClick={() =>
								onPageChange?.(Math.min(totalPages, currentPage + 1))
							}
							disabled={currentPage === totalPages}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-medium text-sm"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
