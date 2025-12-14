'use client'

import {
	calculateDaysLeft,
	formatDateToDDMMYYYY,
} from '@/utils/date/date-utils'
import { motion } from 'framer-motion'
import { Building, Clock, Heart, Lock, MapPin, Users, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProtectedImage } from '@/components/ui/ProtectedImage'

// Check if URL is an S3 URL that needs protection (not already public)
const isProtectedS3Url = (url: string | null | undefined): boolean => {
	if (!url) return false

	// If it's already a pre-signed URL (has AWS signature query params), it's ready to use
	if (url.includes('X-Amz-Algorithm') || url.includes('X-Amz-Signature')) {
		return false // Already pre-signed, use directly
	}

	// All S3 URLs (including HTTPS ones) need protection unless pre-signed
	// Check if it's an S3 URL
	const isS3Url =
		url.includes('.s3.') ||
		url.includes('.s3.amazonaws.com') ||
		url.startsWith('s3://') ||
		url.includes('/users/') ||
		url.includes('/institutions/')

	return isS3Url
}

interface ResearchLabCardProps {
	lab: {
		id: string
		title: string
		description: string
		professor: string
		institution: string
		logo?: string
		field: string
		country: string
		position: string
		date: string
		daysLeft: number
		match: string
		applicationStatus?: string
		postStatus?: string
	}
	index: number
	isWishlisted: boolean
	onWishlistToggle: (id: string) => void
	hasApplied?: boolean
	isApplying?: boolean
	onApply?: (id: string) => void
	onClick?: (labId: string) => void
	applicationId?: string
	onUpdateRequest?: (applicationId: string) => void
	institutionStatus?: {
		isActive?: boolean
		status?: string | boolean
	}
}

