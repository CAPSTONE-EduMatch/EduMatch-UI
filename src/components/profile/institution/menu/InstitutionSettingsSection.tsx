'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'

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

	const handleNotificationChange = (key: string, value: boolean) => {
		setNotifications((prev) => ({ ...prev, [key]: value }))
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
								value="Example123@gmail.com"
								readOnly
								className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Password Field */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>
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
								<button className="text-green-600 hover:text-green-700 text-sm font-medium">
									Change password
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Notification Preferences Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Notification Preferences
					</h2>

					<div className="space-y-6 mt-6">
						{/* Application Status Updates */}
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-medium text-gray-900">
									Application status updates
								</h3>
								<p className="text-gray-600 text-sm mt-1">
									Get notified when your application status changes through
									email
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
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
							</label>
						</div>

						{/* Deadline for Wishlist Items */}
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-medium text-gray-900">
									Deadline for wishlist items
								</h3>
								<p className="text-gray-600 text-sm mt-1">
									Get email notifications when events in your wishlist are about
									to expire
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
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
							</label>
						</div>
					</div>
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
