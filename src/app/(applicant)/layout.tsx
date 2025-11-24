import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { SubscriptionProgressProvider } from '@/contexts/SubscriptionProgressContext'

export default function ApplicantLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<ConditionalLayout>
				<SubscriptionProgressProvider>{children}</SubscriptionProgressProvider>
			</ConditionalLayout>
		</>
	)
}
