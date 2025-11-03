'use client'

import React from 'react'

interface Tab {
	id: string
	label: string
	content: React.ReactNode
}

interface DocumentPanelProps {
	tabs: Tab[]
	activeTab: string
	onTabChange: (tabId: string) => void
	className?: string
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
	tabs,
	activeTab,
	onTabChange,
	className = '',
}) => {
	return (
		<div
			className={`bg-white shadow-sm border lg:col-span-1 min-h-[400px] max-h-[150vh] w-2/3 ${className}`}
		>
			<div className="p-6 flex flex-col">
				<div className="flex flex-col">
					{/* Navigation Tabs */}
					<div className="flex border-b flex-shrink-0">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
									activeTab === tab.id
										? 'border-primary text-primary'
										: 'border-transparent text-gray-500 hover:text-gray-700'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Tab Content - Auto height with max constraint */}
					<div className="overflow-y-auto max-h-[calc(90vh-120px)]">
						{tabs.map((tab) => (
							<div
								key={tab.id}
								className={activeTab === tab.id ? 'block' : 'hidden'}
							>
								{tab.content}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
