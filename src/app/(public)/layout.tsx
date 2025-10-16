import { EduMatchHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			{/* <EduMatchHeader /> */}
			{children}
			<Footer />
		</>
	)
}
