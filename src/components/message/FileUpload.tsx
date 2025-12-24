'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, FileText, Archive } from 'lucide-react'
import {
	formatFileSize,
	getFileCategory,
	getFileIcon,
} from '@/utils/file/file-utils'

interface FileUploadProps {
	onFileSelect: (file: File) => void
	onClose: () => void
	maxSize?: number // in bytes
	acceptedTypes?: string[]
}

interface FilePreview {
	file: File
	preview?: string
	category: string
	icon: string
}

export function FileUpload({
	onFileSelect,
	onClose,
	maxSize = 10 * 1024 * 1024, // 10MB default
	acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
}: FileUploadProps) {
	const [dragActive, setDragActive] = useState(false)
	const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null)
	const [error, setError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const validateFile = useCallback(
		(file: File): string | null => {
			// Check file size first (10MB limit)
			if (file.size > maxSize) {
				return `File size (${formatFileSize(file.size)}) exceeds the maximum limit of ${formatFileSize(maxSize)}. Please choose a smaller file.`
			}

			if (acceptedTypes.length > 0) {
				const isAccepted = acceptedTypes.some((type) => {
					if (type.endsWith('/*')) {
						return file.type.startsWith(type.slice(0, -1))
					}
					return file.type === type
				})

				if (!isAccepted) {
					return `File type "${file.type || 'unknown'}" is not supported. Please select a supported file type.`
				}
			}

			return null
		},
		[maxSize, acceptedTypes]
	)

	const createFilePreview = (file: File): FilePreview => {
		const category = getFileCategory(file.name.split('.').pop() || '')
		const icon = getFileIcon(category, file.name.split('.').pop() || '')

		return {
			file,
			category,
			icon,
		}
	}

	const handleFile = useCallback(
		(file: File) => {
			// Clear previous error and file
			setError(null)
			setSelectedFile(null)

			// Validate file first
			const validationError = validateFile(file)
			if (validationError) {
				setError(validationError)
				// Don't set selectedFile if validation fails
				return
			}

			// File is valid, create preview
			const preview = createFilePreview(file)
			setSelectedFile(preview)

			// Create preview for images
			if (file.type.startsWith('image/')) {
				const reader = new FileReader()
				reader.onload = (e) => {
					setSelectedFile((prev) =>
						prev ? { ...prev, preview: e.target?.result as string } : null
					)
				}
				reader.onerror = () => {
					setError('Failed to load image preview')
				}
				reader.readAsDataURL(file)
			}
		},
		[validateFile]
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
				handleFile(e.dataTransfer.files[0])
			}
		},
		[handleFile]
	)

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files[0]) {
				handleFile(e.target.files[0])
			}
		},
		[handleFile]
	)

	const handleSend = () => {
		if (selectedFile) {
			onFileSelect(selectedFile.file)
			onClose()
		}
	}

	const handleRemove = () => {
		setSelectedFile(null)
		setError(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case 'image':
				return <Image className="w-6 h-6" aria-label="Image file" />
			case 'document':
				return <FileText className="w-6 h-6" aria-label="Document file" />
			case 'archive':
				return <Archive className="w-6 h-6" aria-label="Archive file" />
			default:
				return <File className="w-6 h-6" aria-label="File" />
		}
	}

	return (
		<div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-800">Upload File</h3>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-full transition-colors"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4">
					{!selectedFile ? (
						<div className="space-y-4">
							{/* Upload Area */}
							<div
								className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
									dragActive
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300 hover:border-gray-400'
								}`}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}
							>
								<Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="text-gray-600 mb-2">
									Drag and drop a file here, or{' '}
									<button
										onClick={() => fileInputRef.current?.click()}
										className="text-blue-500 hover:text-blue-600 underline font-medium"
									>
										browse
									</button>
								</p>
								<p className="text-sm text-gray-500 font-medium">
									Maximum file size: {formatFileSize(maxSize)}
								</p>
							</div>

							{/* Supported File Types Info */}
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
								<h4 className="text-sm font-semibold text-gray-700 mb-3">
									Supported File Types:
								</h4>
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center space-x-2">
										<Image
											className="w-4 h-4 text-blue-500"
											aria-label="Images"
										/>
										<span className="text-xs text-gray-600">Images</span>
									</div>
									<div className="flex items-center space-x-2">
										<FileText
											className="w-4 h-4 text-blue-500"
											aria-label="PDF and Documents"
										/>
										<span className="text-xs text-gray-600">
											PDF & Documents
										</span>
									</div>
								</div>
								<p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
									All file types are supported up to {formatFileSize(maxSize)}{' '}
									in size
								</p>
							</div>

							{/* Error Display (if any) */}
							{error && (
								<div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
									<div className="flex items-start space-x-2">
										<X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
										<div className="flex-1">
											<p className="text-sm font-semibold text-red-800 mb-1">
												Upload Error
											</p>
											<p className="text-sm text-red-600">{error}</p>
										</div>
									</div>
								</div>
							)}

							<input
								ref={fileInputRef}
								type="file"
								onChange={handleFileInput}
								accept={acceptedTypes.join(',')}
								className="hidden"
							/>
						</div>
					) : (
						/* File Preview */
						<div className="space-y-4">
							{/* File Preview Card */}
							<div
								className={`border-2 rounded-lg p-4 transition-colors ${
									error
										? 'border-red-300 bg-red-50'
										: 'border-green-200 bg-green-50'
								}`}
							>
								<div className="flex items-start space-x-3">
									{/* File Icon/Preview */}
									<div className="flex-shrink-0">
										{selectedFile.preview ? (
											<img
												src={selectedFile.preview}
												alt={`Preview of ${selectedFile.file.name}`}
												className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
											/>
										) : (
											<div className="w-16 h-16 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
												{getCategoryIcon(selectedFile.category)}
											</div>
										)}
									</div>

									{/* File Info */}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-gray-900 truncate mb-1">
											{selectedFile.file.name}
										</p>
										<div className="flex items-center space-x-3 text-xs text-gray-600 mb-1">
											<span className="font-medium">
												Size: {formatFileSize(selectedFile.file.size)}
											</span>
											<span>•</span>
											<span className="capitalize">
												{selectedFile.category}
											</span>
										</div>
										{selectedFile.file.size <= maxSize ? (
											<div className="flex items-center space-x-1 mt-2">
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
												<p className="text-xs text-green-700 font-medium">
													Ready to send
												</p>
											</div>
										) : (
											<div className="flex items-center space-x-1 mt-2">
												<div className="w-2 h-2 bg-red-500 rounded-full"></div>
												<p className="text-xs text-red-700 font-medium">
													File too large
												</p>
											</div>
										)}
									</div>

									{/* Remove Button */}
									<button
										onClick={handleRemove}
										className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
										title="Remove file"
									>
										<X className="w-5 h-5 text-gray-500" />
									</button>
								</div>
							</div>

							{/* Error Message - Enhanced */}
							{error && (
								<div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<X className="w-5 h-5 text-red-600 mt-0.5" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-semibold text-red-800 mb-1">
												Unable to Upload
											</p>
											<p className="text-sm text-red-700">{error}</p>
											{selectedFile.file.size > maxSize && (
												<p className="text-xs text-red-600 mt-2">
													Current size: {formatFileSize(selectedFile.file.size)}{' '}
													• Max allowed: {formatFileSize(maxSize)}
												</p>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Success Message */}
							{!error && selectedFile && (
								<div className="bg-green-50 border border-green-200 rounded-lg p-3">
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<p className="text-sm text-green-700">
											File is valid and ready to send
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
					>
						Cancel
					</button>
					{selectedFile && !error && (
						<button
							onClick={handleSend}
							className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							Send File
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
