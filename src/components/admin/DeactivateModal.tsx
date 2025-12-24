import Modal from '@/components/ui/modals/Modal'
import { AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'
import { Button, Input } from '@/components/ui'

interface DeactivateModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: (reason: string) => Promise<void>
	userName: string
	userEmail: string
	isLoading?: boolean
}

export const DeactivateModal: React.FC<DeactivateModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	userName,
	userEmail,
	isLoading = false,
}) => {
	const [reason, setReason] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!reason.trim()) {
			alert('Please provide a deactivation reason')
			return
		}

		await onConfirm(reason.trim())
		setReason('')
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Deactivate User"
			maxWidth="md"
			showCloseButton={!isLoading}
		>
			<form onSubmit={handleSubmit}>
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="text-sm font-medium text-gray-900">{userName}</div>
					<div className="text-sm text-gray-600">{userEmail}</div>
				</div>

				<div className="mb-6">
					<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
						<AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-red-900 mb-2">
								Are you sure you want to deactivate this user?
							</h4>
							<p className="text-sm text-red-800">
								This will prevent the user from accessing the platform. They
								will be notified via email about this action.
							</p>
						</div>
					</div>

					<div>
						<label
							htmlFor="deactivate-reason"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Reason for Deactivation <span className="text-red-500">*</span>
						</label>
						<textarea
							id="deactivate-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Explain why this user is being deactivated..."
							rows={4}
							required
							disabled={isLoading}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						<p className="mt-2 text-xs text-gray-500">
							This reason will be included in the email sent to the user.
						</p>
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						type="button"
						onClick={onClose}
						variant="outline"
						className="flex-1"
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						className="flex-1 bg-[#E20000] hover:bg-[#cc0000] text-white"
						disabled={isLoading || !reason.trim()}
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Deactivating...
							</div>
						) : (
							'Deactivate User'
						)}
					</Button>
				</div>
			</form>
		</Modal>
	)
}
