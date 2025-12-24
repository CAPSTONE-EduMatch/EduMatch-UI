'use client'

import { PasswordChangeSection } from '@/components/profile/shared/PasswordChangeSection'
import { Button } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { authClient } from '@/config/auth-client'
import { ApiService } from '@/services/api/axios-config'
import { clearSessionCache } from '@/services/messaging/appsync-client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface SettingsSectionProps {
	profile: any
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
	profile,
}) => {
	const router = useRouter()
	const t = useTranslations('settings_section')
	const [showPassword, setShowPassword] = useState(false)
	const [notifications, setNotifications] = useState({
		applicationStatus: true,
		wishlistDeadline: true,
		payment: true,
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	// Delete account modal state
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [deleteConfirmation, setDeleteConfirmation] = useState('')
	const [deletingAccount, setDeletingAccount] = useState(false)
	// eslint-disable-next-line no-unused-vars
	const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
	const [checkingSubscription, setCheckingSubscription] = useState(false)
	// Subscription warning modal state
	const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false)

	// Fetch notification settings on mount
	useEffect(() => {
		const fetchNotificationSettings = async () => {
			try {
				setLoading(true)
				const response = await ApiService.getNotificationSettings()
				if (response.success && response.settings) {
					setNotifications({
						applicationStatus: response.settings.applicationStatus ?? true,
						wishlistDeadline: response.settings.wishlistDeadline ?? true,
						payment: response.settings.payment ?? true,
					})
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to fetch notification settings:', error)
				// Keep default values on error
			} finally {
				setLoading(false)
			}
		}

		fetchNotificationSettings()
	}, [])

	const handleNotificationChange = async (key: string, value: boolean) => {
		// Optimistically update UI
		const updatedNotifications = { ...notifications, [key]: value }
		setNotifications(updatedNotifications)

		// Save to database
		try {
			setSaving(true)
			await ApiService.updateNotificationSettings({
				applicationStatus: updatedNotifications.applicationStatus,
				wishlistDeadline: updatedNotifications.wishlistDeadline,
				payment: updatedNotifications.payment,
			})
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to update notification settings:', error)
			// Revert on error
			setNotifications(notifications)
			alert('Failed to update notification settings. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	// Check for active subscriptions
	const checkActiveSubscriptions = async () => {
		try {
			setCheckingSubscription(true)
			const { data } = await authClient.subscription.list()

			if (data && data.length > 0) {
				// Check if any subscription is active
				const activeSubscriptions = data.filter(
					(sub: any) =>
						sub.status === 'active' ||
						sub.status === 'trialing' ||
						sub.status === 'past_due'
				)
				setHasActiveSubscription(activeSubscriptions.length > 0)
				return activeSubscriptions.length > 0
			}

			setHasActiveSubscription(false)
			return false
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to check subscriptions:', error)
			// On error, assume no active subscription to not block the user
			setHasActiveSubscription(false)
			return false
		} finally {
			setCheckingSubscription(false)
		}
	}

	const handleDeleteAccount = async () => {
		// Check for active subscriptions first
		const hasActive = await checkActiveSubscriptions()

		if (hasActive) {
			setShowSubscriptionWarning(true)
			return
		}

		setIsDeleteModalOpen(true)
	}

	const handleDeleteAccountConfirm = async () => {
		if (deleteConfirmation !== 'DELETE') {
			alert('Please type "DELETE" to confirm account deletion')
			return
		}

		try {
			setDeletingAccount(true)
			const response = await fetch('/api/user/delete-account', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const data = await response.json()

			if (response.ok && data.success) {
				// Logout user after account deletion (same as logout button)
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
					console.error('Failed to logout after account deletion:', error)
					// Still redirect even if logout fails
					window.location.href = '/signin'
				}
			} else {
				alert(data.message || 'Failed to delete account. Please try again.')
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to delete account:', error)
			alert('Failed to delete account. Please try again.')
		} finally {
			setDeletingAccount(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className=" mx-auto sm:px-6 lg:px-8 space-y-8">
				{/* Account Information Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{t('account_info.title')}
					</h2>
					<p className="text-gray-600 mb-8">{t('account_info.description')}</p>

					<div className="space-y-6">
						{/* Email Field */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{t('account_info.email.label')}
							</label>
							<input
								type="email"
								value={profile?.user?.email || ''}
								readOnly
								className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Password Field */}
						<PasswordChangeSection
							profile={profile}
							showPassword={showPassword}
							setShowPassword={setShowPassword}
						/>
					</div>
				</div>

				{/* Notification Preferences Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{t('notifications.title')}
					</h2>

					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
						</div>
					) : (
						<div className="space-y-6 mt-6">
							{/* Application Status Updates */}
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3 className="text-lg font-medium text-gray-900">
										{t('notifications.application_status.title')}
									</h3>
									<p className="text-gray-600 text-sm mt-1">
										{t('notifications.application_status.description')}
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={notifications.applicationStatus}
										onChange={(e) =>
											handleNotificationChange(
												'applicationStatus',
												e.target.checked
											)
										}
										disabled={saving}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50"></div>
								</label>
							</div>

							{/* Deadline for Wishlist Items */}
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3 className="text-lg font-medium text-gray-900">
										{t('notifications.wishlist_deadline.title')}
									</h3>
									<p className="text-gray-600 text-sm mt-1">
										{t('notifications.wishlist_deadline.description')}
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={notifications.wishlistDeadline}
										onChange={(e) =>
											handleNotificationChange(
												'wishlistDeadline',
												e.target.checked
											)
										}
										disabled={saving}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50"></div>
								</label>
							</div>

							{/* Payment */}
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3 className="text-lg font-medium text-gray-900">
										{t('notifications.payment.title')}
									</h3>
									<p className="text-gray-600 text-sm mt-1">
										{t('notifications.payment.description')}
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={notifications.payment}
										onChange={(e) =>
											handleNotificationChange('payment', e.target.checked)
										}
										disabled={saving}
										className="sr-only peer"
									/>
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50"></div>
								</label>
							</div>
						</div>
					)}
				</div>

				{/* Delete Account Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{t('delete_account.title')}
					</h2>
					<p className="text-gray-600 mb-6">
						{t('delete_account.description')}
					</p>

					{/* Consequences List */}
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<ul className="space-y-2">
							{(t.raw('delete_account.consequences') as string[]).map(
								(consequence, index) => (
									<li
										key={index}
										className="text-red-700 text-sm flex items-start"
									>
										<span className="mr-2">•</span>
										{consequence}
									</li>
								)
							)}
						</ul>
					</div>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<p className="text-blue-800 text-sm">
							<strong>{t('delete_account.note').split(':')[0]}:</strong>{' '}
							{t('delete_account.note').split(':').slice(1).join(':')}
						</p>
					</div>

					{/* Delete Button */}
					<Button
						onClick={handleDeleteAccount}
						disabled={checkingSubscription}
						className=" border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						variant="outline"
					>
						{checkingSubscription ? (
							<div className="flex items-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
								{t('delete_account.checking')}
							</div>
						) : (
							t('delete_account.button')
						)}
					</Button>
				</div>
			</div>

			{/* Delete Account Confirmation Modal */}
			{isDeleteModalOpen && (
				<Modal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					title={t('delete_account.modal.title')}
				>
					<div className="space-y-6">
						{/* Warning Icon */}
						<div className="flex justify-center">
							<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
								<svg
									className="w-8 h-8 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							</div>
						</div>

						{/* Warning Message */}
						<div className="text-center">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{t('delete_account.modal.confirmation_title')}
							</h3>
							<p className="text-gray-600 mb-4">
								{t('delete_account.modal.confirmation_message')}
							</p>
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
								<p className="text-sm text-red-800 font-medium mb-2">
									{t('delete_account.modal.data_warning')}
								</p>
								<ul className="text-sm text-red-700 list-disc list-inside space-y-1">
									{(t.raw('delete_account.modal.data_list') as string[]).map(
										(item, index) => (
											<li key={index}>{item}</li>
										)
									)}
								</ul>
							</div>
						</div>

						{/* Confirmation Input */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{t('delete_account.modal.type_delete')}
							</label>
							<input
								type="text"
								value={deleteConfirmation}
								onChange={(e) => setDeleteConfirmation(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
								placeholder={t('delete_account.modal.placeholder')}
								disabled={deletingAccount}
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<Button
								type="button"
								onClick={() => setIsDeleteModalOpen(false)}
								variant="outline"
								className="flex-1 py-3"
								disabled={deletingAccount}
							>
								{t('delete_account.modal.cancel')}
							</Button>
							<Button
								type="button"
								onClick={handleDeleteAccountConfirm}
								className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
							>
								{deletingAccount ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										{t('delete_account.modal.deleting')}
									</div>
								) : (
									t('delete_account.modal.delete')
								)}
							</Button>
						</div>
					</div>
				</Modal>
			)}
			{/* Subscription Warning Modal */}
			{showSubscriptionWarning && (
				<Modal
					isOpen={showSubscriptionWarning}
					onClose={() => setShowSubscriptionWarning(false)}
					title={t('delete_account.subscription_warning.title')}
				>
					<div className="space-y-6">
						{/* Warning Icon */}
						<div className="flex justify-center">
							<div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
								<svg
									className="w-8 h-8 text-yellow-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							</div>
						</div>

						{/* Warning Message */}
						<div className="text-center">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{t('delete_account.subscription_warning.cannot_delete')}
							</h3>
							<p className="text-gray-600 mb-4">
								{t('delete_account.subscription_warning.message')}
							</p>
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
								<p className="text-sm text-yellow-800">
									<strong>
										{t('delete_account.subscription_warning.what_to_do')}
									</strong>
								</p>
								<ul className="text-sm text-yellow-700 list-disc list-inside mt-2 space-y-1">
									{(
										t.raw(
											'delete_account.subscription_warning.steps'
										) as string[]
									).map((step, index) => (
										<li key={index}>{step}</li>
									))}
								</ul>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<Button
								type="button"
								onClick={() => setShowSubscriptionWarning(false)}
								variant="outline"
								className="flex-1 py-3"
							>
								{t('delete_account.subscription_warning.cancel')}
							</Button>
							<Button
								type="button"
								onClick={() => {
									window.location.href = '/pricing'
								}}
								className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white"
							>
								{t('delete_account.subscription_warning.go_to_pricing')}
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
