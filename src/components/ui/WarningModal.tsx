'use client'

import React from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface WarningModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	message: string
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	onCancel: () => void
}

export function WarningModal({
	isOpen,
	onClose,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
}: WarningModalProps) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Content */}
				<div className="space-y-4">
					<div className="text-center">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
							<svg
								className="h-6 w-6 text-yellow-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							{title}
						</h3>
						<p className="text-sm text-gray-600">{message}</p>
					</div>

					{/* Actions */}
					<div className="flex flex-col sm:flex-row gap-3 pt-4">
						<Button variant="outline" onClick={onCancel} className="flex-1">
							{cancelText}
						</Button>
						<Button
							onClick={onConfirm}
							className="flex-1 bg-red-600 hover:bg-red-700"
						>
							{confirmText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
