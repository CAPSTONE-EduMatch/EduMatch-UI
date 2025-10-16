import { ConditionalLayout } from '@/components/layout/conditional-layout'

export default function ApplicantLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<ConditionalLayout>{children}</ConditionalLayout>
		</>
	)
}
