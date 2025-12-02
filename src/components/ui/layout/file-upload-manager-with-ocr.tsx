'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { FileItem } from '@/utils/file/file-utils'
import { Button } from '@/components/ui'
import { useOCRData } from '@/components/ocr/OCRButton'
import { mistralOCRService } from '@/services/ocr/mistral-ocr-service'
import {
	OllamaFileValidationService,
	FileValidationResult,
} from '@/services/ai/ollama-file-validation-service'
import { cn } from '@/utils/index'
import {
	Eye,
	Trash2,
	Sparkles,
	CheckCircle,
	AlertCircle,
	Hourglass,
} from 'lucide-react'
import { FileValidationNotification } from '@/components/validation/FileValidationNotification'
import { FileValidationDisplay } from '@/components/validation/FileValidationDisplay'

interface FileUploadManagerWithOCRProps {
	className?: string
	onFilesUploaded?: (files: FileItem[]) => void
	onFileDeleted?: (fileId: string) => void
	category?: string
	folderId?: string
	maxFiles?: number
	acceptedTypes?: string[]
	maxSize?: number // in MB
	showPreview?: boolean
	enableOCR?: boolean
	onOCRComplete?: (fileId: string, extractedText: string) => void
	onValidationComplete?: (
		fileId: string,
		validation: FileValidationResult
	) => void
}

interface ProcessingFile {
	file: File
	tempId: string
	status: 'ocr' | 'validating' | 'uploading' | 'completed' | 'failed'
	extractedText?: string
	validation?: FileValidationResult
	error?: string
}

