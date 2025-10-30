'use client'

import { useMemo } from 'react'
import { ProgramCard } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { Program } from '@/types/explore-api'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProgramsTabProps {
	sortBy?: SortOption
	programs?: Program[]
	// eslint-disable-next-line no-unused-vars
	isInWishlist?: (id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onWishlistToggle?: (id: string) => void
	hasApplied?: (id: string) => boolean
	isApplying?: (id: string) => boolean
	onApply?: (id: string) => void
}

export function ProgramsTab({
	programs = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
}: ProgramsTabProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleProgramClick = (programId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		router.push(
			`/explore/programmes/${programId}?from=programmes&${currentParams.toString()}`
		)
	}

	const paginatedPrograms = useMemo(() => {
		// Since pagination is handled by API, just return the programs
		return programs
	}, [programs])

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{paginatedPrograms.length > 0 ? (
				paginatedPrograms.map((program: Program, index: number) => (
					<ProgramCard
						key={program.id}
						program={program}
						index={index}
						isWishlisted={isInWishlist(program.id)}
						onWishlistToggle={() => onWishlistToggle(program.id)}
						onClick={handleProgramClick}
						hasApplied={hasApplied(program.id)}
						isApplying={isApplying(program.id)}
						onApply={() => onApply(program.id)}
					/>
				))
			) : (
				<div className="col-span-full text-center py-12">
					<div className="text-gray-500 text-lg mb-2">No programs found</div>
					<div className="text-gray-400 text-sm">
						Try adjusting your filters or search criteria
					</div>
				</div>
			)}
		</div>
	)
}
