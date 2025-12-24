'use client'

import { ProgramsSection } from '@/components/profile/institution/sections/ProgramsSection'
import { useProfileContext } from '../ProfileContext'
import { motion } from 'framer-motion'

export default function ProgramsPage() {
	const { profile, refreshProfile } = useProfileContext()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
		>
			<ProgramsSection
				profile={profile}
				onProfileUpdate={refreshProfile}
				onNavigationAttempt={() => true}
			/>
		</motion.div>
	)
}
