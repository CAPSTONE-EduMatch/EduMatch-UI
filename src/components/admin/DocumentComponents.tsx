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
		<div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
			<div className="flex items-center gap-3">
				<span className="text-2xl">📄</span>
				<div>
					<p className="font-medium text-sm">{file.name}</p>
					<p className="text-sm text-muted-foreground">
						{file.size} • {formatDate(file.date)}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					onClick={handlePreview}
					disabled={previewing}
					className="text-primary hover:text-primary/80 text-sm font-medium disabled:opacity-50"
					title="Preview file"
				>
					View
				</button>
				<button
					onClick={handleDownload}
					disabled={downloading}
					className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50"
					title="Download file"
				>
					{downloading ? (
						<div className="w-4 h-4 border-2 border-[#126E64] border-t-transparent rounded-full animate-spin" />
					) : (
						<Download className="h-4 w-4" />
					)}
				</button>
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
		<div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
						className="text-primary hover:text-primary/80 text-sm font-medium underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{downloadingAll && (
							<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#126E64]"></div>
						)}
						Download folder
					</button>
				)}
			</div>
			<div className="space-y-3 max-h-64 overflow-y-auto">
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
					<div className="text-center py-8">
						<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500">
							{emptyStateMessage || `No ${title.toLowerCase()} uploaded`}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
