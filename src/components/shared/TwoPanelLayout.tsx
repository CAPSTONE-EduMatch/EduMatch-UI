'use client'

import React from 'react'

interface TwoPanelLayoutProps {
	leftPanel: React.ReactNode
	rightPanel: React.ReactNode
	className?: string
}

export const TwoPanelLayout: React.FC<TwoPanelLayoutProps> = ({
	leftPanel,
	rightPanel,
	className = '',
}) => {
	return (
		<div className={`flex gap-6 ${className}`}>
			{leftPanel}
			{rightPanel}
		</div>
	)
}
