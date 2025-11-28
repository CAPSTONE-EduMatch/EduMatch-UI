'use client'

import PasswordCriteriaChecker, {
	PasswordCriteriaType,
} from '@/components/auth/PasswordCriteriaChecker'
import { Button } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { authClient } from '@/config/auth-client'
import { NotificationType, SQSService } from '@/config/sqs-config'
import { clearSessionCache } from '@/services/messaging/appsync-client'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface PasswordChangeSectionProps {
	profile: any
	showPassword: boolean
	setShowPassword: (value: boolean) => void
}

export const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
	profile,
	showPassword,
	setShowPassword,
}) => {
	const router = useRouter()

	// Password reset modal state
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [passwordChanging, setPasswordChanging] = useState(false)
	const [passwordError, setPasswordError] = useState('')
	const [passwordSuccess, setPasswordSuccess] = useState(false)
	const [isGoogleUser, setIsGoogleUser] = useState(false)
	const [checkingAuthProvider, setCheckingAuthProvider] = useState(true)

	// Password criteria validation state
	const [passwordCriteria, setPasswordCriteria] =
		useState<PasswordCriteriaType>({
			length: false,
			uppercase: false,
			lowercase: false,
			number: false,
			special: false,
		})
	const [isPasswordValid, setIsPasswordValid] = useState(false)

	// Check if user is using Google authentication
	useEffect(() => {
		const checkAuthProvider = async () => {
			if (!profile?.user?.id) {
				setCheckingAuthProvider(false)
				return
			}

			try {
				const response = await fetch('/api/user/auth-provider', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ userId: profile.user.id }),
				})

				if (response.ok) {
					const data = await response.json()
					setIsGoogleUser(data.isGoogleUser || false)
				} else {
					// If API call fails, assume user can change password
					setIsGoogleUser(false)
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to check auth provider:', error)
			} finally {
				setCheckingAuthProvider(false)
			}
		}

		checkAuthProvider()
	}, [profile?.user?.id])

	// Validate new password against criteria
	useEffect(() => {
		const checkPasswordCriteria = (pass: string) => {
			const criteria = {
				length: pass.length >= 12,
				uppercase: /[A-Z]/.test(pass),
				lowercase: /[a-z]/.test(pass),
				number: /[0-9]/.test(pass),
				special: /[^A-Za-z0-9]/.test(pass),
			}

			setPasswordCriteria(criteria)

			// Check if all criteria are met
			const isValid = Object.values(criteria).every(Boolean)
			setIsPasswordValid(isValid)
		}

		checkPasswordCriteria(passwordForm.newPassword)
	}, [passwordForm.newPassword])

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setPasswordError('')
		setPasswordSuccess(false)

		// Validate form
		if (!passwordForm.currentPassword || !passwordForm.newPassword) {
			setPasswordError('Please fill in all required fields')
			return
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('New passwords do not match')
			return
		}

		if (passwordForm.newPassword === passwordForm.currentPassword) {
			setPasswordError(
				'New password must be different from your current password'
			)
			return
		}

		if (!isPasswordValid) {
			setPasswordError('New password does not meet all security requirements')
			return
		}

		try {
			setPasswordChanging(true)
			const { data, error } = await authClient.changePassword({
				newPassword: passwordForm.newPassword,
				currentPassword: passwordForm.currentPassword,
				revokeOtherSessions: true,
			})

			if (error) {
				setPasswordError(error.message || 'Failed to change password')
				return
			}

			if (data) {
				setPasswordSuccess(true)
				setPasswordForm({
					currentPassword: '',
					newPassword: '',
					confirmPassword: '',
				})

				// Close modal after a brief delay to show success message, then logout
				setTimeout(async () => {
					setIsPasswordModalOpen(false)
					setPasswordSuccess(false)

					// Send password change notification email
					try {
						await SQSService.sendEmailMessage({
							id: `password-change-${profile.user.id}-${Date.now()}`,
							type: NotificationType.PASSWORD_CHANGED,
							userId: profile.user.id,
							userEmail: profile.user.email,
							timestamp: new Date().toISOString(),
							metadata: {
								firstName: profile.user.firstName || '',
								lastName: profile.user.lastName || '',
								changeTime: new Date().toISOString(),
							},
						})
					} catch (emailError) {
						// Email sending failure shouldn't block the password change flow
						// eslint-disable-next-line no-console
						console.error('Failed to send password change email:', emailError)
					}

					// Logout user after password change (same as logout button)
					try {
						// Clear AppSync session cache
						clearSessionCache()

						// Clear Better Auth session
						await authClient.signOut()

						// Clear browser storage
						localStorage.clear()
						sessionStorage.clear()

						// Force full page reload to signin page (like logout does)
						window.location.href = '/signin'
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error('Failed to logout after password change:', error)
						// Still redirect even if logout fails
						window.location.href = '/signin'
					}
				}, 2000)
			}
		} catch (err: any) {
			setPasswordError(
				err?.message || 'An unexpected error occurred. Please try again.'
			)
		} finally {
			setPasswordChanging(false)
		}
	}

	const openPasswordModal = () => {
		setIsPasswordModalOpen(true)
		setPasswordError('')
		setPasswordSuccess(false)
		setPasswordForm({
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		})
	}

	const closePasswordModal = () => {
		setIsPasswordModalOpen(false)
		setPasswordError('')
		setPasswordSuccess(false)
		setPasswordForm({
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		})
	}

	return (
		<>
			{/* Password Field */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Password
				</label>
				{checkingAuthProvider ? (
					<div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 flex items-center">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
						Checking authentication method...
					</div>
				) : isGoogleUser ? (
					<div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
						<div className="flex items-center">
							<svg
								className="w-5 h-5 mr-2"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
							Signed in with Google
						</div>
						<p className="text-sm text-gray-500 mt-1">
							Password management is handled by Google. You can change your
							password in your Google account settings.
						</p>
					</div>
				) : (
					<>
						<div className="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								value="********************"
								readOnly
								className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showPassword ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
						<div className="text-right mt-2">
							<button
								type="button"
								onClick={openPasswordModal}
								className="text-green-600 hover:text-green-700 text-sm font-medium"
							>
								Change password
							</button>
						</div>
					</>
				)}
			</div>

			{/* Password Change Modal - Only show for non-Google users */}
			{!isGoogleUser && (
				<Modal
					isOpen={isPasswordModalOpen}
					onClose={closePasswordModal}
					title="Change Password"
					maxWidth="md"
				>
					<form onSubmit={handlePasswordSubmit} className="space-y-6">
						{/* Success Message */}
						{passwordSuccess && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-center">
									<svg
										className="w-5 h-5 text-green-500 mr-2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
									<p className="text-green-700 font-medium">
										Password changed successfully!
									</p>
								</div>
							</div>
						)}

						{/* Error Message */}
						{passwordError && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-center">
									<svg
										className="w-5 h-5 text-red-500 mr-2"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
									<p className="text-red-700">{passwordError}</p>
								</div>
							</div>
						)}

						{/* Current Password */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Current Password *
							</label>
							<div className="relative">
								<input
									type={showCurrentPassword ? 'text' : 'password'}
									value={passwordForm.currentPassword}
									onChange={(e) =>
										setPasswordForm({
											...passwordForm,
											currentPassword: e.target.value,
										})
									}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent pr-12"
									placeholder="Enter your current password"
								/>
								<button
									type="button"
									onClick={() => setShowCurrentPassword(!showCurrentPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
								>
									{showCurrentPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>

						{/* New Password */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								New Password *
							</label>
							<div className="relative">
								<input
									type={showNewPassword ? 'text' : 'password'}
									value={passwordForm.newPassword}
									onChange={(e) =>
										setPasswordForm({
											...passwordForm,
											newPassword: e.target.value,
										})
									}
									required
									minLength={12}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent pr-12"
									placeholder="Enter your new password"
								/>
								<button
									type="button"
									onClick={() => setShowNewPassword(!showNewPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
								>
									{showNewPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>

							{/* Password Criteria Checker */}
							{passwordForm.newPassword.length > 0 && (
								<div className="mt-2">
									<PasswordCriteriaChecker
										criteria={passwordCriteria}
										hasInput={passwordForm.newPassword.length > 0}
									/>
								</div>
							)}
						</div>

						{/* Confirm Password */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Confirm New Password *
							</label>
							<div className="relative">
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									value={passwordForm.confirmPassword}
									onChange={(e) =>
										setPasswordForm({
											...passwordForm,
											confirmPassword: e.target.value,
										})
									}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent pr-12"
									placeholder="Confirm your new password"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
								>
									{showConfirmPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<Button
								type="button"
								onClick={closePasswordModal}
								variant="outline"
								className="flex-1 py-3"
								disabled={passwordChanging}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="flex-1 py-3 bg-[#126E64] hover:bg-[#0f5a52] text-white disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={
									passwordChanging ||
									passwordSuccess ||
									!passwordForm.currentPassword ||
									!passwordForm.newPassword ||
									!passwordForm.confirmPassword ||
									!isPasswordValid ||
									passwordForm.newPassword !== passwordForm.confirmPassword
								}
							>
								{passwordChanging ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Changing...
									</div>
								) : passwordSuccess ? (
									'Success!'
								) : (
									'Change Password'
								)}
							</Button>
						</div>
					</form>
				</Modal>
			)}
		</>
	)
}
