'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { FileText, Sparkles } from 'lucide-react'
import { OCRModal } from './OCRModal'
import { mistralOCRService } from '@/services/ocr/mistral-ocr-service'

interface OCRButtonProps {
	file: File | null
	onOCRComplete?: (extractedText: string) => void
	className?: string
	size?: 'sm' | 'md' | 'lg'
	variant?: 'outline' | 'secondary' | 'primary'
}

export const OCRButton: React.FC<OCRButtonProps> = ({
	file,
	onOCRComplete,
	className = '',
	size = 'sm',
	variant = 'outline',
}) => {
	const [showOCRModal, setShowOCRModal] = useState(false)

	const isOCRSupported = file && mistralOCRService.isSupportedFileType(file)
	const isOCREnabled = mistralOCRService.isOCREnabled()

	if (!isOCREnabled || !isOCRSupported) {
		return null
	}

	return (
		<>
			<Button
				variant={variant}
				size={size}
				onClick={() => setShowOCRModal(true)}
				className={`flex items-center gap-2 ${className}`}
				title="Extract text from document using AI"
			>
				<Sparkles className="w-4 h-4" />
				<FileText className="w-4 h-4" />
				Extract Text
			</Button>

			<OCRModal
				isOpen={showOCRModal}
				onClose={() => setShowOCRModal(false)}
				file={file}
				onOCRComplete={onOCRComplete}
			/>
		</>
	)
}

// Hook for extracting text data and storing with file metadata
export const useOCRData = () => {
	const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>(
		{}
	)

	const saveExtractedText = (fileId: string, text: string) => {
		setExtractedTexts((prev) => ({
			...prev,
			[fileId]: text,
		}))
	}

	const getExtractedText = (fileId: string): string | undefined => {
		return extractedTexts[fileId]
	}

	const removeExtractedText = (fileId: string) => {
		setExtractedTexts((prev) => {
			const newTexts = { ...prev }
			delete newTexts[fileId]
			return newTexts
		})
	}

	const hasExtractedText = (fileId: string): boolean => {
		return Boolean(extractedTexts[fileId])
	}

	return {
		extractedTexts,
		saveExtractedText,
		getExtractedText,
		removeExtractedText,
		hasExtractedText,
	}
}
