import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'

const features = [
	{
		title: 'Smart Matching',
		description:
			'Match students with the right programs based on qualifications.',
		icon: '🔍',
	},
	{
		title: 'Global Opportunities',
		description: 'Access scholarships and research programs globally.',
		icon: '🌍',
	},
	{
		title: 'Personalized Recommendations',
		description:
			'Find opportunities tailored to your specific academic background.',
		icon: '🎯',
	},
	{
		title: 'Seamless Application Process',
		description: "Apply with ease through our platform's intuitive interface.",
		icon: '🚀',
	},
]

export function FeaturesSection() {
	const t = useTranslations()

	// Create refs for each feature at the top level
	const feature0Ref = useRef(null)
	const feature1Ref = useRef(null)
	const feature2Ref = useRef(null)
	const feature3Ref = useRef(null)

	// Create useInView hooks for each feature with framer-motion
	const feature0InView = useInView(feature0Ref, { once: true, amount: 0.2 })
	const feature1InView = useInView(feature1Ref, { once: true, amount: 0.2 })
	const feature2InView = useInView(feature2Ref, { once: true, amount: 0.2 })
	const feature3InView = useInView(feature3Ref, { once: true, amount: 0.2 })

	const refs = [feature0Ref, feature1Ref, feature2Ref, feature3Ref]
	const inViewStates = [
		feature0InView,
		feature1InView,
		feature2InView,
		feature3InView,
	]

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-semibold text-center mb-12 text-foreground">
					{t('homepage.features_section.title')}
				</h2>

				<div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((feature, index) => {
						const ref = refs[index]
						const inView = inViewStates[index]

						return (
							<motion.div
								key={index}
								ref={ref}
								initial={{ opacity: 0, y: 50 }}
								animate={{
									opacity: inView ? 1 : 0,
									y: inView ? 0 : 50,
								}}
								transition={{
									duration: 0.8,
									ease: 'easeOut',
									delay: index * 0.1,
								}}
							>
								<Card className="h-full bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
									<CardHeader className="text-center p-4">
										<div className="text-4xl mb-4">{feature.icon}</div>
										<CardTitle className="text-primary text-xl font-semibold">
											{t(
												`homepage.features_section.features_${index + 1}.title`
											)}
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4">
										<p className="text-muted-foreground text-l leading-relaxed text-center">
											{t(
												`homepage.features_section.features_${index + 1}.description`
											)}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
