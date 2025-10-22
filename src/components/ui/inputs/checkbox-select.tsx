import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface CheckboxSelectProps {
	value?: any[]
	onChange?: (values: any[]) => void
	placeholder?: string
	options?: { value: string; label: string }[]
	isClearable?: boolean
	className?: string
	variant?: 'default' | 'green' | 'outline'
}

const getVariantStyles = (variant: 'default' | 'green' | 'outline') => {
	const baseButtonStyles = {
		default:
			'w-full h-10 px-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center justify-between',
		green:
			'w-full h-10 px-4 py-2 border border-teal-600 rounded-full bg-teal-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors flex items-center justify-between',
		outline:
			'w-full h-10 px-4 py-2 border border-gray-300 rounded-full bg-transparent text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center justify-between',
	}

	return baseButtonStyles[variant]
}

export function CheckboxSelect({
	value = [],
	onChange,
	placeholder = 'Select options',
	options = [],
	isClearable = true,
	className = '',
	variant = 'default',
}: CheckboxSelectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleOptionToggle = (option: { value: string; label: string }) => {
		const isSelected = value.some((v: any) => v.value === option.value)

		if (isSelected) {
			// Remove option
			onChange?.(value.filter((v: any) => v.value !== option.value))
		} else {
			// Add option
			onChange?.([...value, option])
		}
	}

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation()
		onChange?.([])
	}

	const getDisplayText = () => {
		if (value.length === 0) return placeholder
		if (value.length === 1) return value[0].label
		return `${value.length} selected`
	}

	const buttonStyles = getVariantStyles(variant)

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button onClick={() => setIsOpen(!isOpen)} className={buttonStyles}>
				<span className="text-sm truncate">{getDisplayText()}</span>
				<div className="flex items-center gap-2">
					{isClearable && value.length > 0 && (
						<button
							onClick={handleClear}
							className="p-1 hover:bg-gray-200 rounded-full transition-colors"
						>
							<svg
								className="w-3 h-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					)}
					<ChevronDown
						className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					/>
				</div>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
					<div className="py-2">
						{options.map((option) => {
							const isSelected = value.some(
								(v: any) => v.value === option.value
							)
							return (
								<label
									key={option.value}
									className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 px-4 py-2 transition-colors"
									onClick={() => handleOptionToggle(option)}
								>
									<div className="relative">
										<div
											className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
												isSelected
													? 'bg-teal-600 border-teal-600'
													: 'border-gray-300 hover:border-teal-400'
											}`}
										>
											{isSelected && <Check className="w-3 h-3 text-white" />}
										</div>
									</div>
									<span className="text-sm text-gray-700">{option.label}</span>
								</label>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}

export default CheckboxSelect
