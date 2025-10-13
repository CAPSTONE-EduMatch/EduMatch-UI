'use client'

import { useState } from 'react'
import { ScholarshipCard } from '../ui/ScholarshipCard'
import { Scholarship } from '@/types/explore-api'
import { useRouter } from 'next/navigation'

interface ScholarshipsTabProps {
	scholarships?: Scholarship[]
}

export function ScholarshipsTab({ scholarships = [] }: ScholarshipsTabProps) {
	const router = useRouter()
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

	const handleScholarshipClick = (scholarshipId: number) => {
		router.push(`/explore/scholarships/${scholarshipId}?from=scholarships`)
	}

	return (
		<div className="space-y-4">
			{scholarships.length > 0 ? (
				scholarships.map((scholarship, index) => (
					<ScholarshipCard
						key={scholarship.id}
						scholarship={scholarship}
						index={index}
						isWishlisted={wishlistItems.has(scholarship.id)}
						onWishlistToggle={toggleWishlist}
						onClick={handleScholarshipClick}
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
