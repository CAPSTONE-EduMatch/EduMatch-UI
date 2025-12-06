import React from 'react'
import { FileValidationResult } from '@/services/ai/file-validation-service'

interface FileValidationNotificationProps {
	validation: FileValidationResult
	fileName: string
	expectedFileType: string
	onDismiss: () => void
	className?: string
}

export const FileValidationNotification: React.FC<
	FileValidationNotificationProps
> = ({ validation, fileName, expectedFileType, onDismiss, className = '' }) => {
	const getFileTypeDisplayName = (fileType: string): string => {
		const displayNames: { [key: string]: string } = {
			'cv-resume': 'CV/Resume',
			'language-certificates': 'Language Certificate',
			'degree-certificates': 'Degree Certificate',
			transcripts: 'Academic Transcript',
			'institution-verification': 'Institution Verification Document',
		}
		return displayNames[fileType] || fileType
	}

	if (validation.isValid && validation.confidence >= 0.7) {
		return (
			<div
				className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
			>
				<div className="flex items-start justify-between">
					<div className="flex items-start space-x-2">
						<span className="text-green-600 mt-0.5">✅</span>
						<div>
							<div className="text-green-800">
								<span className="font-medium">{fileName}</span> looks like a
								valid {getFileTypeDisplayName(expectedFileType)}.{' '}
								<span className="text-sm">
									(Confidence: {Math.round(validation.confidence * 100)}%)
								</span>
							</div>
						</div>
					</div>
					<button
						onClick={onDismiss}
						className="text-green-600 hover:text-green-800 ml-2 flex-shrink-0 text-lg leading-none"
						title="Dismiss"
					>
						×
					</button>
				</div>
			</div>
		)
	}

	// Invalid or low confidence - show concise message
	const confidencePercent = Math.round((validation.confidence || 0) * 100)
	const shortMessage = validation.reasoning || 'Invalid file. Please re-upload.'

	return (
		<div className={`border rounded-lg p-3 bg-red-50 ${className}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-start gap-3">
					<div
						className={`
									${validation.isValid ? 'text-yellow-800' : 'text-red-800'}
									flex flex-col w-full
									`}
					>
						<span className="font-medium text-sm mr-2 break-all">
							{fileName}
						</span>
						<span className="text-sm">{shortMessage}</span>
					</div>
				</div>

				<button
					onClick={onDismiss}
					className={`ml-2 flex-shrink-0 hover:opacity-75 text-lg leading-none ${validation.isValid ? 'text-yellow-600' : 'text-red-600'}`}
					title="Dismiss"
				>
					×
				</button>
			</div>
		</div>
	)
}
