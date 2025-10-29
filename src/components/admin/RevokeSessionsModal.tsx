import Modal from '@/components/ui/modals/Modal'
import { AlertTriangle, LogOut } from 'lucide-react'
import React from 'react'

interface RevokeSessionsModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => Promise<void>
	userName: string
	userEmail: string
	isLoading?: boolean
}

export const RevokeSessionsModal: React.FC<RevokeSessionsModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	userName,
	userEmail,
	isLoading = false,
}) => {
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		await onConfirm()
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Revoke All Sessions"
			maxWidth="md"
			showCloseButton={!isLoading}
		>
			<form onSubmit={handleSubmit}>
				{/* User Info */}
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="text-sm font-medium text-gray-900">{userName}</div>
					<div className="text-sm text-gray-600">{userEmail}</div>
				</div>

				{/* Warning Message */}
				<div className="mb-6">
					<div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
						<AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-orange-900 mb-2">
								Are you sure you want to revoke all sessions?
							</h4>
							<p className="text-sm text-orange-800 mb-2">
								This action will immediately:
							</p>
							<ul className="ml-4 text-sm text-orange-800 list-disc space-y-1">
								<li>Log out the user from all devices and browsers</li>
								<li>Invalidate all active sessions</li>
								<li>Require the user to log in again</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading}
						className="flex-1 px-6 py-3 bg-[#8B5CF6] text-white rounded-full font-semibold hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
					>
						{isLoading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>Revoking...</span>
							</>
						) : (
							<>
								<LogOut className="w-4 h-4" />
								<span>Revoke Sessions</span>
							</>
						)}
					</button>
				</div>
			</form>
		</Modal>
	)
}
