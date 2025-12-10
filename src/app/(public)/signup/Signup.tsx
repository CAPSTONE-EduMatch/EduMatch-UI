'use client'

import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import {
	AuthLayout,
	FormField,
	GoogleButton,
	PasswordField,
} from '@/components/auth'
import { authClient } from '@/config/auth-client'

const LEFT_IMAGE = '/hero1.png'

// Animation variants for staggered animations
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.3,
		},
	},
}

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			type: 'spring' as const,
			stiffness: 100,
			damping: 10,
		},
	},
}

const fadeIn = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: 0.5 },
	},
}

const Signup = () => {
	const t = useTranslations('auth.signup')
	const tCommon = useTranslations('auth.common')

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const successState = useState('')
	const successMessage = successState[0]
	const [errors, setErrors] = useState<{
		name?: string
		email?: string
		password?: string
		confirmPassword?: string
	}>({})
	const [isLoading, setIsLoading] = useState(false)
	const [passwordIsValid, setPasswordIsValid] = useState(false)
	const [showOTPPopup, setShowOTPPopup] = useState(false)
	const [OTPError, setOTPError] = useState('')
	const [isOTPLoading, setIsOTPLoading] = useState(false)
	const [animateForm, setAnimateForm] = useState(false)
	const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
	const [resendCountdown, setResendCountdown] = useState(0)
	const [canResend, setCanResend] = useState(true)
	const [globalOtpCooldown, setGlobalOtpCooldown] = useState(0)
	const [lastOtpRequestEmail, setLastOtpRequestEmail] = useState('')

	// Load cooldown from localStorage on mount
	useEffect(() => {
		const savedCooldown = localStorage.getItem('otpCooldownEnd')
		const savedEmail = localStorage.getItem('otpCooldownEmail')

		if (savedCooldown && savedEmail) {
			const cooldownEnd = parseInt(savedCooldown)
			const now = Date.now()
			const remainingTime = Math.max(0, Math.floor((cooldownEnd - now) / 1000))

			if (remainingTime > 0) {
				setGlobalOtpCooldown(remainingTime)
				setLastOtpRequestEmail(savedEmail)
			} else {
				// Cleanup expired cooldown
				localStorage.removeItem('otpCooldownEnd')
				localStorage.removeItem('otpCooldownEmail')
			}
		}
	}, [])

	// Trigger animation after component mounts
	useEffect(() => {
		setAnimateForm(true)
	}, [])

	// Countdown effect for resend button
	useEffect(() => {
		let intervalId: NodeJS.Timeout
		if (resendCountdown > 0) {
			intervalId = setInterval(() => {
				setResendCountdown((prev) => {
					if (prev <= 1) {
						setCanResend(true)
						return 0
					}
					return prev - 1
				})
			}, 1000)
		}
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [resendCountdown])

	// Global OTP cooldown effect (prevents bypassing by closing modal)
	useEffect(() => {
		let intervalId: NodeJS.Timeout
		if (globalOtpCooldown > 0) {
			intervalId = setInterval(() => {
				setGlobalOtpCooldown((prev) => {
					if (prev <= 1) {
						// Clear localStorage when cooldown expires
						localStorage.removeItem('otpCooldownEnd')
						localStorage.removeItem('otpCooldownEmail')
						// Also reset resend button if modal is open
						setCanResend(true)
						setResendCountdown(0)
						return 0
					}
					// Sync resend countdown if modal is open and not already in sync
					if (
						showOTPPopup &&
						!canResend &&
						Math.abs(resendCountdown - (prev - 1)) > 1
					) {
						setResendCountdown(prev - 1)
					}
					return prev - 1
				})
			}, 1000)
		}
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [globalOtpCooldown, showOTPPopup, canResend, resendCountdown])

	// Helper function to handle OTP digit changes
	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return // Only allow digits

		const newDigits = [...otpDigits]
		newDigits[index] = value.slice(-1) // Only take the last digit
		setOtpDigits(newDigits)

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`)
			nextInput?.focus()
		}
	}

	// Helper function to handle backspace
	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`)
			prevInput?.focus()
		}
	}

	// Helper function to handle paste
	const handleOtpPaste = (e: React.ClipboardEvent) => {
		e.preventDefault()
		const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
		const newDigits = [...otpDigits]

		for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
			newDigits[i] = pastedData[i]
		}

		setOtpDigits(newDigits)

		// Focus the next empty field or the last field
		const nextEmptyIndex = newDigits.findIndex(
			(digit, idx) => !digit && idx < 6
		)
		const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5
		const targetInput = document.getElementById(`otp-${focusIndex}`)
		targetInput?.focus()
	}

	// Reset OTP digits
	const resetOtpDigits = () => {
		setOtpDigits(['', '', '', '', '', ''])
	}

	// Handle OTP modal close
	const handleCloseOTPModal = () => {
		setShowOTPPopup(false)
		setCanResend(true)
		setResendCountdown(0)
		setOTPError('')
	}

	// Resend OTP function for the popup
	const handleResendOTP = async () => {
		if (!canResend) return

		setOTPError('')

		try {
			setIsOTPLoading(true)

			// Send OTP for email verification
			// Normalize email to lowercase to ensure consistent comparison
			const normalizedEmail = email.toLowerCase().trim()
			const { error: otpError } = await authClient.emailOtp.sendVerificationOtp(
				{
					email: normalizedEmail,
					type: 'email-verification',
				}
			)

			if (otpError) {
				setOTPError(
					`Failed to send verification code: ${
						otpError.message || 'Unknown error'
					}`
				)
			} else {
				// Don't reset digits - let user keep their current input
				// Start countdown and disable resend button
				setCanResend(false)
				setResendCountdown(60)
				// Update global cooldown
				setGlobalOtpCooldown(60)
				setLastOtpRequestEmail(normalizedEmail)
				// Store in localStorage for persistence
				localStorage.setItem('otpCooldownEnd', (Date.now() + 60000).toString())
				localStorage.setItem('otpCooldownEmail', normalizedEmail)
			}
		} catch (err) {
			setOTPError('An unexpected error occurred. Please try again.')
		} finally {
			setIsOTPLoading(false)
		}
	}

	function validate() {
		const next: {
			name?: string
			email?: string
			password?: string
			confirmPassword?: string
		} = {}

		// Remove name validation since we don't collect it during signup

		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			next.email = t('errors.email_required')
		}

		if (!password || !passwordIsValid) {
			next.password = t('errors.password_invalid')
		}

		if (password !== confirmPassword) {
			next.confirmPassword = t('errors.passwords_no_match')
		}

		setErrors(next)
		return Object.keys(next).length === 0
	}

	// Google signup is handled inside the GoogleButton component via the auth client

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		setOTPError('')

		// If there's an active cooldown for this email, just reopen the OTP modal
		if (globalOtpCooldown > 0 && lastOtpRequestEmail === email) {
			setShowOTPPopup(true)
			// Sync the resend countdown with global cooldown
			setResendCountdown(globalOtpCooldown)
			setCanResend(false)
			return
		}

		try {
			setIsLoading(true)

			// First, check if user already exists using our API
			const response = await axios.get(
				`/api/user?email=${encodeURIComponent(email)}`
			)

			// Check if account is deleted (status = false)
			if (response.data.exists && response.data.status === false) {
				setErrors({
					email: t('errors.account_deleted'),
				})
				return
			}

			if (response.data.exists && response.data.isEmailVerified) {
				setErrors({
					email: t('errors.account_exists'),
				})
				return
			}

			// If user doesn't exist, send OTP for email verification during signup
			// Use 'sign-in' type for new users - Better Auth requires this to call sendVerificationOTP
			// Normalize email to lowercase to ensure consistent comparison
			const normalizedEmail = email.toLowerCase().trim()
			const { error: otpError } = await authClient.emailOtp.sendVerificationOtp(
				{
					email: normalizedEmail,
					type: 'sign-in', // Must use 'sign-in' for new users, otherwise Better Auth returns early
				}
			)

			if (otpError) {
				setOTPError(
					t('errors.otp_send_failed', {
						error: otpError.message || 'Please try again 1 hour later.',
					})
				)
			} else {
				resetOtpDigits()
				setShowOTPPopup(true)
				// Start countdown for resend button
				setCanResend(false)
				setResendCountdown(60)
				// Start global cooldown to prevent bypassing
				setGlobalOtpCooldown(60)
				setLastOtpRequestEmail(normalizedEmail)
				// Store in localStorage for persistence
				localStorage.setItem('otpCooldownEnd', (Date.now() + 60000).toString())
				localStorage.setItem('otpCooldownEmail', normalizedEmail)
			}
		} catch (err) {
			// Handle both API errors and OTP errors
			if (axios.isAxiosError(err) && err.response?.status === 400) {
				setErrors({
					email: t('errors.invalid_email_format'),
				})
			} else {
				setOTPError(t('errors.unexpected_error'))
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleVerifyOTPAndAccountCreation = async (otp: string) => {
		setOTPError('')
		if (!otp.trim() || otp.length !== 6) {
			setOTPError(t('errors.otp_incomplete'))
			return
		}
		setIsOTPLoading(true)
		try {
			// Normalize email to lowercase and trim OTP to ensure consistent comparison
			const normalizedEmail = email.toLowerCase().trim()
			const trimmedOtp = otp.trim()

			// Check if user already exists and is verified (edge case)
			// Use normalized email for consistency
			const response = await axios.get(
				`/api/user?email=${encodeURIComponent(normalizedEmail)}`
			)

			// Check if account is deleted (status = false) during OTP verification
			if (response.data.exists && response.data.status === false) {
				setOTPError(t('errors.account_deleted'))
				return
			}

			// Since we sent OTP with type 'sign-in', we must verify using signIn.emailOtp
			// This works for both new and existing users
			// eslint-disable-next-line no-console
			console.log(
				'Verifying OTP for email:',
				normalizedEmail,
				'OTP length:',
				trimmedOtp.length
			)

			try {
				const { error: signInError } = await authClient.signIn.emailOtp({
					email: normalizedEmail,
					otp: trimmedOtp,
				})

				if (signInError) {
					// eslint-disable-next-line no-console
					console.error('Sign-in OTP error:', signInError)
					setOTPError(
						t('errors.verification_failed', {
							error: signInError.message || 'Invalid OTP',
						})
					)
					return
				}
			} catch (err: any) {
				// eslint-disable-next-line no-console
				console.error('Sign-in OTP exception:', err)
				// If signIn.emailOtp fails, try using emailOtp.verifyEmail as fallback
				// eslint-disable-next-line no-console
				console.log('Trying fallback verification method...')
				const fallbackResult = await authClient.emailOtp.verifyEmail({
					email: normalizedEmail,
					otp: trimmedOtp,
				})

				if (fallbackResult.error) {
					// eslint-disable-next-line no-console
					console.error('Fallback verification error:', fallbackResult.error)
					setOTPError(
						t('errors.verification_failed', {
							error: fallbackResult.error.message || 'Invalid OTP',
						})
					)
					return
				}
			}

			// If user didn't exist, account was created automatically
			if (!response.data.exists) {
				// Get the user ID after account creation
				// Use normalized email for consistency
				const updatedResponse = await axios.get(
					`/api/user?email=${encodeURIComponent(normalizedEmail)}`
				)

				if (!updatedResponse.data.exists || !updatedResponse.data.userId) {
					setOTPError(t('errors.user_info_failed'))
					return
				}

				// Set the password
				const responseUpdate = await axios.put('/api/user/update-password', {
					userId: updatedResponse.data.userId,
					newPassword: password,
				})

				if (responseUpdate.status !== 204) {
					setOTPError(t('errors.password_set_failed'))
					return
				}
			}

			// After successful OTP verification

			// Clear global cooldown since verification was successful
			setGlobalOtpCooldown(0)
			setLastOtpRequestEmail('')
			// Clear from localStorage
			localStorage.removeItem('otpCooldownEnd')
			localStorage.removeItem('otpCooldownEmail')

			// Redirect to profile creation after successful account creation
			setTimeout(() => {
				window.location.href = 'signin'
			}, 1500)
		} catch (err) {
			setOTPError(t('errors.unexpected_error'))
		} finally {
			setIsOTPLoading(false)
		}
	}

	return (
		// <AuthRedirect redirectTo="/dashboard">
		<AuthLayout imageSrc={LEFT_IMAGE}>
			<motion.div
				className="relative z-10 max-w-3xl ml-4 md:ml-12 "
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.5,
					ease: 'easeOut',
				}}
			>
				<motion.h1
					className="text-4xl font-bold text-[#126E64] mb-4 mt-20"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.7 }}
				>
					{t('title')}
				</motion.h1>
				<motion.p
					className="text-base text-gray-600 mb-10 max-w-lg"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3, duration: 0.7 }}
				>
					{t('subtitle')}
				</motion.p>

				{successMessage && (
					<motion.div
						className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: 'spring', stiffness: 100 }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 text-green-600 mr-2"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clipRule="evenodd"
							/>
						</svg>
						<span className="font-medium">{successMessage}</span>
					</motion.div>
				)}

				{/* {errors.email && errors.email.includes('already exists') && (
					<motion.div
						className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: 'spring', stiffness: 100 }}
					>
						<div className="flex items-start">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
							<div>
								<span className="font-medium block">{errors.email}</span>
								<Link
									href="/signin"
									className="text-sm text-[#126E64] hover:underline mt-1 inline-block font-medium"
								>
									Go to Sign In →
								</Link>
							</div>
						</div>
					</motion.div>
				)} */}

				<motion.form
					onSubmit={handleSendOTP}
					className="space-y-6 md:space-y-8"
					variants={containerVariants}
					initial="hidden"
					animate={animateForm ? 'visible' : 'hidden'}
				>
					<motion.div variants={itemVariants}>
						<FormField
							label={t('form.email.label')}
							name="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t('form.email.placeholder')}
							error={errors.email}
							required
							helpText={t('form.email.help_text')}
						/>
					</motion.div>

					<motion.div variants={itemVariants}>
						<PasswordField
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required={true}
							onValidChange={setPasswordIsValid}
							error={errors.password}
						/>
					</motion.div>

					<motion.div variants={itemVariants}>
						<PasswordField
							label={t('form.confirm_password.label')}
							name="confirmPassword"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder={t('form.confirm_password.placeholder')}
							error={errors.confirmPassword}
							required
							showCriteria={false}
							helpText={t('form.confirm_password.help_text')}
						/>
					</motion.div>

					<motion.div
						className="flex items-center mt-4"
						variants={itemVariants}
					>
						<label className="flex items-start text-sm text-gray-600">
							<input
								type="checkbox"
								required
								className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-[#126E64] focus:ring-[#126E64]"
							/>
							<span>
								{t('form.terms.text')}{' '}
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									{t('form.terms.terms_of_service')}
								</a>{' '}
								{t('form.terms.and')}{' '}
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									{t('form.terms.privacy_policy')}
								</a>
								<span> {t('form.terms.our_default')} </span>
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									{t('form.terms.notification_settings')}
								</a>
							</span>
						</label>
					</motion.div>

					<motion.div variants={itemVariants}>
						<motion.button
							type="submit"
							disabled={isLoading}
							className="w-full bg-[#126E64] text-white py-3 rounded-full shadow-md hover:opacity-90 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
							whileHover={{
								scale: 1.02,
								boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
							}}
							whileTap={{ scale: 0.98 }}
						>
							{isLoading
								? t('buttons.submitting')
								: globalOtpCooldown > 0 && lastOtpRequestEmail === email
									? t('buttons.continue_verification')
									: t('buttons.submit')}
						</motion.button>
					</motion.div>

					<motion.div className="mt-4" variants={itemVariants}>
						<GoogleButton
							action="signup"
							callbackURL="/signin" // Redirect to signin page to check profile and redirect to create profile if needed
							isLoading={isLoading}
							text={t('buttons.google')}
							loadingText={t('buttons.google_loading')}
						/>
					</motion.div>

					<motion.p
						className="text-center text-sm text-gray-600 mt-6"
						variants={itemVariants}
					>
						{t('links.have_account')}{' '}
						<Link
							href="/signin"
							className="text-[#126E64] font-medium hover:underline relative"
						>
							<motion.span
								className="inline-block"
								whileHover={{
									scale: 1.05,
									color: '#0D504A',
									transition: { duration: 0.2 },
								}}
							>
								{t('links.sign_in')}
							</motion.span>
						</Link>
					</motion.p>
				</motion.form>
			</motion.div>

			{/* OTP Verification Modal with animations */}
			{showOTPPopup && (
				<motion.div
					className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				>
					<motion.div
						className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							type: 'spring',
							stiffness: 100,
							damping: 15,
						}}
					>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-gray-800">
								{t('otp_modal.title')}
							</h2>
							<motion.button
								onClick={handleCloseOTPModal}
								className="text-gray-500 hover:text-gray-700 transition-all duration-300"
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</motion.button>
						</div>

						<motion.div
							initial="hidden"
							animate="visible"
							variants={containerVariants}
						>
							<motion.p className="text-gray-600 mb-4" variants={itemVariants}>
								{t('otp_modal.description', { email })}
							</motion.p>

							{OTPError && (
								<motion.div
									className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ type: 'spring', stiffness: 100 }}
								>
									{OTPError}
								</motion.div>
							)}

							<motion.div className="mb-4" variants={itemVariants}>
								<label className="block text-sm font-medium text-gray-700 mb-3">
									{t('otp_modal.code_label')}
								</label>
								<div className="flex justify-center space-x-2">
									{otpDigits.map((digit, index) => (
										<input
											key={index}
											id={`otp-${index}`}
											type="text"
											inputMode="numeric"
											maxLength={1}
											value={digit}
											onChange={(e) => handleOtpChange(index, e.target.value)}
											onKeyDown={(e) => handleOtpKeyDown(index, e)}
											onPaste={handleOtpPaste}
											className="w-14 h-16 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#126E64] focus:outline-none focus:ring-2 focus:ring-[#126E64]/20 transition-all duration-200 hover:border-gray-400"
											// placeholder="0"
										/>
									))}
								</div>
								{otpDigits.some((digit) => digit) && (
									<div className="text-center mt-2">
										<button
											type="button"
											onClick={resetOtpDigits}
											className="text-sm text-gray-500 hover:text-gray-700 underline"
										>
											{t('otp_modal.clear_button')}
										</button>
									</div>
								)}
							</motion.div>

							<motion.div
								className="flex justify-end space-x-2"
								variants={itemVariants}
							>
								<motion.button
									type="button"
									onClick={handleCloseOTPModal}
									className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-all duration-300"
									whileHover={{
										scale: 1.02,
										boxShadow: '0 5px 10px rgba(0, 0, 0, 0.05)',
									}}
									whileTap={{ scale: 0.98 }}
								>
									{t('otp_modal.cancel_button')}
								</motion.button>
								<motion.button
									type="button"
									onClick={() => {
										const otpCode = otpDigits.join('')
										handleVerifyOTPAndAccountCreation(otpCode)
									}}
									disabled={isOTPLoading || otpDigits.some((digit) => !digit)}
									className="px-4 py-2 bg-[#126E64] text-white rounded-full shadow-md hover:opacity-90 disabled:opacity-70 transition-all duration-300"
									whileHover={{
										scale: 1.02,
										boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
									}}
									whileTap={{ scale: 0.98 }}
								>
									{isOTPLoading
										? t('otp_modal.verifying_button')
										: t('otp_modal.verify_button')}
								</motion.button>
							</motion.div>

							<motion.p
								className="text-sm text-gray-500 mt-4"
								variants={itemVariants}
							>
								{t('otp_modal.resend_text')}{' '}
								<motion.button
									type="button"
									onClick={handleResendOTP}
									disabled={isOTPLoading || !canResend}
									className="text-[#126E64] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
									whileHover={
										canResend ? { scale: 1.05, color: '#0D504A' } : {}
									}
									whileTap={canResend ? { scale: 0.98 } : {}}
								>
									{isOTPLoading
										? t('otp_modal.sending_button')
										: !canResend
											? t('otp_modal.resend_countdown', {
													seconds: resendCountdown,
												})
											: t('otp_modal.resend_button')}
								</motion.button>
							</motion.p>
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AuthLayout>
		// </AuthRedirect>
	)
}

export default Signup
