'use client'

import Button from './Button'

interface Tab {
	id: string
	label: string
}

interface TabSelectorProps {
	tabs: Tab[]
	activeTab: string
	onTabChange: (tabId: string) => void
	className?: string
}

export function TabSelector({
	tabs,
	activeTab,
	onTabChange,
	className = '',
}: TabSelectorProps) {
	return (
		<div className={`flex justify-between mb-12 ${className}`}>
			<div className="flex flex-wrap gap-2 justify-center max-w-full">
				{tabs.map((tab) => (
					<Button
						key={tab.id}
						variant={activeTab === tab.id ? 'primary' : 'outline'}
						onClick={() => onTabChange(tab.id)}
						animate={true}
						className={`rounded-full px-3 sm:px-4 md:px-6 py-2 text-xs sm:text-sm whitespace-nowrap ${
							activeTab === tab.id
								? 'bg-orange-400 hover:bg-orange-500 text-white shadow-md'
								: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
						}`}
					>
						{tab.label}
					</Button>
				))}
			</div>
		</div>
	)
}
