'use client'

import { useState } from 'react'

interface TooltipProps {
	content: string
	children: React.ReactNode
	className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false)

	return (
		<div className="relative inline-block">
			<div
				onMouseEnter={() => setIsVisible(true)}
				onMouseLeave={() => setIsVisible(false)}
				className={`cursor-help ${className || ''}`}
			>
				{children}
			</div>
			{isVisible && (
				<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
					<div className="bg-gray-900 text-white text-xs rounded-md py-2 px-3 whitespace-nowrap shadow-lg">
						{content}
						{/* Tooltip arrow */}
						<div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
					</div>
				</div>
			)}
		</div>
	)
}
