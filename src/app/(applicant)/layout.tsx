import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { SubscriptionProgressProvider } from '@/contexts/SubscriptionProgressContext'
import { ApplicantProfileProvider } from '@/contexts/ApplicantProfileContext'

export default function ApplicantLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<ConditionalLayout>
				<SubscriptionProgressProvider>
					<ApplicantProfileProvider>{children}</ApplicantProfileProvider>
				</SubscriptionProgressProvider>
			</ConditionalLayout>
		</>
	)
}
