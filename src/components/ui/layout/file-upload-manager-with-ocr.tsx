'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useFileUpload } from '@/hooks/files/useFileUpload'
import { FileItem } from '@/utils/file/file-utils'
import { useOCRData } from '@/components/ocr/OCRButton'
import { mistralOCRService } from '@/services/ocr/mistral-ocr-service'
import {
	OllamaFileValidationService,
	FileValidationResult,
} from '@/services/ai/ollama-file-validation-service'
import { cn } from '@/utils/index'
import { Sparkles, CheckCircle, AlertCircle, Hourglass } from 'lucide-react'
import { FileValidationNotification } from '@/components/validation/FileValidationNotification'
import { useTranslations } from 'next-intl'

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
	// showPreview = true, // Unused for now
	enableOCR = true,
	onOCRComplete,
	onValidationComplete,
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
	const fileInputRef = useRef<HTMLInputElement>(null)

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

	// New function to process file with OCR and validation BEFORE upload
	const processFileWithOCRAndValidation = useCallback(
		async (file: File) => {
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
					}, 8000)

					return
				}

				// eslint-disable-next-line no-console
				console.log(
					'File passed all checks, proceeding with upload:',
					file.name,
					{
						ocrRequired,
						ocrPerformed,
						validationPerformed,
						isValid: validation?.isValid,
					}
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
						// Find the file that matches our file name and was recently uploaded
						const uploadedFile = currentFiles
							.filter(
								(f) => f.name === file.name || f.originalName === file.name
							)
							.sort(
								(a, b) =>
									new Date(b.createdAt).getTime() -
									new Date(a.createdAt).getTime()
							)[0]

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

				// Don't upload if processing fails - maintain data integrity
				// Only upload if file passes all validation checks

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
				alert(t('file_upload.alerts.max_files', { maxFiles }))
			}

			// Check for duplicate files in processing queue
			const currentProcessingFiles = processingFiles.map((pf) => pf.file.name)

			const validFiles = limitedFiles.filter((file) => {
				if (currentProcessingFiles.includes(file.name)) {
					alert(
						`File ${file.name} is already being processed. Please wait for it to complete.`
					)
					return false
				}

				// Check file size
				if (file.size > maxSize * 1024 * 1024) {
					alert(
						t('file_upload.alerts.file_too_large', {
							fileName: file.name,
							maxSize,
						})
					)
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
					alert(t('file_upload.alerts.invalid_type', { fileName: file.name }))
					return false
				}

				return true
			})

			if (validFiles.length > 0) {
				// Process files in parallel for better performance
				const processingPromises = validFiles.map((file) =>
					processFileWithOCRAndValidation(file).catch((error) => {
						// eslint-disable-next-line no-console
						console.error(`Error processing file ${file.name}:`, error)
						return null // Continue processing other files
					})
				)
				await Promise.allSettled(processingPromises)
			}
		},
		[
			maxFiles,
			maxSize,
			acceptedTypes,
			processFileWithOCRAndValidation,
			processingFiles,
			t,
			onFilesUploaded,
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
									{file.status === 'uploading' && 'Uploading to cloud...'}
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
				{' '}
				{!isUploading ? (
					<div className="space-y-2">
						<div className="text-4xl">📁</div>
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
				) : (
					<div className="space-y-4">
						<div className="flex flex-col items-center gap-3">
							<Hourglass className="w-10 h-10 text-primary animate-pulse" />
							<p className="text-sm font-medium text-foreground">
								{t('file_upload.uploading_files')}
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
