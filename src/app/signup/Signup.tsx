'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import {
	AuthLayout,
	FormField,
	GoogleButton,
	PasswordField,
} from '../../components/auth'
import { Input } from '../../components/ui'
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

const Signup = () => {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
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
	const [OTPSuccess, setOTPSuccess] = useState('')
	const [isOTPLoading, setIsOTPLoading] = useState(false)
	const [animateForm, setAnimateForm] = useState(false)

	// Trigger animation after component mounts
	useEffect(() => {
		setAnimateForm(true)
	}, [])

	function validate() {
		const next: {
			name?: string
			email?: string
			password?: string
			confirmPassword?: string
		} = {}

		if (!name || name.trim() === '') {
			next.name = 'Please enter your full name'
		}

		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			next.email = 'Please enter a valid email address'
		}

		if (!password || !passwordIsValid) {
			next.password = 'Please enter a valid password'
		}

		if (password !== confirmPassword) {
			next.confirmPassword = "Passwords don't match"
		}

		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleGoogleSignUp = async () => {
		setIsLoading(true)
		setErrors({})
		setSuccessMessage('')

		try {
			// Using social sign-in with Google for signup
			const result = await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/',
				requestSignUp: true, // This parameter indicates we want to sign up
			})

			if (result?.error) {
				setErrors({ email: result.error.message ?? undefined })
			} else {
				// Show success message if not automatically redirected
				setSuccessMessage(
					'Google signup successful! Redirecting to dashboard...'
				)
			}
		} catch (err) {
			console.error(err)
			setErrors({
				email: 'Google signup failed. Please try again or use email.',
			})
			setSuccessMessage('')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		setOTPError('')
		setOTPSuccess('')

		console.log('Starting sign-up process for:', email)

		try {
			setIsLoading(true)
			// First, create the account

			// Then send OTP for email verification
			const { data: otpData, error: otpError } =
				await authClient.emailOtp.sendVerificationOtp({
					email: email,
					type: 'email-verification',
				})

			if (otpError) {
				console.error('OTP error:', otpError)
				setOTPError(
					`Failed to send verification code: ${
						otpError.message || 'Unknown error'
					}`
				)
			} else {
				console.log('OTP sent successfully:', otpData)
				setShowOTPPopup(true)
			}

			//Wait for OTP to be verified before creating account
			// Create account only after OTP is sent successfully

			// const { data, error } = await authClient.signUp.email({
			//   email,
			//   password,
			//   name,
			// });

			// if (error) {
			//   console.error("Sign-up error:", error);
			//   setOTPError(`Sign-up failed: ${error.message || "Unknown error"}`);
			//   return;
			// }
		} catch (err) {
			console.error('General error:', err)
			setOTPError('An unexpected error occurred. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleVerifyOTPAndAccountCreation = async (otp: string) => {
		setOTPError('')
		setOTPSuccess('')
		if (!otp.trim() || otp.length !== 6) {
			setOTPError('Please enter the 6-digit OTP.')
			return
		}
		setIsOTPLoading(true)
		try {
			const { data, error } = await authClient.emailOtp.checkVerificationOtp({
				email,
				otp,
				type: 'email-verification',
			})

			if (error) {
				console.error('OTP verification error:', error)
				setOTPError(`Verification failed: ${error.message || 'Unknown error'}`)
			} else {
				console.log('OTP verification successful:', data)
				setOTPSuccess('Email verification successful. You can now sign in.')
				const { data: signUpData, error: signUpError } =
					await authClient.signUp.email({
						email,
						password,
						name,
					})

				if (error) {
					console.error('Sign-up error:', error)
					setOTPError(
						`Sign-up failed: ${signUpError?.message || 'Unknown error'}`
					)
					return
				}

				// Automatically redirect to dashboard after a delay
				setTimeout(() => {
					window.location.href = '/dashboard'
				}, 1500)
			}
		} catch (err) {
			console.error('Unexpected OTP error:', err)
			setOTPError('An unexpected error occurred. Please try again.')
		} finally {
			setIsOTPLoading(false)
		}
	}

	return (
		<AuthLayout imageSrc={LEFT_IMAGE}>
			<motion.div
				className="relative z-10 max-w-3xl ml-4 md:ml-12"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.5,
					ease: 'easeOut',
				}}
			>
				<motion.h1
					className="text-4xl font-bold text-[#126E64] mb-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.7 }}
				>
					Sign up
				</motion.h1>
				<motion.p
					className="text-base text-gray-600 mb-10 max-w-lg"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3, duration: 0.7 }}
				>
					Join our community and discover educational opportunities that match
					your unique profile
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

				<motion.form
					onSubmit={handleSendOTP}
					className="space-y-6 md:space-y-8"
					variants={containerVariants}
					initial="hidden"
					animate={animateForm ? 'visible' : 'hidden'}
				>
					<motion.div variants={itemVariants}>
						<FormField
							label="Full Name"
							name="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter your full name"
							error={errors.name}
							required
							helpText="(or institution name if you are institution)"
						/>
					</motion.div>

					<motion.div variants={itemVariants}>
						<FormField
							label="Email"
							name="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							error={errors.email}
							required
							helpText="(or institution email if you are institution)"
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
							label="Confirm Password"
							name="confirmPassword"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm your password"
							error={errors.confirmPassword}
							required
							showCriteria={false}
							helpText="Re-enter your password to confirm"
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
								By creating the account means you agree with our{' '}
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									Terms of Service
								</a>{' '}
								and{' '}
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									Privacy Policy
								</a>
								<span> and our default </span>
								<a
									href="#"
									className="text-[#F0A227] font-medium hover:underline"
								>
									Notification Settings
								</a>
							</span>
						</label>
					</motion.div>

					<motion.div variants={itemVariants}>
						<motion.button
							type="submit"
							disabled={isLoading}
							className="w-full bg-[#126E64] text-white py-3 rounded-full shadow-md hover:opacity-90 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
							whileHover={{
								scale: 1.02,
								boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
							}}
							whileTap={{ scale: 0.98 }}
						>
							{isLoading ? 'Signing you up...' : 'Sign Up'}
						</motion.button>
					</motion.div>

					<motion.div className="mt-4" variants={itemVariants}>
						<GoogleButton
							onClick={handleGoogleSignUp}
							isLoading={isLoading}
							text="Sign up with Google"
							loadingText="Signing up..."
						/>
					</motion.div>

					<motion.p
						className="text-center text-sm text-gray-600 mt-6"
						variants={itemVariants}
					>
						Already have an account?{' '}
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
								Sign in
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
								Verify Your Email
							</h2>
							<motion.button
								onClick={() => setShowOTPPopup(false)}
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

						{OTPSuccess ? (
							<motion.div
								className="text-center py-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2 }}
							>
								<motion.svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-12 w-12 text-green-500 mx-auto mb-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{
										type: 'spring',
										stiffness: 100,
										delay: 0.3,
									}}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</motion.svg>
								<motion.p
									className="text-gray-700 mb-6"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
								>
									{OTPSuccess}
								</motion.p>
								<motion.button
									onClick={() => setShowOTPPopup(false)}
									className="w-full py-2 bg-[#126E64] text-white rounded-full shadow-md hover:opacity-90 transition-all duration-300"
									whileHover={{
										scale: 1.02,
										boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
									}}
									whileTap={{ scale: 0.98 }}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.5 }}
								>
									Close
								</motion.button>
							</motion.div>
						) : (
							<motion.div
								initial="hidden"
								animate="visible"
								variants={containerVariants}
							>
								<motion.p
									className="text-gray-600 mb-4"
									variants={itemVariants}
								>
									We&apos;ve sent a 6-digit verification code to{' '}
									<span className="font-medium">{email}</span>. Please enter it
									below to verify your email address.
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
									<label
										htmlFor="otp"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Verification Code
									</label>
									<Input
										type="text"
										id="otp"
										maxLength={6}
										placeholder="Enter 6-digit code"
									/>
								</motion.div>

								<motion.div
									className="flex justify-end space-x-2"
									variants={itemVariants}
								>
									<motion.button
										type="button"
										onClick={() => setShowOTPPopup(false)}
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
										onClick={() => {
											const otpInput = document.getElementById(
												'otp'
											) as HTMLInputElement
											handleVerifyOTPAndAccountCreation(otpInput?.value || '')
										}}
										disabled={isOTPLoading}
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
										onClick={handleSendOTP}
										className="text-[#126E64] hover:underline"
										whileHover={{ scale: 1.05, color: '#0D504A' }}
										whileTap={{ scale: 0.98 }}
									>
										Resend Code
									</motion.button>
								</motion.p>
							</motion.div>
						)}
					</motion.div>
				</motion.div>
			)}
		</AuthLayout>
	)
}

export default Signup
