'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import Button from '@/components/ui/Button'

interface SuccessModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	message?: string
	buttonText?: string
	onButtonClick?: () => void
	showButton?: boolean
}

const SuccessModal: React.FC<SuccessModalProps> = ({
	isOpen,
	onClose,
	title = 'Success!',
	message = 'Operation completed successfully.',
	buttonText = 'Continue',
	onButtonClick,
	showButton = true,
}) => {
	const handleButtonClick = () => {
		if (onButtonClick) {
			onButtonClick()
		} else {
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
					aria-label="Close"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
						<svg
							className="h-6 w-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>

					<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
					<p className="text-sm text-gray-600 mb-6">{message}</p>

					{showButton && (
						<Button
							onClick={handleButtonClick}
							className="w-full bg-green-600 hover:bg-green-700 text-white"
						>
							{buttonText}
						</Button>
					)}
				</div>
			</div>
		</Modal>
	)
}

export default SuccessModal
