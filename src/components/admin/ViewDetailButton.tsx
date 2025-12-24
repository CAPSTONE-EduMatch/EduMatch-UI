'use client'

import { ChevronRight } from 'lucide-react'
import React from 'react'

interface ViewDetailButtonProps {
	onClick: () => void
	type?: 'page' | 'modal' | 'external'
	href?: string
	disabled?: boolean
	className?: string
}

export const ViewDetailButton: React.FC<ViewDetailButtonProps> = ({
	onClick,
	type = 'page',
	href,
	disabled = false,
	className = '',
}) => {
	const baseClasses =
		'flex items-center justify-center gap-1 text-[#126E64] hover:underline text-sm mx-auto transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

	const handleClick = (e: React.MouseEvent) => {
		if (disabled) {
			e.preventDefault()
			return
		}

		if (type === 'external' && href) {
			e.preventDefault()
			window.open(href, '_blank', 'noopener,noreferrer')
		} else {
			onClick()
		}
	}

	return (
		<button
			onClick={handleClick}
			disabled={disabled}
			className={`${baseClasses} ${className}`}
			type="button"
		>
			<span>View Details</span>
			<ChevronRight className="w-4 h-4" />
		</button>
	)
}
