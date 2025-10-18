import { QueryProvider } from '@/providers/query-provider'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Inter } from 'next/font/google'
import './globals.css'
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
				<QueryProvider>
					<NextIntlClientProvider>
						{/* <ConditionalLayout> */}
						{children}
						{/* </ConditionalLayout> */}
					</NextIntlClientProvider>
				</QueryProvider>
			</body>
		</html>
	)
}
