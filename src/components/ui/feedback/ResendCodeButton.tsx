'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ResendCodeButtonProps {
	onResend: () => void | Promise<void>
	disabled?: boolean
	isLoading?: boolean
	cooldownSeconds?: number
	className?: string
}

const ResendCodeButton = ({
	onResend,
	disabled = false,
	isLoading = false,
	cooldownSeconds = 60,
	className = '',
}: ResendCodeButtonProps) => {
	const [countdown, setCountdown] = useState(0)
	const [isResending, setIsResending] = useState(false)

	useEffect(() => {
		let timer: NodeJS.Timeout
		if (countdown > 0) {
			timer = setTimeout(() => {
				setCountdown(countdown - 1)
			}, 1000)
		}
		return () => {
			if (timer) clearTimeout(timer)
		}
	}, [countdown])

	const handleResend = async () => {
		if (countdown > 0 || disabled || isLoading || isResending) return

		setIsResending(true)
		try {
			await onResend()
			setCountdown(cooldownSeconds)
		} catch (error) {
			// Error handling is done in the parent component
			console.error('Resend failed:', error)
		} finally {
			setIsResending(false)
		}
	}

	const isButtonDisabled = countdown > 0 || disabled || isLoading || isResending

	const getButtonText = () => {
		if (isResending) return 'Sending...'
		if (countdown > 0) return `Resend in ${countdown}s`
		if (disabled) return 'Code Sending Limited'
		return 'Resend Code'
	}

	const getButtonClass = () => {
		const baseClass = `transition-all duration-200 ${className}`

		if (isButtonDisabled) {
			return `${baseClass} text-gray-400 cursor-not-allowed`
		}

		return `${baseClass} text-[#126E64] hover:text-[#0D504A] hover:underline cursor-pointer`
	}

	return (
		<motion.button
			type="button"
			onClick={handleResend}
			disabled={isButtonDisabled}
			className={getButtonClass()}
			whileHover={isButtonDisabled ? {} : { scale: 1.05 }}
			whileTap={isButtonDisabled ? {} : { scale: 0.98 }}
		>
			{getButtonText()}
		</motion.button>
	)
}

export default ResendCodeButton
