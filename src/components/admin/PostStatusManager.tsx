'use client'

import { Button, CustomSelect, Modal } from '@/components/ui'
import { useNotification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type PostStatus =
	| 'DRAFT'
	| 'PUBLISHED'
	| 'CLOSED'
	| 'ARCHIVED'
	| 'SUBMITTED'
	| 'UPDATED'
	| 'REQUIRE_UPDATE'

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
		value: 'REQUIRE_UPDATE' as const,
		label: 'Require Update',
		color: 'bg-[#F59E0B] text-white',
	},
	{
		value: 'PUBLISHED' as const,
		label: 'Published',
		color: 'bg-[#126E64] text-white',
	},
	{
		value: 'CLOSED' as const,
		label: 'Closed/Rejected',
		color: 'bg-[#6EB6FF] text-black',
	},
	{
		value: 'ARCHIVED' as const,
		label: 'Archived',
		color: 'bg-[#D5D5D5] text-black',
	},
]

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
	const [isUpdating, setIsUpdating] = useState(false)
	const [showConfirmModal, setShowConfirmModal] = useState(false)
	const [showInputModal, setShowInputModal] = useState(false)
	const [additionalInput, setAdditionalInput] = useState('')
	const [inputType, setInputType] = useState<'reject' | 'requirements'>(
		'reject'
	)

	const { showNotification } = useNotification()
	const router = useRouter()

	const handleStatusChange = (newStatus: PostStatus) => {
		setSelectedStatus(newStatus)

		// Check if this status requires additional input
		if (newStatus === 'CLOSED') {
			setInputType('reject')
			setAdditionalInput('')
			setShowInputModal(true)
		} else if (newStatus === 'REQUIRE_UPDATE') {
			setInputType('requirements')
			setAdditionalInput('')
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
			const requestBody: any = { status }

			// Add additional data based on status
			if (status === 'CLOSED' && additionalData) {
				requestBody.rejectReason = additionalData
			} else if (status === 'REQUIRE_UPDATE' && additionalData) {
				requestBody.additionalRequirements = additionalData
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
		if (selectedStatus === 'CLOSED' || selectedStatus === 'REQUIRE_UPDATE') {
			if (!additionalInput.trim()) {
				showNotification({
					type: 'error',
					title: 'Input Required',
					message: `Please provide ${inputType === 'reject' ? 'a rejection reason' : 'additional requirements'}.`,
				})
				return
			}
		}

		executeStatusUpdate(selectedStatus, additionalInput.trim())
	}

	const getStatusUpdateMessage = (status: PostStatus): string => {
		switch (status) {
			case 'PUBLISHED':
				return `Are you sure you want to publish this ${postType.toLowerCase()}? It will be visible to all users.`
			case 'CLOSED':
				return `This ${postType.toLowerCase()} will be marked as closed/rejected and will not be visible to users.`
			case 'ARCHIVED':
				return `This ${postType.toLowerCase()} will be archived and moved to the archived section.`
			case 'DRAFT':
				return `This ${postType.toLowerCase()} will be moved back to draft status.`
			case 'SUBMITTED':
				return `This ${postType.toLowerCase()} will be marked as submitted for review.`
			case 'UPDATED':
				return `This ${postType.toLowerCase()} will be marked as updated.`
			case 'REQUIRE_UPDATE':
				return `This ${postType.toLowerCase()} will require additional updates from the institution.`
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
			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Change Status To
				</label>
				<CustomSelect
					value={POST_STATUS_OPTIONS.find(
						(opt) => opt.value === selectedStatus
					)}
					onChange={(selected) =>
						selected && handleStatusChange(selected.value as PostStatus)
					}
					options={POST_STATUS_OPTIONS}
					placeholder="Select new status..."
					className="w-full"
					isSearchable={true}
					isClearable={false}
				/>
			</div>

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

			{/* Input Modal for Reject/Requirements */}
			{showInputModal && (
				<Modal
					isOpen={showInputModal}
					onClose={() => setShowInputModal(false)}
					title={
						inputType === 'reject'
							? 'Reject Post'
							: 'Request Additional Requirements'
					}
				>
					<div className="space-y-4">
						<div className="text-center mb-4">
							<div
								className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
									inputType === 'reject' ? 'bg-red-100' : 'bg-orange-100'
								}`}
							>
								<svg
									className={`w-8 h-8 ${inputType === 'reject' ? 'text-red-600' : 'text-orange-600'}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{inputType === 'reject' ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
									)}
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{inputType === 'reject'
									? `Reject ${postType}`
									: `Request Updates for ${postType}`}
							</h3>
							<p className="text-gray-600">
								{inputType === 'reject'
									? 'Please provide a reason for rejecting this post.'
									: 'Please specify what additional requirements or updates are needed.'}
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{inputType === 'reject'
									? 'Rejection Reason *'
									: 'Additional Requirements *'}
							</label>
							<textarea
								value={additionalInput}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									setAdditionalInput(e.target.value)
								}
								placeholder={
									inputType === 'reject'
										? 'Enter the reason for rejection...'
										: 'Describe what updates or additional information is required...'
								}
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
								className={`flex-1 py-3 text-white ${
									inputType === 'reject'
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-orange-600 hover:bg-orange-700'
								}`}
								disabled={isUpdating}
							>
								{isUpdating ? (
									<div className="flex items-center gap-2">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										{inputType === 'reject' ? 'Rejecting...' : 'Updating...'}
									</div>
								) : inputType === 'reject' ? (
									'Reject Post'
								) : (
									'Request Updates'
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