export function ResearchLabCard({
	lab,
	index,
	isWishlisted,
	onWishlistToggle,
	hasApplied = false,
	isApplying = false,
	onApply,
	onClick,
	applicationId,
	onUpdateRequest,
	institutionStatus,
}: ResearchLabCardProps) {
	const router = useRouter()
	const t = useTranslations('application_section')
	// Check if match score is restricted (shown as "—" for non-Premium users)
	const isMatchRestricted = lab.match === '—'
	// Format date and calculate days left on the client side
	const formattedDate = formatDateToDDMMYYYY(lab.date)
	const daysLeft = calculateDaysLeft(lab.date)
	// Utility function to get institution status
	const getInstitutionStatus = (institutionStatus?: {
		status?: string | boolean
		isActive?: boolean
	}) => {
		if (!institutionStatus) return null
		if (!institutionStatus) return null

		// Check for deactivated account (status = false)
		if (institutionStatus.status === false) {
			return {
				type: 'deactivated' as const,
				label: 'Account Deactivated',
				color: 'bg-orange-100 text-orange-800 border-orange-200',
			}
		}

		return null
	}

	// Institution status badge component
	const InstitutionStatusBadge: React.FC<{
		institutionStatus?: {
			isActive?: boolean
			status?: string | boolean
		}
	}> = ({ institutionStatus }) => {
		const status = getInstitutionStatus(institutionStatus)

		if (!status) return null

		return (
			<div
				className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
			>
				<X className="w-3 h-3" />
				{status.label}
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			whileHover={{ x: 5 }}
			className="bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
			onClick={() => onClick?.(lab.id)}
		>
			{/* Header with logo and wishlist */}
			<div className="flex justify-between items-start mb-4 gap-10">
				<div className="">
					{lab.logo ? (
						isProtectedS3Url(lab.logo) ? (
							<ProtectedImage
								src={lab.logo}
								alt={lab.institution}
								width={140}
								height={140}
								className="rounded-lg h-[124px] w-[124px] object-cover"
								expiresIn={7200}
								autoRefresh={true}
								errorFallback={
									<div className="w-[124px] h-[124px] bg-gray-200 rounded-lg flex items-center justify-center">
										<span className="text-gray-400 text-xs text-center px-2">
											{lab.institution.substring(0, 2).toUpperCase()}
										</span>
									</div>
								}
							/>
						) : (
							<Image
								src={lab.logo}
								alt={lab.institution}
								width={140}
								height={140}
								className="rounded-lg h-[124px] w-[124px] object-cover"
								onError={(e) => {
									const target = e.currentTarget
									target.style.display = 'none'
									const fallback = target.nextElementSibling as HTMLElement
									if (fallback) fallback.style.display = 'flex'
								}}
							/>
						)
					) : (
						<div className="w-[124px] h-[124px] bg-gray-200 rounded-lg flex items-center justify-center">
							<span className="text-gray-400 text-xs text-center px-2">
								{lab.institution.substring(0, 2).toUpperCase()}
							</span>
						</div>
					)}
					{/* Fallback that shows when image fails to load */}
					{lab.logo && (
						<div
							className="w-[124px] h-[124px] bg-gray-200 rounded-lg flex items-center justify-center"
							style={{ display: 'none' }}
						>
							<span className="text-gray-400 text-xs text-center px-2">
								{lab.institution.substring(0, 2).toUpperCase()}
							</span>
						</div>
					)}
				</div>
				{/* Hide wishlist button if post is closed, deleted, or rejected */}
				{lab.postStatus !== 'CLOSED' &&
					lab.postStatus !== 'DELETED' &&
					lab.postStatus !== 'REJECTED' && (
						<motion.button
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								onWishlistToggle(lab.id)
							}}
							className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
						>
							<Heart
								className={`w-6 h-6 transition-all duration-200 ${
									isWishlisted
										? 'fill-red-500 text-red-500'
										: 'text-gray-400 hover:text-red-500'
								}`}
							/>
						</motion.button>
					)}
			</div>

			{/* Title */}
			<h3 className="text-xl font-bold text-gray-900 mb-3">{lab.title}</h3>

			{/* Description */}
			<p
				className="text-gray-600 mb-4 line-clamp-3 prose prose-content"
				dangerouslySetInnerHTML={{ __html: lab.description }}
			/>

			{/* Institution Status Badge */}
			{institutionStatus && (
				<div className="mb-3">
					<InstitutionStatusBadge institutionStatus={institutionStatus} />
				</div>
			)}

			{/* Debug: Always show a test badge to verify it renders */}
			{/* {!institutionStatus && (
				<div className="mb-3">
					<div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
						<X className="w-4 h-4" />
						Debug: No Institution Status
					</div>
				</div>
			)} */}

			{/* Professor */}
			<div className="flex items-center gap-2 mb-4 text-[#116E63] font-medium">
				<Users className="w-4 h-4" />
				<span>{lab.professor}</span>
			</div>

			{/* Bottom section */}
			<div className="flex justify-between gap-3 items-center">
				<div className="w-2/3 flex items-center gap-3 text-sm text-gray-600 overflow-x-auto scrollbar-hide">
					<div className="flex items-center gap-3 min-w-max">
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Building className="w-4 h-4" />
							<span>{lab.institution}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<MapPin className="w-4 h-4" />
							<span>{lab.country}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Users className="w-4 h-4" />
							<span>{lab.position}</span>
						</div>
						<div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
							<Clock className="w-4 h-4" />
							<span>
								{formattedDate}{' '}
								<span className="text-red-500">({daysLeft} days left)</span>
							</span>
						</div>
					</div>
				</div>

				{isMatchRestricted ? (
					<div
						className="mt-auto relative w-1/3 h-7 bg-gradient-to-r from-[#126E64]/20 to-[#126E64]/10 rounded-full overflow-hidden cursor-pointer hover:from-[#126E64]/30 hover:to-[#126E64]/20 transition-all"
						onClick={(e) => {
							e.stopPropagation()
							router.push('/pricing')
						}}
					>
						<div className="absolute inset-0 flex items-center justify-center gap-1">
							<Lock className="w-3 h-3 text-[#126E64]" />
							<span className="font-medium text-xs text-[#126E64]">
								Upgrade
							</span>
						</div>
					</div>
				) : (
					<div className="mt-auto relative w-1/3 h-7 bg-gray-200 rounded-full overflow-hidden">
						{/* Animated progress */}
						<motion.div
							className="h-full bg-[#32CF5C] rounded-full relative"
							initial={{ width: '0%' }}
							animate={{ width: lab.match }}
							transition={{
								duration: 1.2,
								delay: index * 0.1 + 0.3,
								ease: [0.4, 0, 0.2, 1],
							}}
						/>

						{/* Centered text */}
						<div className="absolute inset-0 flex items-center justify-center">
							<motion.span
								className="font-semibold text-lg text-white"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: index * 0.1 + 0.8 }}
							>
								Match: {lab.match}
							</motion.span>
						</div>
					</div>
				)}

				{/* Application Status */}
				{lab.applicationStatus && (
					<div className="mt-3 flex flex-col items-center gap-2">
						<span
							className={`px-4 py-2 rounded-full text-sm font-medium ${
								lab.applicationStatus === 'SUBMITTED'
									? 'bg-yellow-100 text-yellow-800'
									: lab.applicationStatus === 'PROGRESSING'
										? 'bg-blue-100 text-blue-800'
										: lab.applicationStatus === 'ACCEPTED'
											? 'bg-green-100 text-green-800'
											: lab.applicationStatus === 'REJECTED'
												? 'bg-red-100 text-red-800'
												: 'bg-gray-100 text-gray-800'
							}`}
						>
							{t(`status.${lab.applicationStatus}`)}
						</span>
					</div>
				)}
			</div>
		</motion.div>
	)
}
