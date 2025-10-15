'use client'

import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import { BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'

const disciplines = [
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
	'Biological Sciences',
]

export function DisciplinesSection() {
	const t = useTranslations()
	return (
		<section className="py-20 bg-muted/30">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold text-center mb-12 text-foreground">
					{t('homepage.disciplines_section.title')}
				</h2>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
					{disciplines.map((discipline, index) => (
						<Card
							key={index}
							className="hover:shadow-md transition-shadow cursor-pointer"
						>
							<CardContent className="p-6 text-center">
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
									<BookOpen className="w-6 h-6 text-primary" />
								</div>
								<h3 className="font-medium text-sm text-card-foreground">
									{discipline}
								</h3>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="text-center">
					<Button variant="primary" animate={true}>
						{t('buttons.show_more')}
					</Button>
				</div>
			</div>
		</section>
	)
}
