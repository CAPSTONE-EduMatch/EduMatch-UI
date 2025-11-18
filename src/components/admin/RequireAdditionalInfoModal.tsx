import Modal from '@/components/ui/modals/Modal'
import { AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'

interface RequireAdditionalInfoModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: (note: string) => Promise<void>
	userName: string
	userEmail: string
	isLoading?: boolean
}

export const RequireAdditionalInfoModal: React.FC<
	RequireAdditionalInfoModalProps
> = ({
	isOpen,
	onClose,
	onConfirm,
	userName,
	userEmail,
	isLoading = false,
}) => {
	const [note, setNote] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!note.trim()) {
			alert('Please provide a note for the institution')
			return
		}

		await onConfirm(note.trim())
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Require Additional Information"
			maxWidth="md"
			showCloseButton={!isLoading}
		>
			<form onSubmit={handleSubmit}>
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="text-sm font-medium text-gray-900">{userName}</div>
					<div className="text-sm text-gray-600">{userEmail}</div>
				</div>

				<div className="mb-6">
					<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-blue-900 mb-2">
								Request Additional Information
							</h4>
							<p className="text-sm text-blue-800">
								This will notify the institution that they need to provide
								additional information. Please include specific details about
								what information is required.
							</p>
						</div>
					</div>
				</div>

				<div className="mb-6">
					<label
						htmlFor="note"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Note for Institution *
					</label>
					<textarea
						id="note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Please specify what additional information is required..."
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
						rows={4}
						required
						disabled={isLoading}
					/>
				</div>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading || !note.trim()}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Sending...' : 'Send Request'}
					</button>
				</div>
			</form>
		</Modal>
	)
}
