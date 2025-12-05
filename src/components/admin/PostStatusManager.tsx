'use client'

import { Button, CustomSelect, Modal } from '@/components/ui'
import { useNotification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export type PostStatus =
	| 'DRAFT'
	| 'PUBLISHED'
	| 'CLOSED'
	| 'REJECTED'
	| 'SUBMITTED'
	| 'UPDATED'
	| 'DELETED'

interface PostStatusManagerProps {
	postId: string
	currentStatus: PostStatus
	postType: string // 'Program', 'Scholarship', 'Research Lab'
	onStatusChange?: (status: PostStatus) => void
}

const POST_STATUS_OPTIONS = [
	{ value: 'DRAFT' as const, label: 'Draft', color: 'bg-[#F0A227] text-white' },
	{
		value: 'SUBMITTED' as const,
		label: 'Submitted',
		color: 'bg-[#3B82F6] text-white',
	},
	{
		value: 'UPDATED' as const,
		label: 'Updated',
		color: 'bg-[#10B981] text-white',
	},
	{
		value: 'PUBLISHED' as const,
		label: 'Published',
		color: 'bg-[#126E64] text-white',
	},
	{
		value: 'CLOSED' as const,
		label: 'Closed',
		color: 'bg-[#6EB6FF] text-black',
	},
	{
		value: 'REJECTED' as const,
		label: 'Rejected',
		color: 'bg-[#EF4444] text-white',
	},
	{
		value: 'DELETED' as const,
		label: 'Deleted',
		color: 'bg-[#9CA3AF] text-white',
	},
]

/**
 * Get allowed status transitions based on current status
 * Rules:
 * - SUBMITTED/UPDATED → PUBLISHED, REJECTED
 * - PUBLISHED → CLOSED
 * - REJECTED → SUBMITTED, PUBLISHED
 */
const getAllowedStatusOptions = (currentStatus: PostStatus): PostStatus[] => {
	switch (currentStatus) {
		case 'SUBMITTED':
		case 'UPDATED':
			return ['PUBLISHED', 'REJECTED']
		case 'PUBLISHED':
			return ['CLOSED']
		case 'REJECTED':
		case 'CLOSED':
			return ['SUBMITTED', 'PUBLISHED']
		default:
			return []
	}
}

const getStatusColor = (status: PostStatus): string => {
	const statusOption = POST_STATUS_OPTIONS.find(
		(option) => option.value === status
	)
	return statusOption?.color || 'bg-gray-200 text-black'
}

const PostStatusManager = ({
	postId,
	currentStatus,
	postType,
	onStatusChange,
}: PostStatusManagerProps) => {
	const [selectedStatus, setSelectedStatus] =
		useState<PostStatus>(currentStatus)

	// Reset selectedStatus when currentStatus prop changes
	useEffect(() => {
		setSelectedStatus(currentStatus)
	}, [currentStatus])

	const [isUpdating, setIsUpdating] = useState(false)
	const [showConfirmModal, setShowConfirmModal] = useState(false)
	const [showInputModal, setShowInputModal] = useState(false)
	const [rejectionReason, setRejectionReason] = useState('')

	const { showNotification } = useNotification()
	const router = useRouter()

	// Get available options based on current status
	const allowedStatuses = getAllowedStatusOptions(currentStatus)
	const availableOptions = POST_STATUS_OPTIONS.filter((opt) =>
		allowedStatuses.includes(opt.value)
	)

	const handleStatusChange = (newStatus: PostStatus) => {
		setSelectedStatus(newStatus)

		// Check if this status requires additional input (rejection reason)
		if (newStatus === 'REJECTED') {
			setRejectionReason('')
			setShowInputModal(true)
		} else {
			// Show confirmation modal for other status changes
			setShowConfirmModal(true)
		}
	}

	const executeStatusUpdate = async (
		status: PostStatus,
		additionalData?: string
	) => {
		setIsUpdating(true)

		try {
			const requestBody: Record<string, unknown> = { status }

			// Add rejection reason if status is REJECTED
			if (status === 'REJECTED' && additionalData) {
				requestBody.rejectionReason = additionalData
			}

			const response = await fetch(`/api/admin/posts/${postId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const data = await response.json()

			if (response.ok && data.success) {
				showNotification({
					type: 'success',
					title: 'Success',
					message: `${postType} status successfully updated to ${POST_STATUS_OPTIONS.find((opt) => opt.value === status)?.label}!`,
				})

				// Call the callback if provided
				onStatusChange?.(status)

				// Redirect to admin posts page
				router.push('/admin/posts')
			} else {
				throw new Error(data.message || 'Failed to update status')
			}
		} catch (error) {
			showNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to update post status. Please try again.',
			})
		} finally {
			setIsUpdating(false)
			setShowConfirmModal(false)
			setShowInputModal(false)
		}
	}

	const handleConfirm = () => {
		executeStatusUpdate(selectedStatus)
	}

	const handleInputSubmit = () => {
		if (selectedStatus === 'REJECTED') {
			if (!rejectionReason.trim()) {
				showNotification({
					type: 'error',
					title: 'Input Required',
					message: 'Please provide a rejection reason.',
				})
				return
			}
		}

		executeStatusUpdate(selectedStatus, rejectionReason.trim())
	}

	const getStatusUpdateMessage = (status: PostStatus): string => {
		switch (status) {
			case 'PUBLISHED':
				return `Are you sure you want to publish this ${postType.toLowerCase()}? It will be visible to all users.`
			case 'CLOSED':
				return `This ${postType.toLowerCase()} will be marked as closed and will no longer accept applications.`
			case 'REJECTED':
				return `This ${postType.toLowerCase()} will be rejected. The institution will be notified with the rejection reason.`
			case 'DELETED':
				return `This ${postType.toLowerCase()} will be soft-deleted. Admins can restore it later by changing status to Draft.`
			case 'DRAFT':
				return `This ${postType.toLowerCase()} will be moved back to draft status.`
			case 'SUBMITTED':
				return `This ${postType.toLowerCase()} will be marked as submitted for review.`
			case 'UPDATED':
				return `This ${postType.toLowerCase()} will be marked as updated.`
			default:
				return `Are you sure you want to change the status?`
		}
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				Post Status Management
			</h3>

			{/* Current Status Display */}
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Current Status
				</label>
				<div className="flex items-center gap-2">
					<span
						className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}
					>
						{
							POST_STATUS_OPTIONS.find((opt) => opt.value === currentStatus)
								?.label
						}
					</span>
				</div>
			</div>

			{/* Status Selection */}
			{availableOptions.length > 0 ? (
				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Change Status To
					</label>
					<CustomSelect
						value={
							selectedStatus !== currentStatus
								? POST_STATUS_OPTIONS.find(
										(opt) => opt.value === selectedStatus
									)
								: null
						}
						onChange={(selected) =>
							selected && handleStatusChange(selected.value as PostStatus)
						}
						options={availableOptions}
						placeholder="Select new status..."
						className="w-full"
						isSearchable={false}
						isClearable={false}
					/>
				</div>
			) : (
				<div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
					<p className="text-sm text-gray-600">
						No status changes available for the current status.
					</p>
				</div>
			)}

			{/* Status Preview */}
			{selectedStatus !== currentStatus && (
				<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<div className="flex items-center gap-2 text-sm">
						<span className="font-medium text-blue-900">Preview:</span>
						<span className="text-blue-700">Status will change from</span>
						<span
							className={`px-2 py-1 rounded text-xs ${getStatusColor(currentStatus)}`}
						>
							{
								POST_STATUS_OPTIONS.find((opt) => opt.value === currentStatus)
									?.label
							}
						</span>
						<span className="text-blue-700">to</span>
						<span
							className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedStatus)}`}
						>
							{
								POST_STATUS_OPTIONS.find((opt) => opt.value === selectedStatus)
									?.label
							}
						</span>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{showConfirmModal && (
				<Modal
					isOpen={showConfirmModal}
					onClose={() => setShowConfirmModal(false)}
					title="Confirm Status Change"
				>
					<div className="space-y-4">
						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-8 h-8 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Update Status to{' '}
								{
									POST_STATUS_OPTIONS.find(
										(opt) => opt.value === selectedStatus
									)?.label
								}
								?
							</h3>
							<p className="text-gray-600">
								{getStatusUpdateMessage(selectedStatus)}
							</p>
						</div>

						<div className="flex gap-4 pt-4">
							<Button
								type="button"
								onClick={() => setShowConfirmModal(false)}
								variant="outline"
								className="flex-1 py-3"
								disabled={isUpdating}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={handleConfirm}
								className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white"
								disabled={isUpdating}
							>
								{isUpdating ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Updating...
									</div>
								) : (
									'Confirm Update'
								)}
							</Button>
						</div>
					</div>
				</Modal>
			)}

			{/* Input Modal for Rejection */}
			{showInputModal && (
				<Modal
					isOpen={showInputModal}
					onClose={() => setShowInputModal(false)}
					title="Reject Post"
				>
					<div className="space-y-4">
						<div className="text-center mb-4">
							<div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
								<svg
									className="w-8 h-8 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Reject {postType}
							</h3>
							<p className="text-gray-600">
								Please provide a reason for rejecting this post. The institution
								will be notified.
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Rejection Reason *
							</label>
							<textarea
								value={rejectionReason}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									setRejectionReason(e.target.value)
								}
								placeholder="Enter the reason for rejection..."
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
							/>
						</div>

						<div className="flex gap-4 pt-4">
							<Button
								type="button"
								onClick={() => setShowInputModal(false)}
								variant="outline"
								className="flex-1 py-3"
								disabled={isUpdating}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={handleInputSubmit}
								className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
								disabled={isUpdating || !rejectionReason.trim()}
							>
								{isUpdating ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Rejecting...
									</div>
								) : (
									'Reject Post'
								)}
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}

export default PostStatusManager
