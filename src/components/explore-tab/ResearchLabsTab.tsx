'use client'

import React from 'react'
import { ResearchLabCard } from '@/components/ui'
import { ResearchLab } from '@/types/api/explore-api'
import { useRouter, useSearchParams } from 'next/navigation'

interface ResearchLabsTabProps {
	researchLabs?: ResearchLab[]
	// eslint-disable-next-line no-unused-vars
	isInWishlist?: (_id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onWishlistToggle?: (_id: string) => void
	// eslint-disable-next-line no-unused-vars
	hasApplied?: (_id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	isApplying?: (_id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onApply?: (_id: string) => void
	onUpdateRequest?: (applicationId: string) => void
}

export function ResearchLabsTab({
	researchLabs = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
	onUpdateRequest,
}: ResearchLabsTabProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleLabClick = (labId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		router.push(
			`/explore/research-labs/${labId}?from=research&${currentParams.toString()}`
		)
	}

	return (
		<div className="space-y-4">
			{researchLabs.length > 0 ? (
				researchLabs.map((lab, index) => (
					<ResearchLabCard
						key={lab.id}
						lab={lab}
						index={index}
						isWishlisted={isInWishlist(lab.id)}
						onWishlistToggle={() => onWishlistToggle(lab.id)}
						hasApplied={hasApplied(lab.id)}
						isApplying={isApplying(lab.id)}
						onApply={() => onApply(lab.id)}
						onClick={handleLabClick}
						applicationId={(lab as any).applicationId}
						onUpdateRequest={onUpdateRequest}
						institutionStatus={(lab as any).institutionStatus}
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
