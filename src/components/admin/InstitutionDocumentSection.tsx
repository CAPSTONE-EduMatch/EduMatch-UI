'use client'

import { downloadInstitutionDocument } from '@/lib/institution-admin-service'
import type { InstitutionDocument } from '@/types/institution-details'
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
	const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
		new Set()
	)

	const handleDownload = async (file: InstitutionDocument) => {
		setDownloadingFiles((prev) => {
			const newSet = new Set(prev)
			newSet.add(file.documentId)
			return newSet
		})

		try {
			await downloadInstitutionDocument(institutionId, file.documentId)
		} catch (error) {
			alert('Failed to download document. Please try again.')
		} finally {
			setDownloadingFiles((prev) => {
				const newSet = new Set(prev)
				newSet.delete(file.documentId)
				return newSet
			})
		}
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<div className="mb-8">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-[#116E63]">{title}</h3>
				<span className="text-sm text-[#A2A2A2]">
					{files.length} file{files.length !== 1 ? 's' : ''}
				</span>
			</div>

			{files.length === 0 ? (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
					<FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
					<p className="text-sm text-gray-500">
						No {title.toLowerCase()} uploaded
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{files.map((file) => (
						<div
							key={file.documentId}
							className="bg-white border border-[#E0E0E0] rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-[#F0F9FF] rounded-lg flex items-center justify-center">
									<FileText className="w-5 h-5 text-[#126E64]" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-black truncate">
										{file.name}
									</p>
									<div className="flex items-center gap-4 text-xs text-[#A2A2A2] mt-1">
										<span>{formatFileSize(file.size)}</span>
										<span>•</span>
										<span>Uploaded {formatDate(file.uploadDate)}</span>
										<span>•</span>
										<span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
											{file.documentType}
										</span>
									</div>
								</div>
							</div>

							<button
								onClick={() => handleDownload(file)}
								disabled={downloadingFiles.has(file.documentId)}
								className="ml-4 p-2 text-[#126E64] hover:bg-[#126E64]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Download document"
							>
								{downloadingFiles.has(file.documentId) ? (
									<div className="w-4 h-4 border-2 border-[#126E64] border-t-transparent rounded-full animate-spin" />
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
