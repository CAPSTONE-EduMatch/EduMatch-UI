'use client'

import React from 'react'

interface InfoItem {
	label: string
	value: string | React.ReactNode
	className?: string
}

interface InfoSectionProps {
	title: string
	items: InfoItem[]
	className?: string
}

export const InfoSection: React.FC<InfoSectionProps> = ({
	title,
	items,
	className = '',
}) => {
	return (
		<div className={`border-t pt-4 ${className}`}>
			<h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
			<div className="space-y-3 mb-6">
				{items.map((item, index) => {
					const isReactNode = React.isValidElement(item.value)
					return (
						<div key={index} className="flex items-start gap-4">
							<span className="text-sm text-gray-600 w-32 flex-shrink-0">
								{item.label}:
							</span>
							<span
								className={`text-sm font-medium flex-1 ${
									isReactNode ? '' : 'whitespace-nowrap'
								} ${item.className || ''}`}
							>
								{item.value}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}
