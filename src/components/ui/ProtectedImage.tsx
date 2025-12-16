'use client'

import React from 'react'
import Image, { ImageProps } from 'next/image'
import { useProtectedImage } from '@/hooks/files/useProtectedImage'

interface ProtectedImageProps extends Omit<ImageProps, 'src' | 'placeholder'> {
	/**
	 * The S3 URL or key of the image
	 */
	src: string | null | undefined
	/**
	 * Expiration time in seconds (default: 3600 = 1 hour)
	 */
	expiresIn?: number
	/**
	 * Whether to automatically refresh the URL before expiration
	 * @default false
	 */
	autoRefresh?: boolean
	/**
	 * Placeholder to show while loading
	 */
	placeholder?: React.ReactNode
	/**
	 * Error fallback to show if image fails to load
	 */
	errorFallback?: React.ReactNode
	/**
	 * Alt text for the image (required for accessibility)
	 */
	alt: string
}

/**
 * ProtectedImage component that automatically handles S3 protected image URLs
 * with expiration and auto-refresh capabilities.
 *
 * @example
 * ```tsx
 * <ProtectedImage
 *   src="s3://bucket/path/to/image.jpg"
 *   alt="Profile picture"
 *   width={200}
 *   height={200}
 *   expiresIn={7200} // 2 hours
 *   autoRefresh={true}
 * />
 * ```
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
	src,
	expiresIn = 3600,
	autoRefresh = false,
	placeholder,
	errorFallback,
	alt,
	...imageProps
}) => {
	const { url, loading, error } = useProtectedImage(src, {
		expiresIn,
		autoRefresh,
	})

	// Show placeholder while loading
	if (loading) {
		return (
			<>
				{placeholder || (
					<div
						className="flex items-center justify-center bg-gray-100 animate-pulse"
						style={{
							width: imageProps.width || '100%',
							height: imageProps.height || '100%',
						}}
					/>
				)}
			</>
		)
	}

	// Show error fallback if there's an error or no URL
	if (error || !url) {
		return (
			<>
				{errorFallback || (
					<div className="flex items-center justify-center bg-gray-100 text-gray-400">
						<svg
							className="w-12 h-12"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
				)}
			</>
		)
	}

	// Render the protected image
	return <Image {...imageProps} src={url} alt={alt} />
}

/**
 * Simple img tag version for cases where Next.js Image is not needed
 */
interface ProtectedImgProps
	extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	/**
	 * The S3 URL or key of the image
	 */
	src: string | null | undefined
	/**
	 * Expiration time in seconds (default: 3600 = 1 hour)
	 */
	expiresIn?: number
	/**
	 * Whether to automatically refresh the URL before expiration
	 * @default false
	 */
	autoRefresh?: boolean
	/**
	 * Fallback to show when loading, error, or no URL
	 */
	fallback?: React.ReactNode
}

export const ProtectedImg: React.FC<ProtectedImgProps> = ({
	src,
	expiresIn = 3600,
	autoRefresh = false,
	fallback,
	...imgProps
}) => {
	const { url, loading, error } = useProtectedImage(src, {
		expiresIn,
		autoRefresh,
	})

	const defaultFallback = (
		<div
			className={`${imgProps.className || ''} bg-gray-200 flex items-center justify-center`}
			style={{
				backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo=")`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		/>
	)

	if (loading) {
		return (
			<>
				{fallback || (
					<div
						className={`${imgProps.className || ''} bg-gray-200 animate-pulse flex items-center justify-center`}
					>
						{imgProps.className?.includes('rounded-full') ? (
							<div className="w-full h-full bg-gray-300 rounded-full" />
						) : (
							<div className="w-full h-full bg-gray-300" />
						)}
					</div>
				)}
			</>
		)
	}

	if (error || !url) {
		return <>{fallback || defaultFallback}</>
	}

	return (
		<img
			{...imgProps}
			src={url}
			alt={imgProps.alt || ''}
			onError={(e) => {
				// Fallback to default on image load error
				const target = e.currentTarget
				if (target.src !== defaultFallback.props.style?.backgroundImage) {
					target.style.display = 'none'
					const fallbackDiv = target.nextElementSibling as HTMLElement
					if (fallbackDiv) {
						fallbackDiv.style.display = 'block'
					}
				}
			}}
			loading="lazy"
		/>
	)
}
