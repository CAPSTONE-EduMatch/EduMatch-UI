'use client'

import { useState, useRef, useCallback } from 'react'
import {
	Upload,
	X,
	File,
	Image,
	FileText,
	Video,
	Music,
	Archive,
} from 'lucide-react'
import { formatFileSize, getFileCategory, getFileIcon } from '@/lib/file-utils'

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
	acceptedTypes = [
		'image/*',
		'application/pdf',
		'text/*',
		'video/*',
		'audio/*',
	],
}: FileUploadProps) {
	const [dragActive, setDragActive] = useState(false)
	const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null)
	const [error, setError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const validateFile = (file: File): string | null => {
		if (file.size > maxSize) {
			return `File size exceeds ${formatFileSize(maxSize)} limit`
		}

		if (acceptedTypes.length > 0) {
			const isAccepted = acceptedTypes.some((type) => {
				if (type.endsWith('/*')) {
					return file.type.startsWith(type.slice(0, -1))
				}
				return file.type === type
			})

			if (!isAccepted) {
				return 'File type not supported'
			}
		}

		return null
	}

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
			const validationError = validateFile(file)
			if (validationError) {
				setError(validationError)
				return
			}

			setError(null)
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
				reader.readAsDataURL(file)
			}
		},
		[maxSize, acceptedTypes]
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
				return <Image className="w-6 h-6" />
			case 'document':
				return <FileText className="w-6 h-6" />
			case 'video':
				return <Video className="w-6 h-6" />
			case 'audio':
				return <Music className="w-6 h-6" />
			case 'archive':
				return <Archive className="w-6 h-6" />
			default:
				return <File className="w-6 h-6" />
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
						/* Upload Area */
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
									className="text-blue-500 hover:text-blue-600 underline"
								>
									browse
								</button>
							</p>
							<p className="text-sm text-gray-500">
								Max size: {formatFileSize(maxSize)}
							</p>
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
							<div className="border border-gray-200 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									{/* File Icon/Preview */}
									<div className="flex-shrink-0">
										{selectedFile.preview ? (
											<img
												src={selectedFile.preview}
												alt="Preview"
												className="w-12 h-12 object-cover rounded"
											/>
										) : (
											<div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
												{getCategoryIcon(selectedFile.category)}
											</div>
										)}
									</div>

									{/* File Info */}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-800 truncate">
											{selectedFile.file.name}
										</p>
										<p className="text-sm text-gray-500">
											{formatFileSize(selectedFile.file.size)}
										</p>
										<p className="text-xs text-gray-400 capitalize">
											{selectedFile.category}
										</p>
									</div>

									{/* Remove Button */}
									<button
										onClick={handleRemove}
										className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
									>
										<X className="w-4 h-4 text-gray-500" />
									</button>
								</div>
							</div>

							{/* Error Message */}
							{error && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3">
									<p className="text-sm text-red-600">{error}</p>
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
