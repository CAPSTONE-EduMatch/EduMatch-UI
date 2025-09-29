'use client'

import {
	AuthLayout,
	// AuthRedirect,
	EmailVerificationModal,
	GoogleButton,
} from '@/components/auth'
import { Input, Modal, ResendCodeButton } from '@/components/ui'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'

const LEFT_IMAGE = '/assets/campus-image.jpg'

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
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
	const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{
		success?: string
		error?: string
	}>({})
	const [resetSent, setResetSent] = useState(false)
	const [forgotEmail, setForgotEmail] = useState('')
	const [animateForm, setAnimateForm] = useState(false)
	const [hasSubmittedForgotEmail, setHasSubmittedForgotEmail] = useState(false)
	// Email verification states
	const [showEmailVerification, setShowEmailVerification] = useState(false)
	const [pendingEmail, setPendingEmail] = useState('')

	// Trigger animation after component mounts
	useEffect(() => {
		setAnimateForm(true)
	}, [])

	function validate() {
		const next: { email?: string; password?: string } = {}
		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			next.email = 'Email does not exist. Please try again.'
		}
		if (!password || password.length < 6) {
			next.password = 'Incorrect password. Please try again.'
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleGoogleSignIn = async () => {
		setIsLoading(true)
		try {
			const result = await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/dashboard',
			})
			console.log('Google sign-in result:', result)
		} catch (err) {
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleEmailSignIn = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		setIsLoading(true)
		try {
			const res = await authClient.signIn.email({
				email,
				password,
				callbackURL: '/dashboard',
			})
			if (res?.error) {
				// Check if error is related to email not being verified
				if (
					res.error.message?.includes('email') &&
					(res.error.message?.includes('verify') ||
						res.error.message?.includes('verification'))
				) {
					// Send OTP for email verification
					await authClient.emailOtp.sendVerificationOtp({
						email,
						type: 'email-verification',
					})
					setPendingEmail(email)
					setShowEmailVerification(true)
				} else {
					setErrors({ email: res.error.message ?? undefined })
				}
			}
		} catch (err) {
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
			const { data, error } = await authClient.requestPasswordReset({
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
			const { data, error } = await authClient.requestPasswordReset({
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

	const openForgotPasswordModal = () => {
		setForgotPasswordEmail(email)
		setShowForgotPassword(true)
		setForgotPasswordStatus({})
	}

	const handleEmailVerificationClose = () => {
		setShowEmailVerification(false)
		setPendingEmail('')
	}

	const handleEmailVerificationSuccess = () => {
		setShowEmailVerification(false)
		setPendingEmail('')
		// After successful verification, attempt sign in again
		handleEmailSignIn({ preventDefault: () => {} } as React.FormEvent)
	}

	useEffect(() => {
		// Show Google One Tap prompt when the page loads
		const cleanup = () => {
			authClient.oneTap({
				callbackURL: '/dashboard',
				fetchOptions: {
					onSuccess: (response) => {
						console.log('One Tap sign-in successful:', response)
					},
					onError: (error) => {
						console.error('One Tap sign-in error:', error)
					},
				},
			})
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
							<label className="col-span-3 text-sm font-medium text-gray-700">
								Password <span className="text-red-500">*</span>
							</label>
							<div className="col-span-9 relative">
								<Input
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
								</motion.button>
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
									onClick={handleGoogleSignIn}
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
							<ResendCodeButton
								onResend={handleResendForgotPassword}
								disabled={isLoading}
								className="mt-4 w-full"
							/>
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
							<ResendCodeButton
								onResend={handleResendForgotPassword}
								disabled={isLoading}
								className="mt-4 w-full"
							/>
						)}
					</motion.div>
				)}
			</Modal>

			{/* Email Verification Modal */}
			<EmailVerificationModal
				isOpen={showEmailVerification}
				onClose={handleEmailVerificationClose}
				onVerificationSuccess={handleEmailVerificationSuccess}
				email={pendingEmail}
			/>
			{/* </AuthRedirect> */}
		</div>
	)
}

export default SignIn
