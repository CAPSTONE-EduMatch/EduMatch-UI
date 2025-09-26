import { HeroSection } from '@/components/homepage/hero-section'
import { AboutSection } from '@/components/homepage/about-section'
import { DisciplinesSection } from '@/components/homepage/disciplines-section'
import { FeaturesSection } from '@/components/homepage/features-section'
import { BlogSection } from '@/components/homepage/blog-section'
import { CTASection } from '@/components/homepage/cta-section'

export default function HomePage() {
	return (
		<main className="min-h-screen">
			<HeroSection />
			<AboutSection />
			<DisciplinesSection />
			<FeaturesSection />
			<BlogSection />
			<CTASection />
		</main>
	)
}
