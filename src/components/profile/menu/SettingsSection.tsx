'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'

interface SettingsSectionProps {
	profile: any
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
	profile,
}) => {
	const [notifications, setNotifications] = useState({
		email: true,
		push: false,
		sms: true,
		marketing: false,
	})

	const [privacy, setPrivacy] = useState({
		profileVisibility: 'public',
		showEmail: false,
		showPhone: false,
	})

	const handleNotificationChange = (key: string, value: boolean) => {
		setNotifications((prev) => ({ ...prev, [key]: value }))
	}

	const handlePrivacyChange = (key: string, value: string) => {
		setPrivacy((prev) => ({ ...prev, [key]: value }))
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Settings</h2>
				<p className="text-muted-foreground">
					Manage your account settings and preferences
				</p>
			</div>

			{/* Account Settings */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">Account Settings</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Email Address</p>
								<p className="text-sm text-muted-foreground">
									{profile?.user?.email}
								</p>
							</div>
							<Button variant="outline" size="sm">
								Change Email
							</Button>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Password</p>
								<p className="text-sm text-muted-foreground">
									Last changed 3 months ago
								</p>
							</div>
							<Button variant="outline" size="sm">
								Change Password
							</Button>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Two-Factor Authentication</p>
								<p className="text-sm text-muted-foreground">
									Add an extra layer of security
								</p>
							</div>
							<Button variant="outline" size="sm">
								Enable 2FA
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notification Settings */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">
						Notification Preferences
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Email Notifications</p>
								<p className="text-sm text-muted-foreground">
									Receive updates via email
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={notifications.email}
									onChange={(e) =>
										handleNotificationChange('email', e.target.checked)
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Push Notifications</p>
								<p className="text-sm text-muted-foreground">
									Receive push notifications
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={notifications.push}
									onChange={(e) =>
										handleNotificationChange('push', e.target.checked)
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">SMS Notifications</p>
								<p className="text-sm text-muted-foreground">
									Receive SMS updates
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={notifications.sms}
									onChange={(e) =>
										handleNotificationChange('sms', e.target.checked)
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Marketing Emails</p>
								<p className="text-sm text-muted-foreground">
									Receive promotional content
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={notifications.marketing}
									onChange={(e) =>
										handleNotificationChange('marketing', e.target.checked)
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Privacy Settings */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Profile Visibility
							</label>
							<select
								value={privacy.profileVisibility}
								onChange={(e) =>
									handlePrivacyChange('profileVisibility', e.target.value)
								}
								className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
								<option value="friends">Friends Only</option>
							</select>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Show Email Address</p>
								<p className="text-sm text-muted-foreground">
									Display email on your profile
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={privacy.showEmail}
									onChange={(e) =>
										setPrivacy((prev) => ({
											...prev,
											showEmail: e.target.checked,
										}))
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Show Phone Number</p>
								<p className="text-sm text-muted-foreground">
									Display phone on your profile
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={privacy.showPhone}
									onChange={(e) =>
										setPrivacy((prev) => ({
											...prev,
											showPhone: e.target.checked,
										}))
									}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-red-200">
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4 text-red-600">
						Danger Zone
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Delete Account</p>
								<p className="text-sm text-muted-foreground">
									Permanently delete your account and all data
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="border-red-300 text-red-600 hover:bg-red-50"
							>
								Delete Account
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
