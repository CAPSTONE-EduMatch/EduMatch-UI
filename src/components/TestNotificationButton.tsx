'use client'

import { useState } from 'react'

export function TestNotificationButton() {
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')

	const sendTestNotification = async (type: string) => {
		setIsLoading(true)
		setMessage('')

		try {
			const response = await fetch('/api/notifications/test', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ type }),
			})

			const data = await response.json()

			if (data.success) {
				setMessage(`✅ ${data.message}`)
			} else {
				setMessage(`❌ ${data.error}`)
			}
		} catch (error) {
			setMessage(`❌ Error: ${error}`)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="p-4 border rounded-lg bg-gray-50">
			<h3 className="text-lg font-semibold mb-4">Test Notifications</h3>

			<div className="space-y-2">
				<button
					onClick={() => sendTestNotification('WELCOME')}
					disabled={isLoading}
					className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					{isLoading ? 'Sending...' : 'Send Welcome Notification'}
				</button>

				<button
					onClick={() => sendTestNotification('PROFILE_CREATED')}
					disabled={isLoading}
					className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
				>
					{isLoading ? 'Sending...' : 'Send Profile Created Notification'}
				</button>
			</div>

			{message && (
				<div className="mt-4 p-2 bg-white border rounded">
					<p className="text-sm">{message}</p>
				</div>
			)}
		</div>
	)
}
