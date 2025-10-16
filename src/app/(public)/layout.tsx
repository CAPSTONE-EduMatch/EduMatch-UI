import { ConditionalLayout } from '@/components/layout/conditional-layout'

export default function PublicLayout({
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
