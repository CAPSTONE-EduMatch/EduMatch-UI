'use client'

import { motion } from 'framer-motion'
import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	isLoading?: boolean
	loadingText?: string
	variant?: 'primary' | 'secondary' | 'outline'
	fullWidth?: boolean
	animate?: boolean
}

const Button: React.FC<ButtonProps> = ({
	children,
	isLoading = false,
	loadingText,
	variant = 'primary',
	fullWidth = false,
	className = '',
	animate = true,
	onClick,
	disabled,
	type = 'button',
	...restProps
}) => {
	const baseClasses =
		'py-3 rounded-full shadow-md transition-all duration-100 font-medium transform hover:-translate-y-1'

	const variantClasses = {
		primary: 'bg-[#126E64] text-white hover:opacity-90',
		secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
		outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
	}

	const widthClass = fullWidth ? 'w-full' : 'px-8'

	const defaultHoverAnimation = {
		scale: 1.02,
		boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
	}

	const defaultTapAnimation = {
		scale: 0.98,
	}

	const buttonContent = isLoading ? loadingText || 'Loading...' : children
	const isDisabled = isLoading || disabled

	if (animate) {
		return (
			<motion.button
				className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
				disabled={isDisabled}
				onClick={onClick}
				type={type}
				whileHover={defaultHoverAnimation}
				whileTap={defaultTapAnimation}
				style={{ transformOrigin: 'center' }}
			>
				{buttonContent}
			</motion.button>
		)
	}

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
			disabled={isDisabled}
			onClick={onClick}
			type={type}
			{...restProps}
		>
			{buttonContent}
		</button>
	)
}

export default Button
