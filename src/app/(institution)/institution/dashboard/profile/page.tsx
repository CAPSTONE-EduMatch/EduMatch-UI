'use client'

import { InstitutionProfileSection } from '@/components/profile/institution/sections/InstitutionProfileSection'
import { InstitutionProfileUpdateBanner } from '@/components/profile/institution/components/InstitutionProfileUpdateBanner'
import { InstitutionInfoRequestBanner } from '@/components/profile/institution/components/InstitutionInfoRequestBanner'
import { useProfileContext } from '../ProfileContext'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ProfilePage() {
	const { profile, refreshProfile } = useProfileContext()
	const [isEditing, setIsEditing] = useState(false)

	const handleEditClick = () => {
		// Trigger edit mode in the profile section by clicking the edit button
		const editButton = document.querySelector(
			'[data-edit-profile-button]'
		) as HTMLButtonElement
		if (editButton) {
			editButton.click()
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className="space-y-6"
		>
			{profile?.verification_status && (
				<InstitutionProfileUpdateBanner
					verificationStatus={profile.verification_status}
					rejectionReason={profile.rejection_reason}
					onEditClick={handleEditClick}
				/>
			)}
			<InstitutionInfoRequestBanner
				onPendingRequestsChange={(hasPending) => {
					// This will be handled by the profile section
				}}
			/>
			<InstitutionProfileSection
				profile={profile}
				onProfileUpdate={refreshProfile}
				onEditingChange={setIsEditing}
			/>
		</motion.div>
	)
}
