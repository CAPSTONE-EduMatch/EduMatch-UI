'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui'
import { AlertTriangle, Edit } from 'lucide-react'
import { motion } from 'framer-motion'

interface InstitutionProfileUpdateBannerProps {
	verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRE_UPDATE'
	rejectionReason?: string | null
	onEditClick?: () => void
}

export const InstitutionProfileUpdateBanner: React.FC<
	InstitutionProfileUpdateBannerProps
> = ({ verificationStatus, rejectionReason, onEditClick }) => {
	// Only show banner when status is REJECTED
	if (verificationStatus !== 'REJECTED') {
		return null
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="mb-6"
		>
			<Alert
				variant="destructive"
				className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20"
			>
				<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
				<AlertTitle className="text-red-900 dark:text-red-100 font-semibold mb-2">
					Profile Update Required
				</AlertTitle>
				<AlertDescription className="text-red-800 dark:text-red-200 space-y-3">
					<div>
						<p className="mb-2">
							Your institution profile has been reviewed and requires updates
							before it can be approved.
						</p>
						{rejectionReason && (
							<div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
								<p className="text-sm font-medium mb-1">Reason:</p>
								<p className="text-sm">{rejectionReason}</p>
							</div>
						)}
					</div>
					<div className="flex items-center gap-3 pt-2">
						{onEditClick ? (
							<Button
								onClick={onEditClick}
								variant="primary"
								size="sm"
								className="bg-red-600 hover:bg-red-700 text-white"
							>
								<Edit className="h-4 w-4 mr-2" />
								Update Profile
							</Button>
						) : (
							<p className="text-sm font-medium">
								Please update your profile information and resubmit for review.
							</p>
						)}
					</div>
				</AlertDescription>
			</Alert>
		</motion.div>
	)
}
