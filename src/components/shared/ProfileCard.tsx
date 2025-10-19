'use client'

import React from 'react'
import { Button } from '@/components/ui'

interface ProfileCardProps {
	header: {
		avatar?: React.ReactNode
		title: string
		subtitle?: string
	}
	sections: React.ReactNode[]
	actions?: React.ReactNode
	className?: string
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
	header,
	sections,
	actions,
	className = '',
}) => {
	return (
		<div
			className={`bg-white shadow-sm border lg:col-span-1 h-[750px] w-1/3 ${className}`}
		>
			<div className="p-6 h-full flex flex-col">
				<div className="space-y-6 flex-1">
					{/* Header Section */}
					<div className="flex items-center gap-4">
						{header.avatar && <div className="relative">{header.avatar}</div>}
						<div className="flex-1">
							<h2 className="text-lg font-bold text-gray-900">
								{header.title}
							</h2>
							{header.subtitle && (
								<p className="text-sm text-gray-600">{header.subtitle}</p>
							)}
						</div>
					</div>

					{/* Sections */}
					<div className="space-y-4">
						{sections.map((section, index) => (
							<div key={index}>{section}</div>
						))}
					</div>

					{/* Actions */}
					{actions && (
						<div className="flex justify-end pt-4 flex-shrink-0">{actions}</div>
					)}
				</div>
			</div>
		</div>
	)
}
