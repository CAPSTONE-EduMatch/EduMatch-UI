'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui'

interface SimpleWarningModalProps {
	isOpen: boolean
	onSaveAndContinue: () => void
	onDiscardChanges: () => void
	onCancel: () => void
	isSaving?: boolean
}

export const SimpleWarningModal: React.FC<SimpleWarningModalProps> = ({
	isOpen,
	onSaveAndContinue,
	onDiscardChanges,
	onCancel,
	isSaving = false,
}) => {
	if (!isOpen) return null

	return (
		<Modal isOpen={isOpen} onClose={onCancel}>
			<div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 relative">
				<div className="text-center">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
						<svg
							className="h-6 w-6 text-yellow-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
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
						Unsaved Changes
					</h3>
					<p className="text-sm text-gray-600 mb-6">
						You have unsaved changes. What would you like to do before leaving
						this section?
					</p>

					<div className="flex gap-3 justify-center">
						<Button
							variant="outline"
							onClick={onDiscardChanges}
							disabled={isSaving}
							className="min-w-[140px]"
							size="sm"
						>
							Discard Changes
						</Button>
						<Button
							onClick={onSaveAndContinue}
							disabled={isSaving}
							className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
						>
							{isSaving ? 'Saving...' : 'Save & Continue'}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	)
}
