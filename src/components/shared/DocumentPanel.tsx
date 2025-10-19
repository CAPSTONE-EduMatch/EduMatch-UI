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
			className={`bg-white shadow-sm border lg:col-span-1 h-[750px] w-2/3 ${className}`}
		>
			<div className="p-6 h-full flex flex-col">
				<div className="flex flex-col flex-1">
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

					{/* Tab Content - Scrollable */}
					<div className="flex-1 overflow-hidden max-h-[650px]">
						{tabs.map((tab) => (
							<div
								key={tab.id}
								className={`h-full ${activeTab === tab.id ? 'block' : 'hidden'}`}
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
