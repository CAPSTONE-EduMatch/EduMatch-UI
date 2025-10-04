'use client'

import { useState, useMemo } from 'react'
import { SortOption } from '../ui/Sort'
import { ResearchLabCard } from '../ui/ResearchLabCard'
import { mockResearchLabs } from '@/data/utils'

interface ResearchLabsTabProps {
	sortBy?: SortOption
	currentPage?: number
	itemsPerPage?: number
}

// eslint-disable-next-line no-unused-vars
export function ResearchLabsTab({
	currentPage = 1,
	itemsPerPage = 15,
}: ResearchLabsTabProps) {
	// TODO: Implement sorting functionality
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

	const paginatedLabs = useMemo(() => {
		// Apply pagination without sorting
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return mockResearchLabs.slice(startIndex, endIndex)
	}, [currentPage, itemsPerPage])

	return (
		<div className="space-y-4">
			{paginatedLabs.length > 0 ? (
				paginatedLabs.map((lab, index) => (
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
