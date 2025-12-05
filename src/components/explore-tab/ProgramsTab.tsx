'use client'

import { useMemo } from 'react'
import { ProgramCard } from '@/components/ui'
import type { SortOption } from '@/components/ui'
import { Program } from '@/types/api/explore-api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

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
	onUpdateRequest?: (applicationId: string) => void
	fromApplicationSection?: boolean
}

export function ProgramsTab({
	programs = [],
	isInWishlist = () => false,
	onWishlistToggle = () => {},
	hasApplied = () => false,
	isApplying = () => false,
	onApply = () => {},
	onUpdateRequest,
	fromApplicationSection = false,
}: ProgramsTabProps) {
	const t = useTranslations('explore_page')
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleProgramClick = (programId: string, applicationId?: string) => {
		// Determine the 'from' parameter based on context
		const fromParam = fromApplicationSection ? 'application' : 'programmes'

		// If there's an applicationId, route to explore detail page with applicationId
		if (applicationId) {
			const currentParams = new URLSearchParams(searchParams?.toString())
			currentParams.set('applicationId', applicationId)
			router.push(
				`/explore/programmes/${programId}?from=${fromParam}&${currentParams.toString()}`
			)
			return
		}
		// Otherwise, route to explore detail page
		const currentParams = new URLSearchParams(searchParams?.toString())
		router.push(
			`/explore/programmes/${programId}?from=${fromParam}&${currentParams.toString()}`
		)
	}

	const paginatedPrograms = useMemo(() => {
		// Since pagination is handled by API, just return the programs
		return programs
	}, [programs])

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{paginatedPrograms.length > 0 ? (
				paginatedPrograms.map((program: Program, index: number) => {
					// Use applicationId if available to ensure unique keys, otherwise use program.id + index
					const uniqueKey = (program as any).applicationId
						? `${program.id}-${(program as any).applicationId}`
						: `${program.id}-${index}`
					return (
						<ProgramCard
							key={uniqueKey}
							program={program}
							index={index}
							isWishlisted={isInWishlist(program.id)}
							onWishlistToggle={() => onWishlistToggle(program.id)}
							onClick={(id) =>
								handleProgramClick(id, (program as any).applicationId)
							}
							hasApplied={hasApplied(program.id)}
							isApplying={isApplying(program.id)}
							onApply={() => onApply(program.id)}
							applicationId={(program as any).applicationId}
							onUpdateRequest={onUpdateRequest}
							institutionStatus={(program as any).institutionStatus}
						/>
					)
				})
			) : (
				<div className="col-span-full text-center py-12">
					<div className="text-gray-500 text-lg mb-2">
						{t('empty.programmes.title')}
					</div>
					<div className="text-gray-400 text-sm">
						{t('empty.programmes.hint')}
					</div>
				</div>
			)}
		</div>
	)
}
