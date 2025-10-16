import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { Footer } from '@/components/layout/footer'

export default function InstitutionLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			{children}
			<Footer />
		</>
	)
}
