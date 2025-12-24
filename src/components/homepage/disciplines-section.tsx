'use client'

import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import { BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface Discipline {
	id: string
	name: string
}

export function DisciplinesSection() {
	const t = useTranslations()
	const [disciplines, setDisciplines] = useState<Discipline[]>([])
	const [displayedDisciplines, setDisplayedDisciplines] = useState<
		Discipline[]
	>([])
	const [showAll, setShowAll] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchDisciplines = async () => {
			try {
				const response = await fetch('/api/disciplines')
				const data = await response.json()
				if (data.success && data.disciplines) {
					setDisciplines(data.disciplines)
					setDisplayedDisciplines(data.disciplines.slice(0, 12))
				}
			} catch (error) {
				console.error('Error fetching disciplines:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchDisciplines()
	}, [])

	const handleShowMore = () => {
		if (showAll) {
			setDisplayedDisciplines(disciplines.slice(0, 12))
		} else {
			setDisplayedDisciplines(disciplines)
		}
		setShowAll(!showAll)
	}

	if (loading) {
		return (
			<section className="py-20 bg-muted/30">
				<div className="container mx-auto px-4">
					<h2 className="text-3xl font-bold text-center mb-12 text-foreground">
						{t('homepage.disciplines_section.title')}
					</h2>
					<div className="text-center text-muted-foreground">Loading...</div>
				</div>
			</section>
		)
	}

	return (
		<section className="py-20 bg-muted/30">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold text-center mb-12 text-foreground">
					{t('homepage.disciplines_section.title')}
				</h2>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
					{displayedDisciplines.map((discipline) => (
						<Card
							key={discipline.id}
							className="hover:shadow-md transition-shadow cursor-pointer"
						>
							<CardContent className="p-6 text-center">
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
									<BookOpen className="w-6 h-6 text-primary" />
								</div>
								<h3 className="font-medium text-sm text-card-foreground">
									{discipline.name}
								</h3>
							</CardContent>
						</Card>
					))}
				</div>

				{disciplines.length > 12 && (
					<div className="text-center">
						<Button variant="primary" animate={true} onClick={handleShowMore}>
							{showAll ? t('buttons.show_less') : t('buttons.show_more')}
						</Button>
					</div>
				)}
			</div>
		</section>
	)
}
