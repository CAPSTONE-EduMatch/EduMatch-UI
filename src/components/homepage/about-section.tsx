'use client'

import { Button } from '@/components/ui'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function AboutSection() {
	const t = useTranslations()
	const router = useRouter()

	return (
		<section className="py-20 bg-background">
			<div className="container mx-auto px-4">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<div>
						<h2 className="text-3xl font-bold mb-6 text-foreground">
							{t('homepage.about_section.title')}
						</h2>
						<p className="text-muted-foreground mb-6 leading-relaxed">
							{t('homepage.about_section.description')}
						</p>
						<Button
							className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md py-3 px-8 rounded-full font-medium"
							animate={true}
							onClick={() => router.push('/explore')}
						>
							{t('buttons.learn_more')}
						</Button>
					</div>

					<div className="relative">
						<Image
							src="/about.png"
							alt="Students studying together"
							width={600}
							height={400}
							className="rounded-lg shadow-lg w-full h-auto"
						/>
					</div>
				</div>
			</div>
		</section>
	)
}
