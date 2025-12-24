'use client'

import { motion } from 'framer-motion'
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

interface OTPInputProps {
	length?: number
	onComplete: (otp: string) => void
	onOTPChange?: (otp: string) => void
	disabled?: boolean
	error?: string
	className?: string
}

const OTPInput = ({
	length = 6,
	onComplete,
	onOTPChange,
	disabled = false,
	error = '',
	className = '',
}: OTPInputProps) => {
	const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
	const [focusedIndex, setFocusedIndex] = useState<number>(0)
	const inputRefs = useRef<(HTMLInputElement | null)[]>(
		Array(length).fill(null)
	)

	// Focus the first input on mount
	useEffect(() => {
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus()
		}
	}, [])

	// Call onOTPChange whenever OTP changes
	useEffect(() => {
		const otpString = otp.join('')
		if (onOTPChange) {
			onOTPChange(otpString)
		}

		// Check if OTP is complete
		if (otpString.length === length && !otpString.includes('')) {
			onComplete(otpString)
		}
	}, [otp, onComplete, onOTPChange, length])

	const handleInputChange = (
		e: ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const value = e.target.value

		// Only allow numbers
		if (!/^\d*$/.test(value)) {
			return
		}

		const newOtp = [...otp]

		if (value.length <= 1) {
			newOtp[index] = value
			setOtp(newOtp)

			// Auto-focus next input if value is entered
			if (value && index < length - 1) {
				const nextInput = inputRefs.current[index + 1]
				if (nextInput) {
					nextInput.focus()
					setFocusedIndex(index + 1)
				}
			}
		}
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
		// Handle backspace
		if (e.key === 'Backspace') {
			const newOtp = [...otp]

			if (otp[index]) {
				// Clear current input
				newOtp[index] = ''
				setOtp(newOtp)
			} else if (index > 0) {
				// Move to previous input and clear it
				const prevInput = inputRefs.current[index - 1]
				if (prevInput) {
					newOtp[index - 1] = ''
					setOtp(newOtp)
					prevInput.focus()
					setFocusedIndex(index - 1)
				}
			}
		}

		// Handle arrow keys
		else if (e.key === 'ArrowLeft' && index > 0) {
			const prevInput = inputRefs.current[index - 1]
			if (prevInput) {
				prevInput.focus()
				setFocusedIndex(index - 1)
			}
		} else if (e.key === 'ArrowRight' && index < length - 1) {
			const nextInput = inputRefs.current[index + 1]
			if (nextInput) {
				nextInput.focus()
				setFocusedIndex(index + 1)
			}
		}

		// Handle paste
		else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault()
			// Let the browser handle paste normally, then process it
			setTimeout(() => {
				handlePaste(index)
			}, 10)
		}
	}

	const handlePaste = (startIndex: number) => {
		navigator.clipboard
			.readText()
			.then((clipText) => {
				const pasteData = clipText.replace(/\D/g, '') // Remove non-digits

				if (pasteData) {
					const newOtp = [...otp]
					let currentIndex = startIndex

					for (let i = 0; i < pasteData.length && currentIndex < length; i++) {
						newOtp[currentIndex] = pasteData[i]
						currentIndex++
					}

					setOtp(newOtp)

					// Focus the next empty input or the last input
					const nextEmptyIndex = newOtp.findIndex(
						(digit, idx) => idx >= startIndex && !digit
					)
					const focusIndex =
						nextEmptyIndex !== -1
							? nextEmptyIndex
							: Math.min(currentIndex, length - 1)

					if (inputRefs.current[focusIndex]) {
						inputRefs.current[focusIndex]?.focus()
						setFocusedIndex(focusIndex)
					}
				}
			})
			.catch(() => {
				// Paste failed, ignore silently
			})
	}

	const handleFocus = (index: number) => {
		setFocusedIndex(index)
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	}

	const inputVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	}

	return (
		<div className={`space-y-4 ${className}`}>
			<motion.div
				className="flex gap-3 justify-center"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{Array.from({ length }, (_, index) => (
					<motion.input
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el
						}}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={otp[index]}
						onChange={(e) => handleInputChange(e, index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						onFocus={() => handleFocus(index)}
						disabled={disabled}
						className={`
							w-12 h-12 md:w-14 md:h-14 
							text-center text-xl font-semibold
							border-2 rounded-xl
							transition-all duration-200
							${
								error
									? 'border-red-500 bg-red-50'
									: focusedIndex === index
										? 'border-[#126E64] bg-[#126E64]/5 shadow-md'
										: otp[index]
											? 'border-[#126E64]/60 bg-[#126E64]/5'
											: 'border-gray-300 bg-white hover:border-gray-400'
							}
							${
								disabled
									? 'opacity-50 cursor-not-allowed'
									: 'focus:outline-none focus:ring-2 focus:ring-[#126E64]/20'
							}
						`}
						variants={inputVariants}
					/>
				))}
			</motion.div>

			{error && (
				<motion.p
					className="text-red-500 text-sm text-center"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					{error}
				</motion.p>
			)}
		</div>
	)
}

export default OTPInput
