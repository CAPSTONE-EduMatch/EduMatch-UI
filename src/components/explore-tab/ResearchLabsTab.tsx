'use client'

import { useState } from 'react'
import { SortOption } from '../ui/Sort'
import { ResearchLabCard } from '../ui/ResearchLabCard'
interface ResearchLabsTabProps {
	sortBy: SortOption
}

// eslint-disable-next-line no-unused-vars
export function ResearchLabsTab({ sortBy }: ResearchLabsTabProps) {
	// TODO: Implement sorting functionality
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

	const labs = Array.from({ length: 6 }, (_, i) => ({
		id: i + 1,
		title:
			'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing and typesetting...",
		professor: 'Prof. John Smith',
		field: 'Information System',
		country: 'Korea',
		position: 'PhD Position',
		date: '25 July 2025',
		daysLeft: Math.floor(Math.random() * 30) + 1,
		match: `${Math.floor(Math.random() * 30) + 70}%`,
	}))

	return (
		<div className="space-y-4">
			{labs.map((lab, index) => (
				<ResearchLabCard
					key={lab.id}
					lab={lab}
					index={index}
					isWishlisted={wishlistItems.has(lab.id)}
					onWishlistToggle={toggleWishlist}
				/>
			))}
		</div>
	)
}
