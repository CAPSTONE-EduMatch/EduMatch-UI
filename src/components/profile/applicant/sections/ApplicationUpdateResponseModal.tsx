'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { Loader2, Upload, X, FileText, AlertCircle } from 'lucide-react'

interface UpdateRequest {
	updateRequestId: string
	requestMessage: string
	requestedDocuments: string[]
	status: string
	createdAt: string
	responseSubmittedAt?: string
	responseMessage?: string
	responseDocuments?: Array<{
		documentId: string
		name: string
		url: string
		size: number
		documentType: string
		updatedAt?: string
	}>
	requestedBy: {
		userId: string
		name: string
		email: string
	}
}

interface ApplicationUpdateResponseModalProps {
	isOpen: boolean
	onClose: () => void
	applicationId: string
	updateRequestId?: string
	onSuccess?: () => void
}

interface UploadedFile {
	file: File
	documentTypeId: string
	name: string
	url?: string
	size: number
}

export const ApplicationUpdateResponseModal: React.FC<
	ApplicationUpdateResponseModalProps
> = ({ isOpen, onClose, applicationId, updateRequestId, onSuccess }) => {
	const [updateRequest, setUpdateRequest] = useState<UpdateRequest | null>(null)
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [responseMessage, setResponseMessage] = useState('')
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

	// Document type options
	const documentTypes = [
		{ id: '1', label: 'Research Proposal' },
		{ id: '2', label: 'CV/Resume' },
		{ id: '3', label: 'Portfolio' },
		{ id: '4', label: 'Academic Transcript' },
		{ id: '5', label: 'Personal Statement' },
		{ id: '6', label: 'Recommendation Letter' },
		{ id: '7', label: 'Language Certificate' },
		{ id: '8', label: 'Passport Copy' },
		{ id: '9', label: 'Degree Certificate' },
		{ id: '10', label: 'Research Paper' },
		{ id: '11', label: 'Institution Verification' },
		{ id: '12', label: 'Required Documents' },
	]

	// Fetch update request when modal opens
	useEffect(() => {
		if (isOpen && applicationId) {
			fetchUpdateRequest()
		} else {
			// Reset state when modal closes
			setUpdateRequest(null)
			setResponseMessage('')
			setUploadedFiles([])
			setError(null)
		}
	}, [isOpen, applicationId, updateRequestId])

	const fetchUpdateRequest = async () => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(
				`/api/applications/${applicationId}/update-request`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			)

			if (!response.ok) {
				throw new Error('Failed to fetch update request')
			}

			const result = await response.json()

			if (
				result.success &&
				result.updateRequests &&
				result.updateRequests.length > 0
			) {
				// If a specific updateRequestId is provided, find that specific request
				if (updateRequestId) {
					const specificRequest = result.updateRequests.find(
						(req: UpdateRequest) => req.updateRequestId === updateRequestId
					)
					if (specificRequest) {
						setUpdateRequest(specificRequest)
					} else {
						throw new Error('Update request not found')
					}
				} else {
					// Otherwise, find the most recent pending request
					const pendingRequest = result.updateRequests.find(
						(req: UpdateRequest) => req.status === 'PENDING'
					)
					if (pendingRequest) {
						setUpdateRequest(pendingRequest)
					} else {
						// If no pending, show the most recent one
						setUpdateRequest(result.updateRequests[0])
					}
				}
			} else {
				throw new Error('No update request found')
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to fetch update request'
			)
		} finally {
			setLoading(false)
		}
	}

	const handleFileUpload = async (file: File, documentTypeId: string) => {
		try {
			// Get presigned URL for upload
			const presignResponse = await fetch('/api/files/presigned-url', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
				}),
			})

			if (!presignResponse.ok) {
				const errorData = await presignResponse.json().catch(() => ({}))
				throw new Error(errorData.error || 'Failed to get upload URL')
			}

			const { presignedUrl, fileName } = await presignResponse.json()

			// Upload file to S3
			const uploadResponse = await fetch(presignedUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type,
				},
				body: file,
			})

			if (!uploadResponse.ok) {
				throw new Error('Failed to upload file to S3')
			}

			// Construct the public URL
			const publicUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'edumatch-file-12'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`

			// Add to uploaded files list
			const uploadedFile: UploadedFile = {
				file,
				documentTypeId,
				name: file.name,
				url: publicUrl,
				size: file.size,
			}

			setUploadedFiles((prev) => [...prev, uploadedFile])
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Failed to upload file. Please try again.'
			)
		}
	}

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Default to "Required Documents" if no type specified
		handleFileUpload(file, '12')
		e.target.value = '' // Reset input
	}

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async () => {
		if (uploadedFiles.length === 0) {
			setError('Please upload at least one document')
			return
		}

		setSubmitting(true)
		setError(null)

		try {
			// Prepare documents for submission
			// The URL is already the full public S3 URL from handleFileUpload
			const documents = uploadedFiles.map((file) => ({
				documentTypeId: file.documentTypeId,
				name: file.name,
				url: file.url || '',
				size: file.size,
			}))

			const response = await fetch(
				`/api/applications/${applicationId}/update-request`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						documents,
						responseMessage: responseMessage.trim() || undefined,
					}),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to submit update response')
			}

			const result = await response.json()

			if (result.success) {
				// Reset form
				setUploadedFiles([])
				setResponseMessage('')
				if (onSuccess) {
					onSuccess()
				}
				onClose()
			} else {
				throw new Error(result.error || 'Failed to submit update response')
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Failed to submit update response. Please try again.'
			)
		} finally {
			setSubmitting(false)
		}
	}

	const handleClose = () => {
		if (!submitting) {
			onClose()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Update Required - Submit Response"
			maxWidth="lg"
		>
			<div className="space-y-6">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
						<span className="text-gray-600">Loading update request...</span>
					</div>
				) : error && !updateRequest ? (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
							<div>
								<p className="text-sm font-medium text-red-900">
									Failed to load update request
								</p>
								<p className="text-sm text-red-700 mt-1">{error}</p>
							</div>
						</div>
					</div>
				) : updateRequest ? (
					<>
						{/* Request Information */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
								<div className="flex-1">
									<h3 className="text-sm font-semibold text-blue-900 mb-2">
										Institution Request
									</h3>
									<p className="text-sm text-blue-800 whitespace-pre-wrap">
										{updateRequest.requestMessage}
									</p>
									{updateRequest.requestedDocuments.length > 0 && (
										<div className="mt-2">
											<p className="text-xs font-medium text-blue-900 mb-1">
												Requested Documents:
											</p>
											<ul className="text-xs text-blue-800 list-disc list-inside">
												{updateRequest.requestedDocuments.map((doc, idx) => (
													<li key={idx}>{doc}</li>
												))}
											</ul>
										</div>
									)}
									<p className="text-xs text-blue-600 mt-2">
										Requested on:{' '}
										{new Date(updateRequest.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
						</div>

						{updateRequest.status === 'PENDING' ? (
							<>
								{/* Document Upload Section */}
								<div className="space-y-3">
									<label className="block text-sm font-medium text-gray-700">
										Upload Documents <span className="text-red-500">*</span>
									</label>
									<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
										<input
											type="file"
											id="file-upload"
											className="hidden"
											accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
											onChange={handleFileInput}
											disabled={submitting}
										/>
										<label
											htmlFor="file-upload"
											className="cursor-pointer flex flex-col items-center gap-2"
										>
											<Upload className="h-8 w-8 text-gray-400" />
											<span className="text-sm text-gray-600">
												Click to upload or drag and drop
											</span>
											<span className="text-xs text-gray-500">
												PDF, DOC, DOCX, JPG, PNG (Max 10MB)
											</span>
										</label>
									</div>

									{/* Uploaded Files List */}
									{uploadedFiles.length > 0 && (
										<div className="space-y-2">
											{uploadedFiles.map((file, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
												>
													<div className="flex items-center gap-3 flex-1 min-w-0">
														<FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-gray-900 truncate">
																{file.name}
															</p>
															<p className="text-xs text-gray-500">
																{(file.size / 1024 / 1024).toFixed(2)} MB
															</p>
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeFile(index)}
														disabled={submitting}
														className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Response Message */}
								<div className="space-y-2">
									<label
										htmlFor="response-message"
										className="block text-sm font-medium text-gray-700"
									>
										Response Message (Optional)
									</label>
									<textarea
										id="response-message"
										value={responseMessage}
										onChange={(e) => {
											setResponseMessage(e.target.value)
											setError(null)
										}}
										placeholder="Add any comments or notes regarding the update..."
										rows={4}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										disabled={submitting}
									/>
									<p className="text-xs text-gray-500">
										{responseMessage.length} characters
									</p>
								</div>

								{error && (
									<div className="bg-red-50 border border-red-200 rounded-lg p-3">
										<p className="text-sm text-red-700">{error}</p>
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
									<Button
										onClick={handleClose}
										variant="outline"
										disabled={submitting}
									>
										Cancel
									</Button>
									<Button
										onClick={handleSubmit}
										disabled={submitting || uploadedFiles.length === 0}
										className="bg-blue-600 hover:bg-blue-700 text-white"
									>
										{submitting ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Submitting...
											</>
										) : (
											'Submit Update Response'
										)}
									</Button>
								</div>
							</>
						) : (
							<>
								{/* Response Information - Show if already responded */}
								{updateRequest.responseMessage && (
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<div className="flex items-start gap-3">
											<div className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0">
												✓
											</div>
											<div className="flex-1">
												<h3 className="text-sm font-semibold text-green-900 mb-2">
													Your Response
												</h3>
												<p className="text-sm text-green-800 whitespace-pre-wrap">
													{updateRequest.responseMessage}
												</p>
												{updateRequest.responseSubmittedAt && (
													<p className="text-xs text-green-600 mt-2">
														Submitted on:{' '}
														{new Date(
															updateRequest.responseSubmittedAt
														).toLocaleDateString()}
													</p>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Submitted Documents - Show if documents were submitted */}
								{updateRequest.responseDocuments &&
									updateRequest.responseDocuments.length > 0 && (
										<div className="space-y-3">
											<label className="block text-sm font-medium text-gray-700">
												Submitted Documents (
												{updateRequest.responseDocuments.length})
											</label>
											<div className="space-y-2">
												{updateRequest.responseDocuments.map((doc) => (
													<div
														key={doc.documentId}
														className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
													>
														<div className="flex items-center gap-3 flex-1 min-w-0">
															<FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
															<div className="flex-1 min-w-0">
																<p className="text-sm font-medium text-gray-900 truncate">
																	{doc.name}
																</p>
																<p className="text-xs text-gray-500">
																	{(doc.size / 1024 / 1024).toFixed(2)} MB
																	{doc.updatedAt && (
																		<>
																			{' • '}
																			Submitted:{' '}
																			{new Date(
																				doc.updatedAt
																			).toLocaleDateString()}
																		</>
																	)}
																</p>
															</div>
														</div>
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																window.open(doc.url, '_blank')
															}}
															className="ml-2"
														>
															View
														</Button>
													</div>
												))}
											</div>
										</div>
									)}

								{/* Close Button */}
								<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
									<Button onClick={handleClose} variant="outline">
										Close
									</Button>
								</div>
							</>
						)}
					</>
				) : null}
			</div>
		</Modal>
	)
}
