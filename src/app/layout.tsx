import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { EduMatchHeader } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'EduMatch',
	description: 'Educational matching platform',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<EduMatchHeader />
				{children}
				<Footer />
			</body>
		</html>
	)
}
