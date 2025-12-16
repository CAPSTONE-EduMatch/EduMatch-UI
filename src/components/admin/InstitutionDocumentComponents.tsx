'use client'

import { InstitutionDocument } from '@/types/domain/institution-details'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { openAdminFile, downloadAdminFile } from '@/utils/files/getAdminFileUrl'

interface InstitutionDocumentSectionProps {
	title: string
	files: InstitutionDocument[]
	institutionId: string
}

export function InstitutionDocumentSection({
	title,
	files,
	institutionId,
}: InstitutionDocumentSectionProps) {
	const [downloading, setDownloading] = useState<string | null>(null)

	const handlePreviewDocument = async (file: InstitutionDocument) => {
		try {
			if (file.url && file.url !== '#' && file.url !== '') {
				await openAdminFile(file.url)
			} else {
				alert('Document not available for preview')
			}
		} catch (error) {
			alert('Failed to preview document. Please try again.')
		}
	}

	const handleDownloadDocument = async (file: InstitutionDocument) => {
		setDownloading(file.documentId)
		try {
			if (file.url && file.url !== '#' && file.url !== '') {
				await downloadAdminFile(file.url, file.name || 'document')
			} else {
				// Fallback to API download if URL is not available
				const response = await fetch(
					`/api/admin/institutions/${institutionId}/documents/${file.documentId}`
				)

				if (response.ok) {
					const blob = await response.blob()
					const url = window.URL.createObjectURL(blob)
					const a = document.createElement('a')
					a.style.display = 'none'
					a.href = url
					a.download = file.name
					document.body.appendChild(a)
					a.click()
					window.URL.revokeObjectURL(url)
					document.body.removeChild(a)
				} else {
					alert('Failed to download document')
				}
			}
		} catch (error) {
			alert('Error downloading document')
		} finally {
			setDownloading(null)
		}
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	return (
		<div className="bg-white rounded-lg p-6 shadow-sm mb-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-black">{title}</h3>
				<span className="text-sm text-gray-500">
					{files.length} {files.length === 1 ? 'document' : 'documents'}
				</span>
			</div>

			{files.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
					<p className="text-sm">No documents uploaded</p>
				</div>
			) : (
				<div className="space-y-3">
					{files.map((file) => (
						<div
							key={file.documentId}
							className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
						>
							<div className="flex items-center gap-3">
								<span className="text-2xl">📄</span>
								<div>
									<p className="font-medium text-sm">
										{file.name || 'Document'}
									</p>
									<p className="text-sm text-muted-foreground">
										{formatFileSize(file.size)}
										{file.documentType ? ` • ${file.documentType}` : ''}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => handlePreviewDocument(file)}
									className="text-primary hover:text-primary/80 text-sm font-medium"
								>
									View
								</button>
								<button
									onClick={() => handleDownloadDocument(file)}
									disabled={downloading === file.documentId}
									className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
									title="Download document"
								>
									{downloading === file.documentId ? (
										<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
									) : (
										<Download className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
