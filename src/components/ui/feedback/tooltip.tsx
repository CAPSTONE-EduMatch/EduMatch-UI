'use client'

import { useState } from 'react'

interface TooltipProps {
	content: string
	children: React.ReactNode
	className?: string
	/** Additional className to apply to the tooltip content box */
	contentClassName?: string
	/** Inline style overrides applied to the tooltip content box */
	style?: React.CSSProperties
	/** width or maxWidth can be a string (e.g. '200px' or '12rem') or number (interpreted as px by React) */
	width?: string | number
	maxWidth?: string | number
	height?: string | number
	maxHeight?: string | number
	/** alignment of the tooltip relative to the trigger */
	align?: 'center' | 'left' | 'right'
	/** horizontal offset (px) applied after alignment. Positive moves tooltip right. */
	offsetX?: number
}

export function Tooltip({
	content,
	children,
	className,
	contentClassName,
	style,
	width = 200,
	maxWidth,
	height,
	maxHeight,
	align = 'center',
	offsetX = 0,
}: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false)

	const contentStyle: React.CSSProperties = {
		...(width !== undefined ? { width } : {}),
		...(maxWidth !== undefined ? { maxWidth } : {}),
		...(height !== undefined ? { height } : {}),
		...(maxHeight !== undefined ? { maxHeight } : {}),
		...style,
	}

	// compute container position/transform based on alignment and offset
	const containerStyle: React.CSSProperties = {}
	if (align === 'left') {
		// tooltip's left edge aligns with trigger's left edge
		containerStyle.left = '0%'
		containerStyle.transform = `translateX(${offsetX}px)`
	} else if (align === 'right') {
		// tooltip's left edge aligns with trigger's right edge
		containerStyle.left = '100%'
		containerStyle.transform = `translateX(${offsetX}px)`
	} else {
		// center (default): center above trigger; offsetX nudges it to the right if positive
		containerStyle.left = '50%'
		containerStyle.transform = `translateX(calc(-50% + ${offsetX}px))`
	}

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
				<div className="absolute bottom-full mb-2 z-50" style={containerStyle}>
					<div
						style={contentStyle}
						className={`bg-gray-900 text-white text-xs rounded-lg py-2.5 px-3.5 shadow-lg leading-relaxed ${
							contentClassName || ''
						}`}
					>
						{content}
						{/* Tooltip arrow (positioned to point at the trigger). */}
						<div
							className="absolute top-full border-4 border-transparent border-t-gray-900"
							style={{
								left: (() => {
									if (align === 'center') return `calc(50% - ${offsetX}px)`
									if (align === 'left') return '12px'
									return 'calc(100% - 12px)'
								})(),
								transform: 'translateX(-50%)',
							}}
						></div>
					</div>
				</div>
			)}
		</div>
	)
}
