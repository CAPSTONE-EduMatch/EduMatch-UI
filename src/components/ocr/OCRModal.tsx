'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Eye, FileText, Loader2, X } from 'lucide-react'
import {
	mistralOCRService,
	OCRResult,
} from '@/services/ocr/mistral-ocr-service'

interface OCRModalProps {
	isOpen: boolean
	onClose: () => void
	file: File | null
	onOCRComplete?: (extractedText: string) => void
}

export const OCRModal: React.FC<OCRModalProps> = ({
	isOpen,
	onClose,
	file,
	onOCRComplete,
}) => {
	const [isProcessing, setIsProcessing] = useState(false)
	const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
	const [showPreview, setShowPreview] = useState(false)

	const handleProcessOCR = async () => {
		if (!file) return

		setIsProcessing(true)
		setOcrResult(null)

		try {
			const result = await mistralOCRService.processFile(file)
			setOcrResult(result)

			if (result.success && result.extractedText && onOCRComplete) {
				onOCRComplete(result.extractedText)
			}
		} catch (error) {
			console.error('OCR processing error:', error)
			setOcrResult({
				success: false,
				error: 'An unexpected error occurred during OCR processing',
			})
		} finally {
			setIsProcessing(false)
		}
	}

	const handleViewFile = () => {
		if (file) {
			const url = URL.createObjectURL(file)
			window.open(url, '_blank')
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-xl font-semibold">Document Text Extraction</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						className="rounded-full"
					>
						<X className="w-4 h-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* File Info */}
					{file && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="text-2xl">
										{file.type === 'application/pdf' ? '📄' : '🖼️'}
									</div>
									<div>
										<p className="font-medium text-gray-900">{file.name}</p>
										<p className="text-sm text-gray-500">
											{formatFileSize(file.size)} • {file.type}
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleViewFile}
									className="flex items-center gap-2"
								>
									<Eye className="w-4 h-4" />
									View File
								</Button>
							</div>
						</div>
					)}

					{/* OCR Status */}
					{!mistralOCRService.isOCREnabled() && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<p className="text-yellow-800">
								OCR functionality is currently disabled. Text extraction is not
								available.
							</p>
						</div>
					)}

					{/* OCR Controls */}
					{mistralOCRService.isOCREnabled() && file && (
						<div className="space-y-4">
							{!ocrResult && !isProcessing && (
								<div className="text-center">
									<p className="text-gray-600 mb-4">
										Extract text from your document using AI-powered OCR
										technology.
									</p>
									<Button
										onClick={handleProcessOCR}
										className="flex items-center gap-2"
										disabled={!mistralOCRService.isSupportedFileType(file)}
									>
										<FileText className="w-4 h-4" />
										Extract Text from Document
									</Button>
									{!mistralOCRService.isSupportedFileType(file) && (
										<p className="text-sm text-red-600 mt-2">
											This file type is not supported for text extraction.
										</p>
									)}
								</div>
							)}

							{/* Processing State */}
							{isProcessing && (
								<div className="text-center py-8">
									<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
									<p className="text-gray-600">
										Processing document with AI OCR...
									</p>
									<p className="text-sm text-gray-500 mt-2">
										This may take a few moments
									</p>
								</div>
							)}

							{/* OCR Results */}
							{ocrResult && (
								<div className="space-y-4">
									{ocrResult.success ? (
										<div className="space-y-4">
											<div className="bg-green-50 border border-green-200 rounded-lg p-4">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-green-500 rounded-full"></div>
													<p className="text-green-800 font-medium">
														Text extraction completed successfully
													</p>
												</div>
												{ocrResult.confidence && (
													<p className="text-sm text-green-600 mt-1">
														Confidence: {Math.round(ocrResult.confidence * 100)}
														%
													</p>
												)}
											</div>

											{ocrResult.extractedText && (
												<div>
													<div className="flex items-center justify-between mb-2">
														<h3 className="font-medium">Extracted Text:</h3>
														<Button
															variant="outline"
															size="sm"
															onClick={() => setShowPreview(!showPreview)}
														>
															{showPreview ? 'Hide' : 'Show'} Preview
														</Button>
													</div>

													{showPreview && (
														<div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
															<pre className="text-sm whitespace-pre-wrap text-gray-700">
																{ocrResult.extractedText}
															</pre>
														</div>
													)}

													<div className="mt-4 p-3 bg-blue-50 rounded-lg">
														<p className="text-sm text-blue-800">
															📝 Text has been extracted successfully. You can
															now search and reference this content.
														</p>
													</div>
												</div>
											)}
										</div>
									) : (
										<div className="bg-red-50 border border-red-200 rounded-lg p-4">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-red-500 rounded-full"></div>
												<p className="text-red-800 font-medium">
													Text extraction failed
												</p>
											</div>
											<p className="text-sm text-red-600 mt-1">
												{ocrResult.error ||
													'An error occurred during text extraction'}
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={handleProcessOCR}
												className="mt-3"
											>
												Try Again
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="border-t p-4 bg-gray-50">
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
						{ocrResult?.success && ocrResult.extractedText && (
							<Button
								onClick={() => {
									if (ocrResult.extractedText && onOCRComplete) {
										onOCRComplete(ocrResult.extractedText)
									}
									onClose()
								}}
							>
								Use Extracted Text
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
