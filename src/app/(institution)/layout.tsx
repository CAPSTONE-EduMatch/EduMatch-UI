import { ConditionalLayout } from '@/components/layout/conditional-layout'

export default function InstitutionLayout({
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
