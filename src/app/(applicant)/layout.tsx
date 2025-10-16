import { EduMatchHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ConditionalLayout } from '@/components/layout/conditional-layout'

export default function ApplicantLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<ConditionalLayout>
				<EduMatchHeader />
				{children}
			</ConditionalLayout>
		</>
	)
}
