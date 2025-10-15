'use client'

import { Button } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

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
	{ id: 'research_labs', label: 'Research Labs' },
]

export function BlogSection() {
	const [activeCategory, setActiveCategory] = useState('programmes')
	const t = useTranslations()

	// Create refs for each blog post at the top level
	const blogPost0Ref = useRef(null)
	const blogPost1Ref = useRef(null)
	const blogPost2Ref = useRef(null)

	// Create useInView hooks for each blog post with framer-motion
	const blogPost0InView = useInView(blogPost0Ref, { once: true, amount: 0.2 })
	const blogPost1InView = useInView(blogPost1Ref, { once: true, amount: 0.2 })
	const blogPost2InView = useInView(blogPost2Ref, { once: true, amount: 0.2 })

	const refs = [blogPost0Ref, blogPost1Ref, blogPost2Ref]
	const inViewStates = [blogPost0InView, blogPost1InView, blogPost2InView]

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-bold text-center mb-12 text-foreground">
					{t('homepage.blog_section.title')}
				</h2>

				<TabSelector
					tabs={categories.map((category) => ({
						...category,
						label: t(`tabs.${category.id}`),
					}))}
					activeTab={activeCategory}
					onTabChange={setActiveCategory}
				/>

				<div className="space-y-6 mb-12">
					{blogPosts.map((post, index) => {
						// Use the pre-created ref and inView state for this index
						const ref = refs[index]
						const inView = inViewStates[index]

						return (
							<motion.div
								key={index}
								ref={ref} // Attach the ref here
								initial={{ opacity: 0, y: 50 }}
								animate={{
									opacity: inView ? 1 : 0,
									y: inView ? 0 : 50,
								}}
								transition={{
									duration: 0.8,
									ease: 'easeOut',
									delay: index * 0.1, // Delay for staggered animation
								}}
							>
								<Card className="p-6 bg-white shadow-sm">
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
							</motion.div>
						)
					})}
				</div>

				<div className="text-center">
					<Button
						variant="primary"
						animate={true}
						className="rounded-full px-8 py-3"
					>
						{t('buttons.show_more')}
					</Button>
				</div>
			</div>
		</section>
	)
}
