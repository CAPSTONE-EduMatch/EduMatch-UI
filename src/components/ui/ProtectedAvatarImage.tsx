'use client'

import React from 'react'
import { AvatarImage } from '@/components/ui'
import { useProtectedImage } from '@/hooks/files/useProtectedImage'

interface ProtectedAvatarImageProps {
	/**
	 * The S3 URL or key of the image
	 */
	src?: string | null
	/**
	 * Alt text for the image
	 */
	alt?: string
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
	 * Additional className
	 */
	className?: string
}

/**
 * ProtectedAvatarImage component that automatically handles S3 protected image URLs
 * for Avatar components with expiration and auto-refresh capabilities.
 */
export const ProtectedAvatarImage: React.FC<ProtectedAvatarImageProps> = ({
	src,
	alt,
	expiresIn = 3600,
	autoRefresh = false,
	className,
}) => {
	const { url, loading } = useProtectedImage(src, {
		expiresIn,
		autoRefresh,
	})

	// If loading or no URL, don't render (Avatar will show fallback)
	if (loading || !url) {
		return null
	}

	// Render AvatarImage with protected URL
	return <AvatarImage src={url} alt={alt} className={className} />
}
