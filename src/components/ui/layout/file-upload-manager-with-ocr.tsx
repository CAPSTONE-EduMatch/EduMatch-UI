'use client'

import { useOCRData } from '@/components/ocr/OCRButton'
import { FileValidationNotification } from '@/components/validation/FileValidationNotification'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import {
	FileValidationResult,
	OllamaFileValidationService,
} from '@/services/ai/ollama-file-validation-service'
import { mistralOCRService } from '@/services/ocr/mistral-ocr-service'
import { FileItem } from '@/utils/file/file-utils'
import { cn } from '@/utils/index'
import { AlertCircle, CheckCircle, Hourglass, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useCallback, useRef, useState } from 'react'

interface FileUploadManagerWithOCRProps {
	className?: string
	// eslint-disable-next-line no-unused-vars
	onFilesUploaded?: (files: FileItem[]) => void
	// eslint-disable-next-line no-unused-vars
	onFileDeleted?: (fileId: string) => void
	category?: string
	folderId?: string
	maxFiles?: number
	acceptedTypes?: string[]
	maxSize?: number // in MB
	showPreview?: boolean
	enableOCR?: boolean
	// eslint-disable-next-line no-unused-vars
	onOCRComplete?: (fileId: string, extractedText: string) => void
	// eslint-disable-next-line no-unused-vars
	// eslint-disable-next-line no-unused-vars
	onValidationComplete?: (
		// eslint-disable-next-line no-unused-vars
		fileId: string,
		// eslint-disable-next-line no-unused-vars
		validation: FileValidationResult
	) => void
	// Authentication props
	isAuthenticated?: boolean
	onAuthRequired?: () => void
	// Global upload control
	isGloballyDisabled?: boolean
	onFileSelectionStart?: () => void
	onProcessingComplete?: () => void
}

