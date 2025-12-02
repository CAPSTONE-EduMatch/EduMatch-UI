'use client'

import { useState } from 'react'
import { ProtectedImg } from '@/components/ui/ProtectedImage'
import {
	openSessionProtectedFile,
	downloadSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { Download } from 'lucide-react'

interface MessageImageProps {
	src: string
	alt?: string
	fileName?: string
	onDownload?: () => void
	className?: string
}

export function MessageImage({
	src,
	alt,
	fileName,
	onDownload,
	className = '',
}: MessageImageProps) {
	const [imageError, setImageError] = useState(false)

	const handleImageClick = () => {
		if (src) {
			openSessionProtectedFile(src)
		}
	}

	const handleDownload = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (onDownload) {
			onDownload()
		} else if (src) {
			try {
				await downloadSessionProtectedFile(src, fileName || 'image')
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to download image:', error)
			}
		}
	}

	if (imageError) {
		return (
			<div
				className={`${className} bg-gray-100 rounded-lg flex items-center justify-center p-4 border border-gray-200`}
			>
				<div className="text-center">
					<p className="text-sm text-gray-500 mb-2">Failed to load image</p>
					{fileName && (
						<p className="text-xs text-gray-400 truncate max-w-xs">
							{fileName}
						</p>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className="relative group">
			<div
				className="relative overflow-hidden rounded-lg cursor-pointer"
				onClick={handleImageClick}
				title="Click to view full size"
			>
				<ProtectedImg
					src={src}
					alt={alt || fileName || 'Message image'}
					className={`${className} max-w-xs max-h-64 rounded-lg object-contain bg-gray-50`}
					expiresIn={7200}
					autoRefresh={true}
					onError={() => setImageError(true)}
					fallback={
						<div className="bg-gray-100 rounded-lg flex items-center justify-center p-8 animate-pulse">
							<div className="text-center">
								<div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2" />
								<p className="text-xs text-gray-500">Loading image...</p>
							</div>
						</div>
					}
				/>
				{/* Download button in top right corner */}
				<button
					onClick={handleDownload}
					className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
					title="Download image"
					onMouseDown={(e) => e.stopPropagation()}
				>
					<Download className="w-4 h-4 text-gray-700" />
				</button>
			</div>
		</div>
	)
}
