import { FAQ } from '@/components/pricing/FAQ'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
import { PricingCards } from '@/components/pricing/PricingCards'
import { PricingHero } from '@/components/pricing/PricingHero'

// Force dynamic rendering to always fetch fresh pricing data
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
