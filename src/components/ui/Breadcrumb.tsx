'use client'

import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface BreadcrumbItem {
	label: string
	href?: string
}

interface BreadcrumbProps {
	items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
	return (
		<motion.nav
			className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<motion.div
				whileHover={{ scale: 1.1 }}
				transition={{ type: 'spring', stiffness: 400, damping: 10 }}
			>
				<Link href="/" className="hover:text-[#116E63] transition-colors">
					<Home className="w-4 h-4" />
					<span className="sr-only">Home</span>
				</Link>
			</motion.div>

			{items.map((item, index) => (
				<motion.div
					key={index}
					className="flex items-center space-x-2"
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: index * 0.1 }}
				>
					<ChevronRight className="w-4 h-4 text-gray-400" />
					<Link
						href={item.href || '/'}
						className={
							item.href
								? 'hover:text-[#116E63] cursor-pointer transition-colors'
								: 'text-gray-900'
						}
					>
						{item.label}
					</Link>
				</motion.div>
			))}
		</motion.nav>
	)
}
