import Modal from '@/components/ui/modals/Modal'
import { AlertTriangle, Shield } from 'lucide-react'
import React, { useState } from 'react'

interface BanUnbanModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: (banReason: string, banDuration?: number) => Promise<void>
	userName: string
	userEmail: string
	currentBanStatus: boolean
	currentBanReason?: string | null
	currentBanExpires?: Date | null
	isLoading?: boolean
}

export const BanUnbanModal: React.FC<BanUnbanModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	userName,
	userEmail,
	currentBanStatus,
	currentBanReason,
	currentBanExpires,
	isLoading = false,
}) => {
	const [banReason, setBanReason] = useState(currentBanReason || '')
	const [banDuration, setBanDuration] = useState<string>('30')
	const [isPermanent, setIsPermanent] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!currentBanStatus && !banReason.trim()) {
			alert('Please provide a ban reason')
			return
		}

		const duration = isPermanent ? undefined : parseInt(banDuration)
		await onConfirm(banReason.trim(), duration)
	}

	const formatBanExpiry = (expires: Date | null) => {
		if (!expires) return 'Permanent'
		return expires.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={currentBanStatus ? 'Unban User' : 'Ban User'}
			maxWidth="md"
			showCloseButton={!isLoading}
		>
			<form onSubmit={handleSubmit}>
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="text-sm font-medium text-gray-900">{userName}</div>
					<div className="text-sm text-gray-600">{userEmail}</div>
					{currentBanStatus && (
						<div className="mt-2 text-sm">
							<div className="text-red-600 font-medium">Currently Banned</div>
							{currentBanReason && (
								<div className="text-gray-700">
									<span className="font-medium">Reason:</span>{' '}
									{currentBanReason}
								</div>
							)}
							<div className="text-gray-700">
								<span className="font-medium">Expires:</span>{' '}
								{formatBanExpiry(currentBanExpires || null)}
							</div>
						</div>
					)}
				</div>

				{currentBanStatus ? (
					<div className="mb-6">
						<div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
							<Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<h4 className="text-sm font-semibold text-green-900 mb-2">
									Are you sure you want to unban this user?
								</h4>
								<p className="text-sm text-green-800">
									This will restore the user&apos;s access to the platform
									immediately.
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4 mb-6">
						<div>
							<label
								htmlFor="banReason"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Ban Reason <span className="text-red-500">*</span>
							</label>
							<textarea
								id="banReason"
								value={banReason}
								onChange={(e) => setBanReason(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
								rows={3}
								placeholder="Provide a clear reason for banning this user..."
								required
								disabled={isLoading}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Ban Duration
							</label>
							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="radio"
										checked={!isPermanent}
										onChange={() => setIsPermanent(false)}
										className="mr-2"
										disabled={isLoading}
									/>
									<span className="text-sm">Temporary</span>
								</label>
								{!isPermanent && (
									<div className="ml-6">
										<input
											type="number"
											value={banDuration}
											onChange={(e) => setBanDuration(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
											placeholder="Days"
											min="1"
											disabled={isLoading}
										/>
										<p className="text-xs text-gray-500 mt-1">
											Number of days (default: 30)
										</p>
									</div>
								)}
								<label className="flex items-center">
									<input
										type="radio"
										checked={isPermanent}
										onChange={() => setIsPermanent(true)}
										className="mr-2"
										disabled={isLoading}
									/>
									<span className="text-sm">Permanent</span>
								</label>
							</div>
						</div>

						<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<h4 className="text-sm font-semibold text-red-900 mb-1">
									Warning
								</h4>
								<p className="text-sm text-red-800">
									The user will be immediately logged out and unable to access
									the platform.
								</p>
							</div>
						</div>
					</div>
				)}

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
						className={`flex-1 px-6 py-3 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
							currentBanStatus
								? 'bg-[#22C55E] hover:bg-[#16A34A]'
								: 'bg-[#E20000] hover:bg-[#cc0000]'
						}`}
					>
						{isLoading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>Processing...</span>
							</>
						) : (
							<>
								{currentBanStatus ? (
									<>
										<Shield className="w-4 h-4" />
										<span>Unban User</span>
									</>
								) : (
									<>
										<AlertTriangle className="w-4 h-4" />
										<span>Ban User</span>
									</>
								)}
							</>
						)}
					</button>
				</div>
			</form>
		</Modal>
	)
}
