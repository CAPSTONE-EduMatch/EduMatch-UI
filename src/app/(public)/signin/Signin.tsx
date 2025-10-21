'use client'

import {
	AuthLayout,
	// AuthRedirect,
	GoogleButton,
	PasswordField,
} from '@/components/auth'
import { Input, Modal } from '@/components/ui'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/app/lib/auth-client'

const LEFT_IMAGE =
	'https://wallpapers.com/images/featured/cambridge-university-k3uqfq0l7bwrrmpr.jpg'
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

const SignIn: React.FC = () => {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [errors, setErrors] = useState<{
		email?: string
		password?: string
		forgotEmail?: string
	}>({})
	const [isLoading, setIsLoading] = useState(false)
	const [showForgotPassword, setShowForgotPassword] = useState(false)
	const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{
		success?: string
		error?: string
	}>({})
	const [resetSent, setResetSent] = useState(false)
	const [forgotEmail, setForgotEmail] = useState('')
	const [animateForm, setAnimateForm] = useState(false)
	const [hasSubmittedForgotEmail, setHasSubmittedForgotEmail] = useState(false)
	// Email verification OTP states (replacing EmailVerificationModal)
	const [showOTPPopup, setShowOTPPopup] = useState(false)
	const [pendingEmail, setPendingEmail] = useState('')
	const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
	const [isOTPLoading, setIsOTPLoading] = useState(false)
	const [OTPError, setOTPError] = useState('')
	const [resendCountdown, setResendCountdown] = useState(0)
	const [canResend, setCanResend] = useState(true)
	// Forgot password cooldown states
	const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(0)
	const [canSendForgotPassword, setCanSendForgotPassword] = useState(true)
	const [lastForgotPasswordEmail, setLastForgotPasswordEmail] = useState('')

	// Check profile and redirect accordingly
	const checkProfileAndRedirect = useCallback(async () => {
		try {
			console.log('🔍 Checking user profile...')
			const profileResponse = await axios.get('/api/profile')
			const profile = profileResponse.data?.profile

			if (profile) {
				console.log('✅ Profile found:', profile.role)
				// User has a profile, redirect based on role
				if (profile.role === 'institution') {
					console.log('🏢 Redirecting to institution profile')
					router.push('/institution-profile')
				} else if (profile.role === 'applicant') {
					console.log('🎓 Redirecting to applicant profile')
					router.push('/applicant-profile/view')
				} else {
					console.log('❓ Unknown role, redirecting to explore')
					router.push('/explore')
				}
			} else {
				console.log('❌ No profile found, redirecting to create profile')
				router.push('/profile/create')
			}
		} catch (error: any) {
			console.log('❌ Profile check failed:', error?.response?.status)

			// If profile doesn't exist (404), redirect to profile creation
			if (error?.response?.status === 404) {
				console.log('📝 No profile found, redirecting to create profile')
				router.push('/profile/create')
			} else {
				console.log('⚠️ Error occurred, redirecting to explore')
				router.push('/explore')
			}
		}
	}, [router])

	// Trigger animation after component mounts
	useEffect(() => {
		setAnimateForm(true)
	}, [])

	// Check if user is already authenticated (e.g., from Google OAuth callback)
	useEffect(() => {
		const checkExistingAuth = async () => {
			try {
				console.log('🔍 Checking existing authentication...')
				const session = await authClient.getSession()
				console.log('🔍 Session result:', session)

				if (session?.data?.user) {
					console.log('✅ User already authenticated, checking profile...')
					// User is already authenticated, check their profile
					await checkProfileAndRedirect()
				} else {
					console.log('❌ No authenticated user found')
				}
			} catch (error) {
				console.log('❌ Auth check error:', error)
				// User is not authenticated, continue with signin form
			}
		}

		checkExistingAuth()
	}, [checkProfileAndRedirect])

	// Load forgot password cooldown from localStorage on mount
	useEffect(() => {
		const savedCooldown = localStorage.getItem('forgotPasswordCooldownEnd')
		const savedEmail = localStorage.getItem('forgotPasswordCooldownEmail')

		if (savedCooldown && savedEmail) {
			const cooldownEnd = parseInt(savedCooldown)
			const now = Date.now()
			const remainingTime = Math.max(0, Math.floor((cooldownEnd - now) / 1000))

			if (remainingTime > 0) {
				setForgotPasswordCooldown(remainingTime)
				setLastForgotPasswordEmail(savedEmail)
				setCanSendForgotPassword(false)
			} else {
				// Cleanup expired cooldown
				localStorage.removeItem('forgotPasswordCooldownEnd')
				localStorage.removeItem('forgotPasswordCooldownEmail')
			}
		}
	}, [])

	// Forgot password cooldown effect
	useEffect(() => {
		let intervalId: NodeJS.Timeout
		if (forgotPasswordCooldown > 0) {
			intervalId = setInterval(() => {
				setForgotPasswordCooldown((prev) => {
					if (prev <= 1) {
						// Clear localStorage when cooldown expires
						localStorage.removeItem('forgotPasswordCooldownEnd')
						localStorage.removeItem('forgotPasswordCooldownEmail')
						setCanSendForgotPassword(true)
						return 0
					}
					return prev - 1
				})
			}, 1000)
		}
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [forgotPasswordCooldown])

	// OTP resend countdown effect
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

	// OTP helper functions
	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return // Only allow digits

		const newDigits = [...otpDigits]
		newDigits[index] = value.slice(-1) // Only take the last digit
		setOtpDigits(newDigits)

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index}`)
			nextInput?.focus()
		}
	}

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`)
			prevInput?.focus()
		}
	}

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

	const resetOtpDigits = () => {
		setOtpDigits(['', '', '', '', '', ''])
	}

	const handleCloseOTPModal = () => {
		setShowOTPPopup(false)
		setOtpDigits(['', '', '', '', '', ''])
		setOTPError('')
		setPendingEmail('')
	}

	function validate() {
		const next: { email?: string; password?: string } = {}
		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			next.email = 'Please enter a valid email address.'
		}
		if (!password) {
			next.password = 'Please enter your password.'
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	// Google social sign-in is handled within the GoogleButton component

	const handleEmailSignIn = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		setIsLoading(true)
		try {
			const res = await authClient.signIn.email({
				email,
				password,
				callbackURL: '/', // We'll handle redirect client-side
			})

			// If successful signin, handle redirect
			if (res?.data && !res?.error) {
				console.log('✅ Sign-in successful, checking profile...')
				// Check if user has a profile and redirect accordingly
				await checkProfileAndRedirect()
				return
			}

			if (res?.error) {
				// eslint-disable-next-line no-console
				console.log('Sign-in error:', res.error) // Debug log to see actual error

				const errorMessage = res.error.message?.toLowerCase() || ''

				// First, try to check if user exists and get their verification status
				let shouldTriggerEmailVerification = false

				try {
					const userCheckResponse = await axios.get(
						`/api/user?email=${encodeURIComponent(email)}`
					)

					// If user exists but email is not verified, trigger OTP flow
					if (
						userCheckResponse.data.exists &&
						!userCheckResponse.data.isEmailVerified
					) {
						shouldTriggerEmailVerification = true
						console.log('User exists but email is not verified')
					}
				} catch (apiError) {
					// eslint-disable-next-line no-console
					console.log('Error checking user verification status:', apiError)
				}

				// Enhanced email verification error detection
				const isEmailVerificationError =
					shouldTriggerEmailVerification ||
					(errorMessage.includes('email') &&
						(errorMessage.includes('verify') ||
							errorMessage.includes('verification') ||
							errorMessage.includes('not verified') ||
							errorMessage.includes('unverified') ||
							errorMessage.includes('confirm') ||
							errorMessage.includes('activate'))) ||
					// Better Auth specific error patterns
					errorMessage.includes('email not verified') ||
					errorMessage.includes('please verify') ||
					errorMessage.includes('account not verified') ||
					errorMessage.includes('verification required')

				// Check if error is related to wrong password/credentials (but not email verification)
				const isCredentialError =
					!isEmailVerificationError &&
					(errorMessage.includes('password') ||
						errorMessage.includes('credential') ||
						errorMessage.includes('invalid') ||
						errorMessage.includes('unauthorized') ||
						errorMessage.includes('wrong'))

				// Check if error is related to user not found
				const isUserNotFoundError =
					!isEmailVerificationError &&
					errorMessage.includes('user') &&
					(errorMessage.includes('not found') ||
						errorMessage.includes('does not exist') ||
						errorMessage.includes("doesn't exist"))

				if (isEmailVerificationError) {
					try {
						// Send OTP for email verification
						await authClient.emailOtp.sendVerificationOtp({
							email,
							type: 'email-verification',
						})
						setPendingEmail(email)
						setShowOTPPopup(true)
					} catch (otpError) {
						// eslint-disable-next-line no-console
						console.error('Failed to send verification OTP:', otpError)
						setErrors({
							email: 'Failed to send verification code. Please try again.',
						})
					}
				} else if (isCredentialError) {
					// Show password error for credential issues
					setErrors({
						email: 'Invalid email or password. Please try again.',
						password: 'Invalid email or password. Please try again.',
					})
				} else if (isUserNotFoundError) {
					// Show email error for user not found
					setErrors({
						email: 'No account found with this email address.',
					})
				} else {
					// For any other error, try email verification as fallback
					try {
						// Attempt to send verification OTP as fallback
						await authClient.emailOtp.sendVerificationOtp({
							email,
							type: 'email-verification',
						})
						setPendingEmail(email)
						setShowOTPPopup(true)
					} catch (otpError) {
						// If OTP fails, show the original error
						setErrors({
							email: res.error.message ?? 'Sign in failed. Please try again.',
						})
					}
				}
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!forgotEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(forgotEmail)) {
			setErrors((prev) => ({
				...prev,
				forgotEmail: 'Please enter a valid email address.',
			}))
			return
		}

		// Check for active cooldown
		if (forgotPasswordCooldown > 0 && lastForgotPasswordEmail === forgotEmail) {
			setErrors((prev) => ({
				...prev,
				forgotEmail: `Please wait ${forgotPasswordCooldown} seconds before requesting another reset link.`,
			}))
			return
		}

		setIsLoading(true)
		try {
			// First check if user exists
			const userCheckResponse = await axios.get(
				`/api/user?email=${encodeURIComponent(forgotEmail)}`
			)

			if (!userCheckResponse.data.exists) {
				setErrors((prev) => ({
					...prev,
					forgotEmail:
						'No account found with this email address. Please check your email or sign up.',
				}))
				setIsLoading(false)
				return
			}

			// If user exists, proceed with password reset
			const { error } = await authClient.requestPasswordReset({
				email: forgotEmail,
				redirectTo: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/forgot-password`,
			})

			if (error) {
				// Handle rate limiting errors specifically
				const errorMessage =
					error.message || 'Failed to send reset link. Please try again later.'

				if (
					errorMessage.includes('Too many') &&
					errorMessage.includes('password reset requests')
				) {
					setErrors((prev) => ({
						...prev,
						forgotEmail:
							'⏰ Too many password reset attempts. Please wait 24 hours before trying again.',
					}))
				} else {
					setErrors((prev) => ({
						...prev,
						forgotEmail: errorMessage,
					}))
				}
				setIsLoading(false)
				return
			}

			await new Promise((resolve) => setTimeout(resolve, 1000))
			setForgotPasswordStatus({
				success: `Password reset link sent to ${forgotEmail}. Please check your inbox.`,
				error: undefined,
			})
			setResetSent(true)
			setHasSubmittedForgotEmail(true)
			setErrors((prev) => ({ ...prev, forgotEmail: undefined }))

			// Start cooldown to prevent spam
			setForgotPasswordCooldown(60)
			setLastForgotPasswordEmail(forgotEmail)
			setCanSendForgotPassword(false)
			// Store in localStorage for persistence
			localStorage.setItem(
				'forgotPasswordCooldownEnd',
				(Date.now() + 60000).toString()
			)
			localStorage.setItem('forgotPasswordCooldownEmail', forgotEmail)
		} catch (error) {
			// Handle API errors
			if (axios.isAxiosError(error)) {
				setErrors((prev) => ({
					...prev,
					forgotEmail: 'Unable to verify email. Please try again later.',
				}))
			} else {
				setForgotPasswordStatus({
					success: undefined,
					error: 'Failed to send reset link. Please try again later.',
				})
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleResendForgotPassword = async () => {
		if (!forgotEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(forgotEmail)) {
			setErrors((prev) => ({
				...prev,
				forgotEmail: 'Please enter a valid email address.',
			}))
			return
		}

		// Check for active cooldown
		if (!canSendForgotPassword && lastForgotPasswordEmail === forgotEmail) {
			setErrors((prev) => ({
				...prev,
				forgotEmail: `Please wait ${forgotPasswordCooldown} seconds before requesting another reset link.`,
			}))
			return
		}

		setIsLoading(true)
		try {
			// First check if user exists
			const userCheckResponse = await axios.get(
				`/api/user?email=${encodeURIComponent(forgotEmail)}`
			)

			if (!userCheckResponse.data.exists) {
				setErrors((prev) => ({
					...prev,
					forgotEmail:
						'No account found with this email address. Please check your email or sign up.',
				}))
				setIsLoading(false)
				return
			}

			// If user exists, proceed with password reset
			const { error } = await authClient.requestPasswordReset({
				email: forgotEmail,
				redirectTo: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/forgot-password`,
			})

			if (error) {
				setForgotPasswordStatus({
					success: undefined,
					error:
						error.message ||
						'Failed to send reset link. Please try again later.',
				})
				return
			}

			// Simulate delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 1000))
			setForgotPasswordStatus({
				success: `Password reset link sent to ${forgotEmail}. Please check your inbox.`,
				error: undefined,
			})
			setErrors((prev) => ({ ...prev, forgotEmail: undefined }))

			// Start cooldown to prevent spam
			setForgotPasswordCooldown(60)
			setLastForgotPasswordEmail(forgotEmail)
			setCanSendForgotPassword(false)
			// Store in localStorage for persistence
			localStorage.setItem(
				'forgotPasswordCooldownEnd',
				(Date.now() + 60000).toString()
			)
			localStorage.setItem('forgotPasswordCooldownEmail', forgotEmail)
		} catch (error) {
			// Handle API errors
			if (axios.isAxiosError(error)) {
				setErrors((prev) => ({
					...prev,
					forgotEmail: 'Unable to verify email. Please try again later.',
				}))
			} else {
				setForgotPasswordStatus({
					success: undefined,
					error: 'Failed to send reset link. Please try again later.',
				})
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleVerifyOTP = async () => {
		const otpCode = otpDigits.join('')
		if (otpCode.length !== 6) {
			setOTPError('Please enter the complete 6-digit code')
			return
		}

		setIsOTPLoading(true)
		setOTPError('')

		try {
			const result = await authClient.emailOtp.verifyEmail({
				email: pendingEmail,
				otp: otpCode,
			})

			if (result.error) {
				setOTPError(result.error.message || 'Invalid verification code')
			} else {
				// Success - close modal and check profile
				handleCloseOTPModal()
				// After successful verification, check profile and redirect
				await checkProfileAndRedirect()
			}
		} catch (err) {
			setOTPError('Verification failed. Please try again.')
		} finally {
			setIsOTPLoading(false)
		}
	}

	const handleResendOTP = async () => {
		if (resendCountdown > 0 || !canResend) return

		setIsOTPLoading(true)
		setOTPError('')

		try {
			const result = await authClient.emailOtp.sendVerificationOtp({
				email: pendingEmail,
				type: 'email-verification',
			})

			if (result.error) {
				setOTPError(result.error.message || 'Failed to send verification code')
			} else {
				setResendCountdown(30) // 30-second cooldown
				setCanResend(false)
				setOtpDigits(['', '', '', '', '', '']) // Clear current OTP
			}
		} catch (err) {
			setOTPError('Failed to resend verification code')
		} finally {
			setIsOTPLoading(false)
		}
	}

	useEffect(() => {
		// Show Google One Tap prompt when the page loads
		const cleanup = () => {
			try {
				authClient.oneTap({
					callbackURL: '/dashboard',
					fetchOptions: {
						onSuccess: (response) => {
							// eslint-disable-next-line no-console
							console.log('One Tap sign-in successful:', response)
						},
						onError: (error) => {
							// Silently handle Google OAuth errors - they're not critical
							// eslint-disable-next-line no-console
							console.warn('One Tap sign-in error (non-critical):', error)
						},
					},
				})
			} catch (error) {
				// Silently handle any Google OAuth initialization errors
				console.warn('Google OAuth initialization error (non-critical):', error)
			}
		}
		cleanup()
	}, [])

	return (
		<div>
			{/* <AuthRedirect redirectTo="/dashboard"> */}
			<AuthLayout imageSrc={LEFT_IMAGE}>
				<motion.div
					className="relative z-10 max-w-2xl"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.3 }}
				>
					<motion.h1
						className="text-4xl font-bold text-[#126E64] mb-3"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.4 }}
					>
						Sign in
					</motion.h1>

					<motion.p
						className="text-sm text-gray-500 mb-8"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.7, delay: 0.5 }}
					>
						Lorem Ipsum is simply dummy text of the printing and typesetting
						industry.
					</motion.p>

					<motion.form
						onSubmit={handleEmailSignIn}
						className="space-y-6"
						variants={containerVariants}
						initial="hidden"
						animate={animateForm ? 'visible' : 'hidden'}
					>
						<motion.div
							className="grid grid-cols-12 items-center gap-4"
							variants={itemVariants}
						>
							<label className="col-span-3 text-sm font-medium text-gray-700">
								Email <span className="text-red-500">*</span>
							</label>
							<div className="col-span-9">
								<Input
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="email"
									placeholder="Enter your mail"
									aria-label="Email"
									variant="signin"
									error={errors.email}
								/>
							</div>
						</motion.div>

						<motion.div
							className="grid grid-cols-12 items-center gap-4"
							variants={itemVariants}
						>
							{/* <label className="col-span-3 text-sm font-medium text-gray-700">
								Password <span className="text-red-500">*</span>
							</label> */}
							<div className="relative col-span-12">
								{/* <Input
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									aria-label="Password"
									variant="signin"
									error={errors.password}
								/>
								<motion.button
									type="button"
									className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
									onClick={() => setShowPassword(!showPassword)}
									// whileHover={{ scale: 1.1 }}
									// whileTap={{ scale: 0.9 }}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
												clipRule="evenodd"
											/>
											<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
										</svg>
									) : (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
											<path
												fillRule="evenodd"
												d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
												clipRule="evenodd"
											/>
										</svg>
									)}
								</motion.button> */}
								<PasswordField
									label="Password"
									name="Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									error={errors.password}
									required
									showCriteria={false}
									// helpText="Re-enter your password to confirm"
								/>
							</div>
						</motion.div>

						<motion.div
							className="flex items-center justify-end"
							variants={itemVariants}
						>
							{/* <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" className="mr-2" /> Remember me
                  </label> */}
							<motion.button
								type="button"
								onClick={() => {
									setForgotEmail(email) // Pre-fill with current email if available
									setShowForgotPassword(true)
									setResetSent(false)
								}}
								className="text-sm text-[#126E64] hover:underline"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								Forgot password?
							</motion.button>
						</motion.div>

						<motion.div variants={itemVariants}>
							<motion.button
								type="submit"
								disabled={isLoading}
								className="w-full bg-[#126E64] text-white py-3 rounded-full shadow-md hover:opacity-90 transition-all duration-100 hover:shadow-lg transform hover:-translate-y-1"
								whileHover={{
									scale: 1.02,
									boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
								}}
								whileTap={{ scale: 0.98 }}
							>
								{isLoading ? 'Signing in...' : 'Sign in'}
							</motion.button>
						</motion.div>

						<motion.div variants={itemVariants}>
							<motion.div className="mt-4" variants={itemVariants}>
								<GoogleButton
									action="signin"
									callbackURL="/signin" // Stay on signin page, we'll handle redirect client-side
									isLoading={isLoading}
									text="Sign in with Google"
									loadingText="Signing in..."
								/>
							</motion.div>
						</motion.div>

						<motion.p
							className="text-center text-sm text-gray-500 mt-2"
							variants={itemVariants}
						>
							Don&apos;t have an account?{' '}
							<Link href="/signup">
								<motion.span
									className="text-[#126E64] font-medium hover:underline inline-block"
									whileHover={{
										scale: 1.05,
										color: '#0D504A',
										transition: { duration: 0.2 },
									}}
								>
									Sign up
								</motion.span>
							</Link>
						</motion.p>
					</motion.form>
				</motion.div>
			</AuthLayout>

			{/* Forgot Password Modal */}
			<Modal
				isOpen={showForgotPassword}
				onClose={() => setShowForgotPassword(false)}
				maxWidth="sm"
			>
				<motion.h2
					className="text-2xl font-bold text-[#126E64] mb-2"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					Forgot Password
				</motion.h2>

				{!resetSent ? (
					<motion.div
						initial="hidden"
						animate="visible"
						variants={containerVariants}
					>
						<motion.p className="text-gray-600 mb-6" variants={itemVariants}>
							We will send a reset password link to your email address.
						</motion.p>

						<motion.form onSubmit={handleForgotPassword} className="space-y-4">
							<motion.div variants={itemVariants} className="relative">
								<Input
									type="email"
									value={forgotEmail}
									onChange={(e) => setForgotEmail(e.target.value)}
									placeholder="example123@gmail.com"
									variant="signin"
									error={errors.forgotEmail}
									required
								/>
							</motion.div>

							<motion.button
								type="submit"
								disabled={isLoading}
								className="w-full bg-[#126E64] text-white py-3 rounded-full font-medium shadow-md hover:bg-opacity-90 "
								variants={itemVariants}
								whileHover={{
									scale: 1.02,
									boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
								}}
								whileTap={{ scale: 0.98 }}
							>
								{isLoading ? 'Sending...' : 'Confirm'}
							</motion.button>
						</motion.form>

						{hasSubmittedForgotEmail && (
							<motion.button
								onClick={handleResendForgotPassword}
								disabled={isLoading || !canSendForgotPassword}
								className="mt-4 w-full px-4 py-2 text-sm font-medium text-[#126E64] bg-transparent border border-[#126E64] rounded-full hover:bg-[#126E64] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={
									canSendForgotPassword && !isLoading ? { scale: 1.02 } : {}
								}
								whileTap={
									canSendForgotPassword && !isLoading ? { scale: 0.98 } : {}
								}
							>
								{isLoading
									? 'Sending...'
									: !canSendForgotPassword
										? `Resend Reset Link (${forgotPasswordCooldown}s)`
										: 'Resend Reset Link'}
							</motion.button>
						)}
					</motion.div>
				) : (
					<motion.div
						className="text-center py-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						<motion.svg
							className="mx-auto h-12 w-12 text-green-500 mb-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{
								type: 'spring',
								stiffness: 100,
								delay: 0.2,
							}}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</motion.svg>
						<motion.p
							className="text-gray-700 mb-4"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							Password reset link sent to{' '}
							<span className="font-medium">{forgotEmail}</span>
						</motion.p>
						<motion.button
							onClick={() => setShowForgotPassword(false)}
							className="w-full bg-[#126E64] text-white py-2 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-all duration-300"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							whileHover={{
								scale: 1.02,
								boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
							}}
							whileTap={{ scale: 0.98 }}
						>
							Close
						</motion.button>

						{hasSubmittedForgotEmail && (
							<motion.button
								onClick={handleResendForgotPassword}
								disabled={isLoading || !canSendForgotPassword}
								className="mt-4 w-full px-4 py-2 text-sm font-medium text-[#126E64] bg-transparent border border-[#126E64] rounded-full hover:bg-[#126E64] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={
									canSendForgotPassword && !isLoading ? { scale: 1.02 } : {}
								}
								whileTap={
									canSendForgotPassword && !isLoading ? { scale: 0.98 } : {}
								}
							>
								{isLoading
									? 'Sending...'
									: !canSendForgotPassword
										? `Resend Reset Link (${forgotPasswordCooldown}s)`
										: 'Resend Reset Link'}
							</motion.button>
						)}
					</motion.div>
				)}
			</Modal>

			{/* Email Verification OTP Popup */}
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
								Verify Your Email
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
								We&apos;ve sent a 6-digit verification code to{' '}
								<span className="font-medium">{pendingEmail}</span>. Please
								enter it below to verify your email address.
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
									Verification Code
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
											Clear all
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
									Cancel
								</motion.button>
								<motion.button
									type="button"
									onClick={handleVerifyOTP}
									disabled={isOTPLoading || otpDigits.some((digit) => !digit)}
									className="px-4 py-2 bg-[#126E64] text-white rounded-full shadow-md hover:opacity-90 disabled:opacity-70 transition-all duration-300"
									whileHover={{
										scale: 1.02,
										boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
									}}
									whileTap={{ scale: 0.98 }}
								>
									{isOTPLoading ? 'Verifying...' : 'Verify'}
								</motion.button>
							</motion.div>

							<motion.p
								className="text-sm text-gray-500 mt-4"
								variants={itemVariants}
							>
								Didn&apos;t receive the code?{' '}
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
										? 'Sending...'
										: !canResend
											? `Resend Code (${resendCountdown}s)`
											: 'Resend Code'}
								</motion.button>
							</motion.p>
						</motion.div>
					</motion.div>
				</motion.div>
			)}
			{/* </AuthRedirect> */}
		</div>
	)
}

export default SignIn
