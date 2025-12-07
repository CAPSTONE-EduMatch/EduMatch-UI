'use client'

import { Button } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Post {
	id: string
	title: string
	institution: string
	description: string
	createdAt: string
	logo?: string
}

const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research_labs', label: 'Research Labs' },
]

export function BlogSection() {
	const [activeCategory, setActiveCategory] = useState('programmes')
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const t = useTranslations()
	const router = useRouter()

	useEffect(() => {
		const fetchPosts = async () => {
			setLoading(true)
			try {
				const endpoint =
					activeCategory === 'programmes'
						? '/api/explore/programs'
						: activeCategory === 'scholarships'
							? '/api/explore/scholarships'
							: '/api/explore/research'

				const response = await fetch(`${endpoint}?page=1&limit=3&sort=newest`)
				const data = await response.json()

				if (data.success && data.data) {
					const formattedPosts = data.data.map((item: any) => ({
						id: item.id,
						title: item.institution || item.institutionName || 'Institution',
						institution: item.institutionName || item.institution || '',
						description: item.description || item.details || '',
						createdAt:
							item.createdAt || item.created_at || new Date().toISOString(),
						logo: item.logo || item.institutionLogo,
					}))
					setPosts(formattedPosts)
				}
			} catch (error) {
				console.error('Error fetching posts:', error)
				setPosts([])
			} finally {
				setLoading(false)
			}
		}

		fetchPosts()
	}, [activeCategory])

	const handleShowMore = () => {
		router.push(`/explore?tab=${activeCategory}`)
	}

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

				{loading ? (
					<div className="text-center py-12 text-muted-foreground">
						Loading...
					</div>
				) : posts.length === 0 ? (
					<div className="text-center py-12">
						<div className="max-w-md mx-auto">
							<div className="text-6xl mb-4">📭</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{t('homepage.blog_section.empty.title')}
							</h3>
							<p className="text-muted-foreground mb-6">
								{activeCategory === 'programmes'
									? t('homepage.blog_section.empty.description_programmes')
									: activeCategory === 'scholarships'
										? t('homepage.blog_section.empty.description_scholarships')
										: t(
												'homepage.blog_section.empty.description_research_labs'
											)}
							</p>
							<Button
								variant="outline"
								onClick={() =>
									setActiveCategory(
										activeCategory === 'programmes'
											? 'scholarships'
											: activeCategory === 'scholarships'
												? 'research_labs'
												: 'programmes'
									)
								}
							>
								{t('homepage.blog_section.empty.try_other_button')}
							</Button>
						</div>
					</div>
				) : (
					<>
						<div className="space-y-6 mb-12">
							{posts.map((post, index) => (
								<motion.div
									key={post.id}
									initial={{ opacity: 0, y: 50 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.8,
										ease: 'easeOut',
										delay: index * 0.1,
									}}
								>
									<Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
										<CardContent className="p-0">
											<div className="flex items-start gap-4">
												<div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden bg-gray-100">
													{post.logo ? (
														<Image
															src={post.logo}
															alt={post.institution}
															width={144}
															height={144}
															className="w-full h-full object-contain rounded"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
															{post.institution.charAt(0)}
														</div>
													)}
												</div>
												<div className="flex-1">
													<div className="mb-2">
														<h3 className="font-bold text-xl text-card-foreground">
															{post.title}
														</h3>
														<p className="text-sm text-muted-foreground">
															{post.institution}
														</p>
													</div>
													<p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">
														{post.description}
													</p>
													<p className="text-sm text-primary font-medium">
														Added{' '}
														{formatDistanceToNow(new Date(post.createdAt), {
															addSuffix: true,
														})}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>

						<div className="text-center">
							<Button
								variant="primary"
								animate={true}
								className="rounded-full px-8 py-3"
								onClick={handleShowMore}
							>
								{t('buttons.show_more')}
							</Button>
						</div>
					</>
				)}
			</div>
		</section>
	)
}
