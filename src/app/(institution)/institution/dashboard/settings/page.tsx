'use client'

import { InstitutionSettingsSection } from '@/components/profile/institution/sections/InstitutionSettingsSection'
import { useProfileContext } from '../ProfileContext'
import { motion } from 'framer-motion'

export default function SettingsPage() {
	const { profile } = useProfileContext()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
		>
			<InstitutionSettingsSection profile={profile} />
		</motion.div>
	)
}
