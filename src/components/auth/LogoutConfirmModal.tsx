'use client'

import { LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/modals/Modal'
import { Button } from '@/components/ui'

interface LogoutConfirmModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	isLoggingOut?: boolean
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	isLoggingOut = false,
}) => {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Confirm Logout"
			maxWidth="md"
			showCloseButton={!isLoggingOut}
		>
			<div className="space-y-6">
				{/* Warning Icon */}
				<div className="flex justify-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
						<LogOut className="w-8 h-8 text-red-600" />
					</div>
				</div>

				{/* Warning Message */}
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Are you sure you want to log out?
					</h3>
					<p className="text-gray-600 mb-4">
						You will need to sign in again to access your account.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-4 pt-4">
					<Button
						type="button"
						onClick={onClose}
						variant="outline"
						className="flex-1 py-3"
						disabled={isLoggingOut}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={onConfirm}
						className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isLoggingOut}
					>
						{isLoggingOut ? (
							<div className="flex items-center gap-2">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Logging out...
							</div>
						) : (
							'Log Out'
						)}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
