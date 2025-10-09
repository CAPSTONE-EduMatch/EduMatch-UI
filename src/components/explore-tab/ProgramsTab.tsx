'use client'

import { useMemo, useState } from 'react'
import { ProgramCard } from '../ui/ProgramCard'
import { SortOption } from '../ui/Sort'
import { Program } from '@/types/explore-api'

interface ProgramsTabProps {
	sortBy?: SortOption
	programs?: Program[]
}

export function ProgramsTab({ programs = [] }: ProgramsTabProps) {
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
		// Since pagination is handled by API, just return the programs
		return programs
	}, [programs])

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{paginatedPrograms.length > 0 ? (
				paginatedPrograms.map((program: Program, index: number) => (
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
