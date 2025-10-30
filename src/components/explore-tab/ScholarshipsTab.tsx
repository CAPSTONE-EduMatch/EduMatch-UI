'use client'

import React from 'react'
import { ScholarshipCard } from '@/components/ui'
import { Scholarship } from '@/types/explore-api'
import { useRouter, useSearchParams } from 'next/navigation'

interface ScholarshipsTabProps {
	scholarships?: Scholarship[]
	isInWishlist?: (id: string) => boolean
	onWishlistToggle?: (id: string) => void
	hasApplied?: (id: string) => boolean
	isApplying?: (id: string) => boolean
	onApply?: (id: string) => void
}

export function ScholarshipsTab({
	scholarships = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
}: ScholarshipsTabProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		router.push(
			`/explore/scholarships/${scholarshipId}?from=scholarships&${currentParams.toString()}`
		)
	}

	return (
		<div className="space-y-4">
			{scholarships.length > 0 ? (
				scholarships.map((scholarship, index) => (
					<ScholarshipCard
						key={scholarship.id}
						scholarship={scholarship}
						index={index}
						isWishlisted={isInWishlist(scholarship.id)}
						onWishlistToggle={() => onWishlistToggle(scholarship.id)}
						hasApplied={hasApplied(scholarship.id)}
						isApplying={isApplying(scholarship.id)}
						onApply={() => onApply(scholarship.id)}
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