export function FileUploadManagerWithOCR({
	className = '',
	onFilesUploaded,
	onFileDeleted,
	category = 'uploads',
	folderId,
	maxFiles = 10,
	acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
	maxSize = 10,
	showPreview = true,
	enableOCR = true,
	onOCRComplete,
	onValidationComplete,
}: FileUploadManagerWithOCRProps) {
	const [dragActive, setDragActive] = useState(false)
	const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
	const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])
	const [validationNotifications, setValidationNotifications] = useState<
		Array<{
			id: string
			validation: FileValidationResult
			fileName: string
			expectedFileType: string
		}>
	>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { saveExtractedText, getExtractedText, hasExtractedText } = useOCRData()

	const { uploadFiles, isUploading, uploadProgress, resetProgress } =
		useFileUpload({
			onSuccess: (files) => {
				// eslint-disable-next-line no-console
				console.log(
					'FileUploadManagerWithOCR: Files uploaded successfully:',
					files
				)
				setUploadedFiles((prev) => {
					const newFiles = [...prev, ...files]
					// eslint-disable-next-line no-console
					console.log(
						'FileUploadManagerWithOCR: Updated uploadedFiles:',
						newFiles
					)
					return newFiles
				})
				onFilesUploaded?.(files)
				resetProgress()
			},
			onError: (error) => {
				// Handle upload error
				alert('Upload failed: ' + error)
			},
			category,
			folderId,
		})

	// New function to process file with OCR and validation BEFORE upload
	const processFileWithOCRAndValidation = useCallback(
		async (file: File) => {
			const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

			// eslint-disable-next-line no-console
			console.log('processFileWithOCRAndValidation called for:', file.name)

			// Add to processing files
			const processingFile: ProcessingFile = {
				file,
				tempId,
				status: 'ocr',
			}
			setProcessingFiles((prev) => [...prev, processingFile])

			try {
				// Step 1: Extract text with OCR if enabled and supported
				let extractedText = ''
				if (enableOCR && mistralOCRService.isOCREnabled()) {
					const isOCRSupported = mistralOCRService.isSupportedFileType(file)
					if (isOCRSupported) {
						// eslint-disable-next-line no-console
						console.log('Starting OCR processing for:', file.name)

						// Update status
						setProcessingFiles((prev) =>
							prev.map((p) =>
								p.tempId === tempId ? { ...p, status: 'ocr' } : p
							)
						)

						// Process OCR based on file type
						let ocrResult
						if (file.type.startsWith('image/')) {
							ocrResult = await mistralOCRService.processImage(file)
						} else if (file.type === 'application/pdf') {
							ocrResult = await mistralOCRService.processPDF(file)
						}
						console.log('OCR result for', file.name, ':', ocrResult)
						console.log('OCR success', ocrResult?.success)
						console.log('OCR Extract', ocrResult?.extractedText)
						if (ocrResult?.success && ocrResult.extractedText) {
							extractedText = ocrResult.extractedText
							// eslint-disable-next-line no-console
							console.log('🔍 OCR EXTRACTION SUCCESS in FileUploadManager:', {
								fileName: file.name,
								fileType: file.type,
								extractedTextLength: extractedText.length,
								extractedTextPreview:
									extractedText.substring(0, 300) +
									(extractedText.length > 300 ? '...(truncated)' : ''),
								fullExtractedText: extractedText,
							})
						} else {
							// eslint-disable-next-line no-console
							console.warn('OCR failed for', file.name, ':', ocrResult?.error)
						}

						// Update processing file with extracted text
						setProcessingFiles((prev) =>
							prev.map((p) =>
								p.tempId === tempId ? { ...p, extractedText } : p
							)
						)
					}
				}

				// Step 2: Validate file if we have extracted text
				let validation: FileValidationResult | undefined
				if (extractedText && category) {
					// eslint-disable-next-line no-console
					console.log('Starting AI validation for:', file.name)

					// Update status
					setProcessingFiles((prev) =>
						prev.map((p) =>
							p.tempId === tempId ? { ...p, status: 'validating' } : p
						)
					)

					try {
						validation = await OllamaFileValidationService.validateFile(
							extractedText,
							category,
							file.name
						)

						// eslint-disable-next-line no-console
						console.log('🤖 AI VALIDATION COMPLETED in FileUploadManager:', {
							fileName: file.name,
							category,
							validation: {
								isValid: validation.isValid,
								confidence: validation.confidence,
								confidencePercentage:
									Math.round(validation.confidence * 100) + '%',
								reasoning: validation.reasoning,
								suggestions: validation.suggestions,
							},
						})

						// Update processing file with validation
						setProcessingFiles((prev) =>
							prev.map((p) => (p.tempId === tempId ? { ...p, validation } : p))
						)

						// Show validation notification if file is invalid or low confidence
						if (
							validation &&
							(!validation.isValid || validation.confidence < 0.7)
						) {
							const notification = {
								id: `${tempId}-${Date.now()}`,
								validation,
								fileName: file.name,
								expectedFileType: category,
							}

							setValidationNotifications((prev) => [...prev, notification])

							// Auto-dismiss notification after 10 seconds for low confidence valid files
							if (validation.isValid && validation.confidence < 0.7) {
								setTimeout(() => {
									setValidationNotifications((prev) =>
										prev.filter((n) => n.id !== notification.id)
									)
								}, 10000)
							}
						}
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error('AI validation failed for', file.name, ':', error)
					}
				}

				// Step 3: Only upload to S3 if validation passes
				// Block upload if: validation failed OR action is 'reupload'
				const shouldUpload =
					!validation ||
					(validation.isValid && validation.action !== 'reupload')

				if (!shouldUpload) {
					// eslint-disable-next-line no-console
					console.log(
						'⛔ Blocking upload for',
						file.name,
						'- validation failed or action=reupload:',
						{
							isValid: validation?.isValid,
							action: validation?.action,
							confidence: validation?.confidence,
						}
					) // Update status to failed
					setProcessingFiles((prev) =>
						prev.map((p) =>
							p.tempId === tempId
								? {
										...p,
										status: 'failed',
										error: 'File validation failed',
									}
								: p
						)
					)

					// Remove from processing after longer delay to show error message
					setTimeout(() => {
						setProcessingFiles((prev) =>
							prev.filter((p) => p.tempId !== tempId)
						)
					}, 8000)

					return
				} // eslint-disable-next-line no-console
				console.log(
					'File passed validation, proceeding with upload:',
					file.name
				)

				// Update status
				setProcessingFiles((prev) =>
					prev.map((p) =>
						p.tempId === tempId ? { ...p, status: 'uploading' } : p
					)
				)

				// Upload file to S3
				await uploadFiles([file])

				// Update status to completed
				setProcessingFiles((prev) =>
					prev.map((p) =>
						p.tempId === tempId ? { ...p, status: 'completed' } : p
					)
				)

				// Find the uploaded file (should be the most recent one)
				setTimeout(() => {
					setUploadedFiles((currentFiles) => {
						const uploadedFile = currentFiles[currentFiles.length - 1]
						if (uploadedFile && extractedText) {
							// eslint-disable-next-line no-console
							console.log(
								'Calling onOCRComplete with real file ID:',
								uploadedFile.id
							)

							// Save extracted text with real file ID
							saveExtractedText(uploadedFile.id, extractedText)

							// Call callbacks with real file ID
							onOCRComplete?.(uploadedFile.id, extractedText)
							if (validation) {
								onValidationComplete?.(uploadedFile.id, validation)
							}
						}
						return currentFiles
					})

					// Remove from processing
					setProcessingFiles((prev) => prev.filter((p) => p.tempId !== tempId))
				}, 100)
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error processing file:', error)

				// Update status to failed
				setProcessingFiles((prev) =>
					prev.map((p) =>
						p.tempId === tempId
							? {
									...p,
									status: 'failed',
									error: (error as Error).message,
								}
							: p
					)
				)

				// Still try to upload if processing fails
				try {
					await uploadFiles([file])
				} catch (uploadError) {
					// eslint-disable-next-line no-console
					console.error('Upload also failed:', uploadError)
				}

				// Remove from processing after delay
				setTimeout(() => {
					setProcessingFiles((prev) => prev.filter((p) => p.tempId !== tempId))
				}, 5000)
			}
		},
		[
			enableOCR,
			onOCRComplete,
			onValidationComplete,
			saveExtractedText,
			uploadFiles,
			category,
		]
	)

	const handleFileSelection = useCallback(
		async (files: File[]) => {
			// eslint-disable-next-line no-console
			console.log('handleFileSelection called with files:', files)

			// Limit files to maxFiles if specified
			const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files

			if (maxFiles && files.length > maxFiles) {
				alert(
					`You can only select up to ${maxFiles} file(s). Only the first ${maxFiles} file(s) will be processed.`
				)
			}

			const validFiles = limitedFiles.filter((file) => {
				// Check file size
				if (file.size > maxSize * 1024 * 1024) {
					alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
					return false
				}

				// Check file type
				const isValidType = acceptedTypes.some((type) => {
					if (type.endsWith('/*')) {
						return file.type.startsWith(type.slice(0, -1))
					}
					return file.type === type
				})

				if (!isValidType) {
					alert(`File ${file.name} is not an accepted file type.`)
					return false
				}

				return true
			})

			if (validFiles.length > 0) {
				// Process each file: OCR + validate first, then upload only if valid
				for (const file of validFiles) {
					await processFileWithOCRAndValidation(file)
				}
			}
		},
		[maxFiles, maxSize, acceptedTypes, processFileWithOCRAndValidation]
	)

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			e.stopPropagation()
			setDragActive(false)

			if (e.dataTransfer.files && e.dataTransfer.files[0]) {
				const files = Array.from(e.dataTransfer.files)
				handleFileSelection(files)
			}
		},
		[handleFileSelection]
	)

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files)
			handleFileSelection(files)
		}
	}

	// eslint-disable-next-line no-unused-vars
	const handleFileDelete = (fileId: string) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
		onFileDeleted?.(fileId)
	}

	// eslint-disable-next-line no-unused-vars
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	return (
		<div className={cn('space-y-4', className)}>
			{/* Validation Notifications */}
			{validationNotifications.length > 0 && (
				<div className="space-y-3">
					{validationNotifications.map((notification) => (
						<FileValidationNotification
							key={notification.id}
							validation={notification.validation}
							fileName={notification.fileName}
							expectedFileType={notification.expectedFileType}
							onDismiss={() => {
								setValidationNotifications((prev) =>
									prev.filter((n) => n.id !== notification.id)
								)
							}}
						/>
					))}
				</div>
			)}

			{/* Processing Files Status */}
			{processingFiles.length > 0 && (
				<div className="space-y-2">
					{/* <h4 className="text-sm font-medium">Processing Files</h4> */}
					{processingFiles.map((file) => (
						<div
							key={file.tempId}
							className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-200"
						>
							<div className="flex-shrink-0">
								{file.status === 'ocr' && (
									<Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
								)}
								{file.status === 'validating' && (
									<CheckCircle className="w-4 h-4 text-orange-600 animate-pulse" />
								)}
								{file.status === 'uploading' && (
									<div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
								)}
								{file.status === 'completed' && (
									<CheckCircle className="w-4 h-4 text-green-600" />
								)}
								{file.status === 'failed' && (
									<AlertCircle className="w-4 h-4 text-red-600" />
								)}
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium">{file.file.name}</p>
								<p className="text-xs text-muted-foreground">
									{file.status === 'ocr' &&
										'Extracting text (it will take a few seconds)...'}
									{file.status === 'validating' &&
										'Validating content (it will take 15s - 20s)...'}
									{file.status === 'uploading' && 'Uploading to cloud...'}
									{file.status === 'completed' && 'Processing complete'}
									{file.status === 'failed' && `Failed: ${file.error}`}
								</p>
								{/* {file.validation && (
									<div className="mt-1">
										<FileValidationDisplay
											validation={file.validation}
											fileName={file.file.name}
										/>
									</div>
								)} */}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Upload Area */}
			<div
				className={cn(
					'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
					dragActive
						? 'border-primary bg-primary/5 cursor-pointer'
						: 'border-border hover:border-primary/50 cursor-pointer',
					isUploading && 'opacity-50 pointer-events-none'
				)}
				role="button"
				tabIndex={0}
				aria-disabled={isUploading}
				onClick={() => {
					if (!isUploading) fileInputRef.current?.click()
				}}
				onKeyDown={(e: React.KeyboardEvent) => {
					if (isUploading) return
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						fileInputRef.current?.click()
					}
				}}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				{!isUploading ? (
					<div className="space-y-2">
						<div className="text-4xl">📁</div>
						<p className="text-sm text-muted-foreground">
							Drag and drop files here, or{' '}
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="text-primary hover:underline"
							>
								browse
							</button>
						</p>
						<p className="text-xs text-muted-foreground">{maxSize}MB each</p>
						{enableOCR && (
							<p className="text-xs text-primary flex items-center justify-center gap-1">
								<Sparkles className="w-3 h-3" />
								OCR text extraction is available
							</p>
						)}
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex flex-col items-center gap-3">
							<Hourglass className="w-10 h-10 text-primary animate-pulse" />
							<p className="text-sm font-medium text-foreground">
								Uploading files...
							</p>
							{/* Overall progress bar (0 - 100%) */}
							{uploadProgress.length > 0 && (
								<div className="w-full max-w-xl">
									{(() => {
										const total = uploadProgress.reduce(
											(acc, p) => acc + (p.progress || 0),
											0
										)
										const overall = Math.round(total / uploadProgress.length)
										return (
											<div className="space-y-2">
												<div className="w-full h-3 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-primary transition-all duration-300"
														style={{ width: `${overall}%` }}
													/>
												</div>
												<div className="flex items-center justify-between text-xs text-muted-foreground">
													<span>Overall progress</span>
													<span>{overall}%</span>
												</div>
											</div>
										)
									})()}
								</div>
							)}
						</div>
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					multiple={maxFiles > 1}
					accept={acceptedTypes.join(',')}
					onChange={handleFileInputChange}
					className="hidden"
				/>
			</div>

			{/* Uploaded Files Preview */}
			{/* {showPreview && uploadedFiles.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-medium">Uploaded Files</h4>
					<div className="space-y-2">
						{uploadedFiles.map((file) => (
							<div
								key={file.id}
								className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
							>
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<span className="text-2xl flex-shrink-0">
										{file.type?.startsWith('image/') ? '🖼️' : '📄'}
									</span>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-sm truncate">
											{file.name || file.originalName || 'Document'}
										</p>
										<p className="text-sm text-muted-foreground">
											{formatFileSize(file.size || 0)}
											{file.type && ` • ${file.type}`}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 flex-shrink-0">
									<Button
										size="sm"
										variant="outline"
										onClick={() => window.open(file.url, '_blank')}
										className="p-2"
										title="View file"
									>
										<Eye className="w-4 h-4" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleFileDelete(file.id)}
										className="p-2 text-red-600 hover:text-red-700"
										title="Delete file"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			)} */}
		</div>
	)
}

export default FileUploadManagerWithOCR
