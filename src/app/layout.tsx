import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
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
				<NextIntlClientProvider>
					{/* <ConditionalLayout> */}
					{children}
					{/* </ConditionalLayout> */}
				</NextIntlClientProvider>
			</body>
		</html>
	)
}
