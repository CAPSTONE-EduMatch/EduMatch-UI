'use client'

import { MessageDialog } from '@/components/message/MessageDialog'
import { useProfileContext } from '../ProfileContext'

export default function InstitutionMessagesPage() {
	const { profile } = useProfileContext()

	return (
		<div className="h-screen">
			<MessageDialog />
		</div>
	)
}
