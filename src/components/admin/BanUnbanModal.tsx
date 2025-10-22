import { AlertTriangle, Shield, X } from 'lucide-react'
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
	const [banDuration, setBanDuration] = useState<string>('30') // Default 30 days
	const [isPermanent, setIsPermanent] = useState(false)

	if (!isOpen) return null

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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center gap-3">
						{currentBanStatus ? (
							<Shield className="w-6 h-6 text-green-600" />
						) : (
							<AlertTriangle className="w-6 h-6 text-red-600" />
						)}
						<h3 className="text-lg font-semibold text-gray-900">
							{currentBanStatus ? 'Unban User' : 'Ban User'}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-full transition-colors"
						disabled={isLoading}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="p-6">
					{/* User Info */}
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

					{/* Ban/Unban Form */}
					{currentBanStatus ? (
						// Unban confirmation
						<div className="mb-6">
							<div className="flex items-center gap-2 mb-4">
								<Shield className="w-5 h-5 text-green-600" />
								<span className="text-sm font-medium text-gray-900">
									Are you sure you want to unban this user?
								</span>
							</div>
							<p className="text-sm text-gray-600">
								This will restore the user&apos;s access to the platform
								immediately.
							</p>
						</div>
					) : (
						// Ban form
						<div className="space-y-4">
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
										<span className="text-sm">Temporary ban</span>
									</label>
									{!isPermanent && (
										<div className="ml-6">
											<select
												value={banDuration}
												onChange={(e) => setBanDuration(e.target.value)}
												className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
												disabled={isLoading}
											>
												<option value="1">1 day</option>
												<option value="3">3 days</option>
												<option value="7">1 week</option>
												<option value="14">2 weeks</option>
												<option value="30">1 month</option>
												<option value="90">3 months</option>
												<option value="180">6 months</option>
												<option value="365">1 year</option>
											</select>
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
										<span className="text-sm text-red-600 font-medium">
											Permanent ban
										</span>
									</label>
								</div>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-3 pt-6">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 transition-colors ${
								currentBanStatus
									? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
									: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
							} disabled:opacity-50 disabled:cursor-not-allowed`}
							disabled={isLoading}
						>
							{isLoading
								? 'Processing...'
								: currentBanStatus
									? 'Unban User'
									: 'Ban User'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
