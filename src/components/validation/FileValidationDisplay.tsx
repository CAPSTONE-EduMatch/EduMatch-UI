import React from 'react'
// import { FileValidationResult } from '@/services/ai/file-validation-service'
import { Badge } from '@/components/ui'
import { FileValidationResult } from '@/services/ai/ollama-file-validation-service'

interface FileValidationDisplayProps {
	validation: FileValidationResult
	fileName: string
	className?: string
}

export const FileValidationDisplay: React.FC<FileValidationDisplayProps> = ({
	validation,
	fileName,
	className = '',
}) => {
	const getValidationBadge = () => {
		if (validation.isValid) {
			if (validation.confidence >= 0.8) {
				return (
					<Badge
						variant="secondary"
						className="ml-2 bg-green-100 text-green-700"
					>
						✓ Valid ({Math.round(validation.confidence * 100)}%)
					</Badge>
				)
			} else {
				return (
					<Badge
						variant="secondary"
						className="ml-2 bg-yellow-100 text-yellow-700"
					>
						? Likely Valid ({Math.round(validation.confidence * 100)}%)
					</Badge>
				)
			}
		} else {
			return (
				<Badge variant="destructive" className="ml-2">
					✗ Invalid ({Math.round(validation.confidence * 100)}%)
				</Badge>
			)
		}
	}

	return (
		<div className={`p-3 border rounded-lg ${className}`}>
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-foreground truncate">
					{fileName}
				</span>
				{getValidationBadge()}
			</div>

			{validation.reasoning && (
				<p className="text-xs text-muted-foreground mt-1">
					{validation.reasoning}
				</p>
			)}

			{validation.suggestions && validation.suggestions.length > 0 && (
				<div className="mt-2">
					<p className="text-xs font-medium text-orange-600">Suggestions:</p>
					<ul className="text-xs text-orange-600 mt-1 space-y-1">
						{validation.suggestions.map((suggestion, index) => (
							<li key={index}>• {suggestion}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
