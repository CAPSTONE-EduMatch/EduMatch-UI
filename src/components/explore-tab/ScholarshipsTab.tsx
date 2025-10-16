'use client'

import React from 'react'
import { ScholarshipCard } from '@/components/ui'
import { Scholarship } from '@/types/explore-api'
import { useRouter } from 'next/navigation'

interface ScholarshipsTabProps {
	scholarships?: Scholarship[]
	isInWishlist?: (id: string) => boolean
	onWishlistToggle?: (id: string) => void
}

export function ScholarshipsTab({
	scholarships = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
}: ScholarshipsTabProps) {
	const router = useRouter()

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
						isWishlisted={isInWishlist(scholarship.postId)}
						onWishlistToggle={(scholarshipId) =>
							onWishlistToggle(scholarship.postId)
						}
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
