'use client'

import { mockPrograms } from '@/data/utils'
import { useMemo, useState } from 'react'
import { ProgramCard } from '../ui/ProgramCard'
import { SortOption } from '../ui/Sort'

interface ProgramsTabProps {
	sortBy?: SortOption
	currentPage?: number
	itemsPerPage?: number
}

export function ProgramsTab({
	currentPage = 1,
	itemsPerPage = 15,
}: ProgramsTabProps) {
	const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set())

	const toggleWishlist = (id: number) => {
		setWishlistItems((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.add(id)
			}
			return newSet
		})
	}

	const paginatedPrograms = useMemo(() => {
		// Apply pagination without sorting
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return mockPrograms.slice(startIndex, endIndex)
	}, [currentPage, itemsPerPage])

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{paginatedPrograms.length > 0 ? (
				paginatedPrograms.map((program, index) => (
					<ProgramCard
						key={program.id}
						program={program}
						index={index}
						isWishlisted={wishlistItems.has(program.id)}
						onWishlistToggle={toggleWishlist}
					/>
				))
			) : (
				<div className="col-span-full text-center py-12">
					<div className="text-gray-500 text-lg mb-2">No programs found</div>
					<div className="text-gray-400 text-sm">
						Try adjusting your filters or search criteria
					</div>
				</div>
			)}
		</div>
	)
}
