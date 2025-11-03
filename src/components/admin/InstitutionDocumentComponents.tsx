'use client'

import { InstitutionDocument } from '@/types/domain/institution-details'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'

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

	const handleDownload = async (documentId: string, fileName: string) => {
		setDownloading(documentId)
		try {
			const response = await fetch(
				`/api/admin/institutions/${institutionId}/documents/${documentId}`
			)

			if (response.ok) {
				const blob = await response.blob()
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.style.display = 'none'
				a.href = url
				a.download = fileName
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			} else {
				alert('Failed to download document')
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
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<div className="flex items-center gap-3 flex-1 min-w-0">
								<FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm text-black truncate">
										{file.name}
									</div>
									<div className="text-xs text-gray-500">
										{formatFileSize(file.size)} • Uploaded{' '}
										{new Date(file.uploadDate).toLocaleDateString()}
									</div>
								</div>
							</div>

							<button
								onClick={() => handleDownload(file.documentId, file.name)}
								disabled={downloading === file.documentId}
								className="ml-3 p-2 text-[#126E64] hover:bg-[#126E64] hover:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
								title="Download document"
							>
								{downloading === file.documentId ? (
									<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
								) : (
									<Download className="w-4 h-4" />
								)}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
