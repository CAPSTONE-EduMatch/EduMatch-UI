'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Sparkles, FileText } from 'lucide-react'
import { mistralOCRService } from '@/services/ocr/mistral-ocr-service'

interface OCRButtonForUploadedFileProps {
	fileUrl: string
	fileName: string
	fileType: string
	onOCRComplete?: (extractedText: string) => void
	className?: string
	size?: 'sm' | 'md' | 'lg'
	variant?: 'outline' | 'secondary' | 'primary'
}

export const OCRButtonForUploadedFile: React.FC<
	OCRButtonForUploadedFileProps
> = ({
	fileUrl,
	fileName,
	fileType,
	onOCRComplete,
	className = '',
	size = 'sm',
	variant = 'outline',
}) => {
	const [isProcessing, setIsProcessing] = useState(false)

	const isOCRSupported = mistralOCRService.isSupportedFileType({
		type: fileType,
	} as File)
	const isOCREnabled = mistralOCRService.isOCREnabled()

	// eslint-disable-next-line no-console
	console.log('OCRButtonForUploadedFile render:', {
		fileName,
		fileType,
		isOCREnabled,
		isOCRSupported,
		fileUrl: fileUrl?.substring(0, 50) + '...',
	})

	if (!isOCREnabled || !isOCRSupported) {
		// eslint-disable-next-line no-console
		console.log('OCRButtonForUploadedFile: Button not rendered because:', {
			isOCREnabled,
			isOCRSupported,
		})
		return null
	}

	const handleOCRClick = async () => {
		// eslint-disable-next-line no-console
		console.log('OCRButtonForUploadedFile: OCR button clicked for:', fileName)

		if (isProcessing) return

		setIsProcessing(true)
		try {
			// For images, we can use the URL directly
			if (fileType.startsWith('image/')) {
				// eslint-disable-next-line no-console
				console.log(
					'OCRButtonForUploadedFile: Starting image OCR for:',
					fileName
				)
				const result = await mistralOCRService.processImageFromURL(fileUrl)
				// eslint-disable-next-line no-console
				console.log('OCRButtonForUploadedFile: Image OCR result:', result)
				if (result.success && result.extractedText) {
					// eslint-disable-next-line no-console
					console.log(
						'OCRButtonForUploadedFile: Calling onOCRComplete with text:',
						result.extractedText?.substring(0, 100)
					)
					onOCRComplete?.(result.extractedText)
				} else {
					// eslint-disable-next-line no-console
					console.error('OCR failed:', result.error)
					alert('OCR failed: ' + (result.error || 'Unknown error'))
				}
			} else if (fileType === 'application/pdf') {
				// For PDFs, we need to download and process
				try {
					// eslint-disable-next-line no-console
					console.log(
						'OCRButtonForUploadedFile: Starting PDF OCR for:',
						fileName
					)
					console.log('Downloading PDF from URL:', fileUrl)
					const response = await fetch(fileUrl)

					if (!response.ok) {
						throw new Error(
							`Failed to download PDF: ${response.status} ${response.statusText}`
						)
					}

					const blob = await response.blob()
					// eslint-disable-next-line no-console
					console.log('Downloaded blob type:', blob.type, 'size:', blob.size)

					// Force set correct PDF mimetype regardless of what server returns
					const file = new File([blob], fileName, { type: 'application/pdf' })
					// eslint-disable-next-line no-console
					console.log('Created file with type:', file.type, 'size:', file.size)

					const result = await mistralOCRService.processPDF(file)
					// eslint-disable-next-line no-console
					console.log('OCRButtonForUploadedFile: PDF OCR result:', result)
					if (result.success && result.extractedText) {
						// eslint-disable-next-line no-console
						console.log(
							'OCRButtonForUploadedFile: Calling onOCRComplete with PDF text:',
							result.extractedText?.substring(0, 100)
						)
						onOCRComplete?.(result.extractedText)
					} else {
						// eslint-disable-next-line no-console
						console.error('PDF OCR failed:', result.error)
						alert('OCR failed: ' + (result.error || 'Unknown error'))
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error('Failed to download PDF for OCR:', error)
					alert('Failed to download PDF for OCR: ' + (error as Error).message)
				}
			}
		} catch (error) {
			alert('OCR failed: ' + (error as Error).message)
		} finally {
			setIsProcessing(false)
		}
	}

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleOCRClick}
			disabled={isProcessing}
			className={`flex items-center gap-2 ${className}`}
			title="Extract text from document using AI"
		>
			<Sparkles className="w-4 h-4" />
			<FileText className="w-4 h-4" />
			{isProcessing ? 'Processing...' : 'Extract Text'}
		</Button>
	)
}
