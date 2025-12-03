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
	// eslint-disable-next-line no-unused-vars
	onUpdateRequest?: (applicationId: string) => void
	fromApplicationSection?: boolean
}

export function ResearchLabsTab({
	researchLabs = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
	onUpdateRequest,
	fromApplicationSection = false,
}: ResearchLabsTabProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleLabClick = (labId: string, applicationId?: string) => {
		// Determine the 'from' parameter based on context
		const fromParam = fromApplicationSection ? 'application' : 'research'

		// If there's an applicationId, route to explore detail page with applicationId
		if (applicationId) {
			const currentParams = new URLSearchParams(searchParams?.toString())
			currentParams.set('applicationId', applicationId)
			router.push(
				`/explore/research-labs/${labId}?from=${fromParam}&${currentParams.toString()}`
			)
			return
		}
		// Otherwise, route to explore detail page
		const currentParams = new URLSearchParams(searchParams?.toString())
		router.push(
			`/explore/research-labs/${labId}?from=${fromParam}&${currentParams.toString()}`
		)
	}

	return (
		<div className="space-y-4">
			{researchLabs.length > 0 ? (
				researchLabs.map((lab, index) => {
					// Use applicationId if available to ensure unique keys, otherwise use lab.id + index
					const uniqueKey = (lab as any).applicationId
						? `${lab.id}-${(lab as any).applicationId}`
						: `${lab.id}-${index}`
					return (
						<ResearchLabCard
							key={uniqueKey}
							lab={lab}
							index={index}
							isWishlisted={isInWishlist(lab.id)}
							onWishlistToggle={() => onWishlistToggle(lab.id)}
							hasApplied={hasApplied(lab.id)}
							isApplying={isApplying(lab.id)}
							onApply={() => onApply(lab.id)}
							onClick={(id) => handleLabClick(id, (lab as any).applicationId)}
							applicationId={(lab as any).applicationId}
							onUpdateRequest={onUpdateRequest}
							institutionStatus={(lab as any).institutionStatus}
						/>
					)
				})
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
