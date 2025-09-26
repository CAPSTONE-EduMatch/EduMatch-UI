'use client'

import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useState } from 'react'

const blogPosts = [
	{
		title: 'HARVARD',
		subtitle: 'UNIVERSITY',
		excerpt:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum has",
		date: 'Added 20 mins ago',
		category: 'programmes',
	},
	{
		title: 'HARVARD',
		subtitle: 'UNIVERSITY',
		excerpt:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum has",
		date: 'Added 20 mins ago',
		category: 'scholarships',
	},
	{
		title: 'HARVARD',
		subtitle: 'UNIVERSITY',
		excerpt:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum has",
		date: 'Added 20 mins ago',
		category: 'research',
	},
]

const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research', label: 'Research Labs' },
]

export function BlogSection() {
	const [activeCategory, setActiveCategory] = useState('programmes')

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-bold text-center mb-12 text-foreground">
					Latest Posts
				</h2>

				<div className="flex justify-between mb-12">
					<div className="flex flex-wrap gap-2 justify-center max-w-full">
						{categories.map((category) => (
							<Button
								key={category.id}
								variant={activeCategory === category.id ? 'primary' : 'outline'}
								onClick={() => setActiveCategory(category.id)}
								animate={true}
								className={`rounded-full px-3 sm:px-4 md:px-6 py-2 text-xs sm:text-sm whitespace-nowrap ${
									activeCategory === category.id
										? 'bg-orange-400 hover:bg-orange-500 text-white shadow-md'
										: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
								}`}
							>
								{category.label}
							</Button>
						))}
					</div>
				</div>

				<div className="space-y-6 mb-12">
					{blogPosts.map((post, index) => (
						<Card key={index} className="p-6 bg-white shadow-sm">
							<CardContent className="p-0">
								<div className="flex items-start gap-4">
									<div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
										<Image
											src="/havard_logo.png"
											alt="Harvard University"
											width={144}
											height={144}
											className="w-full h-full object-contain rounded"
										/>
									</div>
									<div className="flex-1">
										<div className="mb-2">
											<h3 className="font-bold text-xl text-card-foreground">
												{post.title}
											</h3>
											<p className="text-sm text-muted-foreground">
												{post.subtitle}
											</p>
										</div>
										<p className="text-muted-foreground text-sm leading-relaxed mb-3">
											{post.excerpt}
										</p>
										<p className="text-sm text-primary font-medium">
											{post.date}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="text-center">
					<Button
						variant="primary"
						animate={true}
						className="rounded-full px-8 py-3"
					>
						Show more
					</Button>
				</div>
			</div>
		</section>
	)
}
