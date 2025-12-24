'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'

interface InstitutionBanUnbanModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: (banReason: string, banDuration?: number) => void
	institutionName: string
	institutionEmail: string
	currentBanStatus: boolean
	currentBanReason?: string
	currentBanExpires?: Date | null
	isLoading: boolean
}

export function InstitutionBanUnbanModal({
	isOpen,
	onClose,
	onConfirm,
	institutionName,
	institutionEmail,
	currentBanStatus,
	currentBanReason,
	currentBanExpires,
	isLoading,
}: InstitutionBanUnbanModalProps) {
	const [banReason, setBanReason] = useState(currentBanReason || '')
	const [banDuration, setBanDuration] = useState<string>('')
	const [isPermanent, setIsPermanent] = useState(!currentBanExpires)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!currentBanStatus && !banReason.trim()) {
			alert('Please provide a reason for banning this institution.')
			return
		}

		const duration = isPermanent ? undefined : parseInt(banDuration, 10)
		if (!currentBanStatus && !isPermanent && (!duration || duration <= 0)) {
			alert('Please provide a valid ban duration.')
			return
		}

		onConfirm(banReason.trim(), duration)
	}

	const resetForm = () => {
		setBanReason(currentBanReason || '')
		setBanDuration('')
		setIsPermanent(!currentBanExpires)
	}

	const handleClose = () => {
		if (!isLoading) {
			resetForm()
			onClose()
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-lg shadow-xl w-full max-w-md"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h2 className="text-xl font-semibold text-gray-900">
								{currentBanStatus ? 'Unban Institution' : 'Ban Institution'}
							</h2>
							<button
								onClick={handleClose}
								disabled={isLoading}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Content */}
						<form onSubmit={handleSubmit} className="p-6">
							{/* Institution Info */}
							<div className="mb-6 p-4 bg-gray-50 rounded-lg">
								<h3 className="font-medium text-gray-900 mb-1">
									{institutionName}
								</h3>
								<p className="text-sm text-gray-600">{institutionEmail}</p>
							</div>

							{currentBanStatus ? (
								/* Unban Form */
								<div className="mb-6">
									<p className="text-sm text-gray-600 mb-4">
										Are you sure you want to unban this institution? This action
										will restore their access to the platform.
									</p>
									{currentBanReason && (
										<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
											<p className="text-sm text-red-700 mb-1">
												<strong>Current ban reason:</strong>
											</p>
											<p className="text-sm text-red-600">{currentBanReason}</p>
											{currentBanExpires && (
												<p className="text-sm text-red-600 mt-2">
													<strong>Expires:</strong>{' '}
													{currentBanExpires.toLocaleDateString('en-US', {
														year: 'numeric',
														month: 'long',
														day: 'numeric',
													})}
												</p>
											)}
										</div>
									)}
								</div>
							) : (
								/* Ban Form */
								<div className="space-y-4 mb-6">
									<div>
										<label
											htmlFor="banReason"
											className="block text-sm font-medium text-gray-700 mb-2"
										>
											Reason for ban *
										</label>
										<textarea
											id="banReason"
											value={banReason}
											onChange={(e) => setBanReason(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent resize-none"
											rows={4}
											placeholder="Provide a detailed reason for banning this institution..."
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
													name="banType"
													checked={isPermanent}
													onChange={() => setIsPermanent(true)}
													className="mr-2 text-[#126E64] focus:ring-[#126E64]"
													disabled={isLoading}
												/>
												<span className="text-sm text-gray-700">
													Permanent ban
												</span>
											</label>
											<label className="flex items-center">
												<input
													type="radio"
													name="banType"
													checked={!isPermanent}
													onChange={() => setIsPermanent(false)}
													className="mr-2 text-[#126E64] focus:ring-[#126E64]"
													disabled={isLoading}
												/>
												<span className="text-sm text-gray-700">
													Temporary ban
												</span>
											</label>
										</div>
										{!isPermanent && (
											<div className="mt-2">
												<input
													type="number"
													value={banDuration}
													onChange={(e) => setBanDuration(e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent"
													placeholder="Duration in days"
													min="1"
													max="365"
													disabled={isLoading}
													required={!isPermanent}
												/>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleClose}
									disabled={isLoading}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
										currentBanStatus
											? 'bg-[#22C55E] hover:bg-[#16A34A]'
											: 'bg-[#E20000] hover:bg-[#cc0000]'
									}`}
								>
									{isLoading
										? 'Processing...'
										: currentBanStatus
											? 'Unban Institution'
											: 'Ban Institution'}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}
