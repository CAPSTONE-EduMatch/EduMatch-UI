'use client'

import React from 'react'
import { ScholarshipCard } from '@/components/ui'
import { Scholarship } from '@/types/api/explore-api'
import { useRouter, useSearchParams } from 'next/navigation'

interface ScholarshipsTabProps {
	scholarships?: Scholarship[]
	// eslint-disable-next-line no-unused-vars
	isInWishlist?: (id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onWishlistToggle?: (id: string) => void
	// eslint-disable-next-line no-unused-vars
	hasApplied?: (id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	isApplying?: (id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onApply?: (id: string) => void
	// eslint-disable-next-line no-unused-vars
	onUpdateRequest?: (applicationId: string) => void
	fromApplicationSection?: boolean
}

export function ScholarshipsTab({
	scholarships = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
	onUpdateRequest,
	fromApplicationSection = false,
}: ScholarshipsTabProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleScholarshipClick = (
		scholarshipId: string,
		applicationId?: string
	) => {
		// Determine the 'from' parameter based on context
		const fromParam = fromApplicationSection ? 'application' : 'scholarships'

		// If there's an applicationId, route to explore detail page with applicationId
		if (applicationId) {
			const currentParams = new URLSearchParams(searchParams.toString())
			currentParams.set('applicationId', applicationId)
			router.push(
				`/explore/scholarships/${scholarshipId}?from=${fromParam}&${currentParams.toString()}`
			)
			return
		}
		// Otherwise, route to explore detail page
		const currentParams = new URLSearchParams(searchParams.toString())
		router.push(
			`/explore/scholarships/${scholarshipId}?from=${fromParam}&${currentParams.toString()}`
		)
	}

	return (
		<div className="space-y-4">
			{scholarships.length > 0 ? (
				scholarships.map((scholarship, index) => {
					// Use applicationId if available to ensure unique keys, otherwise use scholarship.id + index
					const uniqueKey = (scholarship as any).applicationId
						? `${scholarship.id}-${(scholarship as any).applicationId}`
						: `${scholarship.id}-${index}`
					return (
						<ScholarshipCard
							key={uniqueKey}
							scholarship={scholarship}
							index={index}
							isWishlisted={isInWishlist(scholarship.id)}
							onWishlistToggle={() => onWishlistToggle(scholarship.id)}
							hasApplied={hasApplied(scholarship.id)}
							isApplying={isApplying(scholarship.id)}
							onApply={() => onApply(scholarship.id)}
							onClick={(id) =>
								handleScholarshipClick(id, (scholarship as any).applicationId)
							}
							applicationId={(scholarship as any).applicationId}
							onUpdateRequest={onUpdateRequest}
							institutionStatus={(scholarship as any).institutionStatus}
						/>
					)
				})
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
