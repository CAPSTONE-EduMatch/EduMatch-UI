'use client'

import { useState } from 'react'

const EMAIL_TYPES = [
	{ value: 'welcome', label: 'Welcome Email', description: 'New user signup' },
	{
		value: 'profile_created',
		label: 'Profile Created',
		description: 'Profile creation confirmation',
	},
	{
		value: 'payment_deadline',
		label: 'Payment Deadline',
		description: 'Payment deadline reminder',
	},
	{
		value: 'wishlist_deadline',
		label: 'Wishlist Deadline',
		description: 'Wishlist deadline reminder',
	},
	{
		value: 'application_status_submitted',
		label: 'Application Status - SUBMITTED',
		description: 'Application submitted (to applicant)',
	},
	{
		value: 'application_status_progressing',
		label: 'Application Status - PROGRESSING',
		description: 'Application in progress (to applicant)',
	},
	{
		value: 'application_status_accepted',
		label: 'Application Status - ACCEPTED',
		description: 'Application accepted (to applicant)',
	},
	{
		value: 'application_status_rejected',
		label: 'Application Status - REJECTED',
		description: 'Application rejected (to applicant)',
	},
	{
		value: 'new_application',
		label: 'New Application (Institution)',
		description: 'New application received (to institution)',
	},
	{
		value: 'post_status_published',
		label: 'Post Status - PUBLISHED',
		description: 'Post published (to institution)',
	},
	{
		value: 'post_status_rejected',
		label: 'Post Status - REJECTED',
		description: 'Post rejected (to institution)',
	},
	{
		value: 'post_status_closed',
		label: 'Post Status - CLOSED',
		description: 'Post closed (to institution)',
	},
	{
		value: 'institution_profile_approved',
		label: 'Institution Profile - APPROVED',
		description: 'Institution profile approved',
	},
	{
		value: 'institution_profile_rejected',
		label: 'Institution Profile - REJECTED',
		description: 'Institution profile rejected',
	},
	{
		value: 'institution_profile_require_update',
		label: 'Institution Profile - REQUIRE_UPDATE',
		description: 'Institution profile requires update',
	},
	{
		value: 'institution_profile_updated',
		label: 'Institution Profile - UPDATED',
		description: 'Institution profile updated',
	},
	{
		value: 'document_updated',
		label: 'Document Updated',
		description: 'Document upload notification',
	},
	{
		value: 'payment_success',
		label: 'Payment Success',
		description: 'Successful payment confirmation',
	},
	{
		value: 'payment_failed',
		label: 'Payment Failed',
		description: 'Failed payment notification',
	},
	{
		value: 'subscription_expiring',
		label: 'Subscription Expiring',
		description: 'Subscription expiration warning',
	},
	{
		value: 'user_banned',
		label: 'User Banned',
		description: 'Account suspension notification',
	},
	{
		value: 'session_revoked',
		label: 'Session Revoked',
		description: 'Session revocation security alert',
	},
	{
		value: 'password_changed',
		label: 'Password Changed',
		description: 'Password change notification',
	},
	{
		value: 'account_deleted',
		label: 'Account Deleted',
		description: 'Account deletion confirmation',
	},
]

