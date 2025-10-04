'use client'

import { useState } from 'react'
import { SortOption } from '../ui/Sort'
import { ProgramCard } from '../ui/ProgramCard'
import { mockPrograms } from '@/data/utils'

interface ProgramsTabProps {
	sortBy: SortOption
}

// eslint-disable-next-line no-unused-vars
export function ProgramsTab({ sortBy }: ProgramsTabProps) {
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

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{mockPrograms.map((program, index) => (
				<ProgramCard
					key={program.id}
					program={program}
					index={index}
					isWishlisted={wishlistItems.has(program.id)}
					onWishlistToggle={toggleWishlist}
				/>
			))}
		</div>
	)
}
