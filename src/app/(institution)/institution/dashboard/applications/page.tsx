'use client'

import { InstitutionApplicationSection } from '@/components/profile/institution/sections/InstitutionApplicationSection'
import { useProfileContext } from '../ProfileContext'
import { motion } from 'framer-motion'

export default function ApplicationsPage() {
	const { profile } = useProfileContext()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
		>
			<InstitutionApplicationSection profile={profile} />
		</motion.div>
	)
}
