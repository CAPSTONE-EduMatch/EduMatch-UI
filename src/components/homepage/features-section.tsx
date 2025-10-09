import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTranslations } from 'next-intl'

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

	// Create useInView hooks for each feature at the top level
	const feature0 = useInView({ triggerOnce: true, threshold: 0.2 })
	const feature1 = useInView({ triggerOnce: true, threshold: 0.2 })
	const feature2 = useInView({ triggerOnce: true, threshold: 0.2 })
	const feature3 = useInView({ triggerOnce: true, threshold: 0.2 })

	const inViewHooks = [feature0, feature1, feature2, feature3]

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4">
				<h2 className="text-4xl font-semibold text-center mb-12 text-foreground">
					{t('homepage.features_section.title')}
				</h2>

				<div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((feature, index) => {
						// Use the pre-created hook for this index
						const { ref, inView } = inViewHooks[index]

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
									delay: index * 0.1, // Delay for staggered animation
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
