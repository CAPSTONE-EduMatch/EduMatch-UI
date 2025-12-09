'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useApplicantDocuments } from '@/hooks/documents/useApplicantDocuments'
import { Check, File } from 'lucide-react'

export interface SelectedDocument {
	document_id: string
	name: string
	url: string
	size: number
	documentType?: string
	source: 'existing' | 'new'
}

interface RequiredDocumentType {
	id: string
	name: string
	description?: string
}

interface DocumentSelectorProps {
	selectedDocuments: SelectedDocument[]
	onDocumentsSelected: (documents: SelectedDocument[]) => void
	requiredDocumentTypes?: RequiredDocumentType[]
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
	selectedDocuments,
	onDocumentsSelected,
}) => {
	const t = useTranslations('document_selector')
	const { documents, loading, error } = useApplicantDocuments()

	// Group documents by type for better organization
	const groupedDocuments = documents.reduce(
		(acc, doc) => {
			const typeId = doc.document_type_id
			if (!acc[typeId]) {
				acc[typeId] = []
			}
			acc[typeId].push(doc)
			return acc
		},
		{} as Record<string, typeof documents>
	)

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString()
	}

	const isDocumentSelected = (documentId: string) => {
		return selectedDocuments.some((doc) => doc.document_id === documentId)
	}

	const toggleDocumentSelection = (document: any) => {
		const isSelected = isDocumentSelected(document.document_id)
		if (isSelected) {
			// Remove document
			const updatedDocs = selectedDocuments.filter(
				(doc) => doc.document_id !== document.document_id
			)
			onDocumentsSelected(updatedDocs)
		} else {
			// Add document
			const newDoc: SelectedDocument = {
				document_id: document.document_id,
				name: document.title || document.name,
				url: document.url,
				size: document.size,
				documentType: document.documentType || document.document_type_id,
				source: 'existing',
			}
			onDocumentsSelected([...selectedDocuments, newDoc])
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
				<span className="ml-3 text-gray-600">{t('loading')}</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-600">{t('error')}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="text-center space-y-3">
				<h2 className="text-2xl font-bold text-gray-900">
					{t('header.title')}
				</h2>
			</div>

			{/* Single Column Layout - Profile Documents Only */}
			<div className="max-w-4xl mx-auto">
				{documents.length === 0 ? (
					<div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
						<File className="mx-auto h-16 w-16 text-gray-400 mb-6" />
						<h3 className="text-xl font-semibold text-gray-900 mb-3">
							{t('empty.title')}
						</h3>
						<p className="text-gray-500 mb-6 max-w-md mx-auto">
							{t('empty.message')}
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Available Documents */}
						<div className="space-y-6">
							<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
								<div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
									<File className="w-4 h-4 text-white" />
								</div>
								{t('available_documents.title')} ({documents.length})
							</h3>

							{Object.entries(groupedDocuments).map(([typeId, docs]) => {
								const documentType = docs[0]?.documentType
								return (
									<div
										key={typeId}
										className="bg-white border border-gray-200 rounded-lg p-6"
									>
										<h4 className="font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
											{documentType?.name || t('folder.other_documents')} (
											{docs.length})
										</h4>
										<div className="grid gap-3">
											{docs.map((document) => {
												const isSelected = isDocumentSelected(
													document.document_id
												)
												return (
													<div
														key={document.document_id}
														onClick={() => toggleDocumentSelection(document)}
														className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
															isSelected
																? 'border-teal-500 bg-teal-50 shadow-sm'
																: 'border-gray-200 hover:border-teal-300 hover:bg-teal-25'
														}`}
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-4">
																<div
																	className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
																		isSelected ? 'bg-teal-600' : 'bg-gray-300'
																	}`}
																>
																	<File
																		className={`w-5 h-5 ${
																			isSelected
																				? 'text-white'
																				: 'text-gray-600'
																		}`}
																	/>
																</div>
																<div>
																	<p className="font-medium text-gray-900">
																		{document.title || document.name}
																	</p>
																	<p className="text-sm text-gray-500">
																		{formatFileSize(document.size)} •{' '}
																		{formatDate(document.upload_at)}
																	</p>
																</div>
															</div>
															{isSelected && (
																<div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
																	<Check className="w-5 h-5 text-white" />
																</div>
															)}
														</div>
													</div>
												)
											})}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
