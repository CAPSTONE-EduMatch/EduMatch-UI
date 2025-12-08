import React, { useState } from 'react'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
} from '@/components/ui'
// import { FileValidationResult } from '@/services/ai/file-validation-service'
import { FileValidationDisplay } from '@/components/validation/FileValidationDisplay'
import { FileValidationResult } from '@/services/ai/ollama-file-validation-service'

export interface OCRResult {
	fileId: string
	fileName: string
	extractedText: string
	fileType?: string
	fileSize?: number
	uploadDate?: Date
	autoFilledFields?: string[]
	validation?: FileValidationResult
}

interface OCRResultsDisplayAreaProps {
	ocrResults: OCRResult[]
	className?: string
}

const OCRResultsDisplayArea: React.FC<OCRResultsDisplayAreaProps> = ({
	ocrResults,
	className = '',
}) => {
	const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
	const [copiedStates, setCopiedStates] = useState<Set<string>>(new Set())

	const toggleExpanded = (fileId: string) => {
		const newExpanded = new Set(expandedResults)
		if (newExpanded.has(fileId)) {
			newExpanded.delete(fileId)
		} else {
			newExpanded.add(fileId)
		}
		setExpandedResults(newExpanded)
	}

	const copyToClipboard = async (text: string, fileId: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedStates((prev) => {
				const arr = Array.from(prev)
				arr.push(fileId)
				return new Set(arr)
			})
			// Simple notification
			alert('Text copied to clipboard')
			setTimeout(() => {
				setCopiedStates((prev) => {
					const newSet = new Set(prev)
					newSet.delete(fileId)
					return newSet
				})
			}, 2000)
		} catch (err) {
			alert('Could not copy text to clipboard')
		}
	}

	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return 'Unknown size'
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(1024))
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
	}

	const getFileIcon = (fileType?: string) => {
		if (!fileType) return '📄'
		return fileType.startsWith('image/') ? '🖼️' : '📄'
	}

	const detectKeywords = (text: string) => {
		const keywords: { label: string; icon: string; color: string }[] = []
		const lowerText = text.toLowerCase()

		if (lowerText.includes('university') || lowerText.includes('college')) {
			keywords.push({
				label: 'University',
				icon: '🏫',
				color: 'bg-blue-100 text-blue-800',
			})
		}
		if (lowerText.includes('gpa') || lowerText.includes('grade point')) {
			keywords.push({
				label: 'GPA',
				icon: '📊',
				color: 'bg-purple-100 text-purple-800',
			})
		}
		if (
			lowerText.includes('ielts') ||
			lowerText.includes('toefl') ||
			lowerText.includes('toeic')
		) {
			keywords.push({
				label: 'Language Test',
				icon: '🗣️',
				color: 'bg-orange-100 text-orange-800',
			})
		}
		if (
			lowerText.includes('bachelor') ||
			lowerText.includes('master') ||
			lowerText.includes('phd')
		) {
			keywords.push({
				label: 'Degree',
				icon: '🎓',
				color: 'bg-green-100 text-green-800',
			})
		}
		if (lowerText.includes('research') || lowerText.includes('publication')) {
			keywords.push({
				label: 'Research',
				icon: '🔬',
				color: 'bg-indigo-100 text-indigo-800',
			})
		}

		return keywords
	}

	if (ocrResults.length === 0) {
		return null
	}

	return (
		<div className={`space-y-4 ${className}`}>
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg font-semibold flex items-center gap-2">
							<span className="text-2xl">🤖</span>
							AI Extracted Information
						</CardTitle>
						<Badge
							variant="secondary"
							className="text-xs bg-blue-100 text-blue-800"
						>
							{ocrResults.length} file{ocrResults.length > 1 ? 's' : ''}{' '}
							processed
						</Badge>
					</div>
					<p className="text-sm text-gray-600">
						Text has been extracted from your uploaded documents. Review the
						information below and verify auto-filled fields.
					</p>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{ocrResults.map((result) => {
							const isExpanded = expandedResults.has(result.fileId)
							const isCopied = copiedStates.has(result.fileId)
							const keywords = detectKeywords(result.extractedText)

							return (
								<Card
									key={result.fileId}
									className="border border-gray-200 shadow-sm"
								>
									<CardHeader className="pb-2">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="text-blue-600 flex-shrink-0 text-xl">
													{getFileIcon(result.fileType)}
												</div>
												<div className="min-w-0 flex-1">
													<h4 className="font-medium text-gray-900 truncate">
														{result.fileName}
													</h4>
													<div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
														<span>
															{result.extractedText.length} characters
														</span>
														{result.fileSize && (
															<span>{formatFileSize(result.fileSize)}</span>
														)}
														{result.uploadDate && (
															<span>
																{new Intl.DateTimeFormat('en-US', {
																	month: 'short',
																	day: 'numeric',
																	hour: '2-digit',
																	minute: '2-digit',
																}).format(result.uploadDate)}
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2 flex-shrink-0">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														copyToClipboard(result.extractedText, result.fileId)
													}
													className="h-8 w-8 p-0"
													title="Copy text"
												>
													{isCopied ? (
														<span className="text-green-600">✓</span>
													) : (
														<span>📋</span>
													)}
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => toggleExpanded(result.fileId)}
													className="h-8 px-2 text-xs"
												>
													{isExpanded ? (
														<>
															<span className="mr-1">👁️‍🗨️</span> Hide
														</>
													) : (
														<>
															<span className="mr-1">👁️</span> Show
														</>
													)}
												</Button>
											</div>
										</div>

										{/* Keywords and Auto-filled indicators */}
										<div className="flex flex-wrap gap-2 mt-3">
											{keywords.map((keyword, index) => (
												<Badge
													key={index}
													variant="secondary"
													className={`text-xs ${keyword.color}`}
												>
													{keyword.icon} {keyword.label}
												</Badge>
											))}
											{result.autoFilledFields &&
												result.autoFilledFields.length > 0 && (
													<Badge
														variant="outline"
														className="text-xs bg-green-50 text-green-700 border-green-300"
													>
														✅ Auto-filled {result.autoFilledFields.length}{' '}
														field{result.autoFilledFields.length > 1 ? 's' : ''}
													</Badge>
												)}
										</div>

										{/* File Validation Display */}
										{result.validation && (
											<div className="mt-3">
												<FileValidationDisplay
													validation={result.validation}
													fileName={result.fileName}
													className="bg-gray-50"
												/>
											</div>
										)}
									</CardHeader>

									{isExpanded && (
										<CardContent className="pt-0">
											<div className="bg-gray-50 rounded-lg p-4 border">
												<div className="max-h-60 overflow-y-auto">
													<pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
														{result.extractedText}
													</pre>
												</div>
											</div>

											{result.autoFilledFields &&
												result.autoFilledFields.length > 0 && (
													<div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
														<p className="text-sm text-green-800 font-medium mb-2">
															Auto-filled fields:
														</p>
														<div className="flex flex-wrap gap-1">
															{result.autoFilledFields.map((field, index) => (
																<Badge
																	key={index}
																	variant="outline"
																	className="text-xs bg-green-100 text-green-700 border-green-300"
																>
																	{field}
																</Badge>
															))}
														</div>
													</div>
												)}
										</CardContent>
									)}
								</Card>
							)
						})}
					</div>

					{/* Summary section */}
					<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div className="flex items-start gap-3">
							<span className="text-blue-600 text-xl flex-shrink-0">ℹ️</span>
							<div className="text-sm text-blue-800">
								<p className="font-medium mb-1">AI Processing Complete</p>
								<p>
									Text has been extracted from your documents and relevant
									information has been automatically filled in the form above.
									Please review and edit as needed.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default OCRResultsDisplayArea
