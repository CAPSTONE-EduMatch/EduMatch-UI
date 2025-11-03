'use client'

import React, { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { Loader2 } from 'lucide-react'

interface UpdateApplicationModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (message: string) => Promise<void>
	applicantName?: string
}

export const UpdateApplicationModal: React.FC<UpdateApplicationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	applicantName,
}) => {
	const [message, setMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async () => {
		if (!message.trim()) {
			setError('Please enter a message to the applicant')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			await onSubmit(message.trim())
			setMessage('')
			onClose()
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to send update request'
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleClose = () => {
		if (!isSubmitting) {
			setMessage('')
			setError(null)
			onClose()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Request Update from Applicant"
			maxWidth="lg"
		>
			<div className="space-y-6">
				{/* Instructions */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-sm text-blue-900">
						Please provide clear instructions on what information or documents
						the applicant needs to provide or update. This message will be sent
						to the applicant, and the application status will be set to
						&quot;REVIEWED&quot;.
					</p>
				</div>

				{/* Message Input */}
				<div className="space-y-2">
					<label
						htmlFor="update-message"
						className="block text-sm font-medium text-gray-700"
					>
						Message to Applicant
						{applicantName && (
							<span className="text-gray-500 ml-1">(to {applicantName})</span>
						)}
					</label>
					<textarea
						id="update-message"
						value={message}
						onChange={(e) => {
							setMessage(e.target.value)
							setError(null)
						}}
						placeholder="Enter the information you need from the applicant..."
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
						rows={6}
						disabled={isSubmitting}
					/>
					{error && <p className="text-sm text-red-600 mt-1">{error}</p>}
					<p className="text-xs text-gray-500 mt-1">
						{message.length} characters
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
					<Button
						onClick={handleClose}
						variant="outline"
						disabled={isSubmitting}
						size="md"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !message.trim()}
						className="bg-blue-500 hover:bg-blue-600 text-white"
						size="md"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Sending...
							</>
						) : (
							'Send Update Request'
						)}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