interface ProcessingFile {
	file: File
	tempId: string
	status:
		| 'ocr'
		| 'validating'
		| 'validated'
		| 'uploading'
		| 'completed'
		| 'failed'
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
	// showPreview = true, // Unused for now
	enableOCR = true,
	onOCRComplete,
	onValidationComplete,
	isAuthenticated = true, // Default to true for backward compatibility
	onAuthRequired,
	isGloballyDisabled = false,
	onFileSelectionStart,
	onProcessingComplete,
}: FileUploadManagerWithOCRProps) {
	const t = useTranslations()
	const [dragActive, setDragActive] = useState(false)
	// Track uploaded files for OCR callback matching
	// eslint-disable-next-line no-unused-vars
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
	const [fileErrors, setFileErrors] = useState<
		Array<{
			id: string
			fileName: string
			errorMessage: string
		}>
	>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Check if any files are currently uploading
	const isFilesUploading = processingFiles.some((f) => f.status === 'uploading')

	const { saveExtractedText } = useOCRData()

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
				alert(t('file_upload.alerts.upload_failed', { error }))
			},
			category,
			folderId,
		})

	// Batch upload function for validated files
	const batchUploadValidatedFiles = useCallback(
		async (validatedFiles: ProcessingFile[]) => {
			// eslint-disable-next-line no-console
			console.log(`📤 Batch uploading ${validatedFiles.length} validated files`)

			// Update all to 'uploading' status
			validatedFiles.forEach((pf) => {
				setProcessingFiles((prev) =>
					prev.map((p) =>
						p.tempId === pf.tempId ? { ...p, status: 'uploading' } : p
					)
				)
			})

			try {
				// Upload all files at once
				await uploadFiles(validatedFiles.map((pf) => pf.file))

				// eslint-disable-next-line no-console
				console.log('✅ Batch upload completed successfully')

				// Mark all as completed
				validatedFiles.forEach((pf) => {
					setProcessingFiles((prev) =>
						prev.map((p) =>
							p.tempId === pf.tempId ? { ...p, status: 'completed' } : p
						)
					)
				})

				// Remove completed files after brief delay
				setTimeout(() => {
					validatedFiles.forEach((pf) => {
						setProcessingFiles((prev) =>
							prev.filter((p) => p.tempId !== pf.tempId)
						)
					})
				}, 1500)

				// Handle callbacks after upload
				setTimeout(() => {
					setUploadedFiles((currentFiles) => {
						validatedFiles.forEach((pf) => {
							// Find the uploaded file
							const uploadedFile = currentFiles
								.filter(
									(f) =>
										f.name === pf.file.name || f.originalName === pf.file.name
								)
								.sort(
									(a, b) =>
										new Date(b.createdAt).getTime() -
										new Date(a.createdAt).getTime()
								)[0]

							if (uploadedFile) {
								// Save extracted text with real file ID
								if (pf.extractedText) {
									saveExtractedText(uploadedFile.id, pf.extractedText)
									onOCRComplete?.(uploadedFile.id, pf.extractedText)
								}

								// Call validation callback
								if (pf.validation) {
									onValidationComplete?.(uploadedFile.id, pf.validation)
								}
							}
						})

						return currentFiles
					})
				}, 200)

				// Notify parent that processing is complete
				if (onProcessingComplete) {
					onProcessingComplete()
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Batch upload failed:', error)
				// Mark all as failed
				validatedFiles.forEach((pf) => {
					setProcessingFiles((prev) =>
						prev.map((p) =>
							p.tempId === pf.tempId
								? {
										...p,
										status: 'failed',
										error: 'Upload failed',
									}
								: p
						)
					)
				})
			}

			// Notify parent that processing is complete (even if failed)
			if (onProcessingComplete) {
				onProcessingComplete()
			}
		},
		[
			uploadFiles,
			saveExtractedText,
			onOCRComplete,
			onValidationComplete,
			onProcessingComplete,
		]
	)

	// New function to process file with OCR and validation BEFORE upload
	// Returns validation result instead of uploading directly
	const processFileWithOCRAndValidation = useCallback(
		async (
			file: File
		): Promise<{
			file: File
			shouldUpload: boolean
			validation?: FileValidationResult
			extractedText?: string
			tempId: string
		}> => {
			// Create unique ID with file name and timestamp to avoid conflicts
			const tempId = crypto.randomUUID()

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
						// eslint-disable-next-line no-console
						console.log('OCR result for', file.name, ':', ocrResult)
						// eslint-disable-next-line no-console
						console.log('OCR success', ocrResult?.success)
						// eslint-disable-next-line no-console
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

				// Step 3: Only upload to S3 if OCR AND validation are completed
				// Block upload if:
				// 1. OCR was not performed when it should be (enableOCR=true and supported file type)
				// 2. Validation was not performed when there's extracted text
				// 3. Validation failed or action is 'reupload'

				const ocrRequired =
					enableOCR && mistralOCRService.isSupportedFileType(file)
				const ocrPerformed = !!extractedText
				const validationPerformed = !!validation

				let shouldUpload = true
				let blockReason = ''

				// Block if OCR should have been performed but wasn't
				if (ocrRequired && !ocrPerformed) {
					shouldUpload = false
					blockReason = 'OCR extraction required but not completed'
				}
				// Block if validation should have been performed but wasn't
				else if (extractedText && !validationPerformed) {
					shouldUpload = false
					blockReason = 'Content validation required but not completed'
				}
				// Block if validation failed or action is 'reupload'
				else if (
					validation &&
					(!validation.isValid || validation.action === 'reupload')
				) {
					shouldUpload = false
					blockReason = 'File validation failed or requires reupload'
				}

				if (!shouldUpload) {
					// eslint-disable-next-line no-console
					console.log(
						'Blocking upload for',
						file.name,
						'- Reason:',
						blockReason,
						{
							ocrRequired,
							ocrPerformed,
							validationPerformed,
							isValid: validation?.isValid,
							action: validation?.action,
							confidence: validation?.confidence,
						}
					)

					// Update status to failed
					setProcessingFiles((prev) =>
						prev.map((p) =>
							p.tempId === tempId
								? {
										...p,
										status: 'failed',
										error: blockReason,
									}
								: p
						)
					)

					// Remove from processing after longer delay to show error message
					setTimeout(() => {
						setProcessingFiles((prev) =>
							prev.filter((p) => p.tempId !== tempId)
						)
						// Notify parent that processing is complete (validation failed)
						if (onProcessingComplete) {
							onProcessingComplete()
						}
					}, 200)

					return {
						file,
						shouldUpload: false,
						tempId,
					}
				} // eslint-disable-next-line no-console
				console.log('File passed all checks, will be uploaded:', file.name, {
					ocrRequired,
					ocrPerformed,
					validationPerformed,
					isValid: validation?.isValid,
				})

				// Update status to 'validated' - file passed validation, waiting for batch upload
				setProcessingFiles((prev) =>
					prev.map((p) =>
						p.tempId === tempId ? { ...p, status: 'validated' as const } : p
					)
				)

				// Check if all files completed validation, trigger auto-batch upload
				setTimeout(() => {
					setProcessingFiles((current) => {
						const allCompleted = current.every(
							(f) =>
								f.status === 'validated' ||
								f.status === 'failed' ||
								f.status === 'completed'
						)
						if (allCompleted && current.some((f) => f.status === 'validated')) {
							// Trigger batch upload
							const validatedFiles = current.filter(
								(f) => f.status === 'validated'
							)
							if (validatedFiles.length > 0) {
								batchUploadValidatedFiles(validatedFiles)
							}
						}
						return current
					})
				}, 500) // Small delay to ensure state is updated

				// Return file info for batch upload
				return {
					file,
					shouldUpload: true,
					validation,
					extractedText,
					tempId,
				}
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

				// Don't upload if processing fails - maintain data integrity
				// Only upload if file passes all validation checks

				// Remove from processing after delay
				setTimeout(() => {
					setProcessingFiles((prev) => prev.filter((p) => p.tempId !== tempId))
					// Notify parent that processing is complete (with error)
					if (onProcessingComplete) {
						onProcessingComplete()
					}
				}, 5000)

				return {
					file,
					shouldUpload: false,
					tempId,
				}
			}
		},
		[enableOCR, category, batchUploadValidatedFiles, onProcessingComplete]
	)

	const handleFileSelection = useCallback(
		async (files: File[]) => {
			// Check authentication first
			if (!isAuthenticated) {
				if (onAuthRequired) {
					onAuthRequired()
				} else {
					alert(t('auth.required.message') || 'Please sign in to upload files.')
				}
				return
			}

			// Block file selection if upload is in progress (locally or globally)
			if (isFilesUploading || isGloballyDisabled) {
				alert(
					t('file_upload.alerts.upload_in_progress') ||
						'Please wait for the current upload to complete before adding more files.'
				)
				return
			}

			// Notify parent that file selection has started
			if (onFileSelectionStart) {
				onFileSelectionStart()
			}

			// eslint-disable-next-line no-console
			console.log('handleFileSelection called with files:', files)

			// Limit files to maxFiles if specified
			const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files

			if (maxFiles && files.length > maxFiles) {
				alert(t('file_upload.alerts.max_files', { maxFiles }))
			}

			// Note: Duplicate file check removed to allow multiple file selections
			// while previous files are processing. Each file gets unique tempId.

			const validFiles = limitedFiles.filter((file) => {
				// Check file size
				if (file.size > maxSize * 1024 * 1024) {
					const errorId = `${Date.now()}-${Math.random()}`
					setFileErrors((prev) => [
						...prev,
						{
							id: errorId,
							fileName: file.name,
							errorMessage: t('file_upload.alerts.file_too_large', {
								fileName: file.name,
								maxSize,
							}),
						},
					])
					// Auto-dismiss after 8 seconds
					setTimeout(() => {
						setFileErrors((prev) => prev.filter((e) => e.id !== errorId))
					}, 8000)
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
					const errorId = `${Date.now()}-${Math.random()}`
					setFileErrors((prev) => [
						...prev,
						{
							id: errorId,
							fileName: file.name,
							errorMessage: t('file_upload.alerts.invalid_type', {
								fileName: file.name,
							}),
						},
					])
					// Auto-dismiss after 8 seconds
					setTimeout(() => {
						setFileErrors((prev) => prev.filter((e) => e.id !== errorId))
					}, 8000)
					return false
				}

				return true
			})

			// If no valid files, reset upload state
			if (validFiles.length === 0) {
				// eslint-disable-next-line no-console
				console.log('No valid files to process, resetting upload state')
				if (onProcessingComplete) {
					onProcessingComplete()
				}
				return
			}

			if (validFiles.length > 0) {
				// Process files in parallel for better performance
				const processingPromises = validFiles.map((file) =>
					processFileWithOCRAndValidation(file).catch((error) => {
						// eslint-disable-next-line no-console
						console.error(`Error processing file ${file.name}:`, error)
						const tempId = `temp-${Date.now()}-${Math.random()}`
						return { file, shouldUpload: false, tempId } // Continue processing other files
					})
				)
				const processingResults = await Promise.allSettled(processingPromises)

				// Extract files that passed validation and should be uploaded
				const filesToUpload: Array<{
					file: File
					validation?: FileValidationResult
					extractedText?: string
					tempId: string
				}> = []

				processingResults.forEach((result) => {
					if (result.status === 'fulfilled' && result.value.shouldUpload) {
						// Only files that passed validation have these properties
						const value = result.value as {
							file: File
							shouldUpload: boolean
							validation?: FileValidationResult
							extractedText?: string
							tempId: string
						}
						filesToUpload.push({
							file: value.file,
							validation: value.validation,
							extractedText: value.extractedText,
							tempId: value.tempId,
						})
					}
				})

				// eslint-disable-next-line no-console
				console.log(
					`📤 Batch uploading ${filesToUpload.length} files that passed validation`
				)

				// Upload all validated files in a single batch
				if (filesToUpload.length > 0) {
					// Update status to uploading for all files
					filesToUpload.forEach((item) => {
						if (item.tempId) {
							setProcessingFiles((prev) =>
								prev.map((p) =>
									p.tempId === item.tempId ? { ...p, status: 'uploading' } : p
								)
							)
						}
					})

					try {
						// Upload all files at once
						await uploadFiles(filesToUpload.map((item) => item.file))

						// eslint-disable-next-line no-console
						console.log('✅ Batch upload completed successfully')

						// Immediately update all to completed status
						filesToUpload.forEach((item) => {
							if (item.tempId) {
								setProcessingFiles((prev) =>
									prev.map((p) =>
										p.tempId === item.tempId ? { ...p, status: 'completed' } : p
									)
								)
							}
						})

						// Remove all completed files from processing after brief delay
						setTimeout(() => {
							filesToUpload.forEach((item) => {
								if (item.tempId) {
									setProcessingFiles((prev) =>
										prev.filter((p) => p.tempId !== item.tempId)
									)
								}
							})
						}, 1500)

						// Handle callbacks after upload - find uploaded files
						setTimeout(() => {
							setUploadedFiles((currentFiles) => {
								filesToUpload.forEach((item) => {
									// Find the uploaded file
									const uploadedFile = currentFiles
										.filter(
											(f) =>
												f.name === item.file.name ||
												f.originalName === item.file.name
										)
										.sort(
											(a, b) =>
												new Date(b.createdAt).getTime() -
												new Date(a.createdAt).getTime()
										)[0]

									if (uploadedFile) {
										// eslint-disable-next-line no-console
										console.log(
											'Calling callbacks for uploaded file:',
											uploadedFile.id,
											item.file.name
										)

										// Save extracted text with real file ID
										if (item.extractedText) {
											saveExtractedText(uploadedFile.id, item.extractedText)
											onOCRComplete?.(uploadedFile.id, item.extractedText)
										}

										// Call validation callback
										if (item.validation) {
											onValidationComplete?.(uploadedFile.id, item.validation)
										}
									}
								})

								return currentFiles
							})
						}, 200)
					} catch (error) {
						// eslint-disable-next-line no-console
						console.error('Batch upload failed:', error)
						// Mark all as failed
						filesToUpload.forEach((item) => {
							if (item.tempId) {
								setProcessingFiles((prev) =>
									prev.map((p) =>
										p.tempId === item.tempId
											? {
													...p,
													status: 'failed',
													error: 'Upload failed',
												}
											: p
									)
								)
							}
						})
					}
				}
			}
		},
		[
			maxFiles,
			maxSize,
			acceptedTypes,
			processFileWithOCRAndValidation,
			t,
			uploadFiles,
			saveExtractedText,
			onOCRComplete,
			onValidationComplete,
			isAuthenticated,
			onAuthRequired,
			isFilesUploading,
			isGloballyDisabled,
			onFileSelectionStart,
			onProcessingComplete,
		]
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
			// Clear the input to allow re-selecting the same file
			e.target.value = ''
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
			{/* File Error Notifications */}
			{fileErrors.length > 0 && (
				<div className="space-y-3">
					{fileErrors.map((error) => (
						<div
							key={error.id}
							className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border border-red-20"
						>
							<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-red-900">
									{error.fileName}
								</p>
								<p className="text-sm text-red-700 mt-1">
									{error.errorMessage}
								</p>
							</div>
							<button
								onClick={() =>
									setFileErrors((prev) => prev.filter((e) => e.id !== error.id))
								}
								className="text-red-400 hover:text-red-600 flex-shrink-0"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					))}
				</div>
			)}

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
								{file.status === 'validated' && (
									<CheckCircle className="w-4 h-4 text-green-600" />
								)}
								{file.status === 'uploading' && (
									<div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
								)}
								{file.status === 'completed' && (
									<CheckCircle className="w-4 h-4 text-green-600" />
								)}
								{/* {file.status === 'failed' && (
									<AlertCircle className="w-4 h-4 text-red-600" />
								)} */}
							</div>{' '}
							<div className="flex-1">
								<p className="text-sm font-medium">{file.file.name}</p>
								<p className="text-xs text-muted-foreground">
									{file.status === 'ocr' &&
										t('file_upload.processing.extracting')}
									{file.status === 'validating' &&
										'Validating content (it will take 15s - 20s)...'}
									{file.status === 'validated' &&
										'Validated, waiting for batch upload...'}
									{file.status === 'uploading' &&
										'Uploading to cloud storage...'}
									{file.status === 'completed' && 'Processing complete'}
									{/* {file.status === 'failed' &&
										`⚠️ Upload blocked: ${file.error || 'Processing failed'}`} */}
								</p>
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
					(isUploading ||
						isFilesUploading ||
						isGloballyDisabled ||
						!isAuthenticated) &&
						'opacity-50 pointer-events-none'
				)}
				role="button"
				tabIndex={0}
				aria-disabled={
					isUploading ||
					isFilesUploading ||
					isGloballyDisabled ||
					!isAuthenticated
				}
				onClick={() => {
					if (!isAuthenticated) {
						if (onAuthRequired) {
							onAuthRequired()
						}
						return
					}
					if (!isUploading && !isFilesUploading && !isGloballyDisabled)
						fileInputRef.current?.click()
				}}
				onKeyDown={(e: React.KeyboardEvent) => {
					if (!isAuthenticated) {
						if (onAuthRequired) {
							onAuthRequired()
						}
						return
					}
					if (isUploading || isFilesUploading || isGloballyDisabled) return
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						fileInputRef.current?.click()
					}
				}}
				onDragEnter={(e) => {
					if (!isAuthenticated || isGloballyDisabled) {
						e.preventDefault()
						e.stopPropagation()
						return
					}
					handleDrag(e)
				}}
				onDragLeave={handleDrag}
				onDragOver={(e) => {
					if (!isAuthenticated || isGloballyDisabled) {
						e.preventDefault()
						e.stopPropagation()
						return
					}
					handleDrag(e)
				}}
				onDrop={(e) => {
					if (!isAuthenticated || isGloballyDisabled) {
						e.preventDefault()
						e.stopPropagation()
						if (!isAuthenticated && onAuthRequired) {
							onAuthRequired()
						}
						return
					}
					handleDrop(e)
				}}
			>
				{' '}
				{!isUploading ? (
					<div className="space-y-2">
						<div className="text-4xl">📁</div>
						{!isAuthenticated ? (
							<>
								<p className="text-sm font-medium text-gray-900">
									{t('auth.required.title') || 'Sign In Required'}
								</p>
								<p className="text-xs text-muted-foreground">
									{t('auth.required.message') ||
										'Please sign in or sign up to upload documents.'}
								</p>
							</>
						) : (
							<>
								<p className="text-sm text-muted-foreground">
									{t('file_upload.drag_drop')}{' '}
									{/* <button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="text-primary hover:underline"
									>
										{t('file_upload.browse')}
									</button> */}
								</p>
								<p className="text-xs text-muted-foreground">
									{t('file_upload.max_size', { size: maxSize })}
								</p>
							</>
						)}
						{enableOCR && (
							<div className="text-xs text-primary flex flex-col items-center gap-1">
								<div className="flex items-center gap-1">
									<Sparkles className="w-3 h-3" />
									<span>{t('file_upload.ocr_required')}</span>
								</div>
								<span className="text-xs text-muted-foreground">
									{t('file_upload.validation_required')}
								</span>
							</div>
						)}
					</div>
				) : isFilesUploading ? (
					<div className="space-y-4">
						<div className="flex flex-col items-center gap-3">
							<Hourglass className="w-10 h-10 text-primary animate-pulse" />
							<p className="text-sm font-medium text-foreground">
								{t('file_upload.uploading_files') || 'Uploading files...'}
							</p>
							<p className="text-xs text-muted-foreground">
								Please wait for the upload to complete
							</p>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex flex-col items-center gap-3">
							<Hourglass className="w-10 h-10 text-primary animate-pulse" />
							<p className="text-sm font-medium text-foreground">
								{t('file_upload.uploading_files')}
							</p>
							{/* Overall progress bar (0 - 100%) */}
							onal looking for educational opportunities, courses, or programs.
							￼ Institution{' '}
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
													<span>{t('file_upload.overall_progress')}</span>
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
