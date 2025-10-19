'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui'

interface ErrorModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	message?: string
	buttonText?: string
	onButtonClick?: () => void
	showButton?: boolean
	showRetry?: boolean
	onRetry?: () => void
	retryText?: string
	showCloseButton?: boolean
	// Two button support
	secondButtonText?: string
	onSecondButtonClick?: () => void
	showSecondButton?: boolean
}

const ErrorModal: React.FC<ErrorModalProps> = ({
	isOpen,
	onClose,
	title = 'Error',
	message = 'Something went wrong. Please try again.',
	buttonText = 'Close',
	onButtonClick,
	showButton = true,
	showRetry = false,
	onRetry,
	retryText = 'Try Again',
	showCloseButton = true,
	// Two button support
	secondButtonText = 'Cancel',
	onSecondButtonClick,
	showSecondButton = false,
}) => {
	const handleButtonClick = () => {
		if (onButtonClick) {
			onButtonClick()
		} else {
			onClose()
		}
	}

	const handleRetry = () => {
		if (onRetry) {
			onRetry()
		}
	}

	const handleSecondButtonClick = () => {
		if (onSecondButtonClick) {
			onSecondButtonClick()
		}
	}

	if (!isOpen) return null

	return (
		<Modal isOpen={isOpen} onClose={onClose} showCloseButton={showCloseButton}>
			<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg
							className="h-6 w-6 text-red-600"
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
					</div>

					<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
					<p className="text-sm text-gray-600 mb-6">{message}</p>

					{showButton && (
						<Button
							onClick={handleButtonClick}
							className="w-full bg-gray-600 hover:bg-gray-700 text-white"
						>
							{buttonText}
						</Button>
					)}
					{showSecondButton && (
						<Button
							onClick={handleSecondButtonClick}
							variant="outline"
							className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 mt-3"
						>
							{secondButtonText}
						</Button>
					)}
					{showRetry && (
						<Button
							onClick={handleRetry}
							variant="outline"
							className="w-full border-red-300 text-red-700 hover:bg-red-50 mt-3"
						>
							{retryText}
						</Button>
					)}
				</div>
			</div>
		</Modal>
	)
}

export default ErrorModal
