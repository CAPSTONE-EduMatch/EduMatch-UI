'use client'

import { InstitutionProfileSection } from '@/components/profile/institution/sections/InstitutionProfileSection'
import { useProfileContext } from '../ProfileContext'
import { motion } from 'framer-motion'

export default function ProfilePage() {
	const { profile, refreshProfile } = useProfileContext()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
		>
			<InstitutionProfileSection
				profile={profile}
				onProfileUpdate={refreshProfile}
			/>
		</motion.div>
	)
}
