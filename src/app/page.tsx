'use client'

import { HeroSection } from '@/components/homepage/hero-section'
import { AboutSection } from '@/components/homepage/about-section'
import { DisciplinesSection } from '@/components/homepage/disciplines-section'
import { FeaturesSection } from '@/components/homepage/features-section'
import { BlogSection } from '@/components/homepage/blog-section'
import { CTASection } from '@/components/homepage/cta-section'
import { motion } from 'framer-motion'

export default function HomePage() {
	return (
		<main className="min-h-screen">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<HeroSection />
				<AboutSection />
				<DisciplinesSection />
				<FeaturesSection />
				<BlogSection />
				<CTASection />
			</motion.div>
		</main>
	)
}
