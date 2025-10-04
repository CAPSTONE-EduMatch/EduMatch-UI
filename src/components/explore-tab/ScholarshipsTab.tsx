'use client'

import { useState } from 'react'
import { SortOption } from '../ui/Sort'
import { ScholarshipCard } from '../ui/ScholarshipCard'

interface ScholarshipsTabProps {
	sortBy: SortOption
}

// eslint-disable-next-line no-unused-vars
export function ScholarshipsTab({ sortBy }: ScholarshipsTabProps) {
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

	const scholarships = Array.from({ length: 6 }, (_, i) => ({
		id: i + 1,
		title:
			'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing and typesetting...",
		provider: 'Provided by university',
		university: 'Hankok University',
		essayRequired: 'No',
		country: 'Korea',
		date: '25 July 2025',
		daysLeft: Math.floor(Math.random() * 30) + 1,
		amount: '234,567 USD',
		match: `${Math.floor(Math.random() * 30) + 70}%`,
	}))

	return (
		<div className="space-y-4">
			{scholarships.map((scholarship, index) => (
				<ScholarshipCard
					key={scholarship.id}
					scholarship={scholarship}
					index={index}
					isWishlisted={wishlistItems.has(scholarship.id)}
					onWishlistToggle={toggleWishlist}
				/>
			))}
		</div>
	)
}
