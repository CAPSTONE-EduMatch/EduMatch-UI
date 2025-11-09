'use client'

import { PasswordChangeSection } from '@/components/profile/shared/PasswordChangeSection'
import { Button } from '@/components/ui'
import { ApiService } from '@/services/api/axios-config'
import React, { useEffect, useState } from 'react'

interface InstitutionSettingsSectionProps {
	profile: any
}

export const InstitutionSettingsSection: React.FC<
	InstitutionSettingsSectionProps
> = ({ profile }) => {
	const [showPassword, setShowPassword] = useState(false)
	const [notifications, setNotifications] = useState({
		applicationStatus: true,
		wishlistDeadline: true,
		payment: true,
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

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
			console.error('Failed to update notification settings:', error)
			// Revert on error
			setNotifications(notifications)
			alert('Failed to update notification settings. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteAccount = () => {
		// Handle delete account logic
		console.log('Delete account clicked')
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className=" mx-auto sm:px-6 lg:px-8 space-y-8">
				{/* Account Information Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Account Information
					</h2>
					<p className="text-gray-600 mb-8">
						Manage your personal information and account settings. Keep your
						details up to date for the best experience.
					</p>

					<div className="space-y-6">
						{/* Email Field */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Email
							</label>
							<input
								type="email"
								value={profile?.user?.email || profile?.email || ''}
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
						Notification Preferences
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
										New Application received
									</h3>
									<p className="text-gray-600 text-sm mt-1">
										Get notified when a new applicant submits an application to
										your post.
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
										Document updated
									</h3>
									<p className="text-gray-600 text-sm mt-1">
										Get notified when an applicant uploads or updates required
										documents.
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
									<h3 className="text-lg font-medium text-gray-900">Payment</h3>
									<p className="text-gray-600 text-sm mt-1">
										Get email notifications 3 days before membership fee payment
										is due
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
						Delete account
					</h2>
					<p className="text-gray-600 mb-6">
						Permanently remove your account and all associated data. This action
						cannot be undone and will:
					</p>

					{/* Consequences List */}
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<ul className="space-y-2">
							<li className="text-red-700 text-sm flex items-start">
								<span className="mr-2">•</span>
								Delete your profile and personal information
							</li>
							<li className="text-red-700 text-sm flex items-start">
								<span className="mr-2">•</span>
								Remove all your applications and saved opportunities
							</li>
							<li className="text-red-700 text-sm flex items-start">
								<span className="mr-2">•</span>
								Cancel any active subscriptions
							</li>
							<li className="text-red-700 text-sm flex items-start">
								<span className="mr-2">•</span>
								Permanently delete your account history
							</li>
						</ul>
					</div>

					{/* Delete Button */}
					<Button
						onClick={handleDeleteAccount}
						className=" border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
						variant="outline"
					>
						Delete your account
					</Button>
				</div>
			</div>
		</div>
	)
}
