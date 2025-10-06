import { FAQ } from '@/components/pricing/FAQ'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
import { PricingCards } from '@/components/pricing/PricingCards'
import { PricingHero } from '@/components/pricing/PricingHero'

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-white">
			<PricingHero />
			<PricingCards />
			<FeatureComparison />
			<FAQ />
		</div>
	)
}
