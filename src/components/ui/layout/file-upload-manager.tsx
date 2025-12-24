'use client'

import { useFileUpload } from '@/hooks/files/useFileUpload'
import { FileItem } from '@/utils/file/file-utils'
import { cn } from '@/utils/index'
import React, { useCallback, useRef, useState } from 'react'

interface FileUploadManagerProps {
	className?: string
	onFilesUploaded?: (files: FileItem[]) => void
	onFileDeleted?: (fileId: string) => void
	category?: string
	folderId?: string
	maxFiles?: number
	acceptedTypes?: string[]
	maxSize?: number // in MB
	showPreview?: boolean
}

export function FileUploadManager({
	className = '',
	onFilesUploaded,
	onFileDeleted,
	category = 'uploads',
	folderId,
	maxFiles = 10,
	acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
	maxSize = 10,
	showPreview = true,
}: FileUploadManagerProps) {
	const [dragActive, setDragActive] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { uploadFiles, isUploading, uploadProgress, resetProgress } =
		useFileUpload({
			onSuccess: (files) => {
				onFilesUploaded?.(files)
				resetProgress()
			},
			onError: (error) => {
				console.error('Upload error:', error)
			},
			category,
			folderId,
		})

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}, [])

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const files = Array.from(e.dataTransfer.files)
			handleFileSelection(files)
		}
	}, [])

	const handleFileSelection = async (files: File[]) => {
		// Block file selection if upload is in progress
		if (isUploading) {
			alert(
				'Please wait for the current upload to complete before adding more files.'
			)
			return
		}

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
			// Auto-upload files immediately after selection
			await uploadFiles(validFiles)
		}
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files)
			handleFileSelection(files)
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	return (
		<div className={cn('space-y-4', className)}>
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
				onDragEnter={(e) => {
					if (!isUploading) handleDrag(e)
				}}
				onDragLeave={handleDrag}
				onDragOver={(e) => {
					if (!isUploading) handleDrag(e)
				}}
				onDrop={(e) => {
					if (!isUploading) handleDrop(e)
				}}
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
					</div>
				) : (
					<div className="space-y-4">
						<div className="text-4xl">⏳</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground">
								Uploading files...
							</p>
							<p className="text-xs text-muted-foreground">
								Please wait for the upload to complete
							</p>
							{uploadProgress.length > 0 && (
								<div className="space-y-2">
									{uploadProgress.map((progress, index) => (
										<div key={index} className="flex items-center space-x-2">
											<span className="text-xs w-16 truncate">
												File {index + 1}
											</span>
											<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
												<div
													className="h-full bg-primary transition-all duration-300"
													style={{ width: `${progress.progress}%` }}
												/>
											</div>
											<span className="text-xs text-muted-foreground w-8">
												{progress.status === 'completed' && '✓'}
												{progress.status === 'error' && '✗'}
												{progress.status === 'uploading' &&
													`${progress.progress}%`}
											</span>
										</div>
									))}
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
		</div>
	)
}

export default FileUploadManager
