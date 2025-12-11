import {
	Download,
	FileText,
	File,
	Image,
	FileSpreadsheet,
	FileCode,
	Eye,
} from 'lucide-react'
import { useState } from 'react'
import JSZip from 'jszip'
import {
	openSessionProtectedFile,
	downloadSessionProtectedFile,
	getSessionProtectedFileUrl,
} from '@/utils/files/getSessionProtectedFileUrl'

export interface FileInfo {
	name: string
	size: string
	date: string
	document_id?: string
	url?: string
}

interface FileCardProps {
	file: FileInfo
	userId: string
	downloadEndpoint?: string
}

const getFileIcon = (fileName: string) => {
	const extension = fileName.split('.').pop()?.toLowerCase()

	switch (extension) {
		case 'pdf':
			return <FileText className="w-5 h-5 text-red-500" />
		case 'doc':
		case 'docx':
			return <FileText className="w-5 h-5 text-blue-500" />
		case 'xls':
		case 'xlsx':
			return <FileSpreadsheet className="w-5 h-5 text-green-500" />
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'gif':
		case 'webp':
			return <Image className="w-5 h-5 text-purple-500" />
		case 'txt':
		case 'rtf':
			return <FileText className="w-5 h-5 text-gray-500" />
		case 'zip':
		case 'rar':
		case '7z':
			return <FileCode className="w-5 h-5 text-orange-500" />
		default:
			return <File className="w-5 h-5 text-[#126E64]" />
	}
}

const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	} catch {
		return dateString
	}
}

