import { motion } from 'framer-motion'
import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
	helpText?: string
	required?: boolean
	variant?: 'default' | 'signin'
	inputSize?: 'sm' | 'md' | 'lg' | 'select'
	fullWidth?: boolean
	width?: string
}

const Input: React.FC<InputProps> = ({
	label,
	error,
	helpText,
	required = false,
	variant = 'default',
	inputSize = 'md',
	fullWidth = true,
	width,
	className = '',
	...props
}) => {
	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-2.5 text-base',
		lg: 'px-6 py-3 text-lg',
		select: 'px-4 py-2.5 text-sm h-10',
	}

	const getWidthClass = () => {
		if (width) return width
		return fullWidth ? 'w-full' : 'w-auto'
	}

	const baseInputClasses = `
    ${getWidthClass()} bg-[#F5F7FB] border focus:outline-none transition-all duration-300
    ${error ? 'border-red-500 border-2' : 'border-gray-200'}
    ${error ? 'focus:ring-2 focus:ring-red-200 focus:border-red-500' : 'focus:ring-2 focus:ring-[#126E64] focus:border-transparent'}
    ${sizeClasses[inputSize]}
  `

	const variantClasses = {
		default: 'rounded-full',
		signin: `rounded-full ${variant === 'signin' ? 'transform -skew-x-1 focus:shadow-md' : ''}`,
	}

	const inputClasses = `${baseInputClasses} ${variantClasses[variant]} ${className}`

	if (variant === 'signin') {
		return (
			<>
				<input className={inputClasses} {...props} />
				{error && (
					<motion.p
						className="text-sm text-red-500 mt-3"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{error}
					</motion.p>
				)}
			</>
		)
	}

	return (
		<div className="grid grid-cols-12 gap-2 md:gap-4">
			{label && (
				<label className="col-span-4 md:col-span-3 text-sm font-medium text-gray-800 self-start mt-3">
					{label} {required && <span className="text-red-500">*</span>}
				</label>
			)}
			<div className={label ? 'col-span-8 md:col-span-9' : 'col-span-12'}>
				<input className={inputClasses} {...props} />

				{error && (
					<p className="text-sm text-red-500 mt-1 flex items-center">{error}</p>
				)}

				{helpText && !error && (
					<p className="text-xs text-gray-500 mt-1 ml-2">{helpText}</p>
				)}
			</div>
		</div>
	)
}

export default Input
