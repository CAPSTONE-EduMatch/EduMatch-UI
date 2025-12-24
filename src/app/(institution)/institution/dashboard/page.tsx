'use client'

import { InstitutionOverviewSection } from '@/components/profile/institution/sections/InstitutionOverviewSection'
import { useProfileContext } from './ProfileContext'
import { motion } from 'framer-motion'

export default function DashboardPage() {
	const { profile } = useProfileContext()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
		>
			<InstitutionOverviewSection
				profile={profile}
				onNavigationAttempt={() => true}
			/>
		</motion.div>
	)
}