export const FileCard = ({
	file,
	userId,
	downloadEndpoint = `/api/admin/users/${userId}/documents/${file.name}`,
}: FileCardProps) => {
	const [downloading, setDownloading] = useState(false)
	const [previewing, setPreviewing] = useState(false)

	const handleDownload = async (e: React.MouseEvent) => {
		e.stopPropagation()
		setDownloading(true)
		try {
			// If file has a URL, use protected file download (admin has higher permissions)
			if (file.url && file.url !== '#' && file.url !== '') {
				await downloadSessionProtectedFile(file.url, file.name)
			} else {
				// Fallback to admin API endpoint
				const endpoint = file.document_id
					? `/api/admin/users/${userId}/documents/${file.document_id}`
					: downloadEndpoint ||
						`/api/admin/users/${userId}/documents/${file.name}`

				const response = await fetch(endpoint, {
					credentials: 'include',
				})
				if (response.ok) {
					const blob = await response.blob()
					const url = window.URL.createObjectURL(blob)
					const a = document.createElement('a')
					a.href = url
					a.download = file.name
					a.style.display = 'none'
					document.body.appendChild(a)
					setTimeout(() => {
						a.click()
						setTimeout(() => {
							if (document.body.contains(a)) {
								document.body.removeChild(a)
							}
							window.URL.revokeObjectURL(url)
						}, 100)
					}, 0)
				} else {
					alert('Failed to download file')
				}
			}
		} catch (error) {
			console.error('Error downloading file:', error)
			alert('Error downloading file. Please try again.')
		} finally {
			setDownloading(false)
		}
	}

	const handlePreview = async (e: React.MouseEvent) => {
		e.stopPropagation()
		setPreviewing(true)
		try {
			// If file has a URL, use protected file preview (admin has higher permissions)
			if (file.url && file.url !== '#' && file.url !== '') {
				openSessionProtectedFile(file.url)
			} else {
				// Fallback: try to get preview URL from admin API
				const endpoint = file.document_id
					? `/api/admin/users/${userId}/documents/${file.document_id}?preview=true`
					: downloadEndpoint ||
						`/api/admin/users/${userId}/documents/${file.name}?preview=true`

				try {
					// For preview, we'll use the protected-image API to get a viewable URL
					// First, try to get the file URL from the document
					const response = await fetch(endpoint.replace('?preview=true', ''), {
						credentials: 'include',
					})

					if (response.ok) {
						// If it's a blob response, create object URL
						const blob = await response.blob()
						const url = window.URL.createObjectURL(blob)
						window.open(url, '_blank')
						// Clean up after a delay
						setTimeout(() => window.URL.revokeObjectURL(url), 1000)
					} else {
						alert('Failed to preview file')
					}
				} catch (error) {
					console.error('Error previewing file:', error)
					alert('Failed to preview file. Please try downloading instead.')
				}
			}
		} catch (error) {
			console.error('Error previewing file:', error)
			alert('Failed to preview file')
		} finally {
			setPreviewing(false)
		}
	}

	return (
		<div className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-[#126E64] hover:shadow-md transition-all duration-200">
			<div className="flex items-start gap-4">
				{/* File Icon */}
				<div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#F5F7FB] to-[#E8ECF1] rounded-lg flex items-center justify-center group-hover:from-[#126E64]/10 group-hover:to-[#126E64]/5 transition-colors">
					{getFileIcon(file.name)}
				</div>

				{/* File Info */}
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-semibold text-gray-900 truncate mb-1 group-hover:text-[#126E64] transition-colors">
						{file.name}
					</h4>
					<div className="flex items-center gap-3 text-xs text-gray-500">
						<span className="flex items-center gap-1">
							<File className="w-3 h-3" />
							{file.size}
						</span>
						<span className="flex items-center gap-1">
							<FileText className="w-3 h-3" />
							{formatDate(file.date)}
						</span>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2 flex-shrink-0">
					<button
						onClick={handlePreview}
						disabled={previewing}
						className="p-2 text-gray-400 hover:text-[#126E64] hover:bg-[#126E64]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Preview file"
					>
						<Eye className="w-4 h-4" />
					</button>
					<button
						onClick={handleDownload}
						disabled={downloading}
						className="p-2 text-gray-400 hover:text-[#126E64] hover:bg-[#126E64]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						title="Download file"
					>
						{downloading ? (
							<div className="w-4 h-4 border-2 border-[#126E64] border-t-transparent rounded-full animate-spin" />
						) : (
							<Download className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

interface DocumentSectionProps {
	title: string
	files: FileInfo[]
	userId: string
	downloadButtonText?: string
	emptyStateMessage?: string
	emptyStateSubMessage?: string
	titleClassName?: string
	containerClassName?: string
	downloadEndpoint?: (fileName: string) => string
}

export const DocumentSection = ({
	title,
	files,
	userId,
	downloadButtonText = 'Download all',
	emptyStateMessage,
	emptyStateSubMessage = 'Documents will appear here once uploaded',
	titleClassName = 'text-xl font-semibold text-[#116E63]',
	containerClassName = 'mb-6',
	downloadEndpoint,
}: DocumentSectionProps) => {
	const [downloadingAll, setDownloadingAll] = useState(false)

	// Helper function to fetch a protected file and return its blob
	const fetchProtectedFile = async (fileUrl: string): Promise<Blob | null> => {
		try {
			// Use protected file URL (admin has higher permissions)
			const protectedUrl = `/api/files/protected-image?url=${encodeURIComponent(fileUrl)}&expiresIn=3600`
			const response = await fetch(protectedUrl, {
				method: 'GET',
				credentials: 'include',
			})

			if (!response.ok) {
				// Fallback to proxy URL
				const proxyUrl = getSessionProtectedFileUrl(fileUrl)
				if (!proxyUrl) {
					console.warn(`Failed to get protected URL for: ${fileUrl}`)
					return null
				}

				const proxyResponse = await fetch(proxyUrl, {
					method: 'GET',
					credentials: 'include',
				})

				if (!proxyResponse.ok) {
					console.warn(`Failed to get proxy URL for: ${fileUrl}`)
					return null
				}

				return await proxyResponse.blob()
			}

			const data = await response.json()
			const presignedUrl = data.url

			if (!presignedUrl) {
				console.warn(`No presigned URL returned for: ${fileUrl}`)
				return null
			}

			// Fetch the actual file using the presigned URL
			const fileResponse = await fetch(presignedUrl, {
				method: 'GET',
			})

			if (!fileResponse.ok) {
				console.warn(`Failed to fetch file from presigned URL: ${fileUrl}`)
				return null
			}

			return await fileResponse.blob()
		} catch (error) {
			console.warn(`Error fetching protected file ${fileUrl}:`, error)
			return null
		}
	}

	const handleDownloadAll = async () => {
		if (files.length === 0) return

		setDownloadingAll(true)
		try {
			const zip = new JSZip()
			const zipName = `${title.replace(/\s+/g, '_')}_Documents`

			// Add all files to the zip
			for (const file of files) {
				try {
					let blob: Blob | null = null

					// Try to use file URL first (protected file)
					if (file.url && file.url !== '#' && file.url !== '') {
						blob = await fetchProtectedFile(file.url)
					}

					// Fallback to admin API endpoint if URL fetch failed
					if (!blob) {
						const endpoint = file.document_id
							? `/api/admin/users/${userId}/documents/${file.document_id}`
							: downloadEndpoint
								? downloadEndpoint(file.name)
								: `/api/admin/users/${userId}/documents/${file.name}`

						const response = await fetch(endpoint, {
							credentials: 'include',
						})

						if (response.ok) {
							blob = await response.blob()
						}
					}

					if (blob) {
						const arrayBuffer = await blob.arrayBuffer()
						zip.file(file.name, arrayBuffer)
					} else {
						console.warn(`Failed to fetch document: ${file.name}`)
					}
				} catch (error) {
					console.warn(`Error adding document ${file.name} to zip:`, error)
				}
			}

			// Generate the zip file
			const zipBlob = await zip.generateAsync({ type: 'blob' })

			// Create download link without causing page reload
			const url = window.URL.createObjectURL(zipBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `${zipName}.zip`
			link.style.display = 'none'
			link.setAttribute('download', `${zipName}.zip`)
			document.body.appendChild(link)

			// Trigger download without causing page reload
			setTimeout(() => {
				link.click()
				// Clean up after a short delay
				setTimeout(() => {
					if (document.body.contains(link)) {
						document.body.removeChild(link)
					}
					window.URL.revokeObjectURL(url)
				}, 100)
			}, 0)
		} catch (error) {
			console.error('Error creating zip file:', error)
			alert('Error downloading files. Please try again.')
		} finally {
			setDownloadingAll(false)
		}
	}

	return (
		<div className={containerClassName}>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className={titleClassName}>{title}</h3>
					{files.length > 0 && (
						<p className="text-sm text-gray-500 mt-1">
							{files.length} {files.length === 1 ? 'file' : 'files'}
						</p>
					)}
				</div>
				{files.length > 0 && (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							handleDownloadAll()
						}}
						disabled={downloadingAll}
						className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-[#126E64] text-white hover:bg-[#0f5a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{downloadingAll ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Downloading...</span>
							</>
						) : (
							<>
								<Download className="w-4 h-4" />
								<span>{downloadButtonText}</span>
							</>
						)}
					</button>
				)}
			</div>
			<div className="space-y-3">
				{files.length > 0 ? (
					files.map((file, index) => (
						<FileCard
							key={file.document_id || index}
							file={file}
							userId={userId}
							downloadEndpoint={
								downloadEndpoint ? downloadEndpoint(file.name) : undefined
							}
						/>
					))
				) : (
					<div className="bg-white border border-gray-200 rounded-xl p-12">
						<div className="text-center">
							<div className="w-16 h-16 bg-gradient-to-br from-[#F5F7FB] to-[#E8ECF1] rounded-full flex items-center justify-center mx-auto mb-4">
								<FileText className="w-8 h-8 text-gray-400" />
							</div>
							<p className="text-sm font-medium text-gray-700 mb-1">
								{emptyStateMessage || `No ${title.toLowerCase()} uploaded yet`}
							</p>
							<p className="text-xs text-gray-500">{emptyStateSubMessage}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
