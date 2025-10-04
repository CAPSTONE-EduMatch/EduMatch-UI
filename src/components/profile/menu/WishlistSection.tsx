'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'

interface WishlistSectionProps {
	profile: any
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
	profile,
}) => {
	// Mock data for wishlist - replace with actual API calls
	const wishlistItems = [
		{
			id: 1,
			university: 'Harvard University',
			program: 'Computer Science',
			degree: 'Master of Science',
			country: 'United States',
			deadline: '2024-12-15',
			status: 'active',
		},
		{
			id: 2,
			university: 'Stanford University',
			program: 'Data Science',
			degree: 'Master of Science',
			country: 'United States',
			deadline: '2024-11-30',
			status: 'active',
		},
		{
			id: 3,
			university: 'University of Cambridge',
			program: 'Artificial Intelligence',
			degree: 'Master of Philosophy',
			country: 'United Kingdom',
			deadline: '2024-10-15',
			status: 'applied',
		},
	]

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">My Wishlist</h2>
				<p className="text-muted-foreground">
					Universities and programs you&apos;re interested in
				</p>
			</div>

			{/* Wishlist Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-primary">
							{wishlistItems.length}
						</div>
						<div className="text-sm text-muted-foreground">Total Programs</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-green-600">
							{wishlistItems.filter((item) => item.status === 'active').length}
						</div>
						<div className="text-sm text-muted-foreground">Active</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-blue-600">
							{wishlistItems.filter((item) => item.status === 'applied').length}
						</div>
						<div className="text-sm text-muted-foreground">Applied</div>
					</CardContent>
				</Card>
			</div>

			{/* Wishlist Items */}
			<div className="space-y-4">
				{wishlistItems.map((item) => (
					<Card key={item.id}>
						<CardContent className="p-6">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-lg font-semibold">{item.university}</h3>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												item.status === 'active'
													? 'bg-green-100 text-green-800'
													: 'bg-blue-100 text-blue-800'
											}`}
										>
											{item.status === 'active' ? 'Active' : 'Applied'}
										</span>
									</div>
									<p className="text-primary font-medium mb-1">
										{item.program}
									</p>
									<p className="text-sm text-muted-foreground mb-2">
										{item.degree}
									</p>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<span>📍 {item.country}</span>
										<span>
											📅 Deadline:{' '}
											{new Date(item.deadline).toLocaleDateString()}
										</span>
									</div>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" size="sm">
										View Details
									</Button>
									{item.status === 'active' && (
										<Button size="sm">Apply Now</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Add to Wishlist */}
			<Card>
				<CardContent className="p-6 text-center">
					<div className="text-4xl mb-4">➕</div>
					<h3 className="text-lg font-semibold mb-2">Add More Programs</h3>
					<p className="text-muted-foreground mb-4">
						Discover and add more universities and programs to your wishlist
					</p>
					<Button>Browse Programs</Button>
				</CardContent>
			</Card>
		</div>
	)
}
