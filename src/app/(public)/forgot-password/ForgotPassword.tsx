'use client'

import { authClient } from '@/config/auth-client'
import { PasswordField } from '@/components/auth'
import { Input } from '@/components/ui'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
// import { set } from 'better-auth'

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

const ForgotPassword: React.FC = () => {
	const t = useTranslations('auth.forgot_password')

	const [newPassword, setNewPassword] = useState('')
	const [confirmNewPassword, setConfirmNewPassword] = useState('')
	const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
	const [newPasswordIsValid, setNewPasswordIsValid] = useState(false)
	const [errors, setErrors] = useState<{
		newPassword?: string
		confirmNewPassword?: string
		general?: string
	}>({})
	const [isLoading, setIsLoading] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [animateForm, setAnimateForm] = useState(false)
	const [token, setToken] = useState('')

	// Trigger animation after component mounts
	useEffect(() => {
		setAnimateForm(true)
		setToken(new URLSearchParams(window.location.search).get('token') || '')
	}, [])

	function validate() {
		const next: {
			newPassword?: string
			confirmNewPassword?: string
		} = {}

		if (!newPassword || !newPasswordIsValid) {
			next.newPassword = t('errors.password_invalid')
		}

		if (!confirmNewPassword) {
			next.confirmNewPassword = t('errors.confirm_required')
		} else if (newPassword !== confirmNewPassword) {
			next.confirmNewPassword = t('errors.passwords_no_match')
		}

		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handlePasswordReset = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validate()) return

		setIsLoading(true)
		setSuccessMessage('')
		setErrors({})

		try {
			// This would be replaced with actual password reset API call
			// For now, simulating the API call
			const { error } = await authClient.resetPassword({
				newPassword: newPassword, // required
				token, // required
			})

			if (error) {
				setErrors({
					general: t('errors.update_failed'),
				})
				setIsLoading(false)
				return
			}

			// Simulate success
			setSuccessMessage(t('success.password_updated'))

			// Redirect to sign in after success
			setTimeout(() => {
				window.location.href = '/signin'
			}, 2000)
		} catch (err) {
			// Error occurred during password reset
			setErrors({
				general: t('errors.update_failed'),
			})
		} finally {
			setIsLoading(false)
		}
	}

	const renderPasswordToggle = (show: boolean, toggle: () => void) => (
		<motion.button
			type="button"
			className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
			onClick={toggle}
			aria-label={show ? 'Hide password' : 'Show password'}
		>
			{show ? (
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
	)

	return (
		<div className="min-h-screen text-black">
			<div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
				{/* LEFT: image */}
				<motion.div
					className="hidden md:block relative h-full w-full"
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
				>
					<Image src={LEFT_IMAGE} alt="campus" fill className="object-cover" />
				</motion.div>

				{/* RIGHT: panel */}
				<motion.div
					className="flex items-center justify-center rounded-tl-[150px] bg-white"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<div className="w-full max-w-3xl p-12 relative">
						{/* quarter-circle curve */}
						<div className="absolute w-[420px] bg-white" />

						<motion.div
							className="relative z-10 max-w-2xl ml-12"
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
								{t('title')}
							</motion.h1>

							<motion.p
								className="text-sm text-gray-500 mb-8"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.7, delay: 0.5 }}
							>
								{t('subtitle')}
							</motion.p>

							{/* Success Message */}
							{successMessage && (
								<motion.div
									className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center"
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

							{/* General Error Message */}
							{errors.general && (
								<motion.div
									className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ type: 'spring', stiffness: 100 }}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-red-600 mr-2"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="font-medium">{errors.general}</span>
								</motion.div>
							)}

							<motion.form
								onSubmit={handlePasswordReset}
								className="space-y-6"
								variants={containerVariants}
								initial="hidden"
								animate={animateForm ? 'visible' : 'hidden'}
							>
								{/* New Password */}
								<motion.div variants={itemVariants}>
									<PasswordField
										label="New Password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										onValidChange={setNewPasswordIsValid}
										placeholder="Enter your new password"
										error={errors.newPassword}
										required
										showCriteria={true}
									/>
								</motion.div>

								{/* Confirm New Password */}
								<motion.div
									className="grid grid-cols-12 items-center gap-4"
									variants={itemVariants}
								>
									<label className="col-span-3 text-sm font-medium text-gray-700">
										{t('form.confirm_password.label')}{' '}
										<span className="text-red-500">*</span>
									</label>
									<div className="col-span-9 relative">
										<Input
											value={confirmNewPassword}
											onChange={(e) => setConfirmNewPassword(e.target.value)}
											type={showConfirmNewPassword ? 'text' : 'password'}
											placeholder={t('form.confirm_password.placeholder')}
											aria-label={t('form.confirm_password.label')}
											variant="signin"
											error={errors.confirmNewPassword}
										/>
										{renderPasswordToggle(showConfirmNewPassword, () =>
											setShowConfirmNewPassword(!showConfirmNewPassword)
										)}
									</div>
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
										{isLoading ? t('buttons.submitting') : t('buttons.submit')}
									</motion.button>
								</motion.div>

								<motion.p
									className="text-center text-sm text-gray-500 mt-2"
									variants={itemVariants}
								>
									{t('links.remember_password')}{' '}
									<Link href="/signin">
										<motion.span
											className="text-[#126E64] font-medium hover:underline inline-block"
											whileHover={{
												scale: 1.05,
												color: '#0D504A',
												transition: { duration: 0.2 },
											}}
										>
											{t('buttons.back_to_signin')}
										</motion.span>
									</Link>
								</motion.p>
							</motion.form>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</div>
	)
}

export default ForgotPassword
