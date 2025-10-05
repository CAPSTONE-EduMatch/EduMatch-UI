'use client'

import { useState, useMemo } from 'react'
import { SortOption } from '../ui/Sort'
import { ScholarshipCard } from '../ui/ScholarshipCard'
import { mockScholarships } from '@/data/utils'

interface ScholarshipsTabProps {
	sortBy?: SortOption
	currentPage?: number
	itemsPerPage?: number
}

// eslint-disable-next-line no-unused-vars
export function ScholarshipsTab({
	currentPage = 1,
	itemsPerPage = 15,
}: ScholarshipsTabProps) {
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

	const paginatedScholarships = useMemo(() => {
		// Apply pagination without sorting
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		return mockScholarships.slice(startIndex, endIndex)
	}, [currentPage, itemsPerPage])

	return (
		<div className="space-y-4">
			{paginatedScholarships.length > 0 ? (
				paginatedScholarships.map((scholarship, index) => (
					<ScholarshipCard
						key={scholarship.id}
						scholarship={scholarship}
						index={index}
						isWishlisted={wishlistItems.has(scholarship.id)}
						onWishlistToggle={toggleWishlist}
					/>
				))
			) : (
				<div className="text-center py-12">
					<div className="text-gray-500 text-lg mb-2">
						No scholarships found
					</div>
					<div className="text-gray-400 text-sm">
						Try adjusting your filters or search criteria
					</div>
				</div>
			)}
		</div>
	)
}