export default function TestEmailPage() {
	const [emailType, setEmailType] = useState('welcome')
	const [emailAddress, setEmailAddress] = useState('')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		success: boolean
		message?: string
		error?: string
	} | null>(null)
	const [cronLoading, setCronLoading] = useState(false)
	const [cronResult, setCronResult] = useState<{
		success: boolean
		message?: string
		notificationsSent?: number
		errors?: string[]
		error?: string
		details?: {
			cronJob?: any
			notificationQueue?: any
			emailQueue?: any
		}
	} | null>(null)
	const [queueStatusLoading, setQueueStatusLoading] = useState(false)
	const [queueStatus, setQueueStatus] = useState<any>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setResult(null)

		try {
			const response = await fetch('/api/test/email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					type: emailType,
					to: emailAddress,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setResult({
					success: true,
					message: data.message || 'Email sent successfully!',
				})
			} else {
				setResult({
					success: false,
					error: data.error || 'Failed to send email',
				})
			}
		} catch (error) {
			setResult({
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred',
			})
		} finally {
			setLoading(false)
		}
	}

	const handleCronTest = async () => {
		setCronLoading(true)
		setCronResult(null)

		const details: {
			cronJob?: any
			notificationQueue?: any
			emailQueue?: any
		} = {}

		try {
			// Step 1: Trigger the cron job
			const cronResponse = await fetch('/api/cron/wishlist-deadlines', {
				method: 'GET',
			})

			const cronData = await cronResponse.json()
			details.cronJob = cronData

			if (!cronResponse.ok) {
				setCronResult({
					success: false,
					error: cronData.error || 'Failed to run cron job',
					details,
				})
				return
			}

			// Step 2: Process notification queue (forward to email queue)
			const notificationResponse = await fetch('/api/notifications/process', {
				method: 'POST',
			})
			const notificationData = await notificationResponse.json()
			details.notificationQueue = notificationData

			// Step 3: Process email queue (send emails)
			const emailProcessResponse = await fetch('/api/notifications/process', {
				method: 'PUT',
			})
			const emailProcessData = await emailProcessResponse.json()
			details.emailQueue = emailProcessData

			// Check if email processing had errors
			const hasEmailErrors = !emailProcessResponse.ok

			setCronResult({
				success: true,
				message: `Cron job completed. ${cronData.notificationsSent || 0} notifications found. ${
					hasEmailErrors
						? 'Email processing had errors - check details below.'
						: 'Emails processed.'
				}`,
				notificationsSent: cronData.notificationsSent || 0,
				errors: cronData.errors,
				details,
			})
		} catch (error) {
			setCronResult({
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred',
				details,
			})
		} finally {
			setCronLoading(false)
		}
	}

	const handleCheckQueueStatus = async () => {
		setQueueStatusLoading(true)
		setQueueStatus(null)

		try {
			const response = await fetch('/api/debug/queue-status')
			const data = await response.json()
			setQueueStatus(data)
		} catch (error) {
			setQueueStatus({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		} finally {
			setQueueStatusLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-3xl mx-auto">
				<div className="bg-white shadow rounded-lg p-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Email Template Tester
					</h1>
					<p className="text-gray-600 mb-8">
						Test all email templates by sending them to your email address
					</p>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="emailType"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Email Type
							</label>
							<select
								id="emailType"
								value={emailType}
								onChange={(e) => setEmailType(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								{EMAIL_TYPES.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label} - {type.description}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor="emailAddress"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Recipient Email
							</label>
							<input
								type="email"
								id="emailAddress"
								value={emailAddress}
								onChange={(e) => setEmailAddress(e.target.value)}
								placeholder="your-email@example.com"
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<button
							type="submit"
							disabled={loading || !emailAddress}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Sending...' : 'Send Test Email'}
						</button>
					</form>

					{result && (
						<div
							className={`mt-6 p-4 rounded-md ${
								result.success
									? 'bg-green-50 border border-green-200'
									: 'bg-red-50 border border-red-200'
							}`}
						>
							<div
								className={`flex ${
									result.success ? 'text-green-800' : 'text-red-800'
								}`}
							>
								<div className="flex-shrink-0">
									{result.success ? (
										<svg
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									) : (
										<svg
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									)}
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium">
										{result.success ? result.message : `Error: ${result.error}`}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Queue Status Check Section */}
					<div className="mt-8 pt-8 border-t border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Check SQS Queue Status
						</h2>
						<p className="text-sm text-gray-600 mb-4">
							Check what messages are currently in the notifications and emails
							queues. This helps debug why emails aren&apos;t being sent.
						</p>
						<button
							type="button"
							onClick={handleCheckQueueStatus}
							disabled={queueStatusLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{queueStatusLoading ? 'Checking...' : 'Check Queue Status'}
						</button>

						{queueStatus && (
							<div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
								<div className="space-y-4">
									<div>
										<h3 className="font-medium text-gray-900 mb-2">
											Notifications Queue
										</h3>
										<p className="text-sm text-gray-600">
											Messages: {queueStatus.notificationsQueue?.count || 0}
										</p>
										{queueStatus.notificationsQueue?.messages &&
											queueStatus.notificationsQueue.messages.length > 0 && (
												<div className="mt-2 text-xs bg-white p-2 rounded border">
													<pre className="whitespace-pre-wrap">
														{JSON.stringify(
															queueStatus.notificationsQueue.messages,
															null,
															2
														)}
													</pre>
												</div>
											)}
									</div>
									<div>
										<h3 className="font-medium text-gray-900 mb-2">
											Emails Queue
										</h3>
										<p className="text-sm text-gray-600">
											Messages: {queueStatus.emailsQueue?.count || 0}
										</p>
										{queueStatus.emailsQueue?.messages &&
											queueStatus.emailsQueue.messages.length > 0 && (
												<div className="mt-2 text-xs bg-white p-2 rounded border">
													<pre className="whitespace-pre-wrap">
														{JSON.stringify(
															queueStatus.emailsQueue.messages,
															null,
															2
														)}
													</pre>
												</div>
											)}
									</div>
									{queueStatus.note && (
										<p className="text-xs text-gray-500 italic">
											{queueStatus.note}
										</p>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Cron Job Test Section */}
					<div className="mt-8 pt-8 border-t border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Test Wishlist Deadline Cron Job
						</h2>
						<p className="text-sm text-gray-600 mb-4">
							This will run the wishlist deadline cron job, find wishlist items
							approaching their deadline (within 7 days), and send notifications
							and emails to users who have enabled wishlist deadline
							notifications.
						</p>
						<button
							type="button"
							onClick={handleCronTest}
							disabled={cronLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{cronLoading
								? 'Running Cron Job...'
								: 'Run Wishlist Deadline Cron Job'}
						</button>

						{cronResult && (
							<div
								className={`mt-6 p-4 rounded-md ${
									cronResult.success
										? 'bg-green-50 border border-green-200'
										: 'bg-red-50 border border-red-200'
								}`}
							>
								<div
									className={`flex ${
										cronResult.success ? 'text-green-800' : 'text-red-800'
									}`}
								>
									<div className="flex-shrink-0">
										{cronResult.success ? (
											<svg
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clipRule="evenodd"
												/>
											</svg>
										) : (
											<svg
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
													clipRule="evenodd"
												/>
											</svg>
										)}
									</div>
									<div className="ml-3 flex-1">
										<p className="text-sm font-medium">
											{cronResult.success
												? cronResult.message
												: `Error: ${cronResult.error}`}
										</p>
										{cronResult.success && (
											<div className="mt-2 text-sm space-y-2">
												<p>
													<strong>Notifications Found:</strong>{' '}
													{cronResult.notificationsSent || 0}
												</p>
												{cronResult.errors && cronResult.errors.length > 0 && (
													<div className="mt-2">
														<p className="font-medium text-yellow-800">
															Errors:
														</p>
														<ul className="list-disc list-inside text-yellow-700">
															{cronResult.errors.map((error, idx) => (
																<li key={idx}>{error}</li>
															))}
														</ul>
													</div>
												)}
												{cronResult.details && (
													<div className="mt-4 pt-4 border-t border-gray-300">
														<p className="font-medium mb-2">
															Processing Details:
														</p>
														<div className="space-y-2 text-xs">
															<div>
																<strong>Cron Job:</strong>{' '}
																<span className="text-gray-600">
																	{cronResult.details.cronJob?.message ||
																		'Completed'}
																</span>
															</div>
															<div>
																<strong>Notification Queue:</strong>{' '}
																<span
																	className={
																		cronResult.details.notificationQueue
																			?.success
																			? 'text-green-600'
																			: 'text-red-600'
																	}
																>
																	{cronResult.details.notificationQueue
																		?.message ||
																		cronResult.details.notificationQueue
																			?.error ||
																		'Unknown'}
																</span>
															</div>
															<div>
																<strong>Email Queue:</strong>{' '}
																<span
																	className={
																		cronResult.details.emailQueue?.success
																			? 'text-green-600'
																			: 'text-red-600'
																	}
																>
																	{cronResult.details.emailQueue?.message ||
																		cronResult.details.emailQueue?.error ||
																		'Unknown'}
																</span>
															</div>
															{(cronResult.details.emailQueue?.error ||
																cronResult.details.notificationQueue
																	?.error) && (
																<div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800">
																	<p className="font-medium">
																		⚠️ Email may not have been sent. Check
																		server logs for details.
																	</p>
																	{cronResult.details.emailQueue?.details && (
																		<p className="mt-1 text-xs">
																			{cronResult.details.emailQueue.details}
																		</p>
																	)}
																</div>
															)}
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="mt-8 pt-8 border-t border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Available Email Types
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{EMAIL_TYPES.map((type) => (
								<div
									key={type.value}
									className="p-4 bg-gray-50 rounded-lg border border-gray-200"
								>
									<h3 className="font-medium text-gray-900">{type.label}</h3>
									<p className="text-sm text-gray-600 mt-1">
										{type.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
