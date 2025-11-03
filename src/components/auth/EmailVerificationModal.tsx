'use client'

import { authClient } from '@/config/auth-client'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui'
import React, { useEffect, useRef, useState } from 'react'

interface EmailVerificationModalProps {
	isOpen: boolean
	onClose: () => void
	email: string
	onVerificationSuccess: () => void
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
	isOpen,
	onClose,
	email,
	onVerificationSuccess,
}) => {
	const [otp, setOtp] = useState(['', '', '', '', '', ''])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [isResending, setIsResending] = useState(false)
	const [resendCooldown, setResendCooldown] = useState(0)
	const inputRefs = useRef<(HTMLInputElement | null)[]>([])

	// Start cooldown timer
	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => {
				setResendCooldown(resendCooldown - 1)
			}, 1000)
			return () => clearTimeout(timer)
		}
	}, [resendCooldown])

	const handleOtpChange = (index: number, value: string) => {
		// Only allow numbers
		if (value && !/^\d$/.test(value)) return

		const newOtp = [...otp]
		newOtp[index] = value
		setOtp(newOtp)

		// Auto-move to next input
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus()
		}

		// Clear error when user starts typing
		if (error) setError('')
	}

	const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus()
		}
	}

	const handleVerifyOtp = async () => {
		const otpCode = otp.join('')
		if (otpCode.length !== 6) {
			setError('Please enter the complete 6-digit code')
			return
		}

		setIsLoading(true)
		setError('')

		try {
			const result = await authClient.emailOtp.verifyEmail({
				email,
				otp: otpCode,
			})

			if (result.error) {
				setError(result.error.message || 'Invalid verification code')
			} else {
				onVerificationSuccess()
				onClose()
			}
		} catch (err) {
			setError('Verification failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleResendOtp = async () => {
		if (resendCooldown > 0) return

		setIsResending(true)
		setError('')

		try {
			const result = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'email-verification',
			})

			if (result.error) {
				setError(result.error.message || 'Failed to send verification code')
			} else {
				setResendCooldown(30) // 30-second cooldown
				setOtp(['', '', '', '', '', '']) // Clear current OTP
			}
		} catch (err) {
			setError('Failed to resend verification code')
		} finally {
			setIsResending(false)
		}
	}

	const handleModalClose = () => {
		setOtp(['', '', '', '', '', ''])
		setError('')
		setResendCooldown(0)
		onClose()
	}

	return (
		<Modal isOpen={isOpen} onClose={handleModalClose}>
			<div className="p-6 max-w-md mx-auto">
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Verify Your Email
					</h2>
					<p className="text-gray-600 text-sm">
						We&apos;ve sent a 6-digit verification code to
					</p>
					<p className="text-gray-900 font-semibold">{email}</p>
				</div>

				<div className="mb-6">
					<div className="flex justify-center space-x-3 mb-4">
						{otp.map((digit, index) => (
							<input
								key={index}
								ref={(el) => {
									inputRefs.current[index] = el
								}}
								type="text"
								inputMode="numeric"
								maxLength={1}
								value={digit}
								onChange={(e) => handleOtpChange(index, e.target.value)}
								onKeyDown={(e) => handleKeyDown(index, e)}
								className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent"
								disabled={isLoading}
							/>
						))}
					</div>

					{error && (
						<p className="text-red-500 text-sm text-center mb-4">{error}</p>
					)}

					<Button
						onClick={handleVerifyOtp}
						disabled={isLoading || otp.join('').length !== 6}
						className="w-full bg-[#126E64] hover:bg-[#0f5a52] text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Verifying...' : 'Verify Email'}
					</Button>
				</div>

				<div className="text-center">
					<p className="text-gray-600 text-sm mb-2">
						Didn&apos;t receive the code?
					</p>
					<button
						onClick={handleResendOtp}
						disabled={isResending || resendCooldown > 0}
						className="text-[#126E64] hover:text-[#0f5a52] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isResending
							? 'Sending...'
							: resendCooldown > 0
								? `Resend in ${resendCooldown}s`
								: 'Resend Code'}
					</button>
				</div>
			</div>
		</Modal>
	)
}
