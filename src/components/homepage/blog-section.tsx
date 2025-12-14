'use client'

import { Button } from '@/components/ui'
import { TabSelector } from '@/components/ui'
import { ProgramCard } from '@/components/ui/cards/ProgramCard'
import { ScholarshipCard } from '@/components/ui/cards/ScholarshipCard'
import { ResearchLabCard } from '@/components/ui/cards/ResearchLabCard'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Program {
	id: string
	title: string
	description: string
	university: string
	logo: string
	field: string
	country: string
	date: string
	daysLeft: number
	price: string
	match: string
	attendance: string
}

interface Scholarship {
	id: string
	title: string
	description: string
	provider: string
	university: string
	logo?: string
	essayRequired: string
	country: string
	date: string
	daysLeft: number
	amount: string
	match: string
}

interface ResearchLab {
	id: string
	title: string
	description: string
	professor: string
	institution: string
	logo?: string
	field: string
	country: string
	position: string
	date: string
	daysLeft: number
	match: string
}

const categories = [
	{ id: 'programmes', label: 'Programmes' },
	{ id: 'scholarships', label: 'Scholarships' },
	{ id: 'research_labs', label: 'Research Labs' },
]

export function BlogSection() {
	const [activeCategory, setActiveCategory] = useState('programmes')
	const [programs, setPrograms] = useState<Program[]>([])
	const [scholarships, setScholarships] = useState<Scholarship[]>([])
	const [researchLabs, setResearchLabs] = useState<ResearchLab[]>([])
	const [loading, setLoading] = useState(true)
	const t = useTranslations()
	const router = useRouter()

	useEffect(() => {
		const fetchPosts = async () => {
			setLoading(true)
			try {
				if (activeCategory === 'programmes') {
					const response = await fetch(
						'/api/explore/programs?page=1&limit=3&sortBy=newest'
					)
					const data = await response.json()
					if (data.data && Array.isArray(data.data)) {
						setPrograms(data.data)
					} else {
						setPrograms([])
					}
				} else if (activeCategory === 'scholarships') {
					const response = await fetch(
						'/api/explore/scholarships?page=1&limit=3&sortBy=newest'
					)
					const data = await response.json()
					if (data.data && Array.isArray(data.data)) {
						setScholarships(data.data)
					} else {
						setScholarships([])
					}
				} else if (activeCategory === 'research_labs') {
					const response = await fetch(
						'/api/explore/research?page=1&limit=3&sortBy=newest'
					)
					const data = await response.json()
					if (data.data && Array.isArray(data.data)) {
						setResearchLabs(data.data)
					} else {
						setResearchLabs([])
					}
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error fetching posts:', error)
				if (activeCategory === 'programmes') {
					setPrograms([])
				} else if (activeCategory === 'scholarships') {
					setScholarships([])
				} else {
					setResearchLabs([])
				}
			} finally {
				setLoading(false)
			}
		}

		fetchPosts()
	}, [activeCategory])

	const handleShowMore = () => {
		router.push(`/explore?tab=${activeCategory}`)
	}

	const handleCardClick = (id: string) => {
		if (activeCategory === 'programmes') {
			router.push(`/explore/programmes/${id}`)
		} else if (activeCategory === 'scholarships') {
			router.push(`/explore/scholarships/${id}`)
		} else if (activeCategory === 'research_labs') {
			router.push(`/explore/research-labs/${id}`)
		}
	}

	const getCurrentData = () => {
		if (activeCategory === 'programmes') return programs
		if (activeCategory === 'scholarships') return scholarships
		return researchLabs
	}

	const currentData = getCurrentData()

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
						<div className="flex items-center justify-center gap-3">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#116E63]"></div>
							<p>Loading...</p>
						</div>
					</div>
				) : currentData.length === 0 ? (
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
						<div className="mb-12">
							{activeCategory === 'programmes' && (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{programs.map((program, index) => (
										<ProgramCard
											key={program.id}
											program={program}
											index={index}
											isWishlisted={false}
											onWishlistToggle={() => {}}
											onClick={handleCardClick}
										/>
									))}
								</div>
							)}

							{activeCategory === 'scholarships' && (
								<div className="space-y-6">
									{scholarships.map((scholarship, index) => (
										<ScholarshipCard
											key={scholarship.id}
											scholarship={scholarship}
											index={index}
											isWishlisted={false}
											onWishlistToggle={() => {}}
											onClick={handleCardClick}
										/>
									))}
								</div>
							)}

							{activeCategory === 'research_labs' && (
								<div className="space-y-6">
									{researchLabs.map((lab, index) => (
										<ResearchLabCard
											key={lab.id}
											lab={lab}
											index={index}
											isWishlisted={false}
											onWishlistToggle={() => {}}
											onClick={handleCardClick}
										/>
									))}
								</div>
							)}
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
