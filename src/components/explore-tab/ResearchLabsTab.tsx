'use client'

import { useState } from 'react'
import { ResearchLabCard } from '../ui/ResearchLabCard'
import { ResearchLab } from '@/types/explore-api'

interface ResearchLabsTabProps {
	researchLabs?: ResearchLab[]
}

export function ResearchLabsTab({ researchLabs = [] }: ResearchLabsTabProps) {
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
		<div className="space-y-4">
			{researchLabs.length > 0 ? (
				researchLabs.map((lab, index) => (
					<ResearchLabCard
						key={lab.id}
						lab={lab}
						index={index}
						isWishlisted={wishlistItems.has(lab.id)}
						onWishlistToggle={toggleWishlist}
					/>
				))
			) : (
				<div className="text-center py-12">
					<div className="text-gray-500 text-lg mb-2">
						No research labs found
					</div>
					<div className="text-gray-400 text-sm">
						Try adjusting your filters or search criteria
					</div>
				</div>
			)}
		</div>
	)
}
