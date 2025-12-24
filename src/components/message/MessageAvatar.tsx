'use client'

import { ProtectedImg } from '@/components/ui/ProtectedImage'
import { Building2 } from 'lucide-react'

interface MessageAvatarProps {
	src?: string | null
	alt: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
	showOnlineStatus?: boolean
	isOnline?: boolean
	userType?: 'applicant' | 'institution' | 'unknown'
}

const sizeClasses = {
	sm: 'w-8 h-8',
	md: 'w-10 h-10',
	lg: 'w-12 h-12',
}

const statusSizeClasses = {
	sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
	md: 'w-3 h-3 -bottom-1 -right-1',
	lg: 'w-4 h-4 -bottom-1 -right-1',
}

const defaultAvatarSvg =
	'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMCIgeT0iMTAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOEgxN0MxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cjwvc3ZnPgo='

// Check if URL is an S3 URL that needs protection
const isS3Url = (url: string | null | undefined): boolean => {
	if (!url) return false
	return (
		url.startsWith('s3://') ||
		url.includes('.s3.') ||
		url.includes('.s3.amazonaws.com') ||
		url.includes('/users/')
	)
}

// Check if URL is already a pre-signed URL (has query params)
const isPreSignedUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url)
		return (
			urlObj.searchParams.has('X-Amz-Signature') ||
			urlObj.searchParams.has('X-Amz-Algorithm')
		)
	} catch {
		return false
	}
}

export function MessageAvatar({
	src,
	alt,
	size = 'md',
	className = '',
	showOnlineStatus = false,
	isOnline = false,
	userType = 'unknown',
}: MessageAvatarProps) {
	const sizeClass = sizeClasses[size]
	const statusSizeClass = statusSizeClasses[size]

	// For institutions, use Building icon fallback instead of default avatar
	const isInstitution = userType === 'institution'

	// Check if src is a Google image URL (should not be used for institutions)
	const isGoogleImage =
		src?.includes('googleusercontent.com') || src?.includes('google.com')

	// For institutions, if src is a Google image, ignore it and use fallback
	const shouldUseSrc = src && !(isInstitution && isGoogleImage)

	const fallbackElement = isInstitution ? (
		<div
			className={`${sizeClass} rounded-full bg-[#126E64]/10 flex items-center justify-center border-2 border-gray-200`}
		>
			<Building2
				className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} text-[#126E64]`}
			/>
		</div>
	) : (
		<div
			className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200`}
			style={{
				backgroundImage: `url("${defaultAvatarSvg}")`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		/>
	)

	return (
		<div className={`relative flex-shrink-0 ${className}`}>
			{shouldUseSrc ? (
				// Use ProtectedImg for S3 URLs, regular img for pre-signed or regular URLs
				isS3Url(src) && !isPreSignedUrl(src) ? (
					<ProtectedImg
						src={src}
						alt={alt}
						className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 shadow-sm`}
						expiresIn={7200}
						autoRefresh={false}
						fallback={fallbackElement}
					/>
				) : (
					<>
						<img
							src={src}
							alt={alt}
							className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 shadow-sm`}
							onError={(e) => {
								// For institutions, hide image and show Building icon fallback
								if (isInstitution) {
									const target = e.currentTarget
									target.style.display = 'none'
									// Show the Building icon fallback
									const parent = target.parentElement
									if (parent) {
										const fallback = parent.querySelector(
											'.institution-fallback'
										) as HTMLElement
										if (fallback) {
											fallback.style.display = 'flex'
										}
									}
								} else {
									// Fallback to default avatar on error for non-institutions
									const target = e.currentTarget
									if (target.src !== defaultAvatarSvg) {
										target.src = defaultAvatarSvg
									}
								}
							}}
							loading="lazy"
						/>
						{/* Hidden Building icon fallback for institutions */}
						{isInstitution && (
							<div className="institution-fallback" style={{ display: 'none' }}>
								{fallbackElement}
							</div>
						)}
					</>
				)
			) : (
				fallbackElement
			)}
			{showOnlineStatus && isOnline && (
				<span
					className={`absolute ${statusSizeClass} bg-green-500 border-2 border-white rounded-full shadow-sm`}
					aria-label="Online"
				/>
			)}
		</div>
	)
}
