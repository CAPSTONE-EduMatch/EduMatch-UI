'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface ShortIdWithCopyProps {
	id: string
	shortLength?: number
	className?: string
	onIdClick?: (id: string) => void
	clickable?: boolean
}

export const ShortIdWithCopy: React.FC<ShortIdWithCopyProps> = ({
	id,
	shortLength = 8,
	className = '',
	onIdClick,
	clickable = false,
}) => {
	const [copied, setCopied] = useState(false)

	const shortId =
		id.length > shortLength ? `${id.substring(0, shortLength)}...` : id

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation() // Prevent any parent click handlers
		try {
			await navigator.clipboard.writeText(id)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	const handleIdClick = (e: React.MouseEvent) => {
		if (onIdClick && clickable) {
			e.stopPropagation()
			onIdClick(id)
		}
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{clickable && onIdClick ? (
				<button
					onClick={handleIdClick}
					className="font-mono text-sm text-[#126E64] hover:text-[#126E64] hover:underline transition-all duration-200"
					title={id}
				>
					{shortId}
				</button>
			) : (
				<span className="font-mono text-sm text-gray-700">{shortId}</span>
			)}
			<button
				onClick={handleCopy}
				className="p-1 hover:bg-gray-100 rounded transition-colors"
				title={`Copy full ID: ${id}`}
			>
				{copied ? (
					<Check className="w-4 h-4 text-green-600" />
				) : (
					<Copy className="w-4 h-4 text-gray-500 hover:text-[#126E64]" />
				)}
			</button>
		</div>
	)
}
